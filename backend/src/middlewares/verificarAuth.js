const supabase = require('../config/supabase');

/**
 * Middleware que verifica el JWT de Supabase para rutas de usuario autenticado.
 * Usa supabase.auth.getUser() con la service_role_key para validar el token
 * sin depender de RLS ni de un JWT_SECRET propio.
 *
 * En caso de éxito, adjunta req.user con { id, email, ... } de Supabase.
 */
async function verificarAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token de autenticación requerido' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
    }

    // Bloqueo manual desde el panel admin (distinto del ban automático de
    // `baneado_preguntas_hasta`) — chequeado acá porque verificarAuth corre
    // en toda ruta autenticada, así no hay que repetir el check en cada una.
    // Si el usuario no tiene perfil todavía (recién registrado), no bloquea.
    // De paso trae rol/permisos_override y los cuelga en req.perfil, para
    // que requierePermiso.js (middlewares/requierePermiso.js) no tenga que
    // volver a pegarle a la base por lo mismo.
    const { data: perfil } = await supabase
      .from('perfiles_usuario')
      .select('rol, permisos_override, bloqueado_hasta')
      .eq('user_id', user.id)
      .single();

    if (perfil?.bloqueado_hasta && new Date(perfil.bloqueado_hasta) > new Date()) {
      return res.status(403).json({ success: false, error: 'BLOQUEADO', hasta: perfil.bloqueado_hasta });
    }

    req.user = user;
    req.perfil = perfil ?? null;
    next();
  } catch (err) {
    console.error('verificarAuth:', err);
    return res.status(500).json({ success: false, message: 'Error al verificar autenticación' });
  }
}

module.exports = verificarAuth;
