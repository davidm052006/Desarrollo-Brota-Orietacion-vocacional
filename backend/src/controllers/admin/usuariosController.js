const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePaginacion, metaPaginacion } = require('../../utils/paginacion');
const { patronIlike } = require('../../utils/postgrestFiltro');
const { calcularEdadDesdeFecha } = require('../../utils/calcularEdad');
const { RECURSOS_VALIDOS } = require('../../utils/permisos');
const { crearUsuarioUnico } = require('../../utils/crearUsuario');
const sleep = require('../../utils/sleep');

const MAX_FILAS_MASIVO = 500;
const DELAY_ENTRE_FILAS_MS = 150;

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

    // Margen de seguridad: todas estas llamadas a Supabase Auth salen de la
    // misma IP (este backend) — un rate limit no documentado del Admin API
    // podría rechazar filas en medio de una carga grande sin esta pausa.
    await sleep(DELAY_ENTRE_FILAS_MS);
  }

  return res.status(201).json({ success: true, resultados });
});

// PATCH /api/admin/usuarios/:id — actualiza perfil y/o rol
const updateUsuario = asyncHandler('admin/usuariosController.updateUsuario', async (req, res) => {
  const { id } = req.params;
  const {
    nombre, apellido, ciudad, nivel_educativo, condiciones_socioeconomicas,
    edad, fecha_nacimiento, grado, telefono, rol, institucion_id,
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

  // institucion_id solo se toca si llega explícitamente en el body (re-vincular
  // una cuenta institución tras una sync MEN, ver migration_rol_institucion.sql)
  // — así una edición normal de un usuario no-institución no lo pisa con null.
  const campos = {
    nombre, apellido, ciudad, nivel_educativo, condiciones_socioeconomicas,
    edad: edadFinal, grado: grado || null, telefono: telefono || null,
  };
  if (institucion_id !== undefined) campos.institucion_id = institucion_id || null;

  const { error: updateError } = await supabase
    .from('perfiles_usuario')
    .update(campos)
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

// PATCH /api/admin/usuarios/:id/bloqueo — body: { horas } para bloquear N horas
// desde ahora, o { hasta: null } para desbloquear. No usa una fecha exacta a
// propósito (más simple para el panel: botones rápidos 1h/24h/7d/permanente).
const bloquearUsuario = asyncHandler('admin/usuariosController.bloquearUsuario', async (req, res) => {
  const { id } = req.params;
  const { horas, hasta } = req.body;

  const { data: perfil, error: findError } = await supabase
    .from('perfiles_usuario').select('user_id').eq('id', id).single();

  if (findError || !perfil) {
    return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  }

  if (perfil.user_id === req.user.id) {
    return res.status(400).json({ success: false, message: 'No podés bloquearte a vos mismo' });
  }

  let bloqueadoHasta;
  if (hasta === null) {
    bloqueadoHasta = null; // desbloquear
  } else {
    const horasNum = parseFloat(horas);
    if (isNaN(horasNum) || horasNum <= 0) {
      return res.status(400).json({ success: false, message: 'Debe indicar "horas" (número mayor a 0) para bloquear, o "hasta: null" para desbloquear' });
    }
    bloqueadoHasta = new Date(Date.now() + horasNum * 60 * 60 * 1000).toISOString();
  }

  const { error: updateError } = await supabase
    .from('perfiles_usuario')
    .update({ bloqueado_hasta: bloqueadoHasta })
    .eq('id', id);

  if (updateError) {
    return res.status(500).json({ success: false, message: updateError.message });
  }

  return res.json({
    success: true,
    message: bloqueadoHasta ? `Usuario bloqueado hasta ${bloqueadoHasta}` : 'Usuario desbloqueado',
    data: { bloqueado_hasta: bloqueadoHasta },
  });
});

// PATCH /api/admin/usuarios/:id/permisos — body: { permisos_override: { "recurso": true|false, ... } }
// Reemplaza el objeto completo (no hace merge) — el frontend manda siempre el
// estado completo de los checkboxes, ya con el catálogo de GET /permisos/catalogo.
const actualizarPermisos = asyncHandler('admin/usuariosController.actualizarPermisos', async (req, res) => {
  const { id } = req.params;
  const { permisos_override } = req.body;

  if (typeof permisos_override !== 'object' || permisos_override === null || Array.isArray(permisos_override)) {
    return res.status(400).json({ success: false, message: 'permisos_override debe ser un objeto' });
  }

  const clavesInvalidas = Object.keys(permisos_override).filter(k => !RECURSOS_VALIDOS.includes(k));
  if (clavesInvalidas.length > 0) {
    return res.status(400).json({ success: false, message: `Recurso(s) inválido(s): ${clavesInvalidas.join(', ')}` });
  }

  const { data: perfil, error: findError } = await supabase
    .from('perfiles_usuario').select('id').eq('id', id).single();

  if (findError || !perfil) {
    return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  }

  const { error: updateError } = await supabase
    .from('perfiles_usuario')
    .update({ permisos_override })
    .eq('id', id);

  if (updateError) {
    return res.status(500).json({ success: false, message: updateError.message });
  }

  return res.json({ success: true, message: 'Permisos actualizados correctamente' });
});

module.exports = {
  getUsuarios, getUsuario, createUsuario, createUsuariosMasivo, updateUsuario, deleteUsuario, getStats,
  bloquearUsuario, actualizarPermisos,
};
