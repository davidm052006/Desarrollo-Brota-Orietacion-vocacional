const { crearSupabaseFake, cargarConFake } = require('../helpers/supabaseFake');

function cargar(db = crearSupabaseFake()) {
  return { db, h: cargarConFake('utils/comunidadHelpers', db) };
}

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('timeAgo (reloj controlado)', () => {
  const AHORA = new Date('2026-11-16T12:00:00Z');
  const hace = (ms) => new Date(AHORA.getTime() - ms).toISOString();
  const MIN = 60_000;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(AHORA);
  });

  it.each([
    [10_000, 'ahora mismo'],
    [5 * MIN, 'hace 5 min'],
    [3 * 60 * MIN, 'hace 3 h'],
    [24 * 60 * MIN, 'hace 1 día'],
    [3 * 24 * 60 * MIN, 'hace 3 días'],
    [7 * 24 * 60 * MIN, 'hace 1 semana'],
    [21 * 24 * 60 * MIN, 'hace 3 semanas'],
  ])('%i ms atrás → "%s"', (ms, esperado) => {
    const { h } = cargar();
    expect(h.timeAgo(hace(ms))).toBe(esperado);
  });
});

describe('incrementarContador', () => {
  const args = {
    rpcName: 'incrementar_likes', rpcParams: { p_id: 'h-1' },
    tabla: 'historias', columna: 'likes', filtroCol: 'id', filtroVal: 'h-1', delta: -1, clampMin: 0,
  };

  it('usa el RPC atómico cuando existe y no toca la tabla', async () => {
    const { db, h } = cargar();
    db.rpc.mockResolvedValue({ data: 7, error: null });
    await expect(h.incrementarContador(args)).resolves.toBe(7);
    expect(db.rpc).toHaveBeenCalledWith('incrementar_likes', { p_id: 'h-1' });
    expect(db.from).not.toHaveBeenCalled();
  });

  it('si el RPC no existe cae a leer-calcular-escribir respetando el mínimo', async () => {
    const { db, h } = cargar();
    db.rpc.mockResolvedValue({ data: null, error: { message: 'function does not exist' } });
    db.responder('historias', { data: { likes: 0 } });

    await expect(h.incrementarContador(args)).resolves.toBe(0);
    expect(db.argumentos('historias', 'update')).toEqual([{ likes: 0 }]);
  });

  it('sin mínimo permite el valor calculado tal cual', async () => {
    const { db, h } = cargar();
    db.rpc.mockResolvedValue({ data: null, error: { message: 'x' } });
    db.responder('historias', { data: null });
    await expect(h.incrementarContador({ ...args, delta: 2, clampMin: null })).resolves.toBe(2);
  });
});

describe('consultas de perfil', () => {
  it('getNombreUsuario devuelve el nombre o "Usuario" si falla o no hay nombre', async () => {
    const { db, h } = cargar();
    db.responder('perfiles_usuario', { data: { nombre: 'Ana' } })
      .responder('perfiles_usuario', { error: { message: 'x' } })
      .responder('perfiles_usuario', { data: {} });
    await expect(h.getNombreUsuario('u')).resolves.toBe('Ana');
    await expect(h.getNombreUsuario('u')).resolves.toBe('Usuario');
    await expect(h.getNombreUsuario('u')).resolves.toBe('Usuario');
  });

  it('esModerador es true solo para admin y moderador, y false sin userId', async () => {
    const { db, h } = cargar();
    db.responder('perfiles_usuario', { data: { rol: 'admin' } })
      .responder('perfiles_usuario', { data: { rol: 'moderador' } })
      .responder('perfiles_usuario', { data: { rol: 'estudiante' } });
    await expect(h.esModerador('a')).resolves.toBe(true);
    await expect(h.esModerador('b')).resolves.toBe(true);
    await expect(h.esModerador('c')).resolves.toBe(false);
    await expect(h.esModerador(null)).resolves.toBe(false);
    expect(db.from).toHaveBeenCalledTimes(3);
  });
});

describe('resolverAutor', () => {
  it('no anónimo: nombre guardado y su Broti', async () => {
    const { db, h } = cargar();
    db.responder('perfiles_usuario', { data: { broti_config: { fondo: 'bosque' } } });
    await expect(h.resolverAutor({ userId: 'u', anonimo: false, autorNombreGuardado: 'Ana' }))
      .resolves.toEqual({ display: 'Ana', esAnonimoReal: false, brotiConfig: { fondo: 'bosque' } });
  });

  it('anónimo visto por alguien que no modera: no revela nombre ni Broti y no consulta', async () => {
    const { db, h } = cargar();
    await expect(h.resolverAutor({ userId: 'u', anonimo: true, puedeModerar: false }))
      .resolves.toEqual({ display: 'Anónimo', esAnonimoReal: false, brotiConfig: null });
    expect(db.from).not.toHaveBeenCalled();
  });

  it('anónimo visto por moderación: nombre real marcado como anónimo', async () => {
    const { db, h } = cargar();
    db.responder('perfiles_usuario', { data: { nombre: 'Luis' } })
      .responder('perfiles_usuario', { data: { broti_config: null } });
    await expect(h.resolverAutor({ userId: 'u', anonimo: true, puedeModerar: true }))
      .resolves.toEqual({ display: 'Luis', esAnonimoReal: true, brotiConfig: null });
  });
});
