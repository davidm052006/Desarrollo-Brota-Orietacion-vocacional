// forosController y moderacionController con Supabase falso en memoria.
const { crearSupabaseFake, respuestaFalsa, cargarConFake } = require('../../helpers/supabaseFake');

const AHORA = new Date().toISOString();

function preparar(ruta) {
  const db = crearSupabaseFake();
  return { db, ctrl: cargarConFake(ruta, db), res: respuestaFalsa() };
}
const cuerpo = (res) => res.json.mock.calls[0][0];

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('forosController', () => {
  const RUTA = 'controllers/comunidad/forosController';

  it('getForos agrega el conteo de posts por foro', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('foros', { data: [{ id: 1, nombre: 'Ingeniería' }, { id: 2, nombre: 'Arte' }] })
      .responder('posts_foro', { data: [{ foro_id: 1 }, { foro_id: 1 }] });
    await ctrl.getForos({}, res);
    expect(cuerpo(res).data).toEqual([
      { id: 1, nombre: 'Ingeniería', posts: 2, siguiendo: 0 },
      { id: 2, nombre: 'Arte', posts: 0, siguiendo: 0 },
    ]);
  });

  it('getForos responde 500 si falla la consulta', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('foros', { error: { message: 'x' } });
    await ctrl.getForos({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  describe('getPostsByForo', () => {
    const POSTS = [
      { id: 'p1', user_id: 'u-a', titulo: 'Hola', contenido: 'x'.repeat(300), anonimo: false, autor_nombre: 'ana', votos: 3, created_at: AHORA },
      { id: 'p2', user_id: 'u-b', titulo: 'Secreto', contenido: 'y', anonimo: true, autor_nombre: null, votos: null, created_at: AHORA },
    ];

    it('para un estudiante oculta al autor anónimo y no expone autor_id', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('perfiles_usuario', { data: { rol: 'estudiante' } })
        .responder('posts_foro', { data: POSTS })
        .responder('respuestas_post', { data: [{ post_id: 'p1' }] });

      await ctrl.getPostsByForo({ params: { id: 'f1' }, query: { orden: 'votados' }, user: { id: 'u-x' } }, res);

      const [a, b] = cuerpo(res).data;
      expect(a).toMatchObject({ autor_display: 'ana', ini: 'A', respuestas: 1, votos: 3, time: 'ahora mismo' });
      expect(a.preview).toHaveLength(200);
      expect(b).toMatchObject({ autor_display: 'Anónimo', broti_config: null, respuestas: 0, votos: 0 });
      expect(b.autor_id).toBeUndefined();
      expect(db.llamadas('posts_foro').find((l) => l.metodo === 'order').args[0]).toBe('votos');
    });

    it('para moderación revela el autor real del anónimo', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('perfiles_usuario', { data: { rol: 'moderador' } })
        .responder('posts_foro', { data: [POSTS[1]] })
        .responder('perfiles_usuario', { data: { nombre: 'Beto' } });

      await ctrl.getPostsByForo({ params: { id: 'f1' }, query: {}, user: { id: 'mod' } }, res);

      expect(cuerpo(res).data[0]).toMatchObject({ autor_display: 'Beto', es_anonimo_real: true, autor_id: 'u-b' });
    });

    it('sin posts no consulta respuestas; 500 si falla', async () => {
      const a = preparar(RUTA);
      await a.ctrl.getPostsByForo({ params: { id: 'f1' }, query: {} }, a.res);
      expect(cuerpo(a.res).data).toEqual([]);
      expect(a.db.llamadas('respuestas_post')).toEqual([]);

      const b = preparar(RUTA);
      b.db.responder('posts_foro', { error: { message: 'x' } });
      await b.ctrl.getPostsByForo({ params: { id: 'f1' }, query: {} }, b.res);
      expect(b.res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createPost', () => {
    const req = (body) => ({ params: { id: 'f1' }, body, user: { id: 'u-1' } });

    it('400 sin título o contenido (solo espacios)', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      await ctrl.createPost(req({ titulo: '  ', contenido: 'x' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(db.from).not.toHaveBeenCalled();
    });

    it('404 si el foro no existe', async () => {
      const { ctrl, res } = preparar(RUTA);
      await ctrl.createPost(req({ titulo: 'a', contenido: 'b' }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('guarda texto recortado con el nombre del autor y responde 201', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('foros', { data: { id: 'f1' } })
        .responder('perfiles_usuario', { data: { nombre: 'Ana' } })
        .responder('posts_foro', { data: { id: 'p9' } });
      await ctrl.createPost(req({ titulo: ' Hola ', contenido: ' cuerpo ' }), res);
      expect(db.argumentos('posts_foro', 'insert')[0]).toEqual({
        foro_id: 'f1', user_id: 'u-1', titulo: 'Hola', contenido: 'cuerpo', anonimo: false, autor_nombre: 'Ana',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(cuerpo(res).data).toMatchObject({ id: 'p9', autor_display: 'Ana', respuestas: 0 });
    });

    it('anónimo no guarda el nombre; 500 si falla el insert', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('foros', { data: { id: 'f1' } }).responder('posts_foro', { error: { message: 'x' } });
      await ctrl.createPost(req({ titulo: 'a', contenido: 'b', anonimo: true }), res);
      expect(db.argumentos('posts_foro', 'insert')[0].autor_nombre).toBeNull();
      expect(db.llamadas('perfiles_usuario')).toEqual([]);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPost', () => {
    it('devuelve el post con respuestas, mi voto y respuestas anónimas ocultas', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('perfiles_usuario', { data: { rol: 'estudiante' } })
        .responder('posts_foro', { data: { id: 'p1', user_id: 'u-a', anonimo: false, autor_nombre: 'ana', contenido: 'c', created_at: AHORA, foros: { id: 1 } } })
        .responder('respuestas_post', { data: [
          { id: 'r1', contenido: 'sí', anonimo: true, created_at: AHORA },
          { id: 'r2', contenido: 'no', anonimo: false, autor_nombre: 'luis', votos: 2, es_mejor_respuesta: true, created_at: AHORA },
        ] })
        .responder('votos_post', { data: { direccion: 'up' } });

      await ctrl.getPost({ params: { id: 'p1' }, user: { id: 'u-x' } }, res);

      const { data } = cuerpo(res);
      expect(data).toMatchObject({ body: 'c', autor_display: 'ana', mi_voto: 'up', oculta: false, votos: 0 });
      expect(data.respuestas).toEqual([
        expect.objectContaining({ id: 'r1', autor_display: 'Anónimo', ini: 'A', mejor: false }),
        expect.objectContaining({ id: 'r2', autor_display: 'luis', ini: 'L', votos: 2, mejor: true }),
      ]);
    });

    it('sin sesión no busca el voto; 404 si no existe', async () => {
      const a = preparar(RUTA);
      a.db.responder('posts_foro', { data: { id: 'p1', anonimo: true, contenido: 'c', created_at: AHORA } });
      await a.ctrl.getPost({ params: { id: 'p1' } }, a.res);
      expect(cuerpo(a.res).data).toMatchObject({ mi_voto: null, autor_display: 'Anónimo' });
      expect(a.db.llamadas('votos_post')).toEqual([]);

      const b = preparar(RUTA);
      await b.ctrl.getPost({ params: { id: 'nada' } }, b.res);
      expect(b.res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('votarPost', () => {
    const req = (direccion) => ({ params: { id: 'p1' }, body: { direccion }, user: { id: 'u-1' } });

    it('400 con dirección inválida y 404 si el post no existe', async () => {
      const a = preparar(RUTA);
      await a.ctrl.votarPost(req('lado'), a.res);
      expect(a.res.status).toHaveBeenCalledWith(400);
      const b = preparar(RUTA);
      await b.ctrl.votarPost(req('up'), b.res);
      expect(b.res.status).toHaveBeenCalledWith(404);
    });

    it('voto nuevo inserta y suma 1', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('posts_foro', { data: { id: 'p1' } });
      db.rpc.mockResolvedValue({ data: 4, error: null });
      await ctrl.votarPost(req('up'), res);
      expect(db.argumentos('votos_post', 'insert')).toEqual([{ post_id: 'p1', user_id: 'u-1', direccion: 'up' }]);
      expect(db.rpc).toHaveBeenCalledWith('incrementar_votos_post', { post_id_param: 'p1', delta: 1 });
      expect(cuerpo(res).data).toEqual({ votos: 4, mi_voto: 'up' });
    });

    it('repetir el mismo voto lo quita (delta -1)', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('posts_foro', { data: { id: 'p1' } }).responder('votos_post', { data: { id: 'v1', direccion: 'up' } });
      await ctrl.votarPost(req('up'), res);
      expect(db.llamadas('votos_post').some((l) => l.metodo === 'delete')).toBe(true);
      expect(db.rpc.mock.calls[0][1].delta).toBe(-1);
      expect(cuerpo(res).data.mi_voto).toBeNull();
    });

    it('cambiar de dirección actualiza el voto (delta -2)', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('posts_foro', { data: { id: 'p1' } }).responder('votos_post', { data: { id: 'v1', direccion: 'up' } });
      await ctrl.votarPost(req('down'), res);
      expect(db.argumentos('votos_post', 'update')).toEqual([{ direccion: 'down' }]);
      expect(db.rpc.mock.calls[0][1].delta).toBe(-2);
      expect(cuerpo(res).data.mi_voto).toBe('down');
    });
  });

  describe('responderPost', () => {
    const req = (body) => ({ params: { id: 'p1' }, body, user: { id: 'u-1' } });

    it('400 sin contenido y 404 si el post no existe', async () => {
      const a = preparar(RUTA);
      await a.ctrl.responderPost(req({ contenido: ' ' }), a.res);
      expect(a.res.status).toHaveBeenCalledWith(400);
      const b = preparar(RUTA);
      await b.ctrl.responderPost(req({ contenido: 'x' }), b.res);
      expect(b.res.status).toHaveBeenCalledWith(404);
    });

    it('crea la respuesta (anónima o con nombre) y responde 201', async () => {
      const a = preparar(RUTA);
      a.db.responder('posts_foro', { data: { id: 'p1' } })
        .responder('perfiles_usuario', { data: { nombre: 'Ana' } })
        .responder('respuestas_post', { data: { id: 'r1', contenido: 'ok' } });
      await a.ctrl.responderPost(req({ contenido: ' ok ' }), a.res);
      expect(a.res.status).toHaveBeenCalledWith(201);
      expect(cuerpo(a.res).data).toMatchObject({ texto: 'ok', autor_display: 'Ana', ini: 'A' });

      const b = preparar(RUTA);
      b.db.responder('posts_foro', { data: { id: 'p1' } })
        .responder('respuestas_post', { data: { id: 'r2', contenido: 'x' } });
      await b.ctrl.responderPost(req({ contenido: 'x', anonimo: true }), b.res);
      expect(cuerpo(b.res).data).toMatchObject({ autor_display: 'Anónimo', ini: 'A' });
    });

    it('500 si falla el insert', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('posts_foro', { data: { id: 'p1' } }).responder('respuestas_post', { error: { message: 'x' } });
      await ctrl.responderPost(req({ contenido: 'x', anonimo: true }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  it('asyncHandler convierte una excepción en 500', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    db.from.mockImplementation(() => { throw new Error('caído'); });
    await ctrl.getForos({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(cuerpo(res)).toEqual({ success: false, message: 'caído' });
  });
});

describe('moderacionController', () => {
  const RUTA = 'controllers/comunidad/moderacionController';

  it.each([
    ['post', 'posts_foro'], ['historia', 'historias'], ['pregunta', 'preguntas_comunidad'],
  ])('ocultar %s marca oculta=true en %s', async (tipo, tabla) => {
    const { db, ctrl, res } = preparar(RUTA);
    await ctrl.ocultarPublicacion({ params: { tipo, id: '7' } }, res);
    expect(db.argumentos(tabla, 'update')).toEqual([{ oculta: true }]);
    expect(cuerpo(res)).toEqual({ success: true });
  });

  it('eliminar borra la fila de la tabla del tipo', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    await ctrl.eliminarPublicacion({ params: { tipo: 'historia', id: '7' } }, res);
    expect(db.llamadas('historias').map((l) => l.metodo)).toEqual(['delete', 'eq']);
    expect(cuerpo(res)).toEqual({ success: true });
  });

  it('tipo inválido → 400 sin tocar la base; error de Supabase → 500', async () => {
    for (const fn of ['ocultarPublicacion', 'eliminarPublicacion']) {
      const a = preparar(RUTA);
      await a.ctrl[fn]({ params: { tipo: 'usuario', id: '1' } }, a.res);
      expect(a.res.status).toHaveBeenCalledWith(400);
      expect(a.db.from).not.toHaveBeenCalled();

      const b = preparar(RUTA);
      b.db.responder('posts_foro', { error: { message: 'x' } });
      await b.ctrl[fn]({ params: { tipo: 'post', id: '1' } }, b.res);
      expect(b.res.status).toHaveBeenCalledWith(500);
    }
  });

  it('getInfoAutor junta perfil y correo real; 404 si no existe', async () => {
    const a = preparar(RUTA);
    a.db.responder('perfiles_usuario', { data: { user_id: 'u-1', nombre: 'Ana' } });
    a.db.auth.admin.getUserById.mockResolvedValue({ data: { user: { email: 'ana@x.co' } } });
    await a.ctrl.getInfoAutor({ params: { userId: 'u-1' } }, a.res);
    expect(cuerpo(a.res).data).toEqual({ user_id: 'u-1', nombre: 'Ana', email: 'ana@x.co' });

    const b = preparar(RUTA);
    await b.ctrl.getInfoAutor({ params: { userId: 'nadie' } }, b.res);
    expect(b.res.status).toHaveBeenCalledWith(404);
  });

  it('getInfoAutor devuelve email null si falla Auth', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('perfiles_usuario', { data: { user_id: 'u-1' } });
    db.auth.admin.getUserById.mockRejectedValue(new Error('auth caído'));
    await ctrl.getInfoAutor({ params: { userId: 'u-1' } }, res);
    expect(cuerpo(res).data.email).toBeNull();
  });
});
