import { expect, test } from '@playwright/test';

test('el registro no avanza y muestra validación con los campos obligatorios vacíos', async ({ page }) => {
  // Arrange
  await page.context().clearCookies();
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole('button', { name: 'Regístrate' }).click();

  // Act
  await page.getByRole('button', { name: 'Crear cuenta' }).click();

  // Assert
  const requiredMessages = [
    'El nombre es requerido',
    'El apellido es requerido',
    'El correo es requerido',
    'La contraseña es requerida',
    'Confirma tu contraseña',
    'El nivel educativo es requerido',
    'El grado es requerido',
    'La edad es requerida',
    'La ciudad es requerida',
    'El número de teléfono es requerido',
  ];

  for (const message of requiredMessages) {
    await expect(page.getByText(message, { exact: true })).toBeVisible();
  }

  await expect(page.getByRole('heading', { name: 'Crea tu cuenta' })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});