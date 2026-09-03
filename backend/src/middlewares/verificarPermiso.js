const tienePermiso = (recurso) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permisos || !req.user.permisos.includes(recurso)) {
      return res.status(403).json({ success: false, message: 'Permiso denegado' });
    }
    next();
  };
};
