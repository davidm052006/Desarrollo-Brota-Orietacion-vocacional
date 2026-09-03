const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePaginacion, metaPaginacion } = require('../../utils/paginacion');
const { patronIlike } = require('../../utils/postgrestFiltro');
const { crearUsuarioUnico } = require('../../utils/crearUsuario');
const sleep = require('../../utils/sleep');

const MAX_FILAS_MASIVO = 500;
const DELAY_ENTRE_FILAS_MS = 150;

// GET /api/institucion/usuarios — solo estudiantes de LA institución vinculada
// a la cuenta que llama (req.institucionId, de verificarInstitucion). Nunca
// se filtra por lo que mande el cliente.
const getUsuarios = asyncHandler('institucion/usuariosController.getUsuarios', async (req, res) => {
  if (!req.institucionId) {
    return res.json({ success: true, data: [], meta: metaPaginacion(0, 1, 10) }); // desvinculada, ver migration_rol_institucion.sql
  }

  const { pagina, limite, desde, hasta } = parsePaginacion(req.query);
  const busqueda = (req.query.busqueda || '').trim();

  let query = supabase
    .from('perfiles_usuario')
    .select('*', { count: 'exact' })
    .eq('institucion_id', req.institucionId)
    .eq('rol', 'estudiante')
    .order('created_at', { ascending: false })
    .range(desde, hasta);

  if (busqueda) {
    const patron = patronIlike(busqueda);
    query = query.or(`nombre.ilike.${patron},apellido.ilike.${patron}`);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return res.json({ success: true, data: data || [], meta: metaPaginacion(count, pagina, limite) });
});

// POST /api/institucion/usuarios — crea un estudiante propio. rol e
// institucion_id se fuerzan server-side (nunca lo que mande el body) para
// que una institución no pueda crear admins ni asignarse a otra institución.
const createUsuario = asyncHandler('institucion/usuariosController.createUsuario', async (req, res) => {
  if (!req.institucionId) {
    return res.status(403).json({ success: false, message: 'Tu cuenta no está vinculada a ninguna institución todavía' });
  }

  const resultado = await crearUsuarioUnico({ ...req.body, rol: 'estudiante', institucion_id: req.institucionId });

  if (!resultado.success) {
    return res.status(resultado.status || 400).json({ success: false, message: resultado.error });
  }

  return res.status(201).json({ success: true, message: 'Estudiante creado correctamente', data: { id: resultado.id } });
});

// POST /api/institucion/usuarios/masivo — mismo formato que el admin
// (backend/src/controllers/admin/usuariosController.js), pero cada fila se
// crea como estudiante de esta institución sin importar qué venga en el archivo.
const createUsuariosMasivo = asyncHandler('institucion/usuariosController.createUsuariosMasivo', async (req, res) => {
  if (!req.institucionId) {
    return res.status(403).json({ success: false, message: 'Tu cuenta no está vinculada a ninguna institución todavía' });
  }

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

  const emailsVistos = new Set();
  const resultados = [];

  for (const fila of usuarios) {
    const email = (fila.email || '').trim().toLowerCase();

    if (email && emailsVistos.has(email)) {
      resultados.push({ usuario: fila, success: false, error: 'Email duplicado dentro del archivo' });
      continue;
    }
    if (email) emailsVistos.add(email);

    const resultado = await crearUsuarioUnico({ ...fila, rol: 'estudiante', institucion_id: req.institucionId });
    resultados.push({ usuario: fila, success: resultado.success, error: resultado.success ? null : resultado.error });

    // Margen de seguridad: todas estas llamadas a Supabase Auth salen de la
    // misma IP (este backend) — un rate limit no documentado del Admin API
    // podría rechazar filas en medio de una carga grande sin esta pausa.
    await sleep(DELAY_ENTRE_FILAS_MS);
  }

  return res.status(201).json({ success: true, resultados });
});

// DELETE /api/institucion/usuarios/:id — solo si el estudiante es de ESTA institución.
const deleteUsuario = asyncHandler('institucion/usuariosController.deleteUsuario', async (req, res) => {
  const { id } = req.params;

  const { data: perfil, error: findError } = await supabase
    .from('perfiles_usuario').select('user_id, institucion_id').eq('id', id).single();

  if (findError || !perfil) {
    return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  }
  if (perfil.institucion_id !== req.institucionId) {
    return res.status(403).json({ success: false, message: 'Ese usuario no pertenece a tu institución' });
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

module.exports = { getUsuarios, createUsuario, createUsuariosMasivo, deleteUsuario };
