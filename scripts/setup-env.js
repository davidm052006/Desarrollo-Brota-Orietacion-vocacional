'use strict';
const fs            = require('fs');
const path          = require('path');

const root = path.resolve(__dirname, '..');

// ── Copiar .env si no existe ──────────────────────────────────────────────────
const envPairs = [
  ['backend/.env.example',        'backend/.env'],
  ['frontend/.env.local.example', 'frontend/.env.local'],
];

for (const [src, dst] of envPairs) {
  const dstPath = path.join(root, dst);
  const srcPath = path.join(root, src);
  if (!fs.existsSync(dstPath) && fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, dstPath);
    console.log(`[setup] Creado ${dst}`);
  }
}

// ── Instalar git hooks ────────────────────────────────────────────────────────
const gitHooksDir = path.join(root, '.git', 'hooks');
const srcHooksDir = path.join(root, 'scripts', 'hooks');

if (fs.existsSync(gitHooksDir) && fs.existsSync(srcHooksDir)) {
  for (const hook of fs.readdirSync(srcHooksDir)) {
    const dst = path.join(gitHooksDir, hook);
    fs.copyFileSync(path.join(srcHooksDir, hook), dst);
    try { fs.chmodSync(dst, 0o755); } catch (_) {}
  }
}
