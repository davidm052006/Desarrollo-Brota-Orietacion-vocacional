const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');
const { esTipoPreguntaValido } = require('../../utils/tiposPregunta');

const ERROR_MIGRACION_CORRECTAS = 'Para marcar respuestas correctas, aplica la migración de opciones correctas en Supabase.';

async function tieneColumnaEsCorrecta() {
  const { error } = await supabase.from('opciones').select('es_correcta').limit(0);
  if (!error) return true;
  if (error.code === '42703' || error.code === 'PGRST204') return false;
  throw error;
}

async function insertarOpciones(preguntaId, opciones, incluirEsCorrecta) {
  for (const [index, opcion] of (opciones || []).entries()) {
    const { data: opcionCreada, error: errorOpcion } = await supabase
      .from('opciones')
      .insert([{
        pregunta_id: preguntaId,
        label: opcion.label,
        icon: opcion.icon || null,
        orden: opcion.orden ?? index,
        ...(incluirEsCorrecta && { es_correcta: Boolean(opcion.es_correcta) }),
      }])
      .select('id')
      .single();

    if (errorOpcion) throw errorOpcion;

    const pesos = Object.entries(opcion.pesos || {})
      .filter(([categoria, puntos]) => categoria && Number(puntos) > 0)
      .map(([categoria, puntos]) => ({
        opcion_id: opcionCreada.id,
        categoria,
        puntos: Number(puntos),
      }));

    if (pesos.length > 0) {
      const { error: errorPesos } = await supabase.from('pesos_opciones').insert(pesos);
      if (errorPesos) throw errorPesos;
    }
  }
}

const getPreguntas = asyncHandler('admin/preguntasController.getPreguntas', async (req, res) => {
  const cuestionarioId = req.query.cuestionario_id || '';
  const busqueda       = (req.query.busqueda || '').trim();
  const incluirEsCorrecta = await tieneColumnaEsCorrecta();
  const columnasOpcion = incluirEsCorrecta
    ? 'id, label, icon, orden, es_correcta'
    : 'id, label, icon, orden';

  let query = supabase.from('preguntas').select(`
    *,
    opciones ( ${columnasOpcion}, pesos_opciones ( categoria, puntos ) )
  `).order('orden');

  if (cuestionarioId) query = query.eq('cuestionario_id', cuestionarioId);
  if (busqueda)       query = query.ilike('texto', `%${busqueda}%`);

  const { data, error } = await query;
  if (error) throw error;
  const preguntas = (data || []).map(p => ({
    ...p,
    opciones: (p.opciones || []).sort((a, b) => a.orden - b.orden).map(opcion => ({
      ...opcion,
      es_correcta: Boolean(opcion.es_correcta),
      pesos: Object.fromEntries((opcion.pesos_opciones || []).map(({ categoria, puntos }) => [categoria, puntos])),
    })),
  }));
  return res.json({ success: true, data: preguntas, meta: { es_correcta_disponible: incluirEsCorrecta } });
});

const createPregunta = asyncHandler('admin/preguntasController.createPregunta', async (req, res) => {
  const { cuestionario_id, texto, tipo, orden, categoria, peso, opciones } = req.body;
  if (!cuestionario_id || !texto || !tipo) {
    return res.status(400).json({ success: false, message: 'cuestionario_id, texto y tipo son obligatorios' });
  }
  if (!esTipoPreguntaValido(tipo)) {
    return res.status(400).json({ success: false, message: 'Tipo de pregunta no válido' });
  }
  if (tipo === 'single' && (!Array.isArray(opciones) || opciones.length !== 5 || opciones.some(opcion =>
    !Object.entries(opcion.pesos || {}).some(([categoria, puntos]) => categoria && Number(puntos) > 0)
  ))) {
    return res.status(400).json({ success: false, message: 'La selección única requiere exactamente 5 opciones, cada una con un área ponderada' });
  }
  const incluirEsCorrecta = await tieneColumnaEsCorrecta();
  if (!incluirEsCorrecta && (opciones || []).some(opcion => opcion.es_correcta)) {
    return res.status(409).json({ success: false, message: ERROR_MIGRACION_CORRECTAS });
  }

  const { data, error } = await supabase
    .from('preguntas')
    .insert([{ cuestionario_id, texto, tipo, orden: orden || 1, categoria, peso: peso || 1.0 }])
    .select()
    .single();

  if (error) throw error;
  await insertarOpciones(data.id, opciones, incluirEsCorrecta);
  return res.status(201).json({ success: true, data });
});

const updatePregunta = asyncHandler('admin/preguntasController.updatePregunta', async (req, res) => {
  const { id } = req.params;
  const { texto, tipo, orden, categoria, peso, opciones } = req.body;
  if (tipo === 'single' && (!Array.isArray(opciones) || opciones.length !== 5 || opciones.some(opcion =>
    !Object.entries(opcion.pesos || {}).some(([categoria, puntos]) => categoria && Number(puntos) > 0)
  ))) {
    return res.status(400).json({ success: false, message: 'La selección única requiere exactamente 5 opciones, cada una con un área ponderada' });
  }
  const incluirEsCorrecta = Array.isArray(opciones) ? await tieneColumnaEsCorrecta() : false;
  if (!incluirEsCorrecta && (opciones || []).some(opcion => opcion.es_correcta)) {
    return res.status(409).json({ success: false, message: ERROR_MIGRACION_CORRECTAS });
  }

  const { error } = await supabase.from('preguntas').update({ texto, tipo, orden, categoria, peso }).eq('id', id);
  if (error) throw error;
  if (Array.isArray(opciones)) {
    const { error: deleteError } = await supabase.from('opciones').delete().eq('pregunta_id', id);
    if (deleteError) throw deleteError;
    await insertarOpciones(id, opciones, incluirEsCorrecta);
  }
  return res.json({ success: true, message: 'Pregunta actualizada' });
});

const deletePregunta = asyncHandler('admin/preguntasController.deletePregunta', async (req, res) => {
  const { error } = await supabase.from('preguntas').delete().eq('id', req.params.id);
  if (error) throw error;
  return res.json({ success: true, message: 'Pregunta eliminada' });
});

module.exports = { getPreguntas, createPregunta, updatePregunta, deletePregunta };
