const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');
const { timeAgo } = require('../../utils/comunidadHelpers');

// GET /api/comunidad/feed — últimas publicaciones de toda la comunidad
// (posts de foro, historias publicadas, preguntas), para el feed del
// Dashboard. Mezcla las 3 fuentes y corta a 8, más reciente primero.
const getFeedReciente = asyncHandler('comunidad/feedController.getFeedReciente', async (req, res) => {
  const [posts, historias, preguntas] = await Promise.all([
    supabase.from('posts_foro')
      .select('id, titulo, anonimo, autor_nombre, created_at')
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('historias')
      .select('id, titulo, anonimo, autor_nombre, created_at')
      .eq('publicada', true)
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('preguntas_comunidad')
      .select('id, titulo, anonimo, autor_nombre, created_at')
      .order('created_at', { ascending: false }).limit(5),
  ]);

  const autorDe = (row) => (row.anonimo ? 'Anónimo' : (row.autor_nombre || 'Usuario'));

  const items = [
    ...(posts.data ?? []).map(p => ({
      id: `post-${p.id}`, tipo: 'post', titulo: p.titulo, autor: autorDe(p),
      time: timeAgo(p.created_at), fecha: p.created_at,
      link: `/dashboard/comunidad/post/${p.id}`, linkState: { tipo: 'post' },
    })),
    ...(historias.data ?? []).map(h => ({
      id: `historia-${h.id}`, tipo: 'historia', titulo: h.titulo, autor: autorDe(h),
      time: timeAgo(h.created_at), fecha: h.created_at,
      link: `/dashboard/comunidad/historia/${h.id}`, linkState: {},
    })),
    ...(preguntas.data ?? []).map(p => ({
      id: `pregunta-${p.id}`, tipo: 'pregunta', titulo: p.titulo, autor: autorDe(p),
      time: timeAgo(p.created_at), fecha: p.created_at,
      link: `/dashboard/comunidad/post/${p.id}`, linkState: { tipo: 'pregunta' },
    })),
  ]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 8);

  return res.json({ success: true, data: items });
});

module.exports = { getFeedReciente };
