const supabase = require('../config/supabase');

// Protege las rutas propias de una cuenta institución (/api/institucion/*).
// Self-contained, mismo patrón que verificarModeracion.js/verificarAdmin.js
// (valida el token él mismo). Adjunta req.institucionId para que los
// controllers filtren SIEMPRE por ahí — nunca confiar en un institucion_id
// que mande el body/query, o una institución podría leer/editar los
// programas de otra.
async function verificarInstitucion(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token de autenticación requerido' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
    }

    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles_usuario')
      .select('rol, institucion_id')
      .eq('user_id', user.id)
      .single();

    if (perfilError || perfil?.rol !== 'institucion') {
      return res.status(403).json({ success: false, message: 'Acceso denegado: se requiere rol institución' });
    }

    req.user = user;
    req.institucionId = perfil.institucion_id;
    next();
  } catch (err) {
    console.error('verificarInstitucion:', err);
    return res.status(500).json({ success: false, message: 'Error al verificar permisos' });
  }
}

module.exports = verificarInstitucion;
