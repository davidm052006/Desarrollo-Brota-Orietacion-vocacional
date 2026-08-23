const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/server');

// Pruebas mínimas de arranque para el sistema (agosto 2026) — no hay
// cobertura previa en todo el repo. Cubren un CRUD público (lectura de
// programas) y el guard de autenticación de las rutas admin, que son los
// dos casos más rápidos de verificar sin necesitar un token real de
// Supabase Auth. Correr con `npm test` desde backend/.

test('GET /api/programas responde 200 con la forma esperada', async () => {
  const res = await request(app).get('/api/programas');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data), 'data debería ser un array de programas');
});

test('GET /api/admin/analytics sin token responde 401', async () => {
  const res = await request(app).get('/api/admin/analytics');
  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('GET /api/health responde ok', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
});
