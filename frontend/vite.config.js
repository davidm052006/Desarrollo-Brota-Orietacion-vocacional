import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setupTests.js',
    // Las pruebas de formularios con user-event (muchos clics y teclas)
    // superaban los 5 s por defecto al correr con cobertura y todos los
    // archivos en paralelo: fallaban por tiempo, no por el comportamiento.
    testTimeout: 15000,
    coverage: {
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/**/*.{test,spec}.{js,jsx}', 'src/test/**'],
      reporter: ['text', 'lcov'],
      // Semana 6: umbral = max(70, cobertura real redondeada hacia abajo).
      // Medido el 19-nov-2026: 81.42 / 73.01 / 75.22 / 82.21.
      thresholds: {
        statements: 81,
        branches: 73,
        functions: 75,
        lines: 82,
      },
    },
  },

  server: {
    // allowedHosts: true es necesario para exponer el dev server por un túnel
    // (cloudflared/ngrok) — el host header ya no es localhost y Vite lo
    // bloquea por defecto. Solo para fases de prueba con URL pública, ver
    // sección "Túnel de pruebas" en CLAUDE.md.
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
