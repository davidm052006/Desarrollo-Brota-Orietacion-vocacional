import { test, expect } from '@playwright/test';

const EMAIL = process.env.E2E_TEST_EMAIL;
const PASSWORD = process.env.E2E_TEST_PASSWORD;
const SUPABASE_CONFIGURED = Boolean(
  process.env.E2E_SUPABASE_URL && process.env.E2E_SUPABASE_ANON_KEY,
);

test.skip(
  !EMAIL || !PASSWORD || !SUPABASE_CONFIGURED,
  'Configura E2E_TEST_EMAIL, E2E_TEST_PASSWORD y E2E_SUPABASE_* para usar la cuenta de prueba',
);

test('inicia sesión con credenciales válidas y abre el dashboard', async ({ page }) => {
  // Arrange
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Escribe tu correo…' }).fill(EMAIL);
  await page.getByRole('textbox', { name: 'Contraseña…' }).fill(PASSWORD);

  // Act
  await page.getByRole('button', { name: 'Ingresar' }).click();

  // Assert
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('link', { name: 'Test vocacional' })).toBeVisible();
});
