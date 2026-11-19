// Semana 4 · Capa E2E (transversal): seguridad de la API.
// Prueba rutas protegidas desde HTTP con supertest: sin token (401),
// rol o permiso insuficiente (403) y acceso autorizado (200).
// Supabase está simulado: ningún test lee ni modifica datos reales.
const request = require('supertest');

// Estado que cada test configura antes de llamar a la API.
const fake = {
  user: null,     // lo que devuelve supabase.auth.getUser(token)
  perfil: null,   // lo que devuelve perfiles_usuario ... .single()
  lista: [],      // lo que devuelve una consulta de lista (await query)
};

jest.mock('../../src/config/supabase', () => {
  const builder = () => {
    const q = {};
    ['select', 'eq', 'neq', 'in', 'or', 'not', 'order', 'range', 'limit', 'ilike', 'is']
      .forEach((m) => { q[m] = jest.fn(() => q); });
    q.single = jest.fn(async () => ({ data: fake.perfil, error: fake.perfil ? null : { message: 'no rows' } }));
    q.maybeSingle = q.single;
    // Las consultas de lista se resuelven con `await query`.
    q.then = (resolve, reject) =>
      Promise.resolve({ data: fake.lista, count: fake.lista.length, error: null }).then(resolve, reject);
    return q;
  };
  return {
    auth: {
      getUser: jest.fn(async () => (fake.user
        ? { data: { user: fake.user }, error: null }
        : { data: { user: null }, error: { message: 'invalid JWT' } })),
    },
    from: jest.fn(() => builder()),
  };
});

const app = require('../../src/server');

const TOKEN = 'Bearer token-de-prueba';

beforeEach(() => {
  fake.user = { id: 'user-1', email: 'prueba@brota.test' };
  fake.perfil = null;
  fake.lista = [];
});

describe('API · seguridad de rutas protegidas', () => {
  it('GET /api/admin/usuarios sin token responde 401 en JSON', async () => {
    const res = await request(app).get('/api/admin/usuarios');

    expect(res.status).toBe(401);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({ success: false, message: 'Token de autenticación requerido' });
  });

  it('GET /api/admin/usuarios con token inválido responde 401', async () => {
    fake.user = null;

    const res = await request(app).get('/api/admin/usuarios').set('Authorization', TOKEN);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token inválido o expirado');
  });

  it('GET /api/admin/usuarios con rol estudiante responde 403', async () => {
    fake.perfil = { rol: 'estudiante' };

    const res = await request(app).get('/api/admin/usuarios').set('Authorization', TOKEN);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ success: false, message: 'Acceso denegado: se requiere rol admin' });
  });

  it('GET /api/admin/usuarios con rol admin responde 200 con la lista paginada', async () => {
    fake.perfil = { rol: 'admin' };
    fake.lista = [{ id: 'p1', nombre: 'Ana', rol: 'estudiante' }];

    const res = await request(app).get('/api/admin/usuarios').set('Authorization', TOKEN);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(fake.lista);
    expect(res.body.meta).toEqual(expect.objectContaining({ total: 1 }));
  });

  it('POST /api/comunidad/preguntas con comunidad.publicar quitado por override responde 403', async () => {
    fake.perfil = { rol: 'estudiante', permisos_override: { 'comunidad.publicar': false }, bloqueado_hasta: null };

    const res = await request(app)
      .post('/api/comunidad/preguntas')
      .set('Authorization', TOKEN)
      .send({ titulo: 'Pregunta de prueba', contenido: 'No debería publicarse' });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ success: false, message: 'No tenés permiso para "comunidad.publicar"' });
  });

  it('POST /api/comunidad/preguntas con la cuenta bloqueada responde 403 BLOQUEADO', async () => {
    const hasta = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    fake.perfil = { rol: 'estudiante', permisos_override: null, bloqueado_hasta: hasta };

    const res = await request(app)
      .post('/api/comunidad/preguntas')
      .set('Authorization', TOKEN)
      .send({ titulo: 'Pregunta de prueba', contenido: 'Cuenta bloqueada' });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ success: false, error: 'BLOQUEADO', hasta });
  });
});
