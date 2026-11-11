// Semana 4 · Capa E2E (transversal): contrato de errores de la API.
// Toda respuesta de error debe ser JSON { success: false, message } y no
// filtrar detalles internos (stack traces, rutas de archivos del servidor).
// Supabase está simulado: ningún test lee ni modifica datos reales.
const request = require('supertest');

jest.mock('../../src/config/supabase', () => ({
  auth: { getUser: jest.fn(async () => ({ data: { user: null }, error: { message: 'invalid JWT' } })) },
  from: jest.fn(),
}));

const app = require('../../src/server');

// Señales de que la respuesta filtra detalles internos del servidor.
const FILTRACION = /SyntaxError|at JSON\.parse|node_modules|<pre>|<!DOCTYPE/i;

describe('API · contrato de errores', () => {
  it('POST con JSON mal formado responde 400 en JSON, sin stack trace', async () => {
    const res = await request(app)
      .post('/api/auth/register-perfil')
      .set('Content-Type', 'application/json')
      .send('{"email":');

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({ success: false, message: 'JSON mal formado' });
    expect(res.text).not.toMatch(FILTRACION);
  });

  it('JSON mal formado en una ruta pública también responde 400 en JSON', async () => {
    const res = await request(app)
      .post('/api/contacto')
      .set('Content-Type', 'application/json')
      .send('{nombre: sin comillas}');

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.text).not.toMatch(FILTRACION);
  });

  it('una ruta inexistente responde 404 en JSON', async () => {
    const res = await request(app).get('/api/no-existe');

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({ success: false, message: 'Ruta no encontrada' });
  });
});
