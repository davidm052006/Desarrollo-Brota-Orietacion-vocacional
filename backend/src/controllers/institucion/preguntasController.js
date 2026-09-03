const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');

// A diferencia de admin/preguntasController.js (que solo escribe la columna
// legada `preguntas.opciones` JSONB, nunca leída por el motor real del test),
// este controller SÍ gestiona las tablas relacionales `opciones`/`pesos_opciones`
// que perfilController.obtenerCuestionario usa de verdad para armar el test y
// calcular el perfil vocacional — si no, un cuestionario de institución se
// vería bien en el panel pero no puntuaría nada al tomarse.

// Confirma que `cuestionarioId` existe y pertenece a la institución que llama
// — ninguna operación de preguntas puede tocar un cuestionario ajeno.
async function verificarCuestionarioPropio(cuestionarioId, institucionId) {
  const { data, error } = await supabase
    .from('cuestionarios').select('institucion_id').eq('id', cuestionarioId).single();
  if (error || !data) return { ok: false, status: 404, message: 'Cuestionario no encontrado' };
  if (data.institucion_id !== institucionId) return { ok: false, status: 403, message: 'Ese cuestionario no pertenece a tu institución' };
  return { ok: true };
}

// Inserta las filas de `opciones` + `pesos_opciones` de una pregunta.
// `opciones`: [{ label, icon, orden, pesos: { categoria: puntos, ... } }]
async function insertarOpciones(preguntaId, opciones) {
  for (const [i, opcion] of (opciones || []).entries()) {
    const { data: opcionCreada, error: errOpcion } = await supabase
      .from('opciones')
      .insert([{ pregunta_id: preguntaId, label: opcion.label, icon: opcion.icon || null, orden: opcion.orden ?? i }])
      .select('id')
      .single();

    if (errOpcion) throw errOpcion;

    const pesos = Object.entries(opcion.pesos || {})
      .filter(([, puntos]) => Number(puntos) > 0)
      .map(([categoria, puntos]) => ({ opcion_id: opcionCreada.id, categoria, puntos: Number(puntos) }));

    if (pesos.length > 0) {
      const { error: errPesos } = await supabase.from('pesos_opciones').insert(pesos);
      if (errPesos) throw errPesos;
    }
  }
}

// GET /api/institucion/preguntas?cuestionario_id=... — requiere cuestionario_id
// (a diferencia del admin, acá no tiene sentido listar "todas las preguntas
// sin filtro" porque una institución no puede ver las de otra).
const getPreguntas = asyncHandler('institucion/preguntasController.getPreguntas', async (req, res) => {
  const cuestionarioId = req.query.cuestionario_id;
  if (!cuestionarioId) {
    return res.status(400).json({ success: false, message: 'Falta cuestionario_id' });
  }

  const check = await verificarCuestionarioPropio(cuestionarioId, req.institucionId);
  if (!check.ok) return res.status(check.status).json({ success: false, message: check.message });

  // Mismo shape que perfilController.obtenerCuestionario, para que el editor
  // muestre exactamente lo que el estudiante va a ver.
  const { data, error } = await supabase
    .from('preguntas')
    .select(`
      id, texto, tipo, orden, categoria, peso,
      opciones (
        id, label, icon, orden,
        pesos_opciones ( categoria, puntos )
      )
    `)
    .eq('cuestionario_id', cuestionarioId)
    .order('orden', { ascending: true });

  if (error) throw error;

  const preguntas = (data || []).map(p => ({
    ...p,
    opciones: (p.opciones ?? [])
      .sort((a, b) => a.orden - b.orden)
      .map(o => ({
        id: o.id, label: o.label, icon: o.icon, orden: o.orden,
        pesos: Object.fromEntries((o.pesos_opciones ?? []).map(({ categoria, puntos }) => [categoria, puntos])),
      })),
  }));

  return res.json({ success: true, data: preguntas });
});

// POST /api/institucion/preguntas
// body: { cuestionario_id, texto, tipo, orden, categoria, peso, opciones }
const createPregunta = asyncHandler('institucion/preguntasController.createPregunta', async (req, res) => {
  const { cuestionario_id, texto, tipo, orden, categoria, peso, opciones } = req.body;

  if (!cuestionario_id || !texto || !tipo) {
    return res.status(400).json({ success: false, message: 'cuestionario_id, texto y tipo son obligatorios' });
  }
  if (!Array.isArray(opciones) || opciones.length < 2) {
    return res.status(400).json({ success: false, message: 'La pregunta necesita al menos 2 opciones' });
  }

  const check = await verificarCuestionarioPropio(cuestionario_id, req.institucionId);
  if (!check.ok) return res.status(check.status).json({ success: false, message: check.message });

  const { data: pregunta, error } = await supabase
    .from('preguntas')
    .insert([{ cuestionario_id, texto, tipo, orden: orden || 1, categoria, peso: peso || 1.0 }])
    .select()
    .single();

  if (error) throw error;

  await insertarOpciones(pregunta.id, opciones);

  return res.status(201).json({ success: true, data: pregunta });
});

// PATCH /api/institucion/preguntas/:id
// Las opciones se reemplazan completas (borrar + re-insertar) en vez de
// diffear una por una — el frontend siempre manda el estado completo del
// editor, mismo criterio que permisos_override en usuariosController.js.
const updatePregunta = asyncHandler('institucion/preguntasController.updatePregunta', async (req, res) => {
  const { id } = req.params;
  const { texto, tipo, orden, categoria, peso, opciones } = req.body;

  const { data: preguntaActual, error: findError } = await supabase
    .from('preguntas').select('cuestionario_id').eq('id', id).single();

  if (findError || !preguntaActual) {
    return res.status(404).json({ success: false, message: 'Pregunta no encontrada' });
  }

  const check = await verificarCuestionarioPropio(preguntaActual.cuestionario_id, req.institucionId);
  if (!check.ok) return res.status(check.status).json({ success: false, message: check.message });

  const { error: updateError } = await supabase
    .from('preguntas')
    .update({ texto, tipo, orden, categoria, peso })
    .eq('id', id);

  if (updateError) throw updateError;

  if (Array.isArray(opciones)) {
    // Borra las opciones viejas (cascada a pesos_opciones) y arma las nuevas.
    const { error: deleteError } = await supabase.from('opciones').delete().eq('pregunta_id', id);
    if (deleteError) throw deleteError;
    await insertarOpciones(id, opciones);
  }

  return res.json({ success: true, message: 'Pregunta actualizada' });
});

// DELETE /api/institucion/preguntas/:id — cascada a opciones/pesos_opciones.
const deletePregunta = asyncHandler('institucion/preguntasController.deletePregunta', async (req, res) => {
  const { id } = req.params;

  const { data: preguntaActual, error: findError } = await supabase
    .from('preguntas').select('cuestionario_id').eq('id', id).single();

  if (findError || !preguntaActual) {
    return res.status(404).json({ success: false, message: 'Pregunta no encontrada' });
  }

  const check = await verificarCuestionarioPropio(preguntaActual.cuestionario_id, req.institucionId);
  if (!check.ok) return res.status(check.status).json({ success: false, message: check.message });

  const { error } = await supabase.from('preguntas').delete().eq('id', id);
  if (error) throw error;
  return res.json({ success: true, message: 'Pregunta eliminada' });
});

module.exports = { getPreguntas, createPregunta, updatePregunta, deletePregunta };
