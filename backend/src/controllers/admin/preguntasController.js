const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');
const { esTipoPreguntaValido } = require('../../utils/tiposPregunta');

async function insertarOpciones(preguntaId, opciones) {
  const filas = (opciones || []).map((opcion, index) => ({
    pregunta_id: preguntaId,
    label: opcion.label,
    icon: opcion.icon || null,
    orden: opcion.orden ?? index,
  }));
  if (filas.length === 0) return;
  const { error } = await supabase.from('opciones').insert(filas);
  if (error) throw error;
}

const getPreguntas = asyncHandler('admin/preguntasController.getPreguntas', async (req, res) => {
  const cuestionarioId = req.query.cuestionario_id || '';
  const busqueda       = (req.query.busqueda || '').trim();

  let query = supabase.from('preguntas').select(`
    *,
    opciones ( id, label, icon, orden )
  `).order('orden');

  if (cuestionarioId) query = query.eq('cuestionario_id', cuestionarioId);
  if (busqueda)       query = query.ilike('texto', `%${busqueda}%`);

  const { data, error } = await query;
  if (error) throw error;
  const preguntas = (data || []).map(p => ({
    ...p,
    opciones: (p.opciones || []).sort((a, b) => a.orden - b.orden),
  }));
  return res.json({ success: true, data: preguntas });
});

const createPregunta = asyncHandler('admin/preguntasController.createPregunta', async (req, res) => {
  const { cuestionario_id, texto, tipo, orden, categoria, peso, opciones } = req.body;
  if (!cuestionario_id || !texto || !tipo) {
    return res.status(400).json({ success: false, message: 'cuestionario_id, texto y tipo son obligatorios' });
  }
  if (!esTipoPreguntaValido(tipo)) {
    return res.status(400).json({ success: false, message: 'Tipo de pregunta no válido' });
  }

  const { data, error } = await supabase
    .from('preguntas')
    .insert([{ cuestionario_id, texto, tipo, orden: orden || 1, categoria, peso: peso || 1.0 }])
    .select()
    .single();

  if (error) throw error;
  await insertarOpciones(data.id, opciones);
  return res.status(201).json({ success: true, data });
});

const updatePregunta = asyncHandler('admin/preguntasController.updatePregunta', async (req, res) => {
  const { id } = req.params;
  const { texto, tipo, orden, categoria, peso, opciones } = req.body;

  const { error } = await supabase.from('preguntas').update({ texto, tipo, orden, categoria, peso }).eq('id', id);
  if (error) throw error;
  if (Array.isArray(opciones)) {
    const { error: deleteError } = await supabase.from('opciones').delete().eq('pregunta_id', id);
    if (deleteError) throw deleteError;
    await insertarOpciones(id, opciones);
  }
  return res.json({ success: true, message: 'Pregunta actualizada' });
});

const deletePregunta = asyncHandler('admin/preguntasController.deletePregunta', async (req, res) => {
  const { error } = await supabase.from('preguntas').delete().eq('id', req.params.id);
  if (error) throw error;
  return res.json({ success: true, message: 'Pregunta eliminada' });
});

module.exports = { getPreguntas, createPregunta, updatePregunta, deletePregunta };
