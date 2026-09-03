const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');

// GET /api/institucion/programas — solo los programas de la institución
// vinculada a la cuenta logueada (req.institucionId, de verificarInstitucion).
const getMisProgramas = asyncHandler('institucion/programasController.getMisProgramas', async (req, res) => {
  if (!req.institucionId) {
    return res.json({ success: true, data: [] }); // desvinculada (ver migration_rol_institucion.sql) — nada que listar
  }

  const { data, error } = await supabase
    .from('programas')
    .select('*')
    .eq('institucion_id', req.institucionId)
    .order('nombre');

  if (error) throw error;
  return res.json({ success: true, data: data || [] });
});

// PATCH /api/institucion/programas/:id — solo descripción/requisitos/costo/activo,
// nunca nombre/tipo/area_academica (eso es dato oficial del MEN, no de la institución).
const actualizarMiPrograma = asyncHandler('institucion/programasController.actualizarMiPrograma', async (req, res) => {
  const { id } = req.params;
  const { descripcion, requisitos, costo_matricula, activo } = req.body;

  if (!req.institucionId) {
    return res.status(403).json({ success: false, message: 'Tu cuenta no está vinculada a ninguna institución todavía' });
  }

  // Confirma que el programa es de ESTA institución antes de tocarlo —
  // sin esto, cualquier institución podría editar el programa de otra
  // adivinando un id.
  const { data: programa, error: findError } = await supabase
    .from('programas').select('institucion_id').eq('id', id).single();

  if (findError || !programa) {
    return res.status(404).json({ success: false, message: 'Programa no encontrado' });
  }
  if (programa.institucion_id !== req.institucionId) {
    return res.status(403).json({ success: false, message: 'Ese programa no pertenece a tu institución' });
  }

  const { error: updateError } = await supabase
    .from('programas')
    .update({ descripcion, requisitos, costo_matricula: costo_matricula || null, activo })
    .eq('id', id);

  if (updateError) throw updateError;
  return res.json({ success: true, message: 'Programa actualizado' });
});

module.exports = { getMisProgramas, actualizarMiPrograma };
