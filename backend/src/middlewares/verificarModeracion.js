const supabase = require('../config/supabase');

// Protege las rutas de moderación de comunidad (ocultar/eliminar
// publicaciones, ver el autor real de algo anónimo). A diferencia de
// verificarAdmin.js, acepta tanto 'admin' como 'moderador' — mismo patrón
// de verificación de token, self-contained (no depende de verificarAuth).
async function verificarModeracion(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token de autenticación requerido' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
    }

    const { data: perfil, error: rolError } = await supabase
      .from('perfiles_usuario')
      .select('rol')
      .eq('user_id', user.id)
      .single();

    if (rolError || !['admin', 'moderador'].includes(perfil?.rol)) {
      return res.status(403).json({ success: false, message: 'Acceso denegado: se requiere rol admin o moderador' });
    }

    req.user = user;
    req.rolModeracion = perfil.rol;
    next();
  } catch (err) {
    console.error('verificarModeracion:', err);
    return res.status(500).json({ success: false, message: 'Error al verificar permisos' });
  }
}

module.exports = verificarModeracion;
