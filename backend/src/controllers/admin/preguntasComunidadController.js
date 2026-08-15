const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');

// GET /api/admin/preguntas-comunidad — moderación: preguntas con su conteo de reportes
const getPreguntasComunidad = asyncHandler('admin/preguntasComunidadController.getPreguntasComunidad', async (req, res) => {
  const { data: preguntas, error } = await supabase
    .from('preguntas_comunidad')
    .select('id, titulo, area, autor_nombre, anonimo, resuelta, user_id, created_at')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, message: error.message });

  const ids = (preguntas ?? []).map(p => p.id);
  let conteoReportes = {};
  let respuestasPorPregunta = {};
  if (ids.length) {
    const { data: reportes } = await supabase
      .from('reportes_pregunta').select('pregunta_id').in('pregunta_id', ids);
    (reportes ?? []).forEach(r => { conteoReportes[r.pregunta_id] = (conteoReportes[r.pregunta_id] ?? 0) + 1; });

    const { data: respuestas } = await supabase
      .from('respuestas_pregunta')
      .select('id, pregunta_id, contenido, autor_nombre, anonimo, es_mejor, created_at')
      .in('pregunta_id', ids)
      .order('created_at', { ascending: true });
    (respuestas ?? []).forEach(r => {
      (respuestasPorPregunta[r.pregunta_id] ??= []).push({
        id:        r.id,
        contenido: r.contenido,
        autor:     r.anonimo ? 'Anónimo' : (r.autor_nombre || 'Usuario'),
        mejor:     r.es_mejor,
        created_at: r.created_at,
      });
    });
  }

  const data = (preguntas ?? []).map(p => ({
    id:        p.id,
    titulo:    p.titulo,
    area:      p.area,
    autor:     p.anonimo ? 'Anónimo' : (p.autor_nombre || 'Usuario'),
    resuelta:  p.resuelta,
    reportes:  conteoReportes[p.id] ?? 0,
    respuestas: respuestasPorPregunta[p.id] ?? [],
    created_at: p.created_at,
  }));

  return res.json({ success: true, data });
});

// DELETE /api/admin/preguntas-comunidad/:id
const deletePreguntaComunidad = asyncHandler('admin/preguntasComunidadController.deletePreguntaComunidad', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from('preguntas_comunidad').delete().eq('id', id);
  if (error) return res.status(500).json({ success: false, message: error.message });

  return res.json({ success: true, message: 'Pregunta eliminada correctamente' });
});

module.exports = { getPreguntasComunidad, deletePreguntaComunidad };
