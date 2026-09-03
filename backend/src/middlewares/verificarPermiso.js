const supabase = require('../config/supabase');
const { tienePermiso } = require('../utils/permisos');

// Factory: verificarPermiso('comunidad.publicar') protege una ruta puntual
// que necesita un check más fino que "está logueado" — self-contained, mismo
// patrón que verificarAdmin.js/verificarModeracion.js (valida el token él
// mismo). Lee el permiso efectivo (rol + permisos_override) vía utils/permisos.js
// y también corta el acceso si la cuenta está bloqueada.
function verificarPermiso(recurso) {
  return async function (req, res, next) {
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
        .select('rol, permisos_override, bloqueado_hasta')
        .eq('user_id', user.id)
        .single();

      if (perfilError || !perfil) {
        return res.status(403).json({ success: false, message: 'Perfil no encontrado' });
      }

      if (perfil.bloqueado_hasta && new Date(perfil.bloqueado_hasta) > new Date()) {
        return res.status(403).json({ success: false, error: 'BLOQUEADO', hasta: perfil.bloqueado_hasta });
      }

      if (!tienePermiso(perfil, recurso)) {
        return res.status(403).json({ success: false, message: `Acceso denegado: no tenés permiso para "${recurso}"` });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error('verificarPermiso:', err);
      return res.status(500).json({ success: false, message: 'Error al verificar permisos' });
    }
  };
}

module.exports = verificarPermiso;
