const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');
const { timeAgo } = require('../../utils/comunidadHelpers');

// GET /api/comunidad/notificaciones
// No hay chat/mensajería todavía, así que esto no es una bandeja de mensajes:
// es un feed de cosas reales que ya le pasaron al usuario en Comunidad —
// respuestas a sus preguntas y likes a sus historias. Sin tabla de
// notificaciones ni estado leído/no leído (no hace falta esquema nuevo para
// esto), se arma al vuelo desde datos que ya existen.
const getNotificaciones = asyncHandler('comunidad/notificacionesController.getNotificaciones', async (req, res) => {
  const userId = req.user.id;

  const { data: misPreguntas } = await supabase
    .from('preguntas_comunidad').select('id, titulo').eq('user_id', userId);
  const idsPreguntas = (misPreguntas ?? []).map(p => p.id);
  const tituloPregunta = Object.fromEntries((misPreguntas ?? []).map(p => [p.id, p.titulo]));

  const { data: misHistorias } = await supabase
    .from('historias').select('id, titulo').eq('user_id', userId).eq('publicada', true);
  const idsHistorias = (misHistorias ?? []).map(h => h.id);
  const tituloHistoria = Object.fromEntries((misHistorias ?? []).map(h => [h.id, h.titulo]));

  const [respuestas, likes] = await Promise.all([
    idsPreguntas.length
      ? supabase
          .from('respuestas_pregunta')
          .select('id, pregunta_id, autor_nombre, anonimo, created_at')
          .in('pregunta_id', idsPreguntas)
          .neq('user_id', userId)
      : Promise.resolve({ data: [] }),
    idsHistorias.length
      ? supabase
          .from('likes_historia')
          .select('id, historia_id, created_at')
          .in('historia_id', idsHistorias)
          .neq('user_id', userId)
      : Promise.resolve({ data: [] }),
  ]);

  const notifsRespuestas = (respuestas.data ?? []).map(r => ({
    id: `r-${r.id}`,
    tipo: 'respuesta',
    texto: `${r.anonimo ? 'Alguien' : (r.autor_nombre || 'Alguien')} respondió tu pregunta "${tituloPregunta[r.pregunta_id] || ''}"`,
    time: timeAgo(r.created_at),
    fecha: r.created_at,
    link: `/dashboard/comunidad/post/${r.pregunta_id}`,
    linkState: { tipo: 'pregunta' },
  }));

  const notifsLikes = (likes.data ?? []).map(l => ({
    id: `l-${l.id}`,
    tipo: 'like',
    texto: `A alguien le sirvió tu historia "${tituloHistoria[l.historia_id] || ''}"`,
    time: timeAgo(l.created_at),
    fecha: l.created_at,
    link: `/dashboard/comunidad/historia/${l.historia_id}`,
    linkState: {},
  }));

  const data = [...notifsRespuestas, ...notifsLikes]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 30);

  return res.json({ success: true, data });
});

module.exports = { getNotificaciones };
