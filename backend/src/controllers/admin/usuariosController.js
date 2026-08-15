const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePaginacion, metaPaginacion } = require('../../utils/paginacion');
const { patronIlike } = require('../../utils/postgrestFiltro');

// GET /api/admin/usuarios — lista paginada con ?pagina, ?limite, ?busqueda, ?rol
const getUsuarios = asyncHandler('admin/usuariosController.getUsuarios', async (req, res) => {
  const { pagina, limite, desde, hasta } = parsePaginacion(req.query);
  const busqueda  = (req.query.busqueda || '').trim();
  const rolFiltro = (req.query.rol || '').trim();

  // La columna rol está directamente en perfiles_usuario
  let query = supabase
    .from('perfiles_usuario')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(desde, hasta);

  if (busqueda) {
    const patron = patronIlike(busqueda);
    query = query.or(`nombre.ilike.${patron},apellido.ilike.${patron},ciudad.ilike.${patron}`);
  }

  if (rolFiltro) query = query.eq('rol', rolFiltro);

  const { data: usuariosData, count, error } = await query;
  if (error) throw error;

  return res.json({ success: true, data: usuariosData || [], meta: metaPaginacion(count, pagina, limite) });
});

// GET /api/admin/usuarios/:id — usuario completo con su rol
const getUsuario = asyncHandler('admin/usuariosController.getUsuario', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase.from('perfiles_usuario').select('*').eq('id', id).single();

  if (error || !data) {
    return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  }

  return res.json({ success: true, data });
});

// POST /api/admin/usuarios — crea auth.users + perfiles_usuario (+ rol)
// Requiere SERVICE_ROLE_KEY para supabase.auth.admin.createUser()
const createUsuario = asyncHandler('admin/usuariosController.createUsuario', async (req, res) => {
  const {
    email, password, nombre, apellido,
    ciudad, nivel_educativo, condiciones_socioeconomicas, edad,
    rol = 'estudiante',
  } = req.body;

  if (!email || !password || !nombre || !apellido) {
    return res.status(400).json({
      success: false,
      message: 'Email, contraseña, nombre y apellido son obligatorios',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'La contraseña debe tener mínimo 6 caracteres' });
  }

  // 1. Crear usuario en Supabase Auth (solo posible con SERVICE_ROLE_KEY)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
  });

  if (authError) {
    return res.status(400).json({ success: false, message: authError.message });
  }

  const userId = authData.user.id;

  // 2. Crear registro en perfiles_usuario
  const { error: perfilError } = await supabase
    .from('perfiles_usuario')
    .insert([{ user_id: userId, nombre, apellido, ciudad, nivel_educativo, condiciones_socioeconomicas, edad: edad ? parseInt(edad) : null }]);

  if (perfilError) {
    // Rollback: eliminar el usuario de auth si el perfil no se pudo crear
    await supabase.auth.admin.deleteUser(userId);
    return res.status(500).json({ success: false, message: 'No se pudo crear el perfil: ' + perfilError.message });
  }

  // 3. Asignar rol en perfiles_usuario
  if (rol) {
    await supabase.from('perfiles_usuario').update({ rol }).eq('user_id', userId);
  }

  return res.status(201).json({ success: true, message: 'Usuario creado correctamente', data: { id: userId } });
});

// PATCH /api/admin/usuarios/:id — actualiza perfil y/o rol
const updateUsuario = asyncHandler('admin/usuariosController.updateUsuario', async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, ciudad, nivel_educativo, condiciones_socioeconomicas, edad, rol } = req.body;

  const { data: perfil, error: findError } = await supabase
    .from('perfiles_usuario').select('user_id').eq('id', id).single();

  if (findError || !perfil) {
    return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  }

  const { error: updateError } = await supabase
    .from('perfiles_usuario')
    .update({ nombre, apellido, ciudad, nivel_educativo, condiciones_socioeconomicas, edad: edad ? parseInt(edad) : null })
    .eq('id', id);

  if (updateError) {
    return res.status(500).json({ success: false, message: updateError.message });
  }

  if (rol) {
    const { error: rolError } = await supabase.from('perfiles_usuario').update({ rol }).eq('user_id', perfil.user_id);
    if (rolError) {
      return res.status(207).json({
        success: true,
        message: 'Perfil actualizado, pero no se pudo cambiar el rol: ' + rolError.message,
      });
    }
  }

  return res.json({ success: true, message: 'Usuario actualizado correctamente' });
});

// DELETE /api/admin/usuarios/:id
const deleteUsuario = asyncHandler('admin/usuariosController.deleteUsuario', async (req, res) => {
  const { id } = req.params;

  const { data: perfil, error: findError } = await supabase
    .from('perfiles_usuario').select('user_id').eq('id', id).single();

  if (findError || !perfil) {
    return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  }

  const { error: deletePerfilError } = await supabase.from('perfiles_usuario').delete().eq('id', id);
  if (deletePerfilError) {
    return res.status(500).json({ success: false, message: deletePerfilError.message });
  }

  const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(perfil.user_id);
  if (deleteAuthError) {
    return res.status(207).json({
      success: true,
      message: 'Perfil eliminado. No se pudo eliminar el usuario de autenticación: ' + deleteAuthError.message,
    });
  }

  return res.json({ success: true, message: 'Usuario eliminado correctamente' });
});

// GET /api/admin/stats — conteo de registros de las tablas principales
const getStats = asyncHandler('admin/usuariosController.getStats', async (req, res) => {
  const tablas = ['perfiles_usuario', 'programas', 'instituciones', 'cuestionarios', 'preguntas'];

  const resultados = await Promise.all(
    tablas.map(tabla =>
      supabase.from(tabla).select('*', { count: 'exact', head: true }).then(({ count }) => [tabla, count ?? 0])
    )
  );

  return res.json({ success: true, data: Object.fromEntries(resultados) });
});

module.exports = { getUsuarios, getUsuario, createUsuario, updateUsuario, deleteUsuario, getStats };
