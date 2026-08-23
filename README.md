# 🌱 Brota

Plataforma de orientación vocacional para estudiantes colombianos de colegio (14–25 años): cuestionario vocacional, recomendación de programas académicos (dataset oficial del MEN), comunidad entre estudiantes y panel administrativo.

- **Frontend**: React 19 + Vite 7 + TailwindCSS 4 (`frontend/`)
- **Backend**: Node.js + Express 5 (`backend/`, puerto `3001`)
- **Base de datos / Auth**: Supabase (PostgreSQL + Supabase Auth)

## Documentación

- **[`CLAUDE.md`](./CLAUDE.md)** — contexto técnico día a día: mapa de rutas, arquitectura, bugs conocidos, deuda técnica. Punto de partida si vas a tocar código.
- **[`BRAND.md`](./BRAND.md)** — manual de marca (colores, tipografía, voz y tono).
- **[`docs/00_START_HERE.md`](./docs/00_START_HERE.md)** — índice de la documentación formal del proyecto (requisitos funcionales, modelo de datos, gestión del proyecto, estrategia de pruebas, despliegue).

## Arrancar el proyecto

Requiere Node.js 18+ y una cuenta de Supabase (o correr en **modo demo**, sin Supabase, ver más abajo).

```bash
git clone <este repo>
cd Documentacion_Brota
npm run install:all   # instala backend/ y frontend/
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Luego, en dos terminales:

```bash
cd backend && npm run dev     # http://localhost:3001
cd frontend && npm run dev    # http://localhost:5173
```

Detalle completo de variables de entorno y setup de base de datos (`backend/setup_database.sql`) en [`backend/README.md`](./backend/README.md) y [`frontend/README.md`](./frontend/README.md).

**Modo demo**: si `frontend/.env.local` no tiene `VITE_SUPABASE_URL`, la app arranca sin Supabase — login con cualquier email/password, sin persistencia real. Útil para ver la UI sin configurar nada.

## Tests

```bash
cd backend && npm test     # node --test, contra Supabase real
cd frontend && npm test    # vitest
```

Cobertura todavía mínima (arrancada en agosto 2026) — ver `docs/estrategia_pruebas.md` para el alcance planeado.

## Estructura del repo

```text
/
├── frontend/     # React + Vite (ver frontend/README.md)
├── backend/      # Express + Supabase (ver backend/README.md)
├── docs/         # Documentación formal del proyecto (ver docs/00_START_HERE.md)
├── logos/        # Assets de marca y de la mascota "Broti"
├── CLAUDE.md     # Contexto técnico de desarrollo
└── BRAND.md      # Manual de marca
```
