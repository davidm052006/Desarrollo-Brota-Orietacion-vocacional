// Semana 6 · Brayan · Capa API: POST /api/contacto contra la BD real
// Express real (server.js, con su rate limit) + BD real (Supabase local).
// Cada caso se verifica EN LA BD, no solo en la respuesta HTTP.
//
// Ojo con el rate limit del formulario: 5 solicitudes cada 15 min por
// proceso. Este archivo hace 4; si se agregan casos, no pasar de 5.
//
// La regla que corrige el hallazgo (DEF-07) tiene su test unitario en
// tests/validarContacto.test.js; CON-04 queda como red de integración.
//
// Limpieza: antes de cada test se vacía `contactos` (no tiene FK).
const request = require('supertest');
const { describeBD, consultar, limpiar, cerrar } = require('../helpers/bdPruebas');

const VALIDO = {
  nombre: 'Ana Pérez',
  email: 'Ana.Perez@Colegio.EDU.co',
  telefono: '300 123 4567',
  asunto: 'Información general',
  mensaje: '¿Brota sirve para estudiantes de grado 10?',
};

describeBD('POST /api/contacto contra la BD real', () => {
  let app;

  beforeAll(() => {
    app = require('../../src/server');
  });

  beforeEach(() => limpiar(['contactos']));

  afterAll(cerrar);

  const enviar = (cuerpo) => request(app).post('/api/contacto').send(cuerpo);

  const filas = () => consultar(
    'SELECT nombre, email, telefono, asunto, mensaje, estado FROM contactos',
  );

  it('CON-01 caso feliz: guarda una fila normalizada con estado pendiente', async () => {
    const res = await enviar({ ...VALIDO, nombre: '  Ana Pérez  ' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Solicitud enviada correctamente.' });
    expect(await filas()).toEqual([{
      nombre: 'Ana Pérez',
      email: 'ana.perez@colegio.edu.co',
      telefono: '300 123 4567',
      asunto: 'Información general',
      mensaje: VALIDO.mensaje,
      estado: 'pendiente',
    }]);
  });

  it('CON-02 valor límite: un mensaje de 2001 caracteres se guarda recortado a 2000', async () => {
    const res = await enviar({ ...VALIDO, mensaje: 'x'.repeat(2001), telefono: '' });

    expect(res.status).toBe(200);
    const [fila] = await filas();
    expect(fila.mensaje).toHaveLength(2000);
    expect(fila.telefono).toBeNull();
  });

  it('CON-03 asunto fuera de la lista responde 400 y no guarda nada', async () => {
    const res = await enviar({ ...VALIDO, asunto: 'Publicidad' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'Asunto inválido.' });
    expect(await filas()).toHaveLength(0);
  });

  it('CON-04 (DEF-07) teléfono como número responde 400, no 500, y no guarda nada', async () => {
    const res = await enviar({ ...VALIDO, telefono: 3001234567 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: expect.any(String) });
    expect(await filas()).toHaveLength(0);
  });
});
