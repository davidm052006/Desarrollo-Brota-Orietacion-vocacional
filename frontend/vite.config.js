import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    // allowedHosts: true es necesario para exponer el dev server por un túnel
    // (cloudflared/ngrok) — el host header ya no es localhost y Vite lo
    // bloquea por defecto. Solo para fases de prueba con URL pública, ver
    // sección "Túnel de pruebas" en CLAUDE.md.
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
