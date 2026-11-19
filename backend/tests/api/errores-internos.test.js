// Semana 4 · Capa E2E (transversal): los errores 500 no filtran detalles
// internos (DEF-04). Simula que Supabase/Postgres falla y verifica que el
// cliente reciba un mensaje genérico, sin SQL, tablas ni direcciones internas.
// Supabase está simulado: ningún test lee ni modifica datos reales.
const request = require('supertest');

// Mensaje "interno" que nunca debería llegar al cliente.
const DETALLE_INTERNO = 'relation "public.programas" does not exist (42P01) at 10.0.0.5:5432';

const fake = { falla: 'ninguna' }; // 'respuesta' | 'excepcion'

jest.mock('../../src/config/supabase', () => {
  const builder = (tabla) => {
    if (fake.falla === 'excepcion' && tabla !== 'perfiles_usuario') {
      throw new Error(DETALLE_INTERNO);
    }
    const q = {};
    ['select', 'eq', 'not', 'ilike', 'order', 'range'].forEach((m) => { q[m] = jest.fn(() => q); });
    q.single = jest.fn(async () => ({ data: { rol: 'estudiante' }, error: null }));
    q.then = (resolve, reject) => Promise.resolve(
      fake.falla === 'respuesta'
        ? { data: null, count: null, error: { message: DETALLE_INTERNO, code: '42P01' } }
        : { data: [], count: 0, error: null },
    ).then(resolve, reject);
    return q;
  };
  return {
    auth: { getUser: jest.fn(async () => ({ data: { user: { id: 'user-1' } }, error: null })) },
    from: jest.fn((tabla) => builder(tabla)),
  };
});

const app = require('../../src/server');

const GENERICO = { success: false, message: 'Error interno del servidor' };

// Silencia el console.error esperado: el detalle sí debe ir al log del servidor.
let consoleError;
beforeEach(() => { consoleError = jest.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { consoleError.mockRestore(); fake.falla = 'ninguna'; });

describe('API · errores 500 sin detalles internos', () => {
  it('si Supabase devuelve error, GET /api/programas responde 500 genérico', async () => {
    fake.falla = 'respuesta';

    const res = await request(app).get('/api/programas');

    expect(res.status).toBe(500);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual(GENERICO);
    expect(res.text).not.toContain('42P01');
    expect(res.text).not.toContain('10.0.0.5');
  });

  it('si el controlador lanza una excepción, asyncHandler responde 500 genérico', async () => {
    fake.falla = 'excepcion';

    const res = await request(app).get('/api/rutas').set('Authorization', 'Bearer token-de-prueba');

    expect(res.status).toBe(500);
    expect(res.body).toEqual(GENERICO);
    expect(res.text).not.toContain('relation');
  });

  it('el detalle del error queda en el log del servidor', async () => {
    fake.falla = 'respuesta';

    await request(app).get('/api/programas');

    expect(consoleError).toHaveBeenCalledWith(
      'programasController:',
      expect.objectContaining({ message: DETALLE_INTERNO }),
    );
  });
});
