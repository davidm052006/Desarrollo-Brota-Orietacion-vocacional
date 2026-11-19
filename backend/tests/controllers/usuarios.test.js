// crearUsuarioUnico y los controladores de usuarios (admin e institución).
// Supabase es un fake; `sleep` es un stub para que la carga masiva no espere;
// el reloj está fijo para que la edad calculada desde la fecha no cambie.
const { crearSupabaseFake, respuestaFalsa, cargarConFake } = require('../helpers/supabaseFake');

const VALIDO = { email: 'ana@colegio.co', password: 'secreta1', nombre: 'Ana', apellido: 'Ruiz' };

function preparar(ruta) {
  const db = crearSupabaseFake();
  db.auth.admin.createUser.mockResolvedValue({ data: { user: { id: 'nuevo-1' } }, error: null });
  const sleep = jest.fn().mockResolvedValue();
  const ctrl = cargarConFake(ruta, db, { 'utils/sleep': () => sleep });
  return { db, ctrl, sleep, res: respuestaFalsa() };
}
const cuerpo = (res) => res.json.mock.calls[0][0];

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
  jest.setSystemTime(new Date('2026-11-16T12:00:00Z'));
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('crearUsuarioUnico', () => {
  const crear = async (datos, preparar_ = () => {}) => {
    const { db, ctrl } = preparar('utils/crearUsuario');
    preparar_(db);
    return { db, r: await ctrl.crearUsuarioUnico(datos) };
  };

  it.each([
    [{ ...VALIDO, nombre: '' }, 'obligatorios'],
    [{ ...VALIDO, password: '123' }, 'mínimo 6'],
    [{ ...VALIDO, email: 'sin-arroba' }, 'formato válido'],
    [{ ...VALIDO, rol: 'superadmin' }, 'Rol inválido "superadmin"'],
    [{ ...VALIDO, rol: 'institucion' }, 'Elegí a qué institución'],
    [{ ...VALIDO, fecha_nacimiento: '2020-01-01' }, 'entre 14 y 100'],
    [{ ...VALIDO, edad: 'diez' }, 'debe ser un número'],
  ])('rechaza datos inválidos sin crear nada: %#', async (datos, mensaje) => {
    const { db, r } = await crear(datos);
    expect(r.success).toBe(false);
    expect(r.error).toContain(mensaje);
    expect(db.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it('rechaza una institución que no existe en el catálogo', async () => {
    const { db, r } = await crear({ ...VALIDO, rol: 'institucion', institucion_id: 'x' });
    expect(r.error).toBe('La institución seleccionada no existe');
    expect(db.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it('crea cuenta, perfil con edad desde la fecha y asigna el rol', async () => {
    const { db, r } = await crear({ ...VALIDO, fecha_nacimiento: '2010-12-01', grado: '', telefono: '300' });
    expect(r).toEqual({ success: true, id: 'nuevo-1' });
    expect(db.auth.admin.createUser).toHaveBeenCalledWith({ email: VALIDO.email, password: VALIDO.password, email_confirm: true });
    const [[perfil]] = db.argumentos('perfiles_usuario', 'insert');
    expect(perfil).toMatchObject({ user_id: 'nuevo-1', edad: 15, grado: null, telefono: '300', institucion_id: null });
    expect(db.argumentos('perfiles_usuario', 'update')).toEqual([{ rol: 'estudiante' }]);
  });

  it('cuenta institución válida queda vinculada; admin nunca guarda institucion_id', async () => {
    const inst = await crear({ ...VALIDO, rol: 'institucion', institucion_id: 'i-1', edad: '30' }, (db) => {
      db.responder('instituciones', { data: { id: 'i-1' } });
    });
    expect(inst.r.success).toBe(true);
    expect(inst.db.argumentos('perfiles_usuario', 'insert')[0][0]).toMatchObject({ institucion_id: 'i-1', edad: 30 });

    const admin = await crear({ ...VALIDO, rol: 'admin', institucion_id: 'i-1' });
    expect(admin.db.argumentos('perfiles_usuario', 'insert')[0][0].institucion_id).toBeNull();
  });

  it('error de Auth se devuelve tal cual; error del perfil hace rollback con status 500', async () => {
    const auth = await crear(VALIDO, (db) => {
      db.auth.admin.createUser.mockResolvedValue({ data: null, error: { message: 'User already registered' } });
    });
    expect(auth.r).toEqual({ success: false, error: 'User already registered' });

    const perfil = await crear(VALIDO, (db) => db.responder('perfiles_usuario', { error: { message: 'columna grado' } }));
    expect(perfil.r).toMatchObject({ success: false, status: 500 });
    expect(perfil.db.auth.admin.deleteUser).toHaveBeenCalledWith('nuevo-1');
  });
});

describe('admin/usuariosController', () => {
  const RUTA = 'controllers/admin/usuariosController';

  it('getUsuarios pagina, busca escapando el patrón y filtra por rol', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('perfiles_usuario', { data: [{ id: 1 }], count: 25 });
    await ctrl.getUsuarios({ query: { pagina: '2', limite: '10', busqueda: ' ana ', rol: 'admin' } }, res);
    const llamadas = db.llamadas('perfiles_usuario');
    expect(llamadas.find((l) => l.metodo === 'range').args).toEqual([10, 19]);
    expect(llamadas.find((l) => l.metodo === 'or').args[0]).toContain('nombre.ilike."%ana%"');
    expect(llamadas.find((l) => l.metodo === 'eq').args).toEqual(['rol', 'admin']);
    expect(cuerpo(res).meta).toEqual({ total: 25, pagina: 2, limite: 10, totalPaginas: 3 });
  });

  it('getUsuarios sin filtros no agrega or/eq; error → 500', async () => {
    const a = preparar(RUTA);
    await a.ctrl.getUsuarios({ query: {} }, a.res);
    expect(a.db.llamadas('perfiles_usuario').map((l) => l.metodo)).toEqual(['select', 'order', 'range']);

    const b = preparar(RUTA);
    b.db.responder('perfiles_usuario', { error: { message: 'x' } });
    await b.ctrl.getUsuarios({ query: {} }, b.res);
    expect(b.res.status).toHaveBeenCalledWith(500);
  });

  it('getUsuario devuelve el perfil o 404', async () => {
    const a = preparar(RUTA);
    a.db.responder('perfiles_usuario', { data: { id: 'p1' } });
    await a.ctrl.getUsuario({ params: { id: 'p1' } }, a.res);
    expect(cuerpo(a.res).data).toEqual({ id: 'p1' });

    const b = preparar(RUTA);
    await b.ctrl.getUsuario({ params: { id: 'x' } }, b.res);
    expect(b.res.status).toHaveBeenCalledWith(404);
  });

  it('createUsuario 201 o el status del error', async () => {
    const a = preparar(RUTA);
    await a.ctrl.createUsuario({ body: VALIDO }, a.res);
    expect(a.res.status).toHaveBeenCalledWith(201);

    const b = preparar(RUTA);
    await b.ctrl.createUsuario({ body: { ...VALIDO, email: 'x' } }, b.res);
    expect(b.res.status).toHaveBeenCalledWith(400);
  });

  describe('createUsuariosMasivo', () => {
    it('400 sin filas o con más de 500', async () => {
      const a = preparar(RUTA);
      await a.ctrl.createUsuariosMasivo({ body: { usuarios: [] } }, a.res);
      expect(a.res.status).toHaveBeenCalledWith(400);

      const b = preparar(RUTA);
      await b.ctrl.createUsuariosMasivo({ body: { usuarios: Array(501).fill(VALIDO) } }, b.res);
      expect(cuerpo(b.res).message).toContain('501 filas');
    });

    it('reporta por fila, salta duplicados sin importar mayúsculas y espera entre filas', async () => {
      const { ctrl, res, sleep, db } = preparar(RUTA);
      const filas = [VALIDO, { ...VALIDO, email: ' ANA@colegio.co ' }, { ...VALIDO, email: 'malo' }];
      await ctrl.createUsuariosMasivo({ body: { usuarios: filas } }, res);
      const { resultados } = cuerpo(res);
      expect(resultados.map((r) => [r.success, r.error])).toEqual([
        [true, null],
        [false, 'Email duplicado dentro del archivo'],
        [false, 'El email no tiene un formato válido'],
      ]);
      expect(db.auth.admin.createUser).toHaveBeenCalledTimes(1);
      expect(sleep).toHaveBeenCalledTimes(2);
      expect(sleep).toHaveBeenCalledWith(150);
    });
  });

  describe('updateUsuario', () => {
    const req = (body) => ({ params: { id: 'p1' }, body });

    it('404 si no existe', async () => {
      const { ctrl, res } = preparar(RUTA);
      await ctrl.updateUsuario(req({}), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('calcula edad desde la fecha, permite desvincular institución y cambia el rol', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('perfiles_usuario', { data: { user_id: 'u-9' } });
      await ctrl.updateUsuario(req({ nombre: 'Ana', fecha_nacimiento: '2000-01-01', institucion_id: '', rol: 'moderador' }), res);
      const [campos, rol] = db.argumentos('perfiles_usuario', 'update');
      expect(campos).toMatchObject({ nombre: 'Ana', edad: 26, grado: null, institucion_id: null });
      expect(rol).toEqual({ rol: 'moderador' });
      expect(cuerpo(res).message).toBe('Usuario actualizado correctamente');
    });

    it('sin institucion_id no lo toca; edad numérica o null', async () => {
      const a = preparar(RUTA);
      a.db.responder('perfiles_usuario', { data: { user_id: 'u' } });
      await a.ctrl.updateUsuario(req({ edad: '17' }), a.res);
      const [campos] = a.db.argumentos('perfiles_usuario', 'update');
      expect(campos.edad).toBe(17);
      expect(campos).not.toHaveProperty('institucion_id');

      const b = preparar(RUTA);
      b.db.responder('perfiles_usuario', { data: { user_id: 'u' } });
      await b.ctrl.updateUsuario(req({}), b.res);
      expect(b.db.argumentos('perfiles_usuario', 'update')[0].edad).toBeNull();
    });

    it('500 si falla el update y 207 si solo falla el rol', async () => {
      const a = preparar(RUTA);
      a.db.responder('perfiles_usuario', { data: { user_id: 'u' } }).responder('perfiles_usuario', { error: { message: 'x' } });
      await a.ctrl.updateUsuario(req({}), a.res);
      expect(a.res.status).toHaveBeenCalledWith(500);

      const b = preparar(RUTA);
      b.db.responder('perfiles_usuario', { data: { user_id: 'u' } })
        .responder('perfiles_usuario', {})
        .responder('perfiles_usuario', { error: { message: 'rol' } });
      await b.ctrl.updateUsuario(req({ rol: 'admin' }), b.res);
      expect(b.res.status).toHaveBeenCalledWith(207);
    });
  });

  describe('deleteUsuario', () => {
    const req = { params: { id: 'p1' } };

    it('borra perfil y cuenta de Auth', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('perfiles_usuario', { data: { user_id: 'u-9' } });
      await ctrl.deleteUsuario(req, res);
      expect(db.auth.admin.deleteUser).toHaveBeenCalledWith('u-9');
      expect(cuerpo(res).message).toBe('Usuario eliminado correctamente');
    });

    it('404, 500 al borrar el perfil y 207 si falla Auth', async () => {
      const a = preparar(RUTA);
      await a.ctrl.deleteUsuario(req, a.res);
      expect(a.res.status).toHaveBeenCalledWith(404);

      const b = preparar(RUTA);
      b.db.responder('perfiles_usuario', { data: { user_id: 'u' } }).responder('perfiles_usuario', { error: { message: 'fk' } });
      await b.ctrl.deleteUsuario(req, b.res);
      expect(b.res.status).toHaveBeenCalledWith(500);
      expect(b.db.auth.admin.deleteUser).not.toHaveBeenCalled();

      const c = preparar(RUTA);
      c.db.responder('perfiles_usuario', { data: { user_id: 'u' } });
      c.db.auth.admin.deleteUser.mockResolvedValue({ error: { message: 'auth' } });
      await c.ctrl.deleteUsuario(req, c.res);
      expect(c.res.status).toHaveBeenCalledWith(207);
    });
  });

  describe('bloquearUsuario', () => {
    const req = (body, yo = 'admin-1') => ({ params: { id: 'p1' }, body, user: { id: yo } });

    it('bloquea por N horas desde ahora', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('perfiles_usuario', { data: { user_id: 'u-9' } });
      await ctrl.bloquearUsuario(req({ horas: '2' }), res);
      expect(db.argumentos('perfiles_usuario', 'update')).toEqual([{ bloqueado_hasta: '2026-11-16T14:00:00.000Z' }]);
      expect(cuerpo(res).message).toContain('bloqueado hasta');
    });

    it('hasta: null desbloquea', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('perfiles_usuario', { data: { user_id: 'u-9' } });
      await ctrl.bloquearUsuario(req({ hasta: null }), res);
      expect(db.argumentos('perfiles_usuario', 'update')).toEqual([{ bloqueado_hasta: null }]);
      expect(cuerpo(res).message).toBe('Usuario desbloqueado');
    });

    it('400 si se bloquea a sí mismo o sin horas válidas; 404 y 500', async () => {
      const yo = preparar(RUTA);
      yo.db.responder('perfiles_usuario', { data: { user_id: 'admin-1' } });
      await yo.ctrl.bloquearUsuario(req({ horas: 1 }), yo.res);
      expect(cuerpo(yo.res).message).toBe('No podés bloquearte a vos mismo');

      const horas = preparar(RUTA);
      horas.db.responder('perfiles_usuario', { data: { user_id: 'u' } });
      await horas.ctrl.bloquearUsuario(req({ horas: 0 }), horas.res);
      expect(horas.res.status).toHaveBeenCalledWith(400);

      const no = preparar(RUTA);
      await no.ctrl.bloquearUsuario(req({}), no.res);
      expect(no.res.status).toHaveBeenCalledWith(404);

      const err = preparar(RUTA);
      err.db.responder('perfiles_usuario', { data: { user_id: 'u' } }).responder('perfiles_usuario', { error: { message: 'x' } });
      await err.ctrl.bloquearUsuario(req({ horas: 1 }), err.res);
      expect(err.res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('actualizarPermisos', () => {
    const req = (permisos_override) => ({ params: { id: 'p1' }, body: { permisos_override } });

    it('guarda un override con recursos válidos', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('perfiles_usuario', { data: { id: 'p1' } });
      await ctrl.actualizarPermisos(req({ 'programas.editar': true }), res);
      expect(db.argumentos('perfiles_usuario', 'update')).toEqual([{ permisos_override: { 'programas.editar': true } }]);
      expect(cuerpo(res).success).toBe(true);
    });

    it('400 si no es objeto o tiene recursos inválidos; 404 y 500', async () => {
      const a = preparar(RUTA);
      await a.ctrl.actualizarPermisos(req([]), a.res);
      expect(a.res.status).toHaveBeenCalledWith(400);

      const b = preparar(RUTA);
      await b.ctrl.actualizarPermisos(req({ 'borrar.todo': true }), b.res);
      expect(cuerpo(b.res).message).toContain('borrar.todo');

      const c = preparar(RUTA);
      await c.ctrl.actualizarPermisos(req({}), c.res);
      expect(c.res.status).toHaveBeenCalledWith(404);

      const d = preparar(RUTA);
      d.db.responder('perfiles_usuario', { data: { id: 'p1' } }).responder('perfiles_usuario', { error: { message: 'x' } });
      await d.ctrl.actualizarPermisos(req({}), d.res);
      expect(d.res.status).toHaveBeenCalledWith(500);
    });
  });

  it('getStats cuenta filas por tabla (0 si no hay count)', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('perfiles_usuario', { count: 12 }).responder('programas', { count: null });
    await ctrl.getStats({}, res);
    expect(cuerpo(res).data).toEqual({ perfiles_usuario: 12, programas: 0, instituciones: 0, cuestionarios: 0, preguntas: 0 });
  });
});

describe('institucion/usuariosController', () => {
  const RUTA = 'controllers/institucion/usuariosController';

  it('getUsuarios solo lista estudiantes de su institución', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('perfiles_usuario', { data: [{ id: 1 }], count: 1 });
    await ctrl.getUsuarios({ institucionId: 'i-1', query: { busqueda: 'ana' } }, res);
    const eqs = db.llamadas('perfiles_usuario').filter((l) => l.metodo === 'eq').map((l) => l.args);
    expect(eqs).toEqual([['institucion_id', 'i-1'], ['rol', 'estudiante']]);
    expect(cuerpo(res).data).toEqual([{ id: 1 }]);
  });

  it('getUsuarios: cuenta desvinculada devuelve vacío sin consultar; error → 500', async () => {
    const a = preparar(RUTA);
    await a.ctrl.getUsuarios({ query: {} }, a.res);
    expect(cuerpo(a.res).data).toEqual([]);
    expect(a.db.from).not.toHaveBeenCalled();

    const b = preparar(RUTA);
    b.db.responder('perfiles_usuario', { error: { message: 'x' } });
    await b.ctrl.getUsuarios({ institucionId: 'i', query: {} }, b.res);
    expect(b.res.status).toHaveBeenCalledWith(500);
  });

  it('createUsuario fuerza rol estudiante y su propia institución aunque el body diga otra cosa', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    await ctrl.createUsuario({ institucionId: 'i-1', body: { ...VALIDO, rol: 'admin', institucion_id: 'otra' } }, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(db.argumentos('perfiles_usuario', 'insert')[0][0].institucion_id).toBe('i-1');
    expect(db.argumentos('perfiles_usuario', 'update')).toEqual([{ rol: 'estudiante' }]);
  });

  it('createUsuario 403 sin institución y 400 con datos inválidos', async () => {
    const a = preparar(RUTA);
    await a.ctrl.createUsuario({ body: VALIDO }, a.res);
    expect(a.res.status).toHaveBeenCalledWith(403);

    const b = preparar(RUTA);
    await b.ctrl.createUsuario({ institucionId: 'i', body: { ...VALIDO, password: '1' } }, b.res);
    expect(b.res.status).toHaveBeenCalledWith(400);
  });

  it('createUsuariosMasivo: 403, 400 y reporte por fila con duplicados', async () => {
    const a = preparar(RUTA);
    await a.ctrl.createUsuariosMasivo({ body: { usuarios: [VALIDO] } }, a.res);
    expect(a.res.status).toHaveBeenCalledWith(403);

    const b = preparar(RUTA);
    await b.ctrl.createUsuariosMasivo({ institucionId: 'i', body: {} }, b.res);
    expect(b.res.status).toHaveBeenCalledWith(400);

    const c = preparar(RUTA);
    await c.ctrl.createUsuariosMasivo({ institucionId: 'i', body: { usuarios: Array(501).fill(VALIDO) } }, c.res);
    expect(c.res.status).toHaveBeenCalledWith(400);

    const d = preparar(RUTA);
    await d.ctrl.createUsuariosMasivo({ institucionId: 'i', body: { usuarios: [VALIDO, VALIDO, { nombre: 'x' }] } }, d.res);
    expect(cuerpo(d.res).resultados.map((r) => r.success)).toEqual([true, false, false]);
    expect(d.sleep).toHaveBeenCalledTimes(2);
  });

  describe('deleteUsuario', () => {
    const req = { params: { id: 'p1' }, institucionId: 'i-1' };

    it('borra solo estudiantes de su institución', async () => {
      const { db, ctrl, res } = preparar(RUTA);
      db.responder('perfiles_usuario', { data: { user_id: 'u', institucion_id: 'i-1' } });
      await ctrl.deleteUsuario(req, res);
      expect(db.auth.admin.deleteUser).toHaveBeenCalledWith('u');
      expect(cuerpo(res).success).toBe(true);
    });

    it('403 si es de otra institución, 404, 500 y 207', async () => {
      const otra = preparar(RUTA);
      otra.db.responder('perfiles_usuario', { data: { user_id: 'u', institucion_id: 'i-2' } });
      await otra.ctrl.deleteUsuario(req, otra.res);
      expect(otra.res.status).toHaveBeenCalledWith(403);
      expect(otra.db.llamadas('perfiles_usuario').some((l) => l.metodo === 'delete')).toBe(false);

      const no = preparar(RUTA);
      await no.ctrl.deleteUsuario(req, no.res);
      expect(no.res.status).toHaveBeenCalledWith(404);

      const err = preparar(RUTA);
      err.db.responder('perfiles_usuario', { data: { user_id: 'u', institucion_id: 'i-1' } })
        .responder('perfiles_usuario', { error: { message: 'x' } });
      await err.ctrl.deleteUsuario(req, err.res);
      expect(err.res.status).toHaveBeenCalledWith(500);

      const auth = preparar(RUTA);
      auth.db.responder('perfiles_usuario', { data: { user_id: 'u', institucion_id: 'i-1' } });
      auth.db.auth.admin.deleteUser.mockResolvedValue({ error: { message: 'x' } });
      await auth.ctrl.deleteUsuario(req, auth.res);
      expect(auth.res.status).toHaveBeenCalledWith(207);
    });
  });
});
