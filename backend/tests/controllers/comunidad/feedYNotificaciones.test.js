// Feed reciente, notificaciones, convocatorias públicas y moderación de
// preguntas del panel admin. Supabase falso + reloj controlado.
const { crearSupabaseFake, respuestaFalsa, cargarConFake } = require('../../helpers/supabaseFake');

const AHORA = new Date('2026-11-16T12:00:00Z');
const hace = (min) => new Date(AHORA.getTime() - min * 60_000).toISOString();

function preparar(ruta) {
  const db = crearSupabaseFake();
  return { db, ctrl: cargarConFake(ruta, db), res: respuestaFalsa() };
}
const cuerpo = (res) => res.json.mock.calls[0][0];

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
  jest.setSystemTime(AHORA);
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('feedController.getFeedReciente', () => {
  it('mezcla posts, historias y preguntas, ordena por fecha y recorta a 8', async () => {
    const { db, ctrl, res } = preparar('controllers/comunidad/feedController');
    const filas = (n, base) => Array.from({ length: n }, (_, i) => ({
      id: `${base}${i}`, titulo: base, anonimo: i === 0, autor_nombre: i === 1 ? null : 'ana', created_at: hace(base.length * 10 + i),
    }));
    db.responder('posts_foro', { data: filas(4, 'p') })
      .responder('historias', { data: filas(3, 'his') })
      .responder('preguntas_comunidad', { data: filas(3, 'preg') });

    await ctrl.getFeedReciente({}, res);

    const { data } = cuerpo(res);
    expect(data).toHaveLength(8);
    expect(data[0]).toMatchObject({ id: 'post-p0', tipo: 'post', autor: 'Anónimo', time: 'hace 10 min', linkState: { tipo: 'post' } });
    expect(data[1]).toMatchObject({ id: 'post-p1', autor: 'Usuario' });
    expect(data.map((i) => i.fecha)).toEqual([...data.map((i) => i.fecha)].sort().reverse());
    expect(data.find((i) => i.tipo === 'historia').link).toMatch('/dashboard/comunidad/historia/');
  });

  it('sin datos devuelve una lista vacía', async () => {
    const { ctrl, res } = preparar('controllers/comunidad/feedController');
    await ctrl.getFeedReciente({}, res);
    expect(cuerpo(res)).toEqual({ success: true, data: [] });
  });
});

describe('notificacionesController.getNotificaciones', () => {
  const RUTA = 'controllers/comunidad/notificacionesController';

  it('arma avisos de respuestas a mis preguntas y likes a mis historias, más recientes primero', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('preguntas_comunidad', { data: [{ id: 'q1', titulo: '¿Medicina?' }] })
      .responder('historias', { data: [{ id: 'h1', titulo: 'Mi camino' }] })
      .responder('respuestas_pregunta', { data: [
        { id: 'r1', pregunta_id: 'q1', autor_nombre: 'luis', anonimo: false, created_at: hace(30) },
        { id: 'r2', pregunta_id: 'q1', anonimo: true, created_at: hace(5) },
      ] })
      .responder('likes_historia', { data: [{ id: 'l1', historia_id: 'h1', created_at: hace(10) }] });

    await ctrl.getNotificaciones({ user: { id: 'u-1' } }, res);

    const { data } = cuerpo(res);
    expect(data.map((n) => n.id)).toEqual(['r-r2', 'l-l1', 'r-r1']);
    expect(data[0].texto).toBe('Alguien respondió tu pregunta "¿Medicina?"');
    expect(data[1]).toMatchObject({ tipo: 'like', texto: 'A alguien le sirvió tu historia "Mi camino"', time: 'hace 10 min' });
    expect(data[2].texto).toBe('luis respondió tu pregunta "¿Medicina?"');
    // No cuenta las propias respuestas ni los propios likes
    expect(db.llamadas('respuestas_pregunta').find((l) => l.metodo === 'neq').args).toEqual(['user_id', 'u-1']);
  });

  it('sin preguntas ni historias no consulta respuestas ni likes', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    await ctrl.getNotificaciones({ user: { id: 'u-1' } }, res);
    expect(cuerpo(res).data).toEqual([]);
    expect(db.llamadas('respuestas_pregunta')).toEqual([]);
    expect(db.llamadas('likes_historia')).toEqual([]);
  });
});

describe('comunidad/convocatoriasController', () => {
  const RUTA = 'controllers/comunidad/convocatoriasController';

  it('lista solo convocatorias vigentes con días restantes', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('convocatorias', { data: [
      { id: 1, tipo: 'Beca', titulo: 'Beca A', institucion: 'SENA', ciudad: 'Cali', fecha_cierre: '2026-11-19T12:00:00Z' },
    ] });
    await ctrl.getConvocatorias({}, res);
    expect(cuerpo(res).data).toEqual([{ id: 1, type: 'Beca', title: 'Beca A', inst: 'SENA', city: 'Cali', days: 3 }]);
    expect(db.llamadas('convocatorias').find((l) => l.metodo === 'gte').args).toEqual(['fecha_cierre', AHORA.toISOString()]);
  });

  it('getConvocatorias 500 si falla', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('convocatorias', { error: { message: 'x' } });
    await ctrl.getConvocatorias({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getConvocatoria devuelve el detalle con valores por defecto, o 404', async () => {
    const a = preparar(RUTA);
    a.db.responder('convocatorias', { data: { id: 2, tipo: 'Evento', titulo: 'Feria', fecha_cierre: '2026-11-17T00:00:00Z' } });
    await a.ctrl.getConvocatoria({ params: { id: '2' } }, a.res);
    expect(cuerpo(a.res).data).toMatchObject({ id: 2, title: 'Feria', descripcion: '', url: '', detalles: {}, days: 1 });

    const b = preparar(RUTA);
    await b.ctrl.getConvocatoria({ params: { id: '9' } }, b.res);
    expect(b.res.status).toHaveBeenCalledWith(404);
  });
});

describe('admin/preguntasComunidadController', () => {
  const RUTA = 'controllers/admin/preguntasComunidadController';

  it('lista preguntas con conteo de reportes y respuestas agrupadas', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('preguntas_comunidad', { data: [
      { id: 'q1', titulo: 'A', anonimo: true, resuelta: false },
      { id: 'q2', titulo: 'B', anonimo: false, autor_nombre: null, resuelta: true },
    ] })
      .responder('reportes_pregunta', { data: [{ pregunta_id: 'q1' }, { pregunta_id: 'q1' }] })
      .responder('respuestas_pregunta', { data: [
        { id: 'r1', pregunta_id: 'q2', contenido: 'x', anonimo: false, autor_nombre: 'luz', es_mejor: true },
        { id: 'r2', pregunta_id: 'q2', contenido: 'y', anonimo: true },
      ] });

    await ctrl.getPreguntasComunidad({}, res);

    const [a, b] = cuerpo(res).data;
    expect(a).toMatchObject({ id: 'q1', autor: 'Anónimo', reportes: 2, respuestas: [] });
    expect(b).toMatchObject({ id: 'q2', autor: 'Usuario', reportes: 0 });
    expect(b.respuestas.map((r) => r.autor)).toEqual(['luz', 'Anónimo']);
  });

  it('sin preguntas no consulta reportes; 500 si falla', async () => {
    const a = preparar(RUTA);
    await a.ctrl.getPreguntasComunidad({}, a.res);
    expect(cuerpo(a.res).data).toEqual([]);
    expect(a.db.llamadas('reportes_pregunta')).toEqual([]);

    const b = preparar(RUTA);
    b.db.responder('preguntas_comunidad', { error: { message: 'x' } });
    await b.ctrl.getPreguntasComunidad({}, b.res);
    expect(b.res.status).toHaveBeenCalledWith(500);
  });

  it('deletePreguntaComunidad borra por id o responde 500', async () => {
    const a = preparar(RUTA);
    await a.ctrl.deletePreguntaComunidad({ params: { id: 'q1' } }, a.res);
    expect(a.db.llamadas('preguntas_comunidad').map((l) => l.metodo)).toEqual(['delete', 'eq']);
    expect(cuerpo(a.res).success).toBe(true);

    const b = preparar(RUTA);
    b.db.responder('preguntas_comunidad', { error: { message: 'x' } });
    await b.ctrl.deletePreguntaComunidad({ params: { id: 'q1' } }, b.res);
    expect(b.res.status).toHaveBeenCalledWith(500);
  });
});
