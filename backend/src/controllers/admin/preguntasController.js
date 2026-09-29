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
  const filas = (opciones || []).map((opcion, index) => ({
    pregunta_id: preguntaId,
    label: opcion.label,
    icon: opcion.icon || null,
    orden: opcion.orden ?? index,
    ...(incluirEsCorrecta && { es_correcta: Boolean(opcion.es_correcta) }),
  }));
  if (filas.length === 0) return;
  const { error } = await supabase.from('opciones').insert(filas);
  if (error) throw error;
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
    opciones ( ${columnasOpcion} )
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
