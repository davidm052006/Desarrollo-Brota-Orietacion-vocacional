const { tienePermiso } = require('../utils/permisos');

// A diferencia de verificarPermiso.js (self-contained, revalida token y
// vuelve a consultar perfiles_usuario desde cero), este confía en que
// verificarAuth ya corrió antes en la misma cadena y dejó el perfil en
// req.perfil — no pega de nuevo a Supabase Auth ni a la base. Usar así:
//   router.post('/foros/:id/posts', verificarAuth, requierePermiso('comunidad.publicar'), createPost);
function requierePermiso(recurso) {
  return (req, res, next) => {
    if (!tienePermiso(req.perfil, recurso)) {
      return res.status(403).json({ success: false, message: `No tenés permiso para "${recurso}"` });
    }
    next();
  };
}

module.exports = requierePermiso;
