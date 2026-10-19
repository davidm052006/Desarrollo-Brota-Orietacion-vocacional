import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const e2eDirectory = fileURLToPath(new URL('.', import.meta.url));
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const extraArgs = process.argv.slice(2);
const usaSupabaseReal = Boolean(
  process.env.E2E_TEST_EMAIL
    && process.env.E2E_SUPABASE_URL
    && process.env.E2E_SUPABASE_ANON_KEY,
);
const uiEnvironment = usaSupabaseReal
  ? {
      VITE_SUPABASE_URL: process.env.E2E_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.E2E_SUPABASE_ANON_KEY,
    }
  : {
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'e2e-public-test-key',
    };

const suites = [
  {
    name: 'Autenticación y validación',
    files: [
      'tests/login-validation.spec.js',
      'tests/signup-validation.spec.js',
      'tests/login-invalid-password.spec.js',
      'tests/login-success.spec.js',
    ],
    env: uiEnvironment,
  },
  {
    name: 'Búsqueda de recursos en modo demo',
    files: ['tests/recursos-navigation.spec.js'],
    env: {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
    },
  },
];

for (const suite of suites) {
  console.log(`\nE2E: ${suite.name}`);
  const result = await new Promise((resolve, reject) => {
    const child = spawn(
      pnpm,
      ['exec', 'playwright', 'test', ...suite.files, ...extraArgs],
      {
        cwd: e2eDirectory,
        env: { ...process.env, ...suite.env },
        stdio: 'inherit',
        shell: process.platform === 'win32',
      },
    );

    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (signal) reject(new Error(`Playwright terminó por la señal ${signal}`));
      else resolve(code ?? 1);
    });
  });

  if (result !== 0) process.exit(result);
}
