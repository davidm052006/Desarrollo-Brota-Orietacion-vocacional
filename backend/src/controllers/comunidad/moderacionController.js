const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');

// Mapea el :tipo de la URL a la tabla real — así un solo endpoint sirve
// para las 3 clases de publicación en vez de triplicar rutas/controllers.
const TABLAS = { post: 'posts_foro', historia: 'historias', pregunta: 'preguntas_comunidad' };

// PATCH /api/comunidad/moderacion/:tipo/:id/ocultar
// No borra la fila — la marca oculta=true, para que deje de aparecer en
// foros/historias/preguntas pero quede el registro (a diferencia del
// hard-delete de abajo). No hay endpoint para des-ocultar todavía.
const ocultarPublicacion = asyncHandler('comunidad/moderacionController.ocultarPublicacion', async (req, res) => {
  const { tipo, id } = req.params;
  const tabla = TABLAS[tipo];
  if (!tabla) return res.status(400).json({ success: false, message: 'Tipo de publicación inválido' });

  const { error } = await supabase.from(tabla).update({ oculta: true }).eq('id', id);
  if (error) return res.status(500).json({ success: false, message: error.message });

  return res.json({ success: true });
});

// DELETE /api/comunidad/moderacion/:tipo/:id — borrado definitivo
const eliminarPublicacion = asyncHandler('comunidad/moderacionController.eliminarPublicacion', async (req, res) => {
  const { tipo, id } = req.params;
  const tabla = TABLAS[tipo];
  if (!tabla) return res.status(400).json({ success: false, message: 'Tipo de publicación inválido' });

  const { error } = await supabase.from(tabla).delete().eq('id', id);
  if (error) return res.status(500).json({ success: false, message: error.message });

  return res.json({ success: true });
});

// GET /api/comunidad/moderacion/autor/:userId — página privada de admin/mod
// con los datos de quien hizo una publicación, incluso si la publicó anónima.
const getInfoAutor = asyncHandler('comunidad/moderacionController.getInfoAutor', async (req, res) => {
  const { userId } = req.params;

  const { data: perfil, error } = await supabase
    .from('perfiles_usuario')
    .select('user_id, nombre, apellido, ciudad, edad, nivel_educativo, rol, racha_dias, created_at')
    .eq('user_id', userId)
    .single();

  if (error || !perfil) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

  // El email real solo vive en auth.users, no en perfiles_usuario — hace
  // falta la Admin API (requiere SUPABASE_SERVICE_KEY, que ya usa este backend).
  let email = null;
  try {
    const { data: authData } = await supabase.auth.admin.getUserById(userId);
    email = authData?.user?.email ?? null;
  } catch (err) {
    console.error('moderacionController.getInfoAutor — auth.admin.getUserById:', err.message);
  }

  return res.json({ success: true, data: { ...perfil, email } });
});

module.exports = { ocultarPublicacion, eliminarPublicacion, getInfoAutor };
