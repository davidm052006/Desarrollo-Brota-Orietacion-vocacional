import { test, expect } from '@playwright/test';

// Semana 5 · dobles de prueba en E2E con page.route.
// El navegador nunca llega a Supabase: cualquier petición a *.supabase.co se
// corta y el endpoint de login (POST /auth/v1/token?grant_type=password) se
// responde con un doble. Así las pruebas son deterministas y corren en CI sin
// credenciales reales.
// Requiere frontend/.env.local con VITE_SUPABASE_URL (sin él la app entra en
// modo demo y no hace peticiones); en CI se copia .env.local.example.

const TOKEN_URL = '**/auth/v1/token?grant_type=password';
const EMAIL = 'estudiante@brota.test';
const PASSWORD = 'ClaveSegura123'; // cumple la validación local (8+, letras y números)

test.beforeEach(async ({ page }) => {
  // Red de seguridad: nada sale a Supabase real. Las rutas registradas después
  // tienen prioridad, así que cada test sobreescribe solo el login.
  await page.route('**/*.supabase.co/**', (route) => route.abort('blockedbyclient'));
  await page.goto('/login');
});

async function enviarLogin(page) {
  await page.getByPlaceholder('Escribe tu correo…').fill(EMAIL);
  await page.getByPlaceholder('Contraseña…').fill(PASSWORD);
  await page.getByRole('button', { name: 'Ingresar' }).click();
}

test('ROUTE-01: credenciales inválidas muestran el error en español y no navegan', async ({ page }) => {
  // Arrange: Supabase responde 400 invalid_credentials
  const peticiones = [];
  await page.route(TOKEN_URL, async (route) => {
    peticiones.push(route.request().postDataJSON());
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'invalid_credentials',
        error_code: 'invalid_credentials',
        msg: 'Invalid login credentials',
      }),
    });
  });

  // Act
  await enviarLogin(page);

  // Assert: mensaje traducido, sigue en /login y se envió lo que escribió
  await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Ingresar' })).toBeEnabled();
  expect(peticiones).toHaveLength(1);
  expect(peticiones[0]).toMatchObject({ email: EMAIL, password: PASSWORD });
});

test('ROUTE-02: servicio de autenticación caído muestra error de conexión', async ({ page }) => {
  // Arrange: la petición de login falla a nivel de red
  await page.route(TOKEN_URL, (route) => route.abort('failed'));

  // Act
  await enviarLogin(page);

  // Assert: mensaje de conexión, sin texto técnico en inglés
  await expect(
    page.getByText('No se pudo conectar al servicio de autenticación', { exact: false })
  ).toBeVisible();
  await expect(page.getByText(/failed to fetch/i)).toHaveCount(0);
  await expect(page).toHaveURL(/\/login$/);
});

test('ROUTE-03: demasiados intentos (429) muestra el aviso de espera', async ({ page }) => {
  // Arrange: Supabase limita la tasa de intentos
  await page.route(TOKEN_URL, (route) =>
    route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'over_request_rate_limit',
        error_code: 'over_request_rate_limit',
        msg: 'Too many requests',
      }),
    })
  );

  // Act
  await enviarLogin(page);

  // Assert
  await expect(
    page.getByText('Demasiados intentos. Espera unos minutos antes de intentarlo de nuevo.')
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
