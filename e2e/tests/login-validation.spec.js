import { test, expect } from '@playwright/test';

test('el login vacío muestra las validaciones de correo y contraseña', async ({ page }) => {
  // Arrange
  await page.context().clearCookies();
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('textbox', { name: 'Escribe tu correo…' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Contraseña…' })).toBeVisible();

  // Act
  await page.getByRole('button', { name: 'Ingresar' }).click();

  // Assert
  await expect(page.getByText('El correo es requerido')).toBeVisible();
  await expect(page.getByText('La contraseña es requerida')).toBeVisible();
});
