const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePaginacion, metaPaginacion } = require('../../utils/paginacion');
const { patronIlike } = require('../../utils/postgrestFiltro');
const { calcularEdadDesdeFecha } = require('../../utils/calcularEdad');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES_VALIDOS = ['estudiante', 'orientador', 'moderador', 'admin'];
const MAX_FILAS_MASIVO = 500;

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

// Crea un usuario en Supabase Auth + su fila en perfiles_usuario (+ rol).
// Reutilizada por createUsuario (individual) y createUsuariosMasivo (en lote)
// para no duplicar los mismos 3 pasos ni las reglas de validación.
// `fecha_nacimiento` (mismo campo que pide el registro público, ver SignupCard.jsx)
// tiene prioridad sobre `edad` si llegan los dos — así el formulario de creación
// y la carga masiva pueden usar el mismo formato que el registro real en vez de
// pedir una edad numérica suelta. `edad` se mantiene por compatibilidad (ediciones
// de usuarios existentes, que no tienen fecha de nacimiento guardada).
async function crearUsuarioUnico({
  email, password, nombre, apellido,
  ciudad, nivel_educativo, condiciones_socioeconomicas,
  edad, fecha_nacimiento, grado, telefono,
  rol = 'estudiante',
}) {
  if (!email || !password || !nombre || !apellido) {
    return { success: false, error: 'Email, contraseña, nombre y apellido son obligatorios' };
  }
  if (password.length < 6) {
    return { success: false, error: 'La contraseña debe tener mínimo 6 caracteres' };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { success: false, error: 'El email no tiene un formato válido' };
  }
  if (rol && !ROLES_VALIDOS.includes(rol)) {
    return { success: false, error: `Rol inválido "${rol}" — debe ser uno de: ${ROLES_VALIDOS.join(', ')}` };
  }

  let edadFinal = null;
  if (fecha_nacimiento) {
    edadFinal = calcularEdadDesdeFecha(fecha_nacimiento);
    if (edadFinal === null) {
      return { success: false, error: 'Fecha de nacimiento inválida (la edad debe estar entre 14 y 100 años)' };
    }
  } else if (edad !== undefined && edad !== null && edad !== '') {
    if (isNaN(parseInt(edad))) {
      return { success: false, error: 'La edad debe ser un número' };
    }
    edadFinal = parseInt(edad);
  }

  // 1. Crear usuario en Supabase Auth (solo posible con SERVICE_ROLE_KEY)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
  });

  if (authError) {
    return { success: false, error: authError.message };
  }

  const userId = authData.user.id;

  // 2. Crear registro en perfiles_usuario
  const { error: perfilError } = await supabase
    .from('perfiles_usuario')
    .insert([{
      user_id: userId, nombre, apellido, ciudad, nivel_educativo, condiciones_socioeconomicas,
      edad: edadFinal, grado: grado || null, telefono: telefono || null,
    }]);

  if (perfilError) {
    // Rollback: eliminar el usuario de auth si el perfil no se pudo crear.
    // Es un fallo de infraestructura después de pasar toda la validación
    // (no un error del cliente) — status 500, no 400.
    await supabase.auth.admin.deleteUser(userId);
    return { success: false, error: 'No se pudo crear el perfil: ' + perfilError.message, status: 500 };
  }

  // 3. Asignar rol en perfiles_usuario
  if (rol) {
    await supabase.from('perfiles_usuario').update({ rol }).eq('user_id', userId);
  }

  return { success: true, id: userId };
}

// POST /api/admin/usuarios — crea auth.users + perfiles_usuario (+ rol)
// Requiere SERVICE_ROLE_KEY para supabase.auth.admin.createUser()
const createUsuario = asyncHandler('admin/usuariosController.createUsuario', async (req, res) => {
  const resultado = await crearUsuarioUnico(req.body);

  if (!resultado.success) {
    return res.status(resultado.status || 400).json({ success: false, message: resultado.error });
  }

  return res.status(201).json({ success: true, message: 'Usuario creado correctamente', data: { id: resultado.id } });
});

// POST /api/admin/usuarios/masivo — crea varios usuarios en una sola request.
// body: { usuarios: [{ email, password, nombre, apellido, ciudad, nivel_educativo,
//                       condiciones_socioeconomicas, edad, rol }, ...] }
// El frontend ya parseó el CSV/Excel a filas — este endpoint solo valida y crea,
// evitando el problema de mandar N requests secuenciales (una por fila) que existía
// antes contra el rate limit general de /api (300/15min, ver server.js).
const createUsuariosMasivo = asyncHandler('admin/usuariosController.createUsuariosMasivo', async (req, res) => {
  const { usuarios } = req.body;

  if (!Array.isArray(usuarios) || usuarios.length === 0) {
    return res.status(400).json({ success: false, message: 'No se recibieron filas de usuarios para importar' });
  }
  if (usuarios.length > MAX_FILAS_MASIVO) {
    return res.status(400).json({
      success: false,
      message: `El archivo tiene ${usuarios.length} filas — el máximo por carga es ${MAX_FILAS_MASIVO}`,
    });
  }

  // Duplicados dentro del mismo archivo: se marcan como error en vez de
  // intentar crearlos (el segundo intento fallaría igual en Supabase Auth,
  // pero así el reporte es más claro sobre por qué falló cada fila).
  const emailsVistos = new Set();
  const resultados = [];

  for (const fila of usuarios) {
    const email = (fila.email || '').trim().toLowerCase();

    if (email && emailsVistos.has(email)) {
      resultados.push({ usuario: fila, success: false, error: 'Email duplicado dentro del archivo' });
      continue;
    }
    if (email) emailsVistos.add(email);

    const resultado = await crearUsuarioUnico(fila);
    resultados.push({ usuario: fila, success: resultado.success, error: resultado.success ? null : resultado.error });
  }

  return res.status(201).json({ success: true, resultados });
});

// PATCH /api/admin/usuarios/:id — actualiza perfil y/o rol
const updateUsuario = asyncHandler('admin/usuariosController.updateUsuario', async (req, res) => {
  const { id } = req.params;
  const {
    nombre, apellido, ciudad, nivel_educativo, condiciones_socioeconomicas,
    edad, fecha_nacimiento, grado, telefono, rol,
  } = req.body;

  const { data: perfil, error: findError } = await supabase
    .from('perfiles_usuario').select('user_id').eq('id', id).single();

  if (findError || !perfil) {
    return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  }

  // fecha_nacimiento es opcional en edición (los usuarios existentes no tienen
  // la fecha guardada, solo la edad ya calculada) — si llega, recalcula la edad;
  // si no, se respeta lo que venga en `edad` tal cual (comportamiento previo).
  const edadFinal = fecha_nacimiento ? calcularEdadDesdeFecha(fecha_nacimiento) : (edad ? parseInt(edad) : null);

  const { error: updateError } = await supabase
    .from('perfiles_usuario')
    .update({
      nombre, apellido, ciudad, nivel_educativo, condiciones_socioeconomicas,
      edad: edadFinal, grado: grado || null, telefono: telefono || null,
    })
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

module.exports = { getUsuarios, getUsuario, createUsuario, createUsuariosMasivo, updateUsuario, deleteUsuario, getStats };
