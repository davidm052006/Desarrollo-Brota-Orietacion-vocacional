// perfilController con Supabase reemplazado por un fake en memoria
// (tests/helpers/supabaseFake.js). Se prueba el valor que recibe el cliente
// (estado) y lo que se escribe en la base (comportamiento).
const { crearSupabaseFake, respuestaFalsa, cargarConFake } = require('../helpers/supabaseFake');

const USER = { id: 'u-1' };

function preparar() {
  const db = crearSupabaseFake();
  const ctrl = cargarConFake('controllers/perfilController', db);
  return { db, ctrl, res: respuestaFalsa() };
}
const cuerpo = (res) => res.json.mock.calls[0][0];

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('obtenerMisPermisos', () => {
  it('devuelve el mapa de permisos efectivos del perfil', () => {
    const { ctrl, res } = preparar();
    ctrl.obtenerMisPermisos({ perfil: { rol: 'admin' } }, res);
    expect(cuerpo(res).data).toMatchObject({ 'programas.editar': true, 'comunidad.publicar': true });
  });
});

describe('obtenerCuestionario', () => {
  const PREGUNTAS = [{
    id: 'p1', texto: '¿Qué te gusta?', orden: 1,
    opciones: [
      { id: 'o2', label: 'B', orden: 2, pesos_opciones: [] },
      { id: 'o1', label: 'A', orden: 1, es_correcta: 1, pesos_opciones: [{ categoria: 'arte', puntos: 3 }] },
    ],
  }];

  it('usa el cuestionario global y ordena opciones con sus pesos', async () => {
    const { db, ctrl, res } = preparar();
    db.responder('perfiles_usuario', { data: { institucion_id: null } })
      .responder('cuestionarios', { data: { id: 'c-global', nombre: 'General' } })
      .responder('preguntas', { data: PREGUNTAS });

    await ctrl.obtenerCuestionario({ user: USER }, res);

    const { data } = cuerpo(res);
    expect(data.id).toBe('c-global');
    expect(data.preguntas[0].opciones).toEqual([
      { id: 'o1', label: 'A', icon: undefined, orden: 1, es_correcta: true, pesos: { arte: 3 } },
      { id: 'o2', label: 'B', icon: undefined, orden: 2, es_correcta: false, pesos: {} },
    ]);
  });

  it('prefiere el cuestionario activo de la institución del estudiante', async () => {
    const { db, ctrl, res } = preparar();
    db.responder('perfiles_usuario', { data: { institucion_id: 'inst-1' } })
      .responder('cuestionarios', { data: { id: 'c-inst' } })
      .responder('preguntas', { data: [] });

    await ctrl.obtenerCuestionario({ user: USER }, res);

    expect(cuerpo(res).data.id).toBe('c-inst');
    expect(db.from.mock.calls.filter(([t]) => t === 'cuestionarios')).toHaveLength(1);
  });

  it('si la columna institucion_id no existe (42703) cae al cuestionario sin filtro', async () => {
    const { db, ctrl, res } = preparar();
    db.responder('perfiles_usuario', { data: null })
      .responder('cuestionarios', { error: { code: '42703' } })
      .responder('cuestionarios', { data: { id: 'c-viejo' } })
      .responder('preguntas', { error: { code: '42703' } })
      .responder('preguntas', { data: [{ id: 'p', opciones: null }] });

    await ctrl.obtenerCuestionario({ user: USER }, res);

    expect(cuerpo(res).data).toMatchObject({ id: 'c-viejo', preguntas: [{ id: 'p', opciones: [] }] });
  });

  it('404 sin cuestionario activo y 500 si fallan las preguntas o una excepción', async () => {
    const a = preparar();
    a.db.responder('cuestionarios', { error: { code: 'PGRST116' } });
    await a.ctrl.obtenerCuestionario({ user: USER }, a.res);
    expect(a.res.status).toHaveBeenCalledWith(404);

    const b = preparar();
    b.db.responder('cuestionarios', { data: { id: 'c' } }).responder('preguntas', { error: { message: 'boom' } });
    await b.ctrl.obtenerCuestionario({ user: USER }, b.res);
    expect(b.res.status).toHaveBeenCalledWith(500);

    const c = preparar();
    // Error distinto de 42703 en el cuestionario de la institución → excepción → 500
    c.db.responder('perfiles_usuario', { data: { institucion_id: 'i' } })
      .responder('cuestionarios', { error: { code: 'XX', message: 'x' } });
    await c.ctrl.obtenerCuestionario({ user: USER }, c.res);
    expect(c.res.status).toHaveBeenCalledWith(500);
  });
});

describe('guardarResultado', () => {
  const body = { perfil_usuario_id: 'pu-1', cuestionario_id: 'c-1', respuestas: { p1: ['o1'] } };

  it('400 si faltan campos', async () => {
    const { ctrl, res } = preparar();
    await ctrl.guardarResultado({ user: USER, body: { cuestionario_id: 'c' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('403 si el perfil no es de quien llama', async () => {
    const { db, ctrl, res } = preparar();
    db.responder('perfiles_usuario', { data: null, error: { code: 'PGRST116' } });
    await ctrl.guardarResultado({ user: USER, body }, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(db.argumentos('resultados', 'insert')).toEqual([]);
  });

  it('calcula el perfil, guarda el resultado con porcentajes y responde 201', async () => {
    const { db, ctrl, res } = preparar();
    db.responder('perfiles_usuario', { data: { id: 'pu-1' } })
      .responder('preguntas', {
        data: [{ id: 'p1', opciones: [{ id: 'o1', pesos_opciones: [{ categoria: 'arte', puntos: 4 }] }] }],
      })
      .responder('resultados', { data: { id: 'r-1' } });

    await ctrl.guardarResultado({ user: USER, body }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const [[fila]] = db.argumentos('resultados', 'insert');
    expect(fila).toMatchObject({ perfil_usuario_id: 'pu-1', cuestionario_id: 'c-1', respuestas: body.respuestas });
    expect(fila.perfil_vocacional.categoriaPrincipal).toBe('arte');
    // Se dispara la recomendación con el id del resultado nuevo
    expect(db.argumentos('programas', 'eq')).toContain('area_academica');
  });

  it('500 si falla el insert o el cálculo', async () => {
    const a = preparar();
    a.db.responder('perfiles_usuario', { data: { id: 'pu-1' } })
      .responder('preguntas', { data: [] })
      .responder('resultados', { error: { message: 'insert falló' } });
    await a.ctrl.guardarResultado({ user: USER, body }, a.res);
    expect(a.res.status).toHaveBeenCalledWith(500);

    const b = preparar();
    b.db.responder('perfiles_usuario', { data: { id: 'pu-1' } })
      .responder('preguntas', { error: { message: 'sin preguntas' } });
    await b.ctrl.guardarResultado({ user: USER, body }, b.res);
    expect(b.res.status).toHaveBeenCalledWith(500);
  });
});

describe('obtenerResultado', () => {
  const req = { user: USER, params: { perfilUsuarioId: 'pu-1' } };

  it('devuelve el último resultado del perfil propio', async () => {
    const { db, ctrl, res } = preparar();
    db.responder('perfiles_usuario', { data: { id: 'pu-1' } }).responder('resultados', { data: { id: 'r-9' } });
    await ctrl.obtenerResultado(req, res);
    expect(cuerpo(res)).toEqual({ success: true, data: { id: 'r-9' } });
  });

  it('data null si aún no hizo el test (PGRST116)', async () => {
    const { db, ctrl, res } = preparar();
    db.responder('perfiles_usuario', { data: { id: 'pu-1' } }).responder('resultados', { error: { code: 'PGRST116' } });
    await ctrl.obtenerResultado(req, res);
    expect(cuerpo(res)).toEqual({ success: true, data: null });
  });

  it('403 con perfil ajeno y 500 con otro error', async () => {
    const a = preparar();
    await a.ctrl.obtenerResultado(req, a.res);
    expect(a.res.status).toHaveBeenCalledWith(403);

    const b = preparar();
    b.db.responder('perfiles_usuario', { data: { id: 'pu-1' } }).responder('resultados', { error: { code: 'X', message: 'x' } });
    await b.ctrl.obtenerResultado(req, b.res);
    expect(b.res.status).toHaveBeenCalledWith(500);
  });
});

describe('obtenerRecomendaciones', () => {
  const req = { user: USER, params: { resultadoId: 'r-1' } };

  it('aplana programa e institución y pasa la compatibilidad a porcentaje', async () => {
    const { db, ctrl, res } = preparar();
    db.responder('resultados', { data: { perfil_usuario_id: 'pu-1' } })
      .responder('perfiles_usuario', { data: { id: 'pu-1' } })
      .responder('recomendaciones', {
        data: [
          { id: 'rec-1', compatibilidad: 0.695, razones: '[]', programas: { nombre: 'Sistemas', instituciones: { nombre: 'SENA', ciudad: 'Bogotá' } } },
          { id: 'rec-2', compatibilidad: null, programas: null },
        ],
      });

    await ctrl.obtenerRecomendaciones(req, res);

    const [a, b] = cuerpo(res).data;
    expect(a).toMatchObject({ id: 'rec-1', nombre: 'Sistemas', institucion: 'SENA', ciudad: 'Bogotá', compatibilidad: 70, vista: false });
    expect(b).toMatchObject({ id: 'rec-2', nombre: '—', institucion: '—', compatibilidad: 0, costoMatricula: null });
  });

  it('404 si el resultado no existe, 403 si es ajeno y 500 si falla la consulta', async () => {
    const a = preparar();
    await a.ctrl.obtenerRecomendaciones(req, a.res);
    expect(a.res.status).toHaveBeenCalledWith(404);

    const b = preparar();
    b.db.responder('resultados', { data: { perfil_usuario_id: 'otro' } });
    await b.ctrl.obtenerRecomendaciones(req, b.res);
    expect(b.res.status).toHaveBeenCalledWith(403);

    const c = preparar();
    c.db.responder('resultados', { data: { perfil_usuario_id: 'pu-1' } })
      .responder('perfiles_usuario', { data: { id: 'pu-1' } })
      .responder('recomendaciones', { error: { message: 'x' } });
    await c.ctrl.obtenerRecomendaciones(req, c.res);
    expect(c.res.status).toHaveBeenCalledWith(500);
  });
});

describe('marcarRecomendacionVista', () => {
  const req = { user: USER, params: { id: 'rec-1' } };

  it('marca vista solo si la recomendación es del usuario', async () => {
    const { db, ctrl, res } = preparar();
    db.responder('recomendaciones', { data: { id: 'rec-1', resultados: { perfil_usuario_id: 'pu-1' } } })
      .responder('perfiles_usuario', { data: { id: 'pu-1' } });
    await ctrl.marcarRecomendacionVista(req, res);
    expect(cuerpo(res)).toEqual({ success: true });
    expect(db.argumentos('recomendaciones', 'update')).toEqual([{ vista: true }]);
  });

  it('404, 403 y 500 según el caso', async () => {
    const a = preparar();
    await a.ctrl.marcarRecomendacionVista(req, a.res);
    expect(a.res.status).toHaveBeenCalledWith(404);

    const b = preparar();
    b.db.responder('recomendaciones', { data: { id: 'rec-1', resultados: null } });
    await b.ctrl.marcarRecomendacionVista(req, b.res);
    expect(b.res.status).toHaveBeenCalledWith(403);
    expect(b.db.argumentos('recomendaciones', 'update')).toEqual([]);

    const c = preparar();
    c.db.responder('recomendaciones', { data: { id: 'rec-1', resultados: { perfil_usuario_id: 'pu-1' } } })
      .responder('perfiles_usuario', { data: { id: 'pu-1' } })
      .responder('recomendaciones', { error: { message: 'x' } });
    await c.ctrl.marcarRecomendacionVista(req, c.res);
    expect(c.res.status).toHaveBeenCalledWith(500);
  });
});

describe('eliminarResultado', () => {
  const req = { user: USER, params: { perfilUsuarioId: 'pu-1' } };

  it('borra primero las recomendaciones de sus resultados y luego los resultados', async () => {
    const { db, ctrl, res } = preparar();
    db.responder('perfiles_usuario', { data: { id: 'pu-1' } })
      .responder('resultados', { data: [{ id: 'r-1' }, { id: 'r-2' }] });

    await ctrl.eliminarResultado(req, res);

    expect(cuerpo(res).success).toBe(true);
    const inRec = db.llamadas('recomendaciones').find((l) => l.metodo === 'in');
    expect(inRec.args).toEqual(['resultado_id', ['r-1', 'r-2']]);
    expect(db.llamadas('resultados').some((l) => l.metodo === 'delete')).toBe(true);
  });

  it('sin resultados no toca recomendaciones; 403 ajeno; 500 si falla el borrado', async () => {
    const a = preparar();
    a.db.responder('perfiles_usuario', { data: { id: 'pu-1' } });
    await a.ctrl.eliminarResultado(req, a.res);
    expect(a.db.llamadas('recomendaciones')).toEqual([]);

    const b = preparar();
    await b.ctrl.eliminarResultado(req, b.res);
    expect(b.res.status).toHaveBeenCalledWith(403);

    const c = preparar();
    c.db.responder('perfiles_usuario', { data: { id: 'pu-1' } })
      .responder('resultados', { data: [] })
      .responder('resultados', { error: { message: 'x' } });
    await c.ctrl.eliminarResultado(req, c.res);
    expect(c.res.status).toHaveBeenCalledWith(500);
  });
});

describe('obtenerPerfil y racha (reloj controlado)', () => {
  const req = { user: USER, params: { userId: 'u-1' } };
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    jest.setSystemTime(new Date('2026-11-16T15:00:00Z'));
  });

  it('403 si pide el perfil de otra persona', async () => {
    const { ctrl, res } = preparar();
    await ctrl.obtenerPerfil({ user: USER, params: { userId: 'otro' } }, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('si ya contó hoy no escribe nada', async () => {
    const { db, ctrl, res } = preparar();
    db.responder('perfiles_usuario', { data: { nombre: 'Ana', ultima_actividad: '2026-11-16', racha_dias: 4 } });
    await ctrl.obtenerPerfil(req, res);
    expect(cuerpo(res).data).toMatchObject({ racha_dias: 4, racha_rota: false });
    expect(db.argumentos('perfiles_usuario', 'update')).toEqual([]);
  });

  it('actividad de ayer suma un día y conserva la institución embebida', async () => {
    const { db, ctrl, res } = preparar();
    db.responder('perfiles_usuario', { data: { institucion: { nombre: 'SENA' }, ultima_actividad: '2026-11-15', racha_dias: 4 } })
      .responder('perfiles_usuario', { data: { ultima_actividad: '2026-11-16', racha_dias: 5 } });
    await ctrl.obtenerPerfil(req, res);
    expect(db.argumentos('perfiles_usuario', 'update')).toEqual([{ ultima_actividad: '2026-11-16', racha_dias: 5 }]);
    expect(cuerpo(res).data).toMatchObject({ racha_dias: 5, racha_rota: false, institucion: { nombre: 'SENA' } });
  });

  it('un hueco de días reinicia la racha y la marca como rota', async () => {
    const { db, ctrl, res } = preparar();
    db.responder('perfiles_usuario', { data: { ultima_actividad: '2026-11-10', racha_dias: 6 } })
      .responder('perfiles_usuario', { data: { racha_dias: 1 } });
    await ctrl.obtenerPerfil(req, res);
    expect(db.argumentos('perfiles_usuario', 'update')[0].racha_dias).toBe(1);
    expect(cuerpo(res).data.racha_rota).toBe(true);
  });

  it('si falla la escritura de la racha devuelve el perfil sin marcarla rota', async () => {
    const { db, ctrl, res } = preparar();
    db.responder('perfiles_usuario', { data: { ultima_actividad: null, racha_dias: 3 } })
      .responder('perfiles_usuario', { error: { message: 'x' } });
    await ctrl.obtenerPerfil(req, res);
    expect(cuerpo(res).data).toMatchObject({ racha_dias: 3, racha_rota: false });
  });

  it('sin la relación institución (PGRST200) reintenta sin embed; 404 si no existe', async () => {
    const a = preparar();
    a.db.responder('perfiles_usuario', { error: { code: 'PGRST200' } })
      .responder('perfiles_usuario', { data: { ultima_actividad: '2026-11-16' } });
    await a.ctrl.obtenerPerfil(req, a.res);
    expect(cuerpo(a.res).success).toBe(true);

    const b = preparar();
    b.db.responder('perfiles_usuario', { error: { code: 'PGRST116' } });
    await b.ctrl.obtenerPerfil(req, b.res);
    expect(b.res.status).toHaveBeenCalledWith(404);
  });
});

describe('actualizarPerfil', () => {
  it('actualiza solo los campos permitidos y convierte la edad a entero', async () => {
    const { db, ctrl, res } = preparar();
    db.responder('perfiles_usuario', { data: { nombre: 'Ana' } });
    await ctrl.actualizarPerfil({
      user: USER, params: { userId: 'u-1' },
      body: { nombre: 'Ana', edad: '17', rol: 'admin', institucion_id: 'x' },
    }, res);
    const [cambios] = db.argumentos('perfiles_usuario', 'update');
    expect(cambios).toMatchObject({ nombre: 'Ana', edad: 17 });
    expect(cambios).not.toHaveProperty('rol');
    expect(cambios).not.toHaveProperty('institucion_id');
    expect(cuerpo(res)).toEqual({ success: true, data: { nombre: 'Ana' } });
  });

  it('403 ajeno, edad vacía queda null y 500 si falla', async () => {
    const a = preparar();
    await a.ctrl.actualizarPerfil({ user: USER, params: { userId: 'otro' }, body: {} }, a.res);
    expect(a.res.status).toHaveBeenCalledWith(403);

    const b = preparar();
    b.db.responder('perfiles_usuario', { error: { message: 'x' } });
    await b.ctrl.actualizarPerfil({ user: USER, params: { userId: 'u-1' }, body: { edad: '' } }, b.res);
    expect(b.db.argumentos('perfiles_usuario', 'update')[0].edad).toBeNull();
    expect(b.res.status).toHaveBeenCalledWith(500);
  });
});

describe('actualizarBroti', () => {
  const req = (broti_config, userId = 'u-1') => ({ user: USER, params: { userId }, body: { broti_config } });

  it('guarda un objeto de configuración válido', async () => {
    const { db, ctrl, res } = preparar();
    db.responder('perfiles_usuario', { data: { broti_config: { fondo: 'espacio' } } });
    await ctrl.actualizarBroti(req({ fondo: 'espacio' }), res);
    expect(db.argumentos('perfiles_usuario', 'update')).toEqual([{ broti_config: { fondo: 'espacio' } }]);
    expect(cuerpo(res).success).toBe(true);
  });

  it.each([[null], [[1, 2]], ['texto']])('400 con broti_config inválido: %p', async (valor) => {
    const { db, ctrl, res } = preparar();
    await ctrl.actualizarBroti(req(valor), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(db.from).not.toHaveBeenCalled();
  });

  it('403 ajeno y 500 si falla la escritura', async () => {
    const a = preparar();
    await a.ctrl.actualizarBroti(req({}, 'otro'), a.res);
    expect(a.res.status).toHaveBeenCalledWith(403);

    const b = preparar();
    b.db.responder('perfiles_usuario', { error: { message: 'x' } });
    await b.ctrl.actualizarBroti(req({}), b.res);
    expect(b.res.status).toHaveBeenCalledWith(500);
  });
});
