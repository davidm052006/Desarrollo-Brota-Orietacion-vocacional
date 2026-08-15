const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');

const getCuestionarios = asyncHandler('admin/cuestionariosController.getCuestionarios', async (req, res) => {
  const { data, error } = await supabase
    .from('cuestionarios')
    .select('*, preguntas(count)')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const result = (data || []).map(c => ({ ...c, num_preguntas: c.preguntas?.[0]?.count ?? 0 }));
  return res.json({ success: true, data: result });
});

const createCuestionario = asyncHandler('admin/cuestionariosController.createCuestionario', async (req, res) => {
  const { nombre, version, descripcion, activo = false } = req.body;
  if (!nombre || !version) return res.status(400).json({ success: false, message: 'Nombre y versión son obligatorios' });

  const { data, error } = await supabase
    .from('cuestionarios')
    .insert([{ nombre, version, descripcion, activo }])
    .select()
    .single();

  if (error) throw error;
  return res.status(201).json({ success: true, data });
});

const updateCuestionario = asyncHandler('admin/cuestionariosController.updateCuestionario', async (req, res) => {
  const { id } = req.params;
  const { nombre, version, descripcion, activo } = req.body;

  // Si se activa este cuestionario, desactivar los demás
  if (activo === true) {
    await supabase.from('cuestionarios').update({ activo: false }).neq('id', id);
  }

  const { error } = await supabase
    .from('cuestionarios')
    .update({ nombre, version, descripcion, activo })
    .eq('id', id);

  if (error) throw error;
  return res.json({ success: true, message: 'Cuestionario actualizado' });
});

const deleteCuestionario = asyncHandler('admin/cuestionariosController.deleteCuestionario', async (req, res) => {
  const { error } = await supabase.from('cuestionarios').delete().eq('id', req.params.id);
  if (error) throw error;
  return res.json({ success: true, message: 'Cuestionario eliminado' });
});

module.exports = { getCuestionarios, createCuestionario, updateCuestionario, deleteCuestionario };
