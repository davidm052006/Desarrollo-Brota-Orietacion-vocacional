const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');
const { timeAgo, getNombreUsuario, esModerador, resolverAutor } = require('../../utils/comunidadHelpers');

const getPreguntas = asyncHandler('comunidad/preguntasController.getPreguntas', async (req, res) => {
  const puedeModerar = await esModerador(req.user?.id);

  const { data, error } = await supabase
    .from('preguntas_comunidad')
    .select('id, user_id, titulo, area, anonimo, autor_nombre, resuelta, created_at')
    .eq('oculta', false)
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

  const result = await Promise.all((data ?? []).map(async p => {
    const autor = await resolverAutor({
      userId: p.user_id, anonimo: p.anonimo, autorNombreGuardado: p.autor_nombre, puedeModerar,
    });
    return {
      id:       p.id,
      title:    p.titulo,
      area:     p.area,
      ini:      autor.display.charAt(0).toUpperCase(),
      name:     autor.display,
      es_anonimo_real: autor.esAnonimoReal,
      autor_id: puedeModerar ? p.user_id : undefined,
      time:     timeAgo(p.created_at),
      answers:  conteoResp[p.id] ?? 0,
      resolved: p.resuelta ?? false,
    };
  }));

  return res.json({ success: true, data: result });
});

const getPregunta = asyncHandler('comunidad/preguntasController.getPregunta', async (req, res) => {
  const { id: preguntaId } = req.params;
  const puedeModerar = await esModerador(req.user?.id);

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

  const autor = await resolverAutor({
    userId: pregunta.user_id, anonimo: pregunta.anonimo, autorNombreGuardado: pregunta.autor_nombre, puedeModerar,
  });

  return res.json({
    success: true,
    data: {
      id:         pregunta.id,
      title:      pregunta.titulo,
      area:       pregunta.area,
      ini:        autor.display.charAt(0).toUpperCase(),
      name:       autor.display,
      es_anonimo_real: autor.esAnonimoReal,
      autor_id:   puedeModerar ? pregunta.user_id : undefined,
      oculta:     pregunta.oculta ?? false,
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

const REPORTES_PARA_BAN = 3;
const DIAS_BAN = 7;

const crearPregunta = asyncHandler('comunidad/preguntasController.crearPregunta', async (req, res) => {
  const { titulo, area = 'General', anonimo = false } = req.body;
  const userId = req.user.id;

  if (!titulo?.trim()) {
    return res.status(400).json({ success: false, message: 'Título requerido' });
  }

  const { data: perfil } = await supabase
    .from('perfiles_usuario').select('baneado_preguntas_hasta').eq('user_id', userId).single();

  if (perfil?.baneado_preguntas_hasta && new Date(perfil.baneado_preguntas_hasta) > new Date()) {
    const hasta = new Date(perfil.baneado_preguntas_hasta).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });
    return res.status(403).json({
      success: false,
      message: `No podés publicar preguntas hasta el ${hasta} por reportes recibidos.`,
    });
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

const reportarPregunta = asyncHandler('comunidad/preguntasController.reportarPregunta', async (req, res) => {
  const { id: preguntaId } = req.params;
  const { motivo } = req.body;
  const userId = req.user.id;

  const { data: pregunta } = await supabase
    .from('preguntas_comunidad').select('id, user_id').eq('id', preguntaId).single();
  if (!pregunta) return res.status(404).json({ success: false, message: 'Pregunta no encontrada' });

  const { data: reporteExistente } = await supabase
    .from('reportes_pregunta').select('id').eq('pregunta_id', preguntaId).eq('user_id', userId).single();
  if (reporteExistente) {
    return res.status(409).json({ success: false, message: 'Ya reportaste esta pregunta' });
  }

  const { error: insertError } = await supabase
    .from('reportes_pregunta')
    .insert({ pregunta_id: preguntaId, user_id: userId, motivo: motivo?.trim() || null });
  if (insertError) return res.status(500).json({ success: false, message: insertError.message });

  const { count } = await supabase
    .from('reportes_pregunta')
    .select('id', { count: 'exact', head: true })
    .eq('pregunta_id', preguntaId);

  let autorBaneado = false;
  if (count >= REPORTES_PARA_BAN && pregunta.user_id) {
    const hasta = new Date(Date.now() + DIAS_BAN * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('perfiles_usuario').update({ baneado_preguntas_hasta: hasta }).eq('user_id', pregunta.user_id);
    autorBaneado = true;
  }

  return res.status(201).json({ success: true, data: { reportes: count, autor_baneado: autorBaneado } });
});

module.exports = { getPreguntas, getPregunta, crearPregunta, responderPregunta, marcarMejorRespuesta, reportarPregunta };
