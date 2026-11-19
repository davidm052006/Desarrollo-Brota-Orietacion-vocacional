const request = require('supertest');

// Stub de Supabase: el smoke test comprueba el contrato HTTP, no una BD remota.
// Evita timeouts de red y no lee ni modifica datos de desarrollo.
jest.mock('../src/config/supabase', () => ({
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }),
  })),
}));
const app = require('../src/server');

describe('API — smoke tests sin servicios externos', () => {
  it('GET /api/programas responde 200 con la forma esperada', async () => {
    const res = await request(app).get('/api/programas');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
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
