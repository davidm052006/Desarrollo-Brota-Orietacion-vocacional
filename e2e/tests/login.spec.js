import { test, expect } from '@playwright/test';

// Requiere un usuario real en Supabase Auth (frontend/.env con VITE_SUPABASE_URL
// real, no modo demo): en modo demo el cliente Supabase es un dummy y el submit
// siempre falla.
const EMAIL = process.env.E2E_TEST_EMAIL;
const PASSWORD = process.env.E2E_TEST_PASSWORD;

test.skip(!EMAIL || !PASSWORD, 'Faltan E2E_TEST_EMAIL / E2E_TEST_PASSWORD en el entorno');

test('inicio de sesión exitoso muestra el dashboard', async ({ page }) => {
  // Arrange
  await page.goto('/login');

  // Act
  await page.getByPlaceholder('Escribe tu correo…').fill(EMAIL);
  await page.getByPlaceholder('Contraseña…').fill(PASSWORD);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  // Assert
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByText('No se trata de tener todas las respuestas, sino la curiosidad de descubrirlas.')
  ).toBeVisible();
});
