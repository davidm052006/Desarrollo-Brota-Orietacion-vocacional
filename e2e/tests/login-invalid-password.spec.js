import { test, expect } from '@playwright/test';

const EMAIL = process.env.E2E_TEST_EMAIL;

test.skip(!EMAIL, 'Falta E2E_TEST_EMAIL para usar la cuenta de prueba de Supabase');

test('una contraseña incorrecta muestra un error y mantiene al usuario en login', async ({ page }) => {
  // Arrange
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Escribe tu correo…' }).fill(EMAIL);
  await page.getByRole('textbox', { name: 'Contraseña…' }).fill(`incorrecta-e2e-${Date.now()}`);

  // Act
  await page.getByRole('button', { name: 'Ingresar' }).click();

  // Assert
  await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
