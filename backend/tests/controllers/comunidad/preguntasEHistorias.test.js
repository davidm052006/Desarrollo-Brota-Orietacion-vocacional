// preguntasController e historiasController de comunidad con Supabase falso.
const { crearSupabaseFake, respuestaFalsa, cargarConFake } = require('../../helpers/supabaseFake');

const AHORA = new Date().toISOString();
const USER = { id: 'u-1' };

function preparar(ruta) {
  const db = crearSupabaseFake();
  return { db, ctrl: cargarConFake(ruta, db), res: respuestaFalsa() };
}
const cuerpo = (res) => res.json.mock.calls[0][0];

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('preguntasController', () => {
  const RUTA = 'controllers/comunidad/preguntasController';

  it('getPreguntas cuenta respuestas y oculta autores anónimos a estudiantes', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('perfiles_usuario', { data: { rol: 'estudiante' } })
      .responder('preguntas_comunidad', { data: [
        { id: 'q1', user_id: 'u-a', titulo: '¿Ingeniería?', area: 'Tec', anonimo: true, resuelta: true, created_at: AHORA },
        { id: 'q2', user_id: 'u-b', titulo: '¿Arte?', area: 'Arte', anonimo: false, autor_nombre: 'luz', created_at: AHORA },
      ] })
      .responder('respuestas_pregunta', { data: [{ pregunta_id: 'q1' }, { pregunta_id: 'q1' }] });

    await ctrl.getPreguntas({ user: USER }, res);

    const [a, b] = cuerpo(res).data;
    expect(a).toMatchObject({ id: 'q1', name: 'Anónimo', answers: 2, resolved: true, autor_id: undefined });
    expect(b).toMatchObject({ id: 'q2', name: 'luz', ini: 'L', answers: 0, resolved: false });
  });

  it('getPreguntas: sin preguntas no consulta respuestas; 500 si falla', async () => {
    const a = preparar(RUTA);
    await a.ctrl.getPreguntas({ user: USER }, a.res);
    expect(cuerpo(a.res).data).toEqual([]);
    expect(a.db.llamadas('respuestas_pregunta')).toEqual([]);

    const b = preparar(RUTA);
    b.db.responder('preguntas_comunidad', { error: { message: 'x' } });
    await b.ctrl.getPreguntas({ user: USER }, b.res);
    expect(b.res.status).toHaveBeenCalledWith(500);
  });

  it('getPregunta marca es_autor y formatea respuestas', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('perfiles_usuario', { data: { rol: 'admin' } })
      .responder('preguntas_comunidad', { data: { id: 'q1', user_id: 'u-1', titulo: 'T', anonimo: true, created_at: AHORA } })
      .responder('respuestas_pregunta', { data: [
        { id: 'r1', contenido: 'a', anonimo: true, created_at: AHORA },
        { id: 'r2', contenido: 'b', anonimo: false, autor_nombre: null, es_mejor: true, votos: 1, created_at: AHORA },
      ] })
      .responder('perfiles_usuario', { data: { nombre: 'Yo' } });

    await ctrl.getPregunta({ params: { id: 'q1' }, user: USER }, res);

    const { data } = cuerpo(res);
    expect(data).toMatchObject({ es_autor: true, name: 'Yo', es_anonimo_real: true, autor_id: 'u-1', resuelta: false });
    expect(data.respuestas.map((r) => [r.autor_display, r.ini, r.mejor])).toEqual([['Anónimo', 'A', false], ['Usuario', 'U', true]]);
  });

  it('getPregunta 404 si no existe', async () => {
    const { ctrl, res } = preparar(RUTA);
    await ctrl.getPregunta({ params: { id: 'nada' }, user: USER }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  describe('crearPregunta', () => {
    const req = (body) => ({ body, user: USER });

    it('400 sin título', async () => {
      const { ctrl, res } = preparar(RUTA);
      await ctrl.crearPregunta(req({ titulo: ' ' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('403 si el autor está baneado por reportes (reloj controlado)', async () => {
      jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
      jest.setSystemTime(new Date('2026-11-16T12:00:00Z'));
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('perfiles_usuario', { data: { baneado_preguntas_hasta: '2026-11-20T12:00:00Z' } });
      await ctrl.crearPregunta(req({ titulo: 'Hola' }), res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(cuerpo(res).message).toMatch(/hasta el 20 de noviembre/);
      expect(db.argumentos('preguntas_comunidad', 'insert')).toEqual([]);
    });

    it('crea con área por defecto y nombre del autor; ban vencido no bloquea', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('perfiles_usuario', { data: { baneado_preguntas_hasta: '2020-01-01T00:00:00Z' } })
        .responder('perfiles_usuario', { data: { nombre: 'Ana' } })
        .responder('preguntas_comunidad', { data: { id: 'q9' } });
      await ctrl.crearPregunta(req({ titulo: ' ¿Medicina? ' }), res);
      expect(db.argumentos('preguntas_comunidad', 'insert')[0]).toEqual({
        user_id: 'u-1', titulo: '¿Medicina?', area: 'General', anonimo: false, autor_nombre: 'Ana',
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('500 si falla el insert', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('preguntas_comunidad', { error: { message: 'x' } });
      await ctrl.crearPregunta(req({ titulo: 'a', anonimo: true }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('responderPregunta', () => {
    const req = (body) => ({ params: { id: 'q1' }, body, user: USER });

    it('400, 404 y 500 según el caso', async () => {
      const a = preparar(RUTA);
      await a.ctrl.responderPregunta(req({}), a.res);
      expect(a.res.status).toHaveBeenCalledWith(400);

      const b = preparar(RUTA);
      await b.ctrl.responderPregunta(req({ contenido: 'x' }), b.res);
      expect(b.res.status).toHaveBeenCalledWith(404);

      const c = preparar(RUTA);
      c.db.responder('preguntas_comunidad', { data: { id: 'q1' } }).responder('respuestas_pregunta', { error: { message: 'x' } });
      await c.ctrl.responderPregunta(req({ contenido: 'x', anonimo: true }), c.res);
      expect(c.res.status).toHaveBeenCalledWith(500);
    });

    it('crea la respuesta con el nombre del autor', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('preguntas_comunidad', { data: { id: 'q1' } })
        .responder('perfiles_usuario', { data: { nombre: 'Ana' } })
        .responder('respuestas_pregunta', { data: { id: 'r1', contenido: 'ok' } });
      await ctrl.responderPregunta(req({ contenido: ' ok ' }), res);
      expect(db.argumentos('respuestas_pregunta', 'insert')[0].contenido).toBe('ok');
      expect(cuerpo(res).data).toMatchObject({ texto: 'ok', autor_display: 'Ana', ini: 'A', mejor: false });
    });
  });

  describe('marcarMejorRespuesta', () => {
    const req = { params: { id: 'q1', rid: 'r2' }, user: USER };

    it('solo el autor puede marcarla: desmarca todas, marca una y resuelve la pregunta', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('preguntas_comunidad', { data: { id: 'q1', user_id: 'u-1' } });
      await ctrl.marcarMejorRespuesta(req, res);
      expect(db.argumentos('respuestas_pregunta', 'update')).toEqual([{ es_mejor: false }, { es_mejor: true }]);
      expect(db.argumentos('preguntas_comunidad', 'update')).toEqual([{ resuelta: true }]);
      expect(cuerpo(res)).toEqual({ success: true });
    });

    it('403 si no es el autor y 404 si no existe', async () => {
      const a = preparar(RUTA);
      a.db.responder('preguntas_comunidad', { data: { id: 'q1', user_id: 'otro' } });
      await a.ctrl.marcarMejorRespuesta(req, a.res);
      expect(a.res.status).toHaveBeenCalledWith(403);
      expect(a.db.argumentos('respuestas_pregunta', 'update')).toEqual([]);

      const b = preparar(RUTA);
      await b.ctrl.marcarMejorRespuesta(req, b.res);
      expect(b.res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('reportarPregunta', () => {
    const req = { params: { id: 'q1' }, body: { motivo: ' spam ' }, user: USER };

    it('registra el reporte sin banear por debajo de 3', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('preguntas_comunidad', { data: { id: 'q1', user_id: 'u-a' } })
        .responder('reportes_pregunta', { data: null })
        .responder('reportes_pregunta', {})
        .responder('reportes_pregunta', { count: 2 });
      await ctrl.reportarPregunta(req, res);
      expect(db.argumentos('reportes_pregunta', 'insert')).toEqual([{ pregunta_id: 'q1', user_id: 'u-1', motivo: 'spam' }]);
      expect(cuerpo(res).data).toEqual({ reportes: 2, autor_baneado: false });
      expect(db.argumentos('perfiles_usuario', 'update')).toEqual([]);
    });

    it('al tercer reporte banea al autor 7 días (reloj controlado)', async () => {
      jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
      jest.setSystemTime(new Date('2026-11-16T12:00:00Z'));
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('preguntas_comunidad', { data: { id: 'q1', user_id: 'u-a' } })
        .responder('reportes_pregunta', { data: null })
        .responder('reportes_pregunta', {})
        .responder('reportes_pregunta', { count: 3 });
      await ctrl.reportarPregunta({ ...req, body: {} }, res);
      expect(db.argumentos('reportes_pregunta', 'insert')[0].motivo).toBeNull();
      expect(db.argumentos('perfiles_usuario', 'update')).toEqual([{ baneado_preguntas_hasta: '2026-11-23T12:00:00.000Z' }]);
      expect(cuerpo(res).data.autor_baneado).toBe(true);
    });

    it('404 sin pregunta, 409 si ya reportó y 500 si falla el insert', async () => {
      const a = preparar(RUTA);
      await a.ctrl.reportarPregunta(req, a.res);
      expect(a.res.status).toHaveBeenCalledWith(404);

      const b = preparar(RUTA);
      b.db.responder('preguntas_comunidad', { data: { id: 'q1' } }).responder('reportes_pregunta', { data: { id: 'rep' } });
      await b.ctrl.reportarPregunta(req, b.res);
      expect(b.res.status).toHaveBeenCalledWith(409);

      const c = preparar(RUTA);
      c.db.responder('preguntas_comunidad', { data: { id: 'q1' } })
        .responder('reportes_pregunta', { data: null })
        .responder('reportes_pregunta', { error: { message: 'x' } });
      await c.ctrl.reportarPregunta(req, c.res);
      expect(c.res.status).toHaveBeenCalledWith(500);
    });
  });
});

describe('historiasController', () => {
  const RUTA = 'controllers/comunidad/historiasController';
  const HIST = { id: 'h1', user_id: 'u-a', titulo: 'Mi camino', contenido: 'Párrafo 1\n\nPárrafo 2', area: 'Salud', anonimo: false, autor_nombre: 'ana', likes: 5, created_at: AHORA };

  it('getHistorias marca las que ya me gustaron', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('perfiles_usuario', { data: { rol: 'estudiante' } })
      .responder('historias', { data: [HIST, { ...HIST, id: 'h2', anonimo: true, likes: null }] })
      .responder('likes_historia', { data: [{ historia_id: 'h2' }] });

    await ctrl.getHistorias({ user: USER }, res);

    const [a, b] = cuerpo(res).data;
    expect(a).toMatchObject({ id: 'h1', name: 'ana', yo_di_like: false, likes: 5, carrera: '', tag: 'Salud' });
    expect(b).toMatchObject({ id: 'h2', name: 'Anónimo', yo_di_like: true, likes: 0 });
  });

  it('getHistorias sin sesión no busca likes; 500 si falla', async () => {
    const a = preparar(RUTA);
    a.db.responder('historias', { data: [{ ...HIST, anonimo: true }] });
    await a.ctrl.getHistorias({}, a.res);
    expect(a.db.llamadas('likes_historia')).toEqual([]);

    const b = preparar(RUTA);
    b.db.responder('historias', { error: { message: 'x' } });
    await b.ctrl.getHistorias({ user: USER }, b.res);
    expect(b.res.status).toHaveBeenCalledWith(500);
  });

  it('getHistoria separa párrafos y arma relacionadas', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('perfiles_usuario', { data: { rol: 'estudiante' } })
      .responder('historias', { data: HIST })
      .responder('likes_historia', { data: { id: 'l1' } })
      .responder('historias', { data: [{ id: 'h3', titulo: 'Otra', anonimo: true }, { id: 'h4', titulo: 'Más', autor_nombre: 'beto', likes: 2 }] });

    await ctrl.getHistoria({ params: { id: 'h1' }, user: USER }, res);

    const { data } = cuerpo(res);
    expect(data.body).toEqual(['Párrafo 1', 'Párrafo 2']);
    expect(data.yo_di_like).toBe(true);
    expect(data.relacionadas).toEqual([
      { id: 'h3', title: 'Otra', ini: 'A', name: 'Anónimo', likes: 0 },
      { id: 'h4', title: 'Más', ini: 'B', name: 'beto', likes: 2 },
    ]);
  });

  it('getHistoria 404 si no existe o no está publicada', async () => {
    const { ctrl, res } = preparar(RUTA);
    await ctrl.getHistoria({ params: { id: 'nada' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  describe('crearHistoria', () => {
    const req = (body) => ({ body, user: USER });

    it('400 si falta título, contenido o área', async () => {
      const { ctrl, res } = preparar(RUTA);
      await ctrl.crearHistoria(req({ titulo: 'a', contenido: 'b' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('queda sin publicar (para revisión) y anónima por defecto', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('historias', { data: { id: 'h9' } });
      await ctrl.crearHistoria(req({ titulo: ' T ', contenido: ' C ', area: ' Salud ', carrera: ' ' }), res);
      expect(db.argumentos('historias', 'insert')[0]).toEqual({
        user_id: 'u-1', titulo: 'T', contenido: 'C', area: 'Salud', carrera: null,
        institucion: null, anonimo: true, autor_nombre: null, publicada: false,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(cuerpo(res).message).toBe('Historia enviada para revisión');
    });

    it('con nombre guarda al autor; 500 si falla el insert', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('perfiles_usuario', { data: { nombre: 'Ana' } }).responder('historias', { error: { message: 'x' } });
      await ctrl.crearHistoria(req({ titulo: 'T', contenido: 'C', area: 'S', anonimo: false }), res);
      expect(db.argumentos('historias', 'insert')[0].autor_nombre).toBe('Ana');
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('toggleLikeHistoria', () => {
    const req = { params: { id: 'h1' }, user: USER };

    it('sin like previo inserta y suma 1', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('historias', { data: { id: 'h1' } });
      db.rpc.mockResolvedValue({ data: 6, error: null });
      await ctrl.toggleLikeHistoria(req, res);
      expect(db.argumentos('likes_historia', 'insert')).toEqual([{ historia_id: 'h1', user_id: 'u-1' }]);
      expect(db.rpc.mock.calls[0][1]).toEqual({ historia_id_param: 'h1', delta: 1 });
      expect(cuerpo(res).data).toEqual({ likes: 6, yo_di_like: true });
    });

    it('con like previo lo quita y resta 1', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('historias', { data: { id: 'h1' } }).responder('likes_historia', { data: { id: 'l1' } });
      db.rpc.mockResolvedValue({ data: 4, error: null });
      await ctrl.toggleLikeHistoria(req, res);
      expect(db.llamadas('likes_historia').some((l) => l.metodo === 'delete')).toBe(true);
      expect(cuerpo(res).data).toEqual({ likes: 4, yo_di_like: false });
    });

    it('404 si la historia no existe', async () => {
      const { ctrl, res } = preparar(RUTA);
      await ctrl.toggleLikeHistoria(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
