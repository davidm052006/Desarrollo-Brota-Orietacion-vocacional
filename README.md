# 🌱 Brota

Plataforma de orientación vocacional para estudiantes colombianos de colegio (14–25 años): cuestionario vocacional, recomendación de programas académicos (dataset oficial del MEN), comunidad entre estudiantes y panel administrativo.

- **Frontend**: React 19 + Vite 7 + TailwindCSS 4 (`frontend/`)
- **Backend**: Node.js + Express 5 (`backend/`, puerto `3001`)
- **Base de datos / Auth**: Supabase (PostgreSQL + Supabase Auth)

## Documentación

- **[`docs/CLAUDE.md`](./docs/CLAUDE.md)** — contexto técnico día a día: mapa de rutas, arquitectura, bugs conocidos, deuda técnica. Punto de partida si vas a tocar código.
- **[`docs/BRAND.md`](./docs/BRAND.md)** — manual de marca (colores, tipografía, voz y tono).
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

### Integración contra la BD de pruebas (Supabase local)

Los tests de `backend/tests/integracion/` corren contra un Supabase local en Docker (Postgres 17, puerto **55322**, el mismo stack `brota-demo` de `DEMO_LOCAL.md`), separado del Supabase remoto de desarrollo. El esquema se construye con las migraciones de `supabase/migrations/`, igual que producción. Sin `DATABASE_URL` esos tests se saltan, por eso el CI sigue en verde. Necesitas Docker Desktop abierto. En Git Bash, desde la raíz:

```bash
# 1. Levantar la BD de pruebas y aplicar las migraciones desde cero
npx supabase start -x studio,imgproxy,mailpit,realtime,storage-api,edge-runtime,logflare,vector,supavisor,postgres-meta
npx supabase db reset

# 2. Correr la integración (las variables salen del Supabase local, no de backend/.env)
eval "$(npx supabase status -o env --override-name db.url=DATABASE_URL --override-name api.url=SUPABASE_URL --override-name auth.service_role_key=SUPABASE_SERVICE_KEY | grep -E '^(DATABASE_URL|SUPABASE_URL|SUPABASE_SERVICE_KEY)=' | sed 's/^/export /')"
pnpm --filter backend test:integracion

# 3. Apagar y borrar los datos (equivale a `docker compose down -v`)
npx supabase stop --no-backup
```

**Ojo:** la BD de pruebas y el demo local comparten el stack `brota-demo`. Los tests vacían las tablas que usan y `supabase db reset` borra los datos del demo; para volver al demo después de probar, `make brota-demo-reset`.

Si `DATABASE_URL` o `SUPABASE_URL` no apuntan a `127.0.0.1`/`localhost`, los tests abortan antes de tocar la BD. El plan completo está en [`docs/plan_pruebas.md`](./docs/plan_pruebas.md).

La cobertura actual y las pruebas pendientes están documentadas en [`docs/estrategia_pruebas.md`](./docs/estrategia_pruebas.md).

## Estructura del repo

```text
/
├── frontend/     # React + Vite (ver frontend/README.md)
├── backend/      # Express + Supabase (ver backend/README.md)
├── docs/         # Documentación del proyecto (ver docs/00_START_HERE.md y docs/CLAUDE.md)
├── scripts/      # Automatización y diagnósticos de desarrollo
└── supabase/     # Configuración y migraciones de Supabase
```
