import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // design_handoff_comunidad_vistas/ es un bundle generado por una herramienta
  // externa de handoff de diseño ("do not edit", ver cabecera del archivo) —
  // no es código fuente de la app, no tiene sentido lintearlo.
  globalIgnores(['dist', 'design_handoff_comunidad_vistas']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // El patrón "setLoading(true) al entrar al efecto, luego fetch async" se
      // usa deliberadamente en ~20 pantallas (fetch-on-mount) — no es un bug,
      // así que se deja en warning en vez de bloquear todos los PR por un
      // patrón ya aceptado en todo el código existente.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // src/test/setupTests.js usa require()/global.X estilo CommonJS aunque
    // el resto del frontend es ESM — necesita los globals de Node, no los
    // de browser.
    files: ['src/test/setupTests.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
