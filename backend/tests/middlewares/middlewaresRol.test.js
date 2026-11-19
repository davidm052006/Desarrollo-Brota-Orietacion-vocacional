// Middlewares de autenticación y rol: verificarAuth, verificarInstitucion,
// verificarModeracion y verificarPermiso. Supabase es un fake (auth.getUser
// programable + tabla perfiles_usuario en memoria).
const { crearSupabaseFake, respuestaFalsa, cargarConFake } = require('../helpers/supabaseFake');

const USER = { id: 'u-1', email: 'a@b.co' };
const FUTURO = new Date(Date.now() + 3_600_000).toISOString();
const PASADO = new Date(Date.now() - 3_600_000).toISOString();

function preparar(ruta, { perfil, perfilError, user = USER } = {}) {
  const db = crearSupabaseFake();
  db.auth.getUser.mockResolvedValue({ data: { user }, error: null });
  db.responder('perfiles_usuario', { data: perfil ?? null, error: perfilError ?? null });
  const mw = cargarConFake(ruta, db);
  return { db, mw };
}

async function ejecutar(mw, headers = { authorization: 'Bearer tok' }) {
  const req = { headers };
  const res = respuestaFalsa();
  const next = jest.fn();
  await mw(req, res, next);
  return { req, res, next };
}

beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterEach(() => jest.restoreAllMocks());

// Comportamiento común de los cuatro: sin token, token inválido y excepción.
describe.each([
  ['verificarAuth', (m) => m],
  ['verificarInstitucion', (m) => m],
  ['verificarModeracion', (m) => m],
  ['verificarPermiso', (m) => m('comunidad.publicar')],
])('%s', (nombre, construir) => {
  const ruta = `middlewares/${nombre}`;

  it('responde 401 sin token y no llama a Supabase', async () => {
    const { db, mw } = preparar(ruta);
    const { res, next } = await ejecutar(construir(mw), {});
    expect(res.status).toHaveBeenCalledWith(401);
    expect(db.auth.getUser).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('responde 401 con token inválido', async () => {
    const { db, mw } = preparar(ruta);
    db.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'jwt expired' } });
    const { res, next } = await ejecutar(construir(mw));
    expect(db.auth.getUser).toHaveBeenCalledWith('tok');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('responde 500 si Supabase lanza una excepción', async () => {
    const { db, mw } = preparar(ruta);
    db.auth.getUser.mockRejectedValue(new Error('red caída'));
    const { res, next } = await ejecutar(construir(mw));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('verificarAuth', () => {
  it('adjunta user y perfil y deja pasar', async () => {
    const perfil = { rol: 'estudiante', permisos_override: null, bloqueado_hasta: null };
    const { mw } = preparar('middlewares/verificarAuth', { perfil });
    const { req, next } = await ejecutar(mw);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(USER);
    expect(req.perfil).toEqual(perfil);
  });

  it('bloquea con 403 a una cuenta bloqueada hasta una fecha futura', async () => {
    const { mw } = preparar('middlewares/verificarAuth', { perfil: { rol: 'estudiante', bloqueado_hasta: FUTURO } });
    const { res, next } = await ejecutar(mw);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'BLOQUEADO', hasta: FUTURO });
    expect(next).not.toHaveBeenCalled();
  });

  it('deja pasar si el bloqueo ya venció o no hay perfil', async () => {
    const vencido = preparar('middlewares/verificarAuth', { perfil: { rol: 'estudiante', bloqueado_hasta: PASADO } });
    expect((await ejecutar(vencido.mw)).next).toHaveBeenCalled();
    const sinPerfil = preparar('middlewares/verificarAuth');
    const r = await ejecutar(sinPerfil.mw);
    expect(r.next).toHaveBeenCalled();
    expect(r.req.perfil).toBeNull();
  });
});

describe('verificarInstitucion', () => {
  it('deja pasar al rol institución y adjunta su institucionId', async () => {
    const { db, mw } = preparar('middlewares/verificarInstitucion', { perfil: { rol: 'institucion', institucion_id: 'inst-9' } });
    const { req, next } = await ejecutar(mw);
    expect(next).toHaveBeenCalled();
    expect(req.institucionId).toBe('inst-9');
    expect(db.argumentos('perfiles_usuario', 'eq')).toEqual(['user_id']);
  });

  it.each(['estudiante', 'admin'])('rechaza con 403 al rol %s', async (rol) => {
    const { mw } = preparar('middlewares/verificarInstitucion', { perfil: { rol } });
    const { res, next } = await ejecutar(mw);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('verificarModeracion', () => {
  it.each(['admin', 'moderador'])('deja pasar al rol %s', async (rol) => {
    const { mw } = preparar('middlewares/verificarModeracion', { perfil: { rol } });
    const { req, next } = await ejecutar(mw);
    expect(next).toHaveBeenCalled();
    expect(req.rolModeracion).toBe(rol);
  });

  it('rechaza con 403 a un estudiante o si falla la consulta del rol', async () => {
    const est = preparar('middlewares/verificarModeracion', { perfil: { rol: 'estudiante' } });
    expect((await ejecutar(est.mw)).res.status).toHaveBeenCalledWith(403);
    const err = preparar('middlewares/verificarModeracion', { perfilError: { message: 'x' } });
    expect((await ejecutar(err.mw)).res.status).toHaveBeenCalledWith(403);
  });
});

describe('verificarPermiso', () => {
  const ruta = 'middlewares/verificarPermiso';

  it('deja pasar cuando el rol tiene el permiso', async () => {
    const { mw } = preparar(ruta, { perfil: { rol: 'admin' } });
    const { req, next } = await ejecutar(mw('programas.editar'));
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(USER);
  });

  it('rechaza con 403 cuando el rol no tiene el permiso', async () => {
    const { mw } = preparar(ruta, { perfil: { rol: 'estudiante' } });
    const { res, next } = await ejecutar(mw('programas.editar'));
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json.mock.calls[0][0].message).toContain('programas.editar');
    expect(next).not.toHaveBeenCalled();
  });

  it('respeta un override que quita un permiso del rol', async () => {
    const { mw } = preparar(ruta, { perfil: { rol: 'estudiante', permisos_override: { 'comunidad.publicar': false } } });
    const { res } = await ejecutar(mw('comunidad.publicar'));
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('rechaza con 403 si no hay perfil o la cuenta está bloqueada', async () => {
    const sin = preparar(ruta, { perfilError: { message: 'no rows' } });
    expect((await ejecutar(sin.mw('comunidad.publicar'))).res.status).toHaveBeenCalledWith(403);
    const bloq = preparar(ruta, { perfil: { rol: 'admin', bloqueado_hasta: FUTURO } });
    const { res } = await ejecutar(bloq.mw('comunidad.publicar'));
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'BLOQUEADO', hasta: FUTURO });
  });
});
