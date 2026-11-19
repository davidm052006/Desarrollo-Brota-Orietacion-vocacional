import { test, expect } from '@playwright/test';

test('busca recursos educativos por título', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('demoModeLoggedIn', 'true');
    localStorage.setItem('demoUserEmail', 'e2e@brota.test');
    localStorage.setItem('demoUserName', 'E2E Test');
  });

  await page.goto('/dashboard/recursos');

  const recursoIcetex = page.getByText('ICETEX — Crédito educativo', { exact: true });
  const recursoCarrera = page.getByText('Cómo elegir tu carrera', { exact: true });

  await expect(recursoIcetex).toBeVisible();
  await expect(recursoCarrera).toBeVisible();

  await page.getByPlaceholder('Buscar recurso…').fill('ICETEX');

  await expect(recursoIcetex).toBeVisible();
  await expect(recursoCarrera).toHaveCount(0);
});
