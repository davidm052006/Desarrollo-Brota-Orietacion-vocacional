// Semana 6 · Parte 4 (umbral 70%) · Julian
// Controladores CRUD del panel admin (programas, instituciones, solicitudes
// de contacto) y el formulario público de contacto. Supabase es un fake
// (tests/helpers/supabaseFake.js): se verifica qué se envía a la BD y qué
// responde la API en cada rama (validación, filtro, error de la BD).
const { crearSupabaseFake, respuestaFalsa, cargarConFake } = require('../helpers/supabaseFake');

function preparar(ruta) {
  const db = crearSupabaseFake();
  const ctrl = cargarConFake(ruta, db);
  return { db, ctrl, res: respuestaFalsa() };
}
const cuerpo = (res) => res.json.mock.calls[0][0];
const metodos = (db, tabla) => db.llamadas(tabla).map((l) => l.metodo);
const ERROR_BD = { error: { message: 'relation does not exist', code: '42P01' } };

beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterEach(() => jest.restoreAllMocks());

// ── Programas (admin) ─────────────────────────────────────────

describe('admin/programasController', () => {
  const RUTA = 'controllers/admin/programasController';

  it('lista con la institución aplanada y paginación por defecto', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('programas', {
      data: [
        { id: 'p1', nombre: 'Medicina', instituciones: { nombre: 'U. de Córdoba' } },
        { id: 'p2', nombre: 'Sin institución', instituciones: null },
      ],
      count: 12,
    });

    await ctrl.getProgramas({ query: {} }, res);

    expect(cuerpo(res)).toEqual({
      success: true,
      data: [
        expect.objectContaining({ id: 'p1', institucion_nombre: 'U. de Córdoba' }),
        expect.objectContaining({ id: 'p2', institucion_nombre: '—' }),
      ],
      meta: { total: 12, pagina: 1, limite: 10, totalPaginas: 2 },
    });
    expect(metodos(db, 'programas')).not.toContain('ilike');
    expect(db.argumentos('programas', 'range')).toEqual([0]);
  });

  it('busca por nombre, recorta espacios y respeta la página pedida', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('programas', { data: null, count: null });

    await ctrl.getProgramas({ query: { busqueda: '  ingeniería ', pagina: '3', limite: '5' } }, res);

    expect(db.argumentos('programas', 'ilike')).toEqual(['nombre']);
    expect(db.llamadas('programas').find((l) => l.metodo === 'ilike').args[1]).toBe('%ingeniería%');
    expect(db.llamadas('programas').find((l) => l.metodo === 'range').args).toEqual([10, 14]);
    expect(cuerpo(res)).toEqual({ success: true, data: [], meta: { total: 0, pagina: 3, limite: 5, totalPaginas: 0 } });
  });

  it('crear sin nombre responde 400 y no escribe', async () => {
    const { db, ctrl, res } = preparar(RUTA);

    await ctrl.createPrograma({ body: { tipo: 'Pregrado' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(cuerpo(res)).toEqual({ success: false, message: 'El nombre es obligatorio' });
    expect(db.llamadas('programas')).toHaveLength(0);
  });

  it('crear normaliza costo e institución vacíos a null y queda activo por defecto', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('programas', { data: { id: 'nuevo' } });

    await ctrl.createPrograma({ body: { nombre: 'Enfermería', costo_matricula: '', institucion_id: '' } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(cuerpo(res)).toEqual({ success: true, data: { id: 'nuevo' } });
    expect(db.argumentos('programas', 'insert')[0][0]).toMatchObject({
      nombre: 'Enfermería', costo_matricula: null, institucion_id: null, activo: true,
    });
  });

  it('actualizar envía los cambios al id pedido', async () => {
    const { db, ctrl, res } = preparar(RUTA);

    await ctrl.updatePrograma({ params: { id: 'p1' }, body: { nombre: 'Medicina', costo_matricula: 5000000, institucion_id: 'i1', activo: false } }, res);

    expect(cuerpo(res)).toEqual({ success: true, message: 'Programa actualizado' });
    expect(db.argumentos('programas', 'update')[0]).toMatchObject({ costo_matricula: 5000000, institucion_id: 'i1', activo: false });
    expect(db.llamadas('programas').find((l) => l.metodo === 'eq').args).toEqual(['id', 'p1']);
  });

  it('eliminar borra el id pedido', async () => {
    const { db, ctrl, res } = preparar(RUTA);

    await ctrl.deletePrograma({ params: { id: 'p9' } }, res);

    expect(cuerpo(res)).toEqual({ success: true, message: 'Programa eliminado' });
    expect(metodos(db, 'programas')).toEqual(['delete', 'eq']);
  });

  it.each([
    ['getProgramas', { query: {} }],
    ['createPrograma', { body: { nombre: 'X' } }],
    ['updatePrograma', { params: { id: 'p1' }, body: {} }],
    ['deletePrograma', { params: { id: 'p1' } }],
  ])('%s con error de la BD responde 500 genérico', async (metodo, req) => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('programas', ERROR_BD);

    await ctrl[metodo](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(JSON.stringify(cuerpo(res))).not.toContain('42P01');
  });
});

// ── Instituciones (admin) ─────────────────────────────────────

describe('admin/institucionesController', () => {
  const RUTA = 'controllers/admin/institucionesController';

  it('lista sin búsqueda no filtra', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('instituciones', { data: [{ id: 'i1' }], count: 1 });

    await ctrl.getInstituciones({ query: {} }, res);

    expect(cuerpo(res)).toEqual({ success: true, data: [{ id: 'i1' }], meta: { total: 1, pagina: 1, limite: 10, totalPaginas: 1 } });
    expect(metodos(db, 'instituciones')).not.toContain('or');
  });

  it('la búsqueda filtra por nombre o ciudad con el valor escapado', async () => {
    const { db, ctrl, res } = preparar(RUTA);

    // Una coma en la búsqueda no debe poder agregar condiciones al .or()
    await ctrl.getInstituciones({ query: { busqueda: 'Montería,activa.eq.false' } }, res);

    expect(db.argumentos('instituciones', 'or')).toEqual([
      'nombre.ilike."%Montería,activa.eq.false%",ciudad.ilike."%Montería,activa.eq.false%"',
    ]);
  });

  it('crear sin nombre responde 400', async () => {
    const { db, ctrl, res } = preparar(RUTA);

    await ctrl.createInstitucion({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(db.llamadas('instituciones')).toHaveLength(0);
  });

  it('crear guarda costo vacío como null y activa por defecto', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('instituciones', { data: { id: 'i2' } });

    await ctrl.createInstitucion({ body: { nombre: 'SENA', costo_promedio: 0 } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(db.argumentos('instituciones', 'insert')[0][0]).toMatchObject({ nombre: 'SENA', costo_promedio: null, activa: true });
  });

  it('actualizar y eliminar responden éxito', async () => {
    const a = preparar(RUTA);
    await a.ctrl.updateInstitucion({ params: { id: 'i1' }, body: { nombre: 'Unicor', costo_promedio: 100 } }, a.res);
    expect(cuerpo(a.res)).toEqual({ success: true, message: 'Institución actualizada' });
    expect(a.db.argumentos('instituciones', 'update')[0]).toMatchObject({ costo_promedio: 100 });

    const b = preparar(RUTA);
    await b.ctrl.deleteInstitucion({ params: { id: 'i1' } }, b.res);
    expect(cuerpo(b.res)).toEqual({ success: true, message: 'Institución eliminada' });
  });

  it.each([
    ['getInstituciones', { query: {} }],
    ['createInstitucion', { body: { nombre: 'X' } }],
    ['updateInstitucion', { params: { id: 'i1' }, body: {} }],
    ['deleteInstitucion', { params: { id: 'i1' } }],
  ])('%s con error de la BD responde 500', async (metodo, req) => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('instituciones', ERROR_BD);

    await ctrl[metodo](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── Solicitudes de contacto (admin) ───────────────────────────

describe('admin/contactosController', () => {
  const RUTA = 'controllers/admin/contactosController';

  it('lista las más recientes primero, 20 por página por defecto', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('contactos', { data: [{ id: 'c1' }], count: 41 });

    await ctrl.getContactos({ query: {} }, res);

    expect(cuerpo(res).meta).toEqual({ total: 41, pagina: 1, limite: 20, totalPaginas: 3 });
    expect(db.llamadas('contactos').find((l) => l.metodo === 'order').args).toEqual(['created_at', { ascending: false }]);
    expect(metodos(db, 'contactos')).not.toContain('eq');
  });

  it('filtra por estado', async () => {
    const { db, ctrl, res } = preparar(RUTA);

    await ctrl.getContactos({ query: { estado: ' pendiente ' } }, res);

    expect(db.llamadas('contactos').find((l) => l.metodo === 'eq').args).toEqual(['estado', 'pendiente']);
  });

  it('actualizar sin estado ni notas responde 400 y no escribe', async () => {
    const { db, ctrl, res } = preparar(RUTA);

    await ctrl.updateContacto({ params: { id: 'c1' }, body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(cuerpo(res)).toEqual({ success: false, message: 'Nada que actualizar.' });
    expect(db.llamadas('contactos')).toHaveLength(0);
  });

  it('actualizar solo envía los campos que llegan (notas vacías sí cuentan)', async () => {
    const soloEstado = preparar(RUTA);
    await soloEstado.ctrl.updateContacto({ params: { id: 'c1' }, body: { estado: 'resuelto' } }, soloEstado.res);
    expect(soloEstado.db.argumentos('contactos', 'update')).toEqual([{ estado: 'resuelto' }]);

    const soloNotas = preparar(RUTA);
    await soloNotas.ctrl.updateContacto({ params: { id: 'c1' }, body: { notas_admin: '' } }, soloNotas.res);
    expect(soloNotas.db.argumentos('contactos', 'update')).toEqual([{ notas_admin: '' }]);
    expect(cuerpo(soloNotas.res)).toEqual({ success: true });
  });

  it.each([
    ['getContactos', { query: {} }],
    ['updateContacto', { params: { id: 'c1' }, body: { estado: 'x' } }],
  ])('%s con error de la BD responde 500', async (metodo, req) => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('contactos', ERROR_BD);

    await ctrl[metodo](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── Formulario público de contacto ────────────────────────────

describe('contactoController.crearContacto', () => {
  const RUTA = 'controllers/contactoController';
  const VALIDO = {
    nombre: '  Ana Ruiz ',
    // Sin espacios alrededor: el regex se aplica antes del trim(), así que
    // ' ana@x.co ' se rechaza. Desde la UI no pasa, porque <input type="email">
    // ya quita esos espacios al enviar.
    email: 'Ana@Colegio.CO',
    telefono: ' 3001234567 ',
    asunto: 'Soporte técnico',
    mensaje: '  No puedo ver mis resultados  ',
  };

  it('guarda la solicitud con los textos limpios y el correo en minúsculas', async () => {
    const { db, ctrl, res } = preparar(RUTA);

    await ctrl.crearContacto({ body: VALIDO }, res);

    expect(cuerpo(res)).toEqual({ success: true, message: 'Solicitud enviada correctamente.' });
    expect(db.argumentos('contactos', 'insert')).toEqual([{
      nombre: 'Ana Ruiz',
      email: 'ana@colegio.co',
      telefono: '3001234567',
      asunto: 'Soporte técnico',
      mensaje: 'No puedo ver mis resultados',
    }]);
  });

  it('sin teléfono lo guarda como null y recorta el mensaje a 2000 caracteres', async () => {
    const { db, ctrl, res } = preparar(RUTA);

    await ctrl.crearContacto({ body: { ...VALIDO, telefono: undefined, mensaje: 'm'.repeat(2500) } }, res);

    const fila = db.argumentos('contactos', 'insert')[0];
    expect(fila.telefono).toBeNull();
    expect(fila.mensaje).toHaveLength(2000);
  });

  it.each([
    ['sin nombre', { nombre: '   ' }, 'Campos requeridos incompletos.'],
    ['sin mensaje', { mensaje: undefined }, 'Campos requeridos incompletos.'],
    ['correo sin dominio', { email: 'ana@colegio' }, 'Correo electrónico inválido.'],
    ['asunto fuera de la lista', { asunto: 'Publicidad' }, 'Asunto inválido.'],
  ])('%s responde 400 y no guarda', async (_caso, cambio, mensaje) => {
    const { db, ctrl, res } = preparar(RUTA);

    await ctrl.crearContacto({ body: { ...VALIDO, ...cambio } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(cuerpo(res)).toEqual({ success: false, message: mensaje });
    expect(db.llamadas('contactos')).toHaveLength(0);
  });

  it('si la BD falla responde 500 sin el detalle', async () => {
    const { db, ctrl, res } = preparar(RUTA);
    db.responder('contactos', ERROR_BD);

    await ctrl.crearContacto({ body: VALIDO }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(cuerpo(res)).toEqual({ success: false, message: 'Error al procesar la solicitud.' });
  });
});
