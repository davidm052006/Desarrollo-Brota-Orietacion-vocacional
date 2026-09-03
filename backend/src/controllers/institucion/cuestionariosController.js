const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');

// GET /api/institucion/cuestionarios — solo los propios de esta institución
// (nunca los globales ni los de otra institución).
const getCuestionarios = asyncHandler('institucion/cuestionariosController.getCuestionarios', async (req, res) => {
  if (!req.institucionId) return res.json({ success: true, data: [] });

  const { data, error } = await supabase
    .from('cuestionarios')
    .select('*, preguntas(count)')
    .eq('institucion_id', req.institucionId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const result = (data || []).map(c => ({ ...c, num_preguntas: c.preguntas?.[0]?.count ?? 0 }));
  return res.json({ success: true, data: result });
});

// POST /api/institucion/cuestionarios — nace inactivo a propósito: recién
// creado no tiene preguntas todavía, activarlo de una dejaría a los
// estudiantes de esa institución con un test vacío.
const createCuestionario = asyncHandler('institucion/cuestionariosController.createCuestionario', async (req, res) => {
  if (!req.institucionId) {
    return res.status(403).json({ success: false, message: 'Tu cuenta no está vinculada a ninguna institución todavía' });
  }

  const { nombre, version, descripcion } = req.body;
  if (!nombre || !version) return res.status(400).json({ success: false, message: 'Nombre y versión son obligatorios' });

  const { data, error } = await supabase
    .from('cuestionarios')
    .insert([{ nombre, version, descripcion, activo: false, institucion_id: req.institucionId }])
    .select()
    .single();

  if (error) throw error;
  return res.status(201).json({ success: true, data });
});

// PATCH /api/institucion/cuestionarios/:id
const updateCuestionario = asyncHandler('institucion/cuestionariosController.updateCuestionario', async (req, res) => {
  const { id } = req.params;
  const { nombre, version, descripcion, activo } = req.body;

  const { data: existente, error: findError } = await supabase
    .from('cuestionarios').select('institucion_id').eq('id', id).single();

  if (findError || !existente) {
    return res.status(404).json({ success: false, message: 'Cuestionario no encontrado' });
  }
  if (existente.institucion_id !== req.institucionId) {
    return res.status(403).json({ success: false, message: 'Ese cuestionario no pertenece a tu institución' });
  }

  // Si se activa este, desactivar los OTROS de la misma institución — a
  // diferencia del admin (que desactiva todos los cuestionarios del sistema),
  // acá nunca se toca el cuestionario global ni el de otra institución.
  if (activo === true) {
    await supabase.from('cuestionarios').update({ activo: false })
      .eq('institucion_id', req.institucionId).neq('id', id);
  }

  const { error } = await supabase
    .from('cuestionarios')
    .update({ nombre, version, descripcion, activo })
    .eq('id', id);

  if (error) throw error;
  return res.json({ success: true, message: 'Cuestionario actualizado' });
});

// DELETE /api/institucion/cuestionarios/:id — cascada a preguntas/opciones/pesos.
const deleteCuestionario = asyncHandler('institucion/cuestionariosController.deleteCuestionario', async (req, res) => {
  const { id } = req.params;

  const { data: existente, error: findError } = await supabase
    .from('cuestionarios').select('institucion_id').eq('id', id).single();

  if (findError || !existente) {
    return res.status(404).json({ success: false, message: 'Cuestionario no encontrado' });
  }
  if (existente.institucion_id !== req.institucionId) {
    return res.status(403).json({ success: false, message: 'Ese cuestionario no pertenece a tu institución' });
  }

  const { error } = await supabase.from('cuestionarios').delete().eq('id', id);
  if (error) throw error;
  return res.json({ success: true, message: 'Cuestionario eliminado' });
});

module.exports = { getCuestionarios, createCuestionario, updateCuestionario, deleteCuestionario };
