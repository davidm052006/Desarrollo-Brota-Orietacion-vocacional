import { test, expect } from '@playwright/test';

// Semana 5 · Brayan · Capa E2E: dobles de red con page.route en /contacto.
// El formulario de contacto es público (sin sesión) y llama a POST /api/contacto.
// Ninguna prueba llega al backend: cada una responde la petición con un doble
// (stub) o la corta, y comprueba lo que ve la persona en la pantalla.
// No necesita credenciales ni Supabase: corre igual en local y en CI.
//
// Los <label> del formulario no están asociados a sus campos (falta htmlFor),
// así que los campos se buscan por su placeholder.

const API_CONTACTO = '**/api/contacto';
const MENSAJE = 'Quiero saber si Brota sirve para estudiantes de grado 10.';

test.beforeEach(async ({ page }) => {
  await page.goto('/contacto');
});

async function llenarFormulario(page, { mensaje = MENSAJE } = {}) {
  await page.getByPlaceholder('Tu nombre').fill('Ana Pérez');
  await page.getByPlaceholder('tu@correo.com').fill('ana@colegio.edu.co');
  await page.getByPlaceholder('300 000 0000').fill('3001234567');
  await page.getByRole('combobox').selectOption('Información general');
  await page.getByPlaceholder('Cuéntanos en qué podemos ayudarte...').fill(mensaje);
}

const enviar = (page) => page.getByRole('button', { name: 'Enviar mensaje' }).click();

test('CONTACTO-01: con la API caída muestra error de conexión y conserva lo escrito', async ({ page }) => {
  // Arrange: la petición falla a nivel de red (stub de error)
  await page.route(API_CONTACTO, (route) => route.abort('failed'));
  await llenarFormulario(page);

  // Act
  await enviar(page);

  // Assert
  await expect(page.getByText('Error de conexión. Intenta de nuevo.')).toBeVisible();
  await expect(page.getByRole('heading', { name: '¡Mensaje recibido!' })).toHaveCount(0);
  await expect(page.getByPlaceholder('Tu nombre')).toHaveValue('Ana Pérez');
  await expect(page.getByRole('button', { name: 'Enviar mensaje' })).toBeEnabled();
});

test('CONTACTO-02: un 400 del servidor muestra su message, no un texto genérico', async ({ page }) => {
  // Arrange: el backend rechaza el asunto (stub con el contrato real de error)
  await page.route(API_CONTACTO, (route) => route.fulfill({
    status: 400,
    contentType: 'application/json',
    body: JSON.stringify({ success: false, message: 'Asunto inválido.' }),
  }));
  await llenarFormulario(page);

  // Act
  await enviar(page);

  // Assert
  await expect(page.getByText('Asunto inválido.')).toBeVisible();
  await expect(page.getByRole('heading', { name: '¡Mensaje recibido!' })).toHaveCount(0);
});

test('CONTACTO-03: el rate limit (429) muestra el aviso de demasiadas solicitudes', async ({ page }) => {
  // Arrange: misma respuesta que devuelve contactoLimiter en server.js
  await page.route(API_CONTACTO, (route) => route.fulfill({
    status: 429,
    contentType: 'application/json',
    body: JSON.stringify({ success: false, message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }),
  }));
  await llenarFormulario(page);

  // Act
  await enviar(page);

  // Assert
  await expect(page.getByText('Demasiadas solicitudes. Intenta de nuevo más tarde.')).toBeVisible();
});

test('CONTACTO-04: envío correcto manda los datos del formulario y muestra la confirmación', async ({ page }) => {
  // Arrange: spy + stub — guarda lo que se envió y responde 200
  const enviados = [];
  await page.route(API_CONTACTO, async (route) => {
    enviados.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Solicitud enviada correctamente.' }),
    });
  });
  await llenarFormulario(page);

  // Act
  await enviar(page);

  // Assert: estado en pantalla y contrato de la petición
  await expect(page.getByRole('heading', { name: '¡Mensaje recibido!' })).toBeVisible();
  expect(enviados).toEqual([{
    nombre: 'Ana Pérez',
    email: 'ana@colegio.edu.co',
    telefono: '3001234567',
    asunto: 'Información general',
    mensaje: MENSAJE,
  }]);
});

test('CONTACTO-05: un mensaje de menos de 20 caracteres no llega a enviarse', async ({ page }) => {
  // Arrange: si la validación local fallara, este doble registraría la petición
  let peticiones = 0;
  await page.route(API_CONTACTO, (route) => {
    peticiones += 1;
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
  });
  await llenarFormulario(page, { mensaje: 'Muy corto' });

  // Act
  await enviar(page);

  // Assert
  await expect(page.getByText('Mínimo 20 caracteres.')).toBeVisible();
  expect(peticiones).toBe(0);
});
