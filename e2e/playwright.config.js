import { defineConfig, devices } from '@playwright/test';

/**
 * Levanta el frontend real de Brota (Vite, puerto 5173) y corre los E2E contra él.
 * Requiere que frontend/.env tenga VITE_SUPABASE_URL real (no modo demo): en modo
 * demo el login siempre falla (ver nota técnica en tests/login.spec.js).
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
