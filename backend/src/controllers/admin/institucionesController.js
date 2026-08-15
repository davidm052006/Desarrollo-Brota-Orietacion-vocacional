const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePaginacion, metaPaginacion } = require('../../utils/paginacion');
const { patronIlike } = require('../../utils/postgrestFiltro');

const getInstituciones = asyncHandler('admin/institucionesController.getInstituciones', async (req, res) => {
  const { pagina, limite, desde, hasta } = parsePaginacion(req.query);
  const busqueda = (req.query.busqueda || '').trim();

  let query = supabase
    .from('instituciones')
    .select('*', { count: 'exact' })
    .order('nombre')
    .range(desde, hasta);

  if (busqueda) {
    const patron = patronIlike(busqueda);
    query = query.or(`nombre.ilike.${patron},ciudad.ilike.${patron}`);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return res.json({ success: true, data, meta: metaPaginacion(count, pagina, limite) });
});

const createInstitucion = asyncHandler('admin/institucionesController.createInstitucion', async (req, res) => {
  const { nombre, tipo, ciudad, departamento, direccion, telefono, email, sitio_web, costo_promedio, activa = true } = req.body;
  if (!nombre) return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });

  const { data, error } = await supabase
    .from('instituciones')
    .insert([{ nombre, tipo, ciudad, departamento, direccion, telefono, email, sitio_web, costo_promedio: costo_promedio || null, activa }])
    .select()
    .single();

  if (error) throw error;
  return res.status(201).json({ success: true, data });
});

const updateInstitucion = asyncHandler('admin/institucionesController.updateInstitucion', async (req, res) => {
  const { id } = req.params;
  const { nombre, tipo, ciudad, departamento, direccion, telefono, email, sitio_web, costo_promedio, activa } = req.body;

  const { error } = await supabase
    .from('instituciones')
    .update({ nombre, tipo, ciudad, departamento, direccion, telefono, email, sitio_web, costo_promedio: costo_promedio || null, activa })
    .eq('id', id);

  if (error) throw error;
  return res.json({ success: true, message: 'Institución actualizada' });
});

const deleteInstitucion = asyncHandler('admin/institucionesController.deleteInstitucion', async (req, res) => {
  const { error } = await supabase.from('instituciones').delete().eq('id', req.params.id);
  if (error) throw error;
  return res.json({ success: true, message: 'Institución eliminada' });
});

module.exports = { getInstituciones, createInstitucion, updateInstitucion, deleteInstitucion };
