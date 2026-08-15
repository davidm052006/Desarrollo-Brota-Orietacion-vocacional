const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePaginacion, metaPaginacion } = require('../../utils/paginacion');

const getProgramas = asyncHandler('admin/programasController.getProgramas', async (req, res) => {
  const { pagina, limite, desde, hasta } = parsePaginacion(req.query);
  const busqueda = (req.query.busqueda || '').trim();

  let query = supabase
    .from('programas')
    .select('*, instituciones(nombre)', { count: 'exact' })
    .order('nombre')
    .range(desde, hasta);

  if (busqueda) query = query.ilike('nombre', `%${busqueda}%`);

  const { data, count, error } = await query;
  if (error) throw error;

  const programas = (data || []).map(p => ({ ...p, institucion_nombre: p.instituciones?.nombre || '—' }));
  return res.json({ success: true, data: programas, meta: metaPaginacion(count, pagina, limite) });
});

const createPrograma = asyncHandler('admin/programasController.createPrograma', async (req, res) => {
  const { nombre, tipo, area_academica, duracion, modalidad, descripcion, requisitos, costo_matricula, institucion_id, activo = true } = req.body;
  if (!nombre) return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });

  const { data, error } = await supabase
    .from('programas')
    .insert([{ nombre, tipo, area_academica, duracion, modalidad, descripcion, requisitos, costo_matricula: costo_matricula || null, institucion_id: institucion_id || null, activo }])
    .select()
    .single();

  if (error) throw error;
  return res.status(201).json({ success: true, data });
});

const updatePrograma = asyncHandler('admin/programasController.updatePrograma', async (req, res) => {
  const { id } = req.params;
  const { nombre, tipo, area_academica, duracion, modalidad, descripcion, requisitos, costo_matricula, institucion_id, activo } = req.body;

  const { error } = await supabase
    .from('programas')
    .update({ nombre, tipo, area_academica, duracion, modalidad, descripcion, requisitos, costo_matricula: costo_matricula || null, institucion_id: institucion_id || null, activo })
    .eq('id', id);

  if (error) throw error;
  return res.json({ success: true, message: 'Programa actualizado' });
});

const deletePrograma = asyncHandler('admin/programasController.deletePrograma', async (req, res) => {
  const { error } = await supabase.from('programas').delete().eq('id', req.params.id);
  if (error) throw error;
  return res.json({ success: true, message: 'Programa eliminado' });
});

module.exports = { getProgramas, createPrograma, updatePrograma, deletePrograma };
