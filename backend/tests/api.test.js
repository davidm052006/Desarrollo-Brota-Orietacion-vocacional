const request = require('supertest');
const app = require('../src/server');

// Pruebas mínimas de arranque para el sistema (agosto 2026) — cubren un
// CRUD público (lectura de programas) y el guard de autenticación de las
// rutas admin, los dos casos más rápidos de verificar sin necesitar un
// token real de Supabase Auth. Corren contra el Supabase real de
// desarrollo (sin mocks) — complementan a tests/admin y
// tests/middlewares, que sí mockean supabase para probar lógica aislada.

describe('API — smoke tests', () => {
  it('GET /api/programas responde 200 con la forma esperada', async () => {
    const res = await request(app).get('/api/programas');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/admin/analytics sin token responde 401', async () => {
    const res = await request(app).get('/api/admin/analytics');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/health responde ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
