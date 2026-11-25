import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const url = process.env.E2E_SUPABASE_URL;
const anon = process.env.E2E_SUPABASE_ANON_KEY;
const service = process.env.E2E_SUPABASE_SERVICE_KEY;
const api = process.env.E2E_API_URL || 'http://localhost:3001';
const enabled = process.env.E2E_LOCAL_DB === '1';
test.skip(!enabled, 'Ejecutar con E2E_LOCAL_DB=1 y Supabase local');
test.describe.configure({ mode: 'serial' });

let ids = [];
const password = 'Brota-S6-' + randomUUID();
const prefix = 'david-s6-';
const headers = token => ({ apikey: anon, Authorization: 'Bearer ' + token });
const adminHeaders = () => ({ apikey: service, Authorization: 'Bearer ' + service });
const authHeaders = token => ({ Authorization: 'Bearer ' + token });

test.beforeAll(() => {
  for (const value of [url, api]) {
    if (!value || !['localhost', '127.0.0.1'].includes(new URL(value).hostname)) {
      throw new Error('S6 requiere exclusivamente URLs locales');
    }
  }
  if (!anon || !service) throw new Error('Faltan claves de Supabase local');
});

test.beforeEach(async ({ request }) => {
  // Detecta contaminación de ejecuciones anteriores sin borrar datos ajenos.
  const response = await request.get(url + '/auth/v1/admin/users?per_page=1000', { headers: adminHeaders() });
  expect(response.ok()).toBeTruthy();
  const { users } = await response.json();
  expect(users.filter(u => u.email?.startsWith(prefix) && u.email.endsWith('@prueba.brota.test'))).toHaveLength(0);
});

test.afterEach(async ({ request }) => {
  if (process.env.E2E_MUTANTE_SIN_LIMPIEZA === '1') return;
  for (const id of ids) {
    const response = await request.delete(url + '/auth/v1/admin/users/' + id, { headers: adminHeaders() });
    expect(response.ok()).toBeTruthy();
  }
  ids = [];
});

async function crearUsuario(request) {
  const email = prefix + randomUUID() + '@prueba.brota.test';
  const created = await request.post(url + '/auth/v1/admin/users', {
    headers: adminHeaders(), data: { email, password, email_confirm: true },
  });
  expect(created.ok()).toBeTruthy();
  const user = await created.json();
  ids.push(user.id);
  const login = await request.post(url + '/auth/v1/token?grant_type=password', {
    headers: headers(anon), data: { email, password },
  });
  expect(login.ok()).toBeTruthy();
  const { access_token: token } = await login.json();
  expect(token).toBeTruthy();
  const profile = await request.post(api + '/api/auth/register-perfil', {
    headers: authHeaders(token), data: { nombre: 'David', apellido: 'Prueba' },
  });
  expect(profile.status()).toBe(201);
  return { id: user.id, email, token };
}

test('registro por API y login real desde el navegador', async ({ request, page }) => {
  const user = await crearUsuario(request);
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Escribe tu correo…' }).fill(user.email);
  await page.getByRole('textbox', { name: 'Contraseña…' }).fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('link', { name: 'Test vocacional' })).toBeVisible();
});

test('actualiza perfil propio y verifica persistencia por API', async ({ request }) => {
  const user = await crearUsuario(request);
  const endpoint = api + '/api/perfil/' + user.id;
  const updated = await request.patch(endpoint, {
    headers: authHeaders(user.token), data: { nombre: 'Actualizado', ciudad: 'Bogotá', edad: 20 },
  });
  expect(updated.status()).toBe(200);
  const read = await request.get(endpoint, { headers: authHeaders(user.token) });
  expect(read.status()).toBe(200);
  expect((await read.json()).data).toMatchObject({ user_id: user.id, nombre: 'Actualizado', ciudad: 'Bogotá', edad: 20 });
});

test('protege el perfil frente a otro usuario y peticiones sin sesión', async ({ request }) => {
  const owner = await crearUsuario(request);
  const other = await crearUsuario(request);
  const endpoint = api + '/api/perfil/' + owner.id;
  const forbidden = await request.get(endpoint, { headers: authHeaders(other.token) });
  expect(forbidden.status()).toBe(403);
  const anonymous = await request.get(endpoint);
  expect(anonymous.status()).toBe(401);
  const allowed = await request.get(endpoint, { headers: authHeaders(owner.token) });
  expect(allowed.status()).toBe(200);
  expect((await allowed.json()).data.user_id).toBe(owner.id);
});
