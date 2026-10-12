import { defineConfig, devices } from '@playwright/test';

/**
 * Levanta el frontend real de Brota (Vite, puerto 5173) y corre los E2E contra él.
 * El test de contraseña incorrecta requiere frontend/.env con Supabase real y
 * E2E_TEST_EMAIL configurado; el test de validación local no necesita Supabase.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    cwd: '../frontend',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
