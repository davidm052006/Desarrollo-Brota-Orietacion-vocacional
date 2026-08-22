const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');
const { timeAgo, incrementarContador, getNombreUsuario, esModerador, resolverAutor } = require('../../utils/comunidadHelpers');

const getForos = asyncHandler('comunidad/forosController.getForos', async (req, res) => {
  const { data: foros, error } = await supabase
    .from('foros')
    .select('id, icon, nombre, descripcion')
    .order('id');

  if (error) return res.status(500).json({ success: false, message: error.message });

  // Conteo de posts por foro
  const { data: conteos } = await supabase.from('posts_foro').select('foro_id');

  const conteoPorForo = {};
  (conteos ?? []).forEach(p => {
    conteoPorForo[p.foro_id] = (conteoPorForo[p.foro_id] ?? 0) + 1;
  });

  const result = foros.map(f => ({ ...f, posts: conteoPorForo[f.id] ?? 0, siguiendo: 0 }));

  return res.json({ success: true, data: result });
});

const getPostsByForo = asyncHandler('comunidad/forosController.getPostsByForo', async (req, res) => {
  const { id: foroId } = req.params;
  const orden = req.query.orden === 'votados' ? 'votos' : 'created_at';
  const puedeModerar = await esModerador(req.user?.id);

  const { data, error } = await supabase
    .from('posts_foro')
    .select('id, user_id, titulo, contenido, anonimo, autor_nombre, votos, created_at')
    .eq('foro_id', foroId)
    .eq('oculta', false)
    .order(orden, { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ success: false, message: error.message });

  // Conteo de respuestas
  const postIds = (data ?? []).map(p => p.id);
  let conteoResp = {};
  if (postIds.length) {
    const { data: resps } = await supabase.from('respuestas_post').select('post_id').in('post_id', postIds);
    (resps ?? []).forEach(r => { conteoResp[r.post_id] = (conteoResp[r.post_id] ?? 0) + 1; });
  }

  const result = await Promise.all((data ?? []).map(async p => {
    const autor = await resolverAutor({
      userId: p.user_id, anonimo: p.anonimo, autorNombreGuardado: p.autor_nombre, puedeModerar,
    });
    return {
      id:            p.id,
      foro_id:       foroId,
      titulo:        p.titulo,
      preview:       p.contenido.slice(0, 200),
      autor_display: autor.display,
      es_anonimo_real: autor.esAnonimoReal,
      broti_config:  autor.brotiConfig,
      autor_id:      puedeModerar ? p.user_id : undefined,
      ini:           autor.display.charAt(0).toUpperCase(),
      time:          timeAgo(p.created_at),
      votos:         p.votos ?? 0,
      respuestas:    conteoResp[p.id] ?? 0,
    };
  }));

  return res.json({ success: true, data: result });
});

const createPost = asyncHandler('comunidad/forosController.createPost', async (req, res) => {
  const { id: foroId } = req.params;
  const { titulo, contenido, anonimo = false } = req.body;
  const userId = req.user.id;

  if (!titulo?.trim() || !contenido?.trim()) {
    return res.status(400).json({ success: false, message: 'Título y contenido requeridos' });
  }

  const { data: foro } = await supabase.from('foros').select('id').eq('id', foroId).single();
  if (!foro) return res.status(404).json({ success: false, message: 'Foro no encontrado' });

  const autorNombre = anonimo ? null : await getNombreUsuario(userId);

  const { data, error } = await supabase
    .from('posts_foro')
    .insert({ foro_id: foroId, user_id: userId, titulo: titulo.trim(), contenido: contenido.trim(), anonimo, autor_nombre: autorNombre })
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });

  return res.status(201).json({
    success: true,
    data: { ...data, autor_display: anonimo ? 'Anónimo' : autorNombre, time: 'ahora mismo', respuestas: 0 },
  });
});

const getPost = asyncHandler('comunidad/forosController.getPost', async (req, res) => {
  const { id: postId } = req.params;
  const userId = req.user?.id ?? null;
  const puedeModerar = await esModerador(userId);

  const { data: post, error } = await supabase
    .from('posts_foro')
    .select('*, foros(id, icon, nombre)')
    .eq('id', postId)
    .single();

  if (error || !post) return res.status(404).json({ success: false, message: 'Post no encontrado' });

  const { data: respuestas } = await supabase
    .from('respuestas_post')
    .select('id, contenido, anonimo, autor_nombre, votos, es_mejor_respuesta, created_at')
    .eq('post_id', postId)
    .order('es_mejor_respuesta', { ascending: false })
    .order('votos', { ascending: false });

  let miVoto = null;
  if (userId) {
    const { data: voto } = await supabase
      .from('votos_post').select('direccion').eq('post_id', postId).eq('user_id', userId).single();
    miVoto = voto?.direccion ?? null;
  }

  const autorPost = await resolverAutor({
    userId: post.user_id, anonimo: post.anonimo, autorNombreGuardado: post.autor_nombre, puedeModerar,
  });

  return res.json({
    success: true,
    data: {
      id:            post.id,
      foro:          post.foros,
      titulo:        post.titulo,
      body:          post.contenido,
      autor_display: autorPost.display,
      es_anonimo_real: autorPost.esAnonimoReal,
      broti_config:  autorPost.brotiConfig,
      autor_id:      puedeModerar ? post.user_id : undefined,
      oculta:        post.oculta ?? false,
      ini:           autorPost.display.charAt(0).toUpperCase(),
      time:          timeAgo(post.created_at),
      votos:         post.votos ?? 0,
      mi_voto:       miVoto,
      respuestas:    (respuestas ?? []).map(r => ({
        id:            r.id,
        texto:         r.contenido,
        autor_display: r.anonimo ? 'Anónimo' : (r.autor_nombre || 'Usuario'),
        ini:           (r.anonimo ? 'A' : (r.autor_nombre || 'U').charAt(0).toUpperCase()),
        time:          timeAgo(r.created_at),
        votos:         r.votos ?? 0,
        mejor:         r.es_mejor_respuesta ?? false,
      })),
    },
  });
});

const votarPost = asyncHandler('comunidad/forosController.votarPost', async (req, res) => {
  const { id: postId } = req.params;
  const { direccion } = req.body;
  const userId = req.user.id;

  if (!['up', 'down'].includes(direccion)) {
    return res.status(400).json({ success: false, message: 'Dirección inválida' });
  }

  const { data: postActual } = await supabase.from('posts_foro').select('id').eq('id', postId).single();
  if (!postActual) return res.status(404).json({ success: false, message: 'Post no encontrado' });

  const { data: votoExistente } = await supabase
    .from('votos_post').select('id, direccion').eq('post_id', postId).eq('user_id', userId).single();

  let delta = 0;
  let miVoto = null;

  if (votoExistente) {
    if (votoExistente.direccion === direccion) {
      // Toggle: quitar voto
      await supabase.from('votos_post').delete().eq('id', votoExistente.id);
      delta = direccion === 'up' ? -1 : 1;
      miVoto = null;
    } else {
      // Cambiar dirección
      await supabase.from('votos_post').update({ direccion }).eq('id', votoExistente.id);
      delta = direccion === 'up' ? 2 : -2;
      miVoto = direccion;
    }
  } else {
    await supabase.from('votos_post').insert({ post_id: postId, user_id: userId, direccion });
    delta = direccion === 'up' ? 1 : -1;
    miVoto = direccion;
  }

  const nuevoVotos = await incrementarContador({
    rpcName: 'incrementar_votos_post',
    rpcParams: { post_id_param: postId, delta },
    tabla: 'posts_foro', columna: 'votos', filtroCol: 'id', filtroVal: postId, delta,
  });

  return res.json({ success: true, data: { votos: nuevoVotos, mi_voto: miVoto } });
});

const responderPost = asyncHandler('comunidad/forosController.responderPost', async (req, res) => {
  const { id: postId } = req.params;
  const { contenido, anonimo = false } = req.body;
  const userId = req.user.id;

  if (!contenido?.trim()) {
    return res.status(400).json({ success: false, message: 'Contenido requerido' });
  }

  const { data: post } = await supabase.from('posts_foro').select('id').eq('id', postId).single();
  if (!post) return res.status(404).json({ success: false, message: 'Post no encontrado' });

  const autorNombre = anonimo ? null : await getNombreUsuario(userId);

  const { data, error } = await supabase
    .from('respuestas_post')
    .insert({ post_id: postId, user_id: userId, contenido: contenido.trim(), anonimo, autor_nombre: autorNombre })
    .select().single();

  if (error) return res.status(500).json({ success: false, message: error.message });

  return res.status(201).json({
    success: true,
    data: {
      id:            data.id,
      texto:         data.contenido,
      autor_display: anonimo ? 'Anónimo' : autorNombre,
      ini:           (anonimo ? 'A' : (autorNombre || 'U').charAt(0).toUpperCase()),
      time:          'ahora mismo',
      votos:         0,
      mejor:         false,
    },
  });
});

module.exports = { getForos, getPostsByForo, createPost, getPost, votarPost, responderPost };
