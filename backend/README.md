# ⚙️ Backend - Sistema Brota 🌱

API REST en Node.js + Express 5 (CommonJS) para la plataforma de orientación vocacional **Brota**. Habla con Supabase (PostgreSQL + Auth) usando la `service_role_key`, así que hace de intermediario entre el frontend y la base de datos — el frontend nunca consulta Supabase directo salvo para login/registro (`supabase.auth.*`).

---

## 🚀 Requisitos Previos

- **Node.js**: versión 18 o superior.
- Un proyecto de Supabase (URL + `service_role_key`) — o usar las credenciales de desarrollo ya incluidas en `.env.example` para arrancar rápido en cualquier máquina (ver nota de seguridad más abajo).

---

## 🛠️ Instalación y Ejecución

1. **Ubicate en esta carpeta** (`/backend`).
2. **Instalá las dependencias**:
   ```bash
   npm install
   ```
3. **Configurá las variables de entorno**:
   ```bash
   cp .env.example .env
   ```
4. **Si es una base de datos nueva**, corré `setup_database.sql` contra tu proyecto de Supabase (SQL Editor → pegar el contenido completo del archivo) — crea las 22 tablas, índices, triggers y políticas RLS.
5. **Iniciá el servidor de desarrollo** (con recarga automática vía `nodemon`):
   ```bash
   npm run dev
   ```
6. El servidor queda en `http://localhost:3001` — probar con `GET /api/health`.

---

## 🧪 Tests

```bash
npm test
```

Usa el test runner nativo de Node (`node --test`, sin dependencias de framework) + `supertest` para las peticiones HTTP. Los tests corren contra el Supabase real configurado en `.env` (no hay mocks todavía) — ver `test/api.test.js`.

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
├── test/                   # Tests (node --test)
├── setup_database.sql      # Fuente única para levantar la base de datos desde cero
└── package.json
```

---

## 🔑 Variables de Entorno

Ver `.env.example` para la lista completa. Las principales:

| Variable | Para qué |
|---|---|
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | Conexión a la base de datos (bypassea RLS — nunca exponer al frontend) |
| `PORT` | Puerto del servidor (default `3001`) |
| `FRONTEND_URL` | Origen permitido por CORS — debe apuntar a donde corre el frontend (incluye túneles de prueba) |
| `SMTP_*` | Envío de correos (recuperación de contraseña, contacto) |
| `JWT_SECRET` | **Variable muerta** — la autenticación usa `supabase.auth.getUser(token)`, no un JWT propio. Queda por inercia, se puede quitar en la limpieza de credenciales previa a producción |

> ⚠️ `.env.example` trae credenciales reales de desarrollo (decisión consciente del equipo, para facilitar el arranque durante la fase de desarrollo — ver `CLAUDE.md`). Antes de producción hay que rotar todo y sacar los secretos del repo.

---

## 🔗 Ver también

- [`docs/00_START_HERE.md`](../docs/00_START_HERE.md) — documentación formal del proyecto.
- [`CLAUDE.md`](../CLAUDE.md) — mapa de rutas de la API, arquitectura de controllers, bugs conocidos.
