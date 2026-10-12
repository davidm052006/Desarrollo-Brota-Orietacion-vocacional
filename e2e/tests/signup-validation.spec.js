import { expect, test } from '@playwright/test';

test('el registro no avanza y muestra validación con los campos obligatorios vacíos', async ({ page }) => {
  // Arrange
  await page.goto('/login');
  await page.getByRole('button', { name: 'Regístrate' }).click();

  // Act
  await page.getByRole('button', { name: 'Crear cuenta' }).click();

  // Assert
  await expect(page.getByText('El nombre es requerido')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Crea tu cuenta' })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  await page.screenshot({ path: 'tests/Evidencia_codegen/Evidencia-Test-signup-validation.png' });
});