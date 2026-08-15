const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');
const { timeAgo, incrementarContador, getNombreUsuario } = require('../../utils/comunidadHelpers');

const getHistorias = asyncHandler('comunidad/historiasController.getHistorias', async (req, res) => {
  const { data, error } = await supabase
    .from('historias')
    .select('id, titulo, contenido, area, carrera, institucion, anonimo, autor_nombre, likes, created_at')
    .eq('publicada', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ success: false, message: error.message });

  const userId = req.user?.id ?? null;
  let misLikes = new Set();
  if (userId && data?.length) {
    const { data: likes } = await supabase
      .from('likes_historia')
      .select('historia_id')
      .eq('user_id', userId)
      .in('historia_id', data.map(h => h.id));
    (likes ?? []).forEach(l => misLikes.add(l.historia_id));
  }

  const result = (data ?? []).map(h => ({
    id:         h.id,
    ini:        h.anonimo ? 'A' : (h.autor_nombre || 'U').charAt(0).toUpperCase(),
    name:       h.anonimo ? 'Anónimo' : (h.autor_nombre || 'Usuario'),
    carrera:    h.carrera || '',
    inst:       h.institucion || '',
    title:      h.titulo,
    excerpt:    h.contenido.slice(0, 160),
    tag:        h.area,
    likes:      h.likes ?? 0,
    yo_di_like: misLikes.has(h.id),
    date:       timeAgo(h.created_at),
  }));

  return res.json({ success: true, data: result });
});

const getHistoria = asyncHandler('comunidad/historiasController.getHistoria', async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id ?? null;

  const { data, error } = await supabase
    .from('historias')
    .select('*')
    .eq('id', id)
    .eq('publicada', true)
    .single();

  if (error || !data) return res.status(404).json({ success: false, message: 'Historia no encontrada' });

  let yoDiLike = false;
  if (userId) {
    const { data: like } = await supabase
      .from('likes_historia').select('id').eq('historia_id', id).eq('user_id', userId).single();
    yoDiLike = !!like;
  }

  // Historias relacionadas (misma área, sin incluir la actual)
  const { data: relacionadas } = await supabase
    .from('historias')
    .select('id, titulo, anonimo, autor_nombre, likes')
    .eq('publicada', true)
    .eq('area', data.area)
    .neq('id', id)
    .limit(4);

  return res.json({
    success: true,
    data: {
      id:           data.id,
      titulo:       data.titulo,
      area:         data.area,
      carrera:      data.carrera || '',
      inst:         data.institucion || '',
      ini:          data.anonimo ? 'A' : (data.autor_nombre || 'U').charAt(0).toUpperCase(),
      name:         data.anonimo ? 'Anónimo' : (data.autor_nombre || 'Usuario'),
      likes:        data.likes ?? 0,
      yo_di_like:   yoDiLike,
      date:         timeAgo(data.created_at),
      body:         data.contenido.split('\n\n').filter(Boolean),
      relacionadas: (relacionadas ?? []).map(r => ({
        id:    r.id,
        title: r.titulo,
        ini:   r.anonimo ? 'A' : (r.autor_nombre || 'U').charAt(0).toUpperCase(),
        name:  r.anonimo ? 'Anónimo' : (r.autor_nombre || 'Usuario'),
        likes: r.likes ?? 0,
      })),
    },
  });
});

const crearHistoria = asyncHandler('comunidad/historiasController.crearHistoria', async (req, res) => {
  const { titulo, contenido, area, carrera, institucion, anonimo = true } = req.body;
  const userId = req.user.id;

  if (!titulo?.trim() || !contenido?.trim() || !area?.trim()) {
    return res.status(400).json({ success: false, message: 'Título, contenido y área son requeridos' });
  }

  const autorNombre = anonimo ? null : await getNombreUsuario(userId);

  const { data, error } = await supabase
    .from('historias')
    .insert({
      user_id: userId, titulo: titulo.trim(), contenido: contenido.trim(),
      area: area.trim(), carrera: carrera?.trim() || null,
      institucion: institucion?.trim() || null, anonimo, autor_nombre: autorNombre,
      publicada: false,
    })
    .select().single();

  if (error) return res.status(500).json({ success: false, message: error.message });

  return res.status(201).json({ success: true, data, message: 'Historia enviada para revisión' });
});

const toggleLikeHistoria = asyncHandler('comunidad/historiasController.toggleLikeHistoria', async (req, res) => {
  const { id: historiaId } = req.params;
  const userId = req.user.id;

  const { data: historia } = await supabase.from('historias').select('id').eq('id', historiaId).single();
  if (!historia) return res.status(404).json({ success: false, message: 'Historia no encontrada' });

  const { data: like } = await supabase
    .from('likes_historia').select('id').eq('historia_id', historiaId).eq('user_id', userId).single();

  let delta;
  let yoDiLike;

  if (like) {
    await supabase.from('likes_historia').delete().eq('id', like.id);
    delta = -1;
    yoDiLike = false;
  } else {
    await supabase.from('likes_historia').insert({ historia_id: historiaId, user_id: userId });
    delta = 1;
    yoDiLike = true;
  }

  const nuevoLikes = await incrementarContador({
    rpcName: 'incrementar_likes_historia',
    rpcParams: { historia_id_param: historiaId, delta },
    tabla: 'historias', columna: 'likes', filtroCol: 'id', filtroVal: historiaId, delta, clampMin: 0,
  });

  return res.json({ success: true, data: { likes: nuevoLikes, yo_di_like: yoDiLike } });
});

module.exports = { getHistorias, getHistoria, crearHistoria, toggleLikeHistoria };
