# ⚙️ Backend - Sistema Brota 🌱

API REST en Node.js + Express 5 (CommonJS) para la plataforma de orientación vocacional **Brota**. Habla con Supabase (PostgreSQL + Auth) usando la `service_role_key`, así que hace de intermediario entre el frontend y la base de datos — el frontend nunca consulta Supabase directo salvo para login/registro (`supabase.auth.*`).

---

## 🚀 Requisitos Previos

- **Node.js**: versión 20.19 o superior recomendada para mantener compatibilidad con el workspace (el frontend usa Vite 7).
- **Docker Desktop**, para la Supabase local (`npx supabase start`). `.env.example` ya apunta a ella con sus claves de demostración, que son públicas. Para un proyecto de Supabase en la nube, pide la URL y la `service_role_key` por privado.

---

## 🛠️ Instalación y Ejecución

1. **Ubicate en la raíz del repositorio**.
2. **Instalá las dependencias del workspace**:
   ```bash
   pnpm install
   ```
3. **Configurá las variables de entorno.** `pnpm install` crea `backend/.env` desde `.env.example` si no existe. Si no, a mano:
   ```bash
   cp .env.example .env
   ```
4. **Levantá la Supabase local** (Docker Desktop abierto). Crea la BD desde `supabase/migrations/` y carga `supabase/seed.sql`:
   ```bash
   npx supabase start
   ```
   Para un proyecto de Supabase en la nube que esté vacío, corré `setup_database.sql` en su SQL Editor: crea las tablas, índices, triggers y políticas RLS.
5. **Iniciá el servidor de desarrollo** desde la raíz del repositorio (con recarga automática vía `nodemon`):
   ```bash
   pnpm --filter backend dev
   ```
6. El servidor queda en `http://localhost:3001` — probar con `GET /api/health`.

---

## 🧪 Tests

```bash
pnpm --filter backend test
```

Usa Jest y `supertest` para las peticiones HTTP. Los tests corren contra el Supabase real configurado en `.env` (no hay mocks todavía) — ver `test/api.test.js`.

---

## 📁 Estructura del Proyecto

```text
/backend
│
├── src/
│   ├── server.js          # Punto de entrada: monta Express, CORS, rate limiting, todas las rutas
│   ├── config/            # Cliente de Supabase
│   ├── routes/            # Un archivo por dominio (auth, perfil, admin, programas, comunidad, rutas)
│   ├── controllers/       # Lógica de cada endpoint — split por entidad dentro de admin/ y comunidad/
│   ├── middlewares/       # verificarAuth (JWT de Supabase), verificarAdmin, verificarModeracion
│   └── utils/              # Algoritmo de recomendación, helpers de comunidad, etc.
│
├── scripts/
│   └── historico/          # Migraciones SQL ya aplicadas — solo como registro, no correr de nuevo
│
├── test/                   # Tests de integración (Jest + supertest)
├── setup_database.sql      # Fuente única para levantar la base de datos desde cero
└── package.json
```

---

## 🔑 Variables de Entorno

Las variables están en `.env.example`:

| Variable | Para qué | Valor en `.env.example` |
|---|---|---|
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | Conexión a la base de datos (bypassea RLS: nunca exponer al frontend) | Supabase local y su service key de demostración (`npx supabase status`) |
| `PORT` | Puerto del servidor | `3001` |
| `FRONTEND_URL` | Origen permitido por CORS: donde corre el frontend (incluye túneles de prueba) | `http://localhost:5173` |

> 🔒 `.env.example` no tiene secretos: solo los valores públicos de la Supabase local. Las credenciales de un proyecto en la nube (y las de Railway y Vercel) se comparten por privado, nunca en el repo, que es público. Hasta el 25 nov 2026 este archivo traía credenciales reales de desarrollo, que hay que rotar (#29) porque siguen en el historial de Git.
>
> `JWT_SECRET` y `SMTP_*` ya no aparecen porque ningún código las usa: la autenticación valida con `supabase.auth.getUser(token)` y los correos (recuperación de contraseña) los manda Supabase Auth.

---

## 🔗 Ver también

- [`docs/00_START_HERE.md`](../docs/00_START_HERE.md) — documentación formal del proyecto.
- [`docs/CLAUDE.md`](../docs/CLAUDE.md) — mapa de rutas de la API, arquitectura de controllers, bugs conocidos.
