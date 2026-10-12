# 🌱 Brota

Plataforma de orientación vocacional para estudiantes colombianos de colegio (14–25 años): cuestionario vocacional, recomendación de programas académicos (dataset oficial del MEN), comunidad entre estudiantes y panel administrativo.

- **Frontend**: React 19 + Vite 7 + TailwindCSS 4 (`frontend/`)
- **Backend**: Node.js + Express 5 (`backend/`, puerto `3001`)
- **Base de datos / Auth**: Supabase (PostgreSQL + Supabase Auth)

## Documentación

- **[`CLAUDE.md`](./CLAUDE.md)** — contexto técnico día a día: mapa de rutas, arquitectura, bugs conocidos, deuda técnica. Punto de partida si vas a tocar código.
- **[`BRAND.md`](./BRAND.md)** — manual de marca (colores, tipografía, voz y tono).
- **[`docs/00_START_HERE.md`](./docs/00_START_HERE.md)** — índice de la documentación formal del proyecto (requisitos funcionales, modelo de datos, gestión del proyecto, estrategia de pruebas, despliegue).

## Arrancar con Docker Compose

Requiere Docker Desktop con Docker Compose v2. Supabase sigue siendo un servicio externo: configura sus credenciales antes de iniciar los contenedores.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
docker compose up --build
```

Abre `http://localhost:5173`. La API queda disponible en `http://localhost:3001` y el frontend la consume a través del proxy de Vite dentro de la red de Compose. El código se monta como volumen para reflejar los cambios durante el desarrollo; las dependencias permanecen en volúmenes Docker.

Para detener los servicios, ejecuta `docker compose down`. Esto conserva los volúmenes de dependencias.

## Arrancar sin Docker

Requiere Node.js 20.19+ y una cuenta de Supabase (o correr en **modo demo**, sin Supabase, ver más abajo). Vite 7 requiere esta versión mínima de Node.js.

```bash
git clone <este repo>
cd Documentacion_Brota
pnpm install           # instala backend/, frontend/ y e2e/
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Luego, en dos terminales:

```bash
pnpm --filter backend dev     # http://localhost:3001
pnpm --filter frontend dev    # http://localhost:5173
```

Detalle completo de variables de entorno y setup de base de datos (`backend/setup_database.sql`) en [`backend/README.md`](./backend/README.md) y [`frontend/README.md`](./frontend/README.md).

**Modo demo**: si `frontend/.env.local` no tiene `VITE_SUPABASE_URL`, la app arranca sin Supabase — login con cualquier email/password, sin persistencia real. Útil para ver la UI sin configurar nada.

## Tests

```bash
pnpm --filter backend test   # Jest
pnpm --filter frontend test  # Vitest
pnpm --filter backend test:coverage
pnpm --filter frontend test:coverage
```

Los comandos de cobertura aplican los umbrales mínimos de CI. El E2E requiere Chromium instalado. La prueba de contraseña incorrecta necesita Supabase real y el correo de una cuenta de prueba configurado localmente en `E2E_TEST_EMAIL`:

```bash
pnpm --filter brota-e2e exec playwright install chromium
pnpm --filter brota-e2e test
```

La cobertura actual y las pruebas pendientes están documentadas en [`docs/estrategia_pruebas.md`](./docs/estrategia_pruebas.md).

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
