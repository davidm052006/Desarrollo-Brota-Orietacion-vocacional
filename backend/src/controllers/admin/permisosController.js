const asyncHandler = require('../../utils/asyncHandler');
const { PERMISOS_POR_ROL, RECURSOS_VALIDOS } = require('../../utils/permisos');

// GET /api/admin/permisos/catalogo — recursos disponibles + default por rol,
// para que el frontend arme los checkboxes de ModalPermisosUsuario sin
// duplicar la lista que ya vive en utils/permisos.js
const getCatalogoPermisos = asyncHandler('admin/permisosController.getCatalogoPermisos', async (req, res) => {
  return res.json({ success: true, data: { recursos: RECURSOS_VALIDOS, porRol: PERMISOS_POR_ROL } });
});

module.exports = { getCatalogoPermisos };
