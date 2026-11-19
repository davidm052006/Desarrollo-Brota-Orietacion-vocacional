// Semana 6 · Julian · Red de integración del hallazgo en PATCH /api/perfil/:userId
// Express real + verificarAuth real + BD real (Supabase local). El caso
// feliz se verifica EN LA BD, no solo en la respuesta.
//
// La regla que corrige el hallazgo tiene su test unitario en
// tests/validarCampos.test.js; este archivo queda como red.
//
// Limpieza: antes de cada test se borran los usuarios @prueba.brota.test;
// su perfil se va por ON DELETE CASCADE.
const request = require('supertest');
const {
  describeBD, consultar, limpiar, crearUsuarioConSesion, cerrar,
} = require('../helpers/bdPruebas');

describeBD('PATCH /api/perfil/:userId contra la BD real', () => {
  let app;
  let usuario;

  beforeAll(() => {
    app = require('../../src/server');
  });

  beforeEach(async () => {
    await limpiar();
    usuario = await crearUsuarioConSesion('perfil');
    await consultar(
      `INSERT INTO perfiles_usuario (user_id, nombre, apellido, edad, ciudad)
       VALUES ($1, 'Ana', 'Pérez', 16, 'Montería')`,
      [usuario.id],
    );
  });

  afterAll(cerrar);

  const patch = (cuerpo) => request(app)
    .patch(`/api/perfil/${usuario.id}`)
    .set('Authorization', `Bearer ${usuario.token}`)
    .send(cuerpo);

  const filaEnBD = async () => {
    const [fila] = await consultar(
      'SELECT nombre, apellido, edad, ciudad, telefono FROM perfiles_usuario WHERE user_id = $1',
      [usuario.id],
    );
    return fila;
  };

  it('PER-01 caso feliz: guarda los cambios en la BD', async () => {
    const res = await patch({ nombre: 'Ana María', apellido: 'Pérez', edad: 17, ciudad: 'Lorica' });

    expect(res.status).toBe(200);
    expect(await filaEnBD()).toMatchObject({ nombre: 'Ana María', edad: 17, ciudad: 'Lorica' });
  });

  it('PER-02 un PATCH sin edad no borra la edad guardada (PerfilInstitucion no la envía)', async () => {
    const res = await patch({ telefono: '3001234567' });

    expect(res.status).toBe(200);
    expect(await filaEnBD()).toMatchObject({ telefono: '3001234567', edad: 16, nombre: 'Ana' });
  });

  it.each([
    ['edad menor a 14 (CHECK)', { edad: 13 }],
    ['edad mayor a 100 (CHECK)', { edad: 101 }],
    ['nombre de 101 caracteres (VARCHAR 100)', { nombre: 'x'.repeat(101) }],
    ['ciudad de 101 caracteres (VARCHAR 100)', { ciudad: 'x'.repeat(101) }],
    ['nombre null (NOT NULL)', { nombre: null }],
    ['apellido vacío', { apellido: '   ' }],
  ])('PER-03 %s responde 400 con el contrato y no toca la BD', async (_caso, cuerpo) => {
    const antes = await filaEnBD();

    const res = await patch(cuerpo);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: expect.any(String) });
    expect(await filaEnBD()).toEqual(antes);
  });
});
