import { defineConfig, devices } from '@playwright/test';

const usaSupabaseReal = Boolean(
  process.env.E2E_TEST_EMAIL
    && process.env.E2E_SUPABASE_URL
    && process.env.E2E_SUPABASE_ANON_KEY,
);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: usaSupabaseReal ? 1 : undefined,
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
    command: 'pnpm dev -- --host 127.0.0.1 --strictPort',
    cwd: '../frontend',
    url: 'http://localhost:5173',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
