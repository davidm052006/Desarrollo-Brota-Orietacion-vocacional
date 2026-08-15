const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');

const getPreguntas = asyncHandler('admin/preguntasController.getPreguntas', async (req, res) => {
  const cuestionarioId = req.query.cuestionario_id || '';
  const busqueda       = (req.query.busqueda || '').trim();

  let query = supabase.from('preguntas').select('*').order('orden');

  if (cuestionarioId) query = query.eq('cuestionario_id', cuestionarioId);
  if (busqueda)       query = query.ilike('texto', `%${busqueda}%`);

  const { data, error } = await query;
  if (error) throw error;
  return res.json({ success: true, data: data || [] });
});

const createPregunta = asyncHandler('admin/preguntasController.createPregunta', async (req, res) => {
  const { cuestionario_id, texto, tipo, orden, categoria, peso, opciones } = req.body;
  if (!cuestionario_id || !texto || !tipo) {
    return res.status(400).json({ success: false, message: 'cuestionario_id, texto y tipo son obligatorios' });
  }

  const { data, error } = await supabase
    .from('preguntas')
    .insert([{ cuestionario_id, texto, tipo, orden: orden || 1, categoria, peso: peso || 1.0, opciones: opciones || [] }])
    .select()
    .single();

  if (error) throw error;
  return res.status(201).json({ success: true, data });
});

const updatePregunta = asyncHandler('admin/preguntasController.updatePregunta', async (req, res) => {
  const { id } = req.params;
  const { texto, tipo, orden, categoria, peso, opciones } = req.body;

  const { error } = await supabase.from('preguntas').update({ texto, tipo, orden, categoria, peso, opciones }).eq('id', id);
  if (error) throw error;
  return res.json({ success: true, message: 'Pregunta actualizada' });
});

const deletePregunta = asyncHandler('admin/preguntasController.deletePregunta', async (req, res) => {
  const { error } = await supabase.from('preguntas').delete().eq('id', req.params.id);
  if (error) throw error;
  return res.json({ success: true, message: 'Pregunta eliminada' });
});

module.exports = { getPreguntas, createPregunta, updatePregunta, deletePregunta };
