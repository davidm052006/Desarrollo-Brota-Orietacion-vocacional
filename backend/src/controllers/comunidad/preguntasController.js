const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');
const { timeAgo, getNombreUsuario } = require('../../utils/comunidadHelpers');

const getPreguntas = asyncHandler('comunidad/preguntasController.getPreguntas', async (req, res) => {
  const { data, error } = await supabase
    .from('preguntas_comunidad')
    .select('id, titulo, area, anonimo, autor_nombre, resuelta, created_at')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) return res.status(500).json({ success: false, message: error.message });

  const pregIds = (data ?? []).map(p => p.id);
  let conteoResp = {};
  if (pregIds.length) {
    const { data: resps } = await supabase
      .from('respuestas_pregunta').select('pregunta_id').in('pregunta_id', pregIds);
    (resps ?? []).forEach(r => { conteoResp[r.pregunta_id] = (conteoResp[r.pregunta_id] ?? 0) + 1; });
  }

  const result = (data ?? []).map(p => ({
    id:       p.id,
    title:    p.titulo,
    area:     p.area,
    ini:      p.anonimo ? 'A' : (p.autor_nombre || 'U').charAt(0).toUpperCase(),
    name:     p.anonimo ? 'Anónimo' : (p.autor_nombre || 'Usuario'),
    time:     timeAgo(p.created_at),
    answers:  conteoResp[p.id] ?? 0,
    resolved: p.resuelta ?? false,
  }));

  return res.json({ success: true, data: result });
});

const getPregunta = asyncHandler('comunidad/preguntasController.getPregunta', async (req, res) => {
  const { id: preguntaId } = req.params;

  const { data: pregunta, error } = await supabase
    .from('preguntas_comunidad')
    .select('*')
    .eq('id', preguntaId)
    .single();

  if (error || !pregunta) return res.status(404).json({ success: false, message: 'Pregunta no encontrada' });

  const { data: respuestas } = await supabase
    .from('respuestas_pregunta')
    .select('id, contenido, anonimo, autor_nombre, votos, es_mejor, created_at')
    .eq('pregunta_id', preguntaId)
    .order('es_mejor', { ascending: false })
    .order('votos', { ascending: false });

  return res.json({
    success: true,
    data: {
      id:         pregunta.id,
      title:      pregunta.titulo,
      area:       pregunta.area,
      ini:        pregunta.anonimo ? 'A' : (pregunta.autor_nombre || 'U').charAt(0).toUpperCase(),
      name:       pregunta.anonimo ? 'Anónimo' : (pregunta.autor_nombre || 'Usuario'),
      time:       timeAgo(pregunta.created_at),
      resuelta:   pregunta.resuelta ?? false,
      es_autor:   pregunta.user_id === req.user.id,
      respuestas: (respuestas ?? []).map(r => ({
        id:            r.id,
        texto:         r.contenido,
        autor_display: r.anonimo ? 'Anónimo' : (r.autor_nombre || 'Usuario'),
        ini:           r.anonimo ? 'A' : (r.autor_nombre || 'U').charAt(0).toUpperCase(),
        time:          timeAgo(r.created_at),
        votos:         r.votos ?? 0,
        mejor:         r.es_mejor ?? false,
      })),
    },
  });
});

const crearPregunta = asyncHandler('comunidad/preguntasController.crearPregunta', async (req, res) => {
  const { titulo, area = 'General', anonimo = false } = req.body;
  const userId = req.user.id;

  if (!titulo?.trim()) {
    return res.status(400).json({ success: false, message: 'Título requerido' });
  }

  const autorNombre = anonimo ? null : await getNombreUsuario(userId);

  const { data, error } = await supabase
    .from('preguntas_comunidad')
    .insert({ user_id: userId, titulo: titulo.trim(), area: area.trim(), anonimo, autor_nombre: autorNombre })
    .select().single();

  if (error) return res.status(500).json({ success: false, message: error.message });

  return res.status(201).json({ success: true, data });
});

const responderPregunta = asyncHandler('comunidad/preguntasController.responderPregunta', async (req, res) => {
  const { id: preguntaId } = req.params;
  const { contenido, anonimo = false } = req.body;
  const userId = req.user.id;

  if (!contenido?.trim()) {
    return res.status(400).json({ success: false, message: 'Contenido requerido' });
  }

  const { data: pregunta } = await supabase
    .from('preguntas_comunidad').select('id').eq('id', preguntaId).single();
  if (!pregunta) return res.status(404).json({ success: false, message: 'Pregunta no encontrada' });

  const autorNombre = anonimo ? null : await getNombreUsuario(userId);

  const { data, error } = await supabase
    .from('respuestas_pregunta')
    .insert({ pregunta_id: preguntaId, user_id: userId, contenido: contenido.trim(), anonimo, autor_nombre: autorNombre })
    .select().single();

  if (error) return res.status(500).json({ success: false, message: error.message });

  return res.status(201).json({
    success: true,
    data: {
      id:            data.id,
      texto:         data.contenido,
      autor_display: anonimo ? 'Anónimo' : autorNombre,
      ini:           anonimo ? 'A' : (autorNombre || 'U').charAt(0).toUpperCase(),
      time:          'ahora mismo',
      votos:         0,
      mejor:         false,
    },
  });
});

const marcarMejorRespuesta = asyncHandler('comunidad/preguntasController.marcarMejorRespuesta', async (req, res) => {
  const { id: preguntaId, rid: respuestaId } = req.params;
  const userId = req.user.id;

  const { data: pregunta } = await supabase
    .from('preguntas_comunidad').select('id, user_id').eq('id', preguntaId).single();
  if (!pregunta) return res.status(404).json({ success: false, message: 'Pregunta no encontrada' });
  if (pregunta.user_id !== userId) {
    return res.status(403).json({ success: false, message: 'Solo el autor puede marcar la mejor respuesta' });
  }

  // Desmarcar todas las respuestas previas
  await supabase.from('respuestas_pregunta').update({ es_mejor: false }).eq('pregunta_id', preguntaId);
  // Marcar la nueva
  await supabase.from('respuestas_pregunta').update({ es_mejor: true }).eq('id', respuestaId);
  // Marcar pregunta como resuelta
  await supabase.from('preguntas_comunidad').update({ resuelta: true }).eq('id', preguntaId);

  return res.json({ success: true });
});

module.exports = { getPreguntas, getPregunta, crearPregunta, responderPregunta, marcarMejorRespuesta };
