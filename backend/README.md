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

## 📡 Endpoints de la API

Todas las rutas cuelgan de `/api` (`http://localhost:3001/api` en desarrollo). Las tablas salen de los routers de `src/routes/`:

```bash
grep -rnE "router\.(get|post|put|patch|delete)" backend/src/routes
```

### Convenciones

- **Autenticación:** las rutas que no son públicas piden `Authorization: Bearer <access_token>`, el token de sesión de Supabase Auth. El backend no tiene endpoint de login: el frontend inicia sesión directo contra Supabase (`supabase.auth.*`).
- **Formato:** todo responde JSON. El éxito trae `success: true` (y `data` cuando devuelve datos); los errores traen `success: false` y `message`, salvo la cuenta bloqueada, que trae `error: "BLOQUEADO"` y `hasta`.
- **Rol requerido:** `público` (sin token), `autenticado` (cualquier sesión válida), `autenticado + permiso` (además el permiso de comunidad efectivo del usuario, según su rol y `permisos_override`), o un rol concreto de `perfiles_usuario.rol`: `admin`, `moderador`, `institucion`.
- **Listados paginados** (`pagina`, `limite`): `limite` por defecto 10, máximo 50. `GET /api/programas` usa `page` y `limit`.

### Códigos de respuesta

| Código | Cuándo |
|---|---|
| 200 | Éxito. |
| 201 | Recurso creado. |
| 207 | Éxito parcial: la fila de la BD se actualizó o borró, pero falló el paso en Supabase Auth (cambio de rol/correo o borrado de la cuenta). |
| 400 | Datos inválidos, `JSON mal formado` o campo obligatorio faltante. |
| 401 | Sin token (`Token de autenticación requerido`) o token vencido (`Token inválido o expirado`). |
| 403 | La cuenta está bloqueada (`error: "BLOQUEADO"`), no tiene el rol o permiso que pide la ruta, o el recurso es de otro usuario (`No autorizado para este perfil`). |
| 404 | El recurso no existe, o la ruta no existe (`Ruta no encontrada`). |
| 409 | Conflicto: duplicado (por ejemplo, reportar dos veces la misma pregunta). |
| 413 | Cuerpo de más de 5 MB. |
| 429 | Límite de peticiones: 300 cada 15 minutos por IP en toda la API, y 5 cada 15 minutos en `POST /api/contacto`. |
| 500 | Error interno. Responde siempre `Error interno del servidor` (o un mensaje genérico del controlador) sin detalles: el error completo solo va al log (DEF-04). |

En las tablas, cada fila lista los códigos que puede devolver esa ruta: los de su controlador, el 401/403 de su middleware de autenticación y el 500 del manejador de errores. El 400 por JSON mal formado, el 404 de ruta inexistente, el 413 y el 429 general aplican a todas y no se repiten.

### General

| Método | Ruta | Rol requerido | Body / query | Respuestas |
|---|---|---|---|---|
| GET | `/api/health` | público | — | 200 |

### `/api/admin`

| Método | Ruta | Rol requerido | Body / query | Respuestas |
|---|---|---|---|---|
| GET | `/api/admin/stats` | admin | — | 200 · 401 · 403 · 500 |
| GET | `/api/admin/analytics` | admin | — | 200 · 401 · 403 · 500 |
| GET | `/api/admin/usuarios` | admin | query: `busqueda`, `rol`, `pagina`, `limite` | 200 · 401 · 403 · 500 |
| POST | `/api/admin/usuarios/masivo` | admin | `usuarios`: arreglo de filas con los campos de `POST /usuarios` (máx. 500) | 201 · 400 · 401 · 403 · 500 |
| GET | `/api/admin/usuarios/:id` | admin | — | 200 · 401 · 403 · 404 · 500 |
| POST | `/api/admin/usuarios` | admin | `email`, `password`, `nombre`, `apellido` (obligatorios); `ciudad`, `nivel_educativo`, `condiciones_socioeconomicas`, `edad`, `fecha_nacimiento`, `grado`, `telefono`, `rol`, `institucion_id` | 201 · 400 · 401 · 403 · 500 |
| PATCH | `/api/admin/usuarios/:id` | admin | `nombre`, `apellido`, `ciudad`, `nivel_educativo`, `condiciones_socioeconomicas`, `edad`, `fecha_nacimiento`, `grado`, `telefono`, `rol`, `institucion_id` | 200 · 207 · 401 · 403 · 404 · 500 |
| DELETE | `/api/admin/usuarios/:id` | admin | — | 200 · 207 · 401 · 403 · 404 · 500 |
| PATCH | `/api/admin/usuarios/:id/bloqueo` | admin | `horas` o `hasta` | 200 · 400 · 401 · 403 · 404 · 500 |
| PATCH | `/api/admin/usuarios/:id/permisos` | admin | `permisos_override` | 200 · 400 · 401 · 403 · 404 · 500 |
| GET | `/api/admin/permisos/catalogo` | admin | — | 200 · 401 · 403 · 500 |
| GET | `/api/admin/instituciones` | admin | query: `busqueda`, `pagina`, `limite` | 200 · 401 · 403 · 500 |
| POST | `/api/admin/instituciones` | admin | `nombre`, `tipo`, `ciudad`, `departamento`, `direccion`, `telefono`, `email`, `sitio_web`, `costo_promedio`, `activa` | 201 · 400 · 401 · 403 · 500 |
| PATCH | `/api/admin/instituciones/:id` | admin | `nombre`, `tipo`, `ciudad`, `departamento`, `direccion`, `telefono`, `email`, `sitio_web`, `costo_promedio`, `activa` | 200 · 401 · 403 · 500 |
| DELETE | `/api/admin/instituciones/:id` | admin | — | 200 · 401 · 403 · 500 |
| GET | `/api/admin/programas` | admin | query: `busqueda`, `pagina`, `limite` | 200 · 401 · 403 · 500 |
| POST | `/api/admin/programas` | admin | `nombre`, `tipo`, `area_academica`, `duracion`, `modalidad`, `descripcion`, `requisitos`, `costo_matricula`, `institucion_id`, `activo` | 201 · 400 · 401 · 403 · 500 |
| PATCH | `/api/admin/programas/:id` | admin | `nombre`, `tipo`, `area_academica`, `duracion`, `modalidad`, `descripcion`, `requisitos`, `costo_matricula`, `institucion_id`, `activo` | 200 · 401 · 403 · 500 |
| DELETE | `/api/admin/programas/:id` | admin | — | 200 · 401 · 403 · 500 |
| GET | `/api/admin/convocatorias` | admin | query: `busqueda`, `pagina`, `limite` | 200 · 401 · 403 · 500 |
| POST | `/api/admin/convocatorias` | admin | `tipo`, `titulo`, `institucion`, `ciudad`, `descripcion`, `detalles`, `url`, `fecha_cierre`, `activa` | 201 · 400 · 401 · 403 · 500 |
| PATCH | `/api/admin/convocatorias/:id` | admin | `tipo`, `titulo`, `institucion`, `ciudad`, `descripcion`, `detalles`, `url`, `fecha_cierre`, `activa` (todos opcionales) | 200 · 400 · 401 · 403 · 404 · 500 |
| DELETE | `/api/admin/convocatorias/:id` | admin | — | 200 · 401 · 403 · 404 · 500 |
| GET | `/api/admin/cuestionarios` | admin | — | 200 · 401 · 403 · 500 |
| POST | `/api/admin/cuestionarios` | admin | `nombre`, `version`, `descripcion`, `activo` | 201 · 400 · 401 · 403 · 500 |
| PATCH | `/api/admin/cuestionarios/:id` | admin | `nombre`, `version`, `descripcion`, `activo` | 200 · 401 · 403 · 500 |
| DELETE | `/api/admin/cuestionarios/:id` | admin | — | 200 · 401 · 403 · 500 |
| GET | `/api/admin/preguntas` | admin | query: `cuestionario_id`, `busqueda` | 200 · 401 · 403 · 500 |
| POST | `/api/admin/preguntas` | admin | `cuestionario_id`, `texto`, `tipo`, `orden`, `categoria`, `peso`, `opciones` | 201 · 400 · 401 · 403 · 409 · 500 |
| PATCH | `/api/admin/preguntas/:id` | admin | `texto`, `tipo`, `orden`, `categoria`, `peso`, `opciones` | 200 · 400 · 401 · 403 · 409 · 500 |
| DELETE | `/api/admin/preguntas/:id` | admin | — | 200 · 401 · 403 · 500 |
| GET | `/api/admin/contactos` | admin | query: `estado`, `pagina`, `limite` | 200 · 401 · 403 · 500 |
| PATCH | `/api/admin/contactos/:id` | admin | `estado`, `notas_admin` | 200 · 400 · 401 · 403 · 500 |
| GET | `/api/admin/preguntas-comunidad` | admin | — | 200 · 401 · 403 · 500 |
| DELETE | `/api/admin/preguntas-comunidad/:id` | admin | — | 200 · 401 · 403 · 500 |
| GET | `/api/admin/sincronizacion/estado` | admin | — | 200 · 401 · 403 · 500 |
| POST | `/api/admin/sincronizacion/ejecutar` | admin | — | 200 · 401 · 403 · 500 |

### `/api/auth`

| Método | Ruta | Rol requerido | Body / query | Respuestas |
|---|---|---|---|---|
| POST | `/api/auth/register-perfil` | autenticado | `nombre`, `apellido`, `fechaNacimiento`, `ciudad`, `nivelEducativo`, `grado`, `telefono` | 201 · 400 · 401 · 403 · 500 |

### `/api/comunidad`

| Método | Ruta | Rol requerido | Body / query | Respuestas |
|---|---|---|---|---|
| GET | `/api/comunidad/foros` | autenticado | — | 200 · 401 · 403 · 500 |
| GET | `/api/comunidad/foros/:id/posts` | autenticado | query: `orden` | 200 · 401 · 403 · 500 |
| POST | `/api/comunidad/foros/:id/posts` | autenticado + permiso `comunidad.publicar` | `titulo`, `contenido`, `anonimo` | 201 · 400 · 401 · 403 · 404 · 500 |
| GET | `/api/comunidad/posts/:id` | autenticado | — | 200 · 401 · 403 · 404 · 500 |
| POST | `/api/comunidad/posts/:id/votar` | autenticado | `direccion` | 200 · 400 · 401 · 403 · 404 · 500 |
| POST | `/api/comunidad/posts/:id/respuestas` | autenticado + permiso `comunidad.comentar` | `contenido`, `anonimo` | 201 · 400 · 401 · 403 · 404 · 500 |
| GET | `/api/comunidad/historias` | autenticado | — | 200 · 401 · 403 · 500 |
| GET | `/api/comunidad/historias/:id` | autenticado | — | 200 · 401 · 403 · 404 · 500 |
| POST | `/api/comunidad/historias` | autenticado + permiso `comunidad.publicar` | `titulo`, `contenido`, `area`, `carrera`, `institucion`, `anonimo` | 201 · 400 · 401 · 403 · 500 |
| POST | `/api/comunidad/historias/:id/like` | autenticado | — | 200 · 401 · 403 · 404 · 500 |
| GET | `/api/comunidad/preguntas` | autenticado | — | 200 · 401 · 403 · 500 |
| GET | `/api/comunidad/preguntas/:id` | autenticado | — | 200 · 401 · 403 · 404 · 500 |
| POST | `/api/comunidad/preguntas` | autenticado + permiso `comunidad.publicar` | `titulo`, `area`, `anonimo` | 201 · 400 · 401 · 403 · 500 |
| POST | `/api/comunidad/preguntas/:id/respuestas` | autenticado + permiso `comunidad.comentar` | `contenido`, `anonimo` | 201 · 400 · 401 · 403 · 404 · 500 |
| PATCH | `/api/comunidad/preguntas/:id/respuestas/:rid/mejor` | autenticado | — | 200 · 401 · 403 · 404 · 500 |
| POST | `/api/comunidad/preguntas/:id/reportar` | autenticado | `motivo` | 201 · 401 · 403 · 404 · 409 · 500 |
| GET | `/api/comunidad/convocatorias` | autenticado | query: `pagina`, `limite` | 200 · 401 · 403 · 500 |
| GET | `/api/comunidad/convocatorias/:id` | autenticado | — | 200 · 401 · 403 · 404 · 500 |
| GET | `/api/comunidad/notificaciones` | autenticado | — | 200 · 401 · 403 · 500 |
| GET | `/api/comunidad/feed` | autenticado | — | 200 · 401 · 403 · 500 |
| PATCH | `/api/comunidad/moderacion/:tipo/:id/ocultar` | admin o moderador | — | 200 · 400 · 401 · 403 · 500 |
| DELETE | `/api/comunidad/moderacion/:tipo/:id` | admin o moderador | — | 200 · 400 · 401 · 403 · 500 |
| GET | `/api/comunidad/moderacion/autor/:userId` | admin o moderador | — | 200 · 401 · 403 · 404 · 500 |

### `/api/contacto`

| Método | Ruta | Rol requerido | Body / query | Respuestas |
|---|---|---|---|---|
| POST | `/api/contacto` | público | `nombre`, `email`, `telefono`, `asunto`, `mensaje` | 200 · 400 · 429 · 500 |

### `/api/institucion`

| Método | Ruta | Rol requerido | Body / query | Respuestas |
|---|---|---|---|---|
| GET | `/api/institucion/analytics` | institucion | — | 200 · 401 · 403 · 500 |
| GET | `/api/institucion/programas` | institucion | — | 200 · 401 · 403 · 500 |
| PATCH | `/api/institucion/programas/:id` | institucion | `descripcion`, `requisitos`, `costo_matricula`, `activo` | 200 · 401 · 403 · 404 · 500 |
| GET | `/api/institucion/usuarios` | institucion | query: `busqueda`, `pagina`, `limite` | 200 · 401 · 403 · 500 |
| POST | `/api/institucion/usuarios/masivo` | institucion | `usuarios`: arreglo de filas con los campos de `POST /usuarios` (máx. 500) | 201 · 400 · 401 · 403 · 500 |
| POST | `/api/institucion/usuarios` | institucion | `email`, `password`, `nombre`, `apellido` (obligatorios); `ciudad`, `nivel_educativo`, `fecha_nacimiento`, `grado`, `telefono`. El rol y la institución los fija el servidor | 201 · 400 · 401 · 403 · 500 |
| DELETE | `/api/institucion/usuarios/:id` | institucion | — | 200 · 207 · 401 · 403 · 404 · 500 |
| GET | `/api/institucion/cuestionarios` | institucion | — | 200 · 401 · 403 · 500 |
| POST | `/api/institucion/cuestionarios` | institucion | `nombre`, `version`, `descripcion` | 201 · 400 · 401 · 403 · 500 |
| PATCH | `/api/institucion/cuestionarios/:id` | institucion | `nombre`, `version`, `descripcion`, `activo` | 200 · 401 · 403 · 404 · 500 |
| DELETE | `/api/institucion/cuestionarios/:id` | institucion | — | 200 · 401 · 403 · 404 · 500 |
| GET | `/api/institucion/preguntas` | institucion | query: `cuestionario_id` | 200 · 400 · 401 · 403 · 500 |
| POST | `/api/institucion/preguntas` | institucion | `cuestionario_id`, `texto`, `tipo`, `orden`, `categoria`, `peso`, `opciones` | 201 · 400 · 401 · 403 · 500 |
| PATCH | `/api/institucion/preguntas/:id` | institucion | `texto`, `tipo`, `orden`, `categoria`, `peso`, `opciones` | 200 · 400 · 401 · 403 · 404 · 500 |
| DELETE | `/api/institucion/preguntas/:id` | institucion | — | 200 · 401 · 403 · 404 · 500 |

### `/api/perfil`

| Método | Ruta | Rol requerido | Body / query | Respuestas |
|---|---|---|---|---|
| GET | `/api/perfil/cuestionario` | autenticado | — | 200 · 401 · 403 · 404 · 500 |
| GET | `/api/perfil/permisos` | autenticado | — | 200 · 401 · 403 · 500 |
| POST | `/api/perfil/resultado` | autenticado | `perfil_usuario_id`, `cuestionario_id`, `respuestas` | 201 · 400 · 401 · 403 · 500 |
| GET | `/api/perfil/resultado/:perfilUsuarioId` | autenticado | — | 200 · 401 · 403 · 500 |
| DELETE | `/api/perfil/resultado/:perfilUsuarioId` | autenticado | — | 200 · 401 · 403 · 500 |
| GET | `/api/perfil/recomendaciones/:resultadoId` | autenticado | — | 200 · 401 · 403 · 404 · 500 |
| PATCH | `/api/perfil/recomendaciones/:id/vista` | autenticado | — | 200 · 401 · 403 · 404 · 500 |
| GET | `/api/perfil/:userId` | autenticado | — | 200 · 401 · 403 · 404 · 500 |
| PATCH | `/api/perfil/:userId` | autenticado | `nombre`, `apellido`, `ciudad`, `nivel_educativo`, `condiciones_socioeconomicas`, `edad`, `telefono`, `institucion_contacto`, `institucion_descripcion` | 200 · 401 · 403 · 500 |
| PATCH | `/api/perfil/:userId/broti` | autenticado | `broti_config` | 200 · 400 · 401 · 403 · 500 |

### `/api/programas`

| Método | Ruta | Rol requerido | Body / query | Respuestas |
|---|---|---|---|---|
| GET | `/api/programas/stats` | público | — | 200 · 500 |
| GET | `/api/programas` | público | query: `area`, `search`, `page`, `limit` | 200 · 500 |

### `/api/rutas`

| Método | Ruta | Rol requerido | Body / query | Respuestas |
|---|---|---|---|---|
| GET | `/api/rutas` | autenticado | — | 200 · 401 · 403 · 500 |
| GET | `/api/rutas/:area` | autenticado | — | 200 · 401 · 403 · 404 · 500 |

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
