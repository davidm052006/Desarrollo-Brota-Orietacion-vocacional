# Colección de Postman — Brota API (T6, ítem 9)

- `brota.postman_collection.json`: la colección "Brota API".
- `local.postman_environment.json`: el entorno "Brota local". Solo tiene valores de la pila local: la URL del backend, la de Supabase local, la anon key de demostración que trae `supabase start` (es pública e igual en toda instalación local) y una contraseña para el usuario de prueba. No hay tokens reales.

## Qué prueba

| Carpeta | Petición | Espera |
|---|---|---|
| 0. Preparación | Registro en Supabase Auth | 200, usuario nuevo `postman-…@prueba.brota.test` |
| 0. Preparación | Login inicial y creación del perfil (`POST /api/auth/register-perfil`) | 201 |
| 1. Login | Login correcto | 200, `access_token` |
| 1. Login | Login con clave mala | 400, `error_code: invalid_credentials` y `msg` |
| 2. Perfil | `GET /api/perfil/:userId` con token | 200, el perfil propio |
| 2. Perfil | `GET /api/perfil/:userId` sin token | 401, `message` |
| 3. Programas | `GET /api/programas` | 200, lista paginada |
| 4. Contacto | `POST /api/contacto` válido | 200 |
| 4. Contacto | `POST /api/contacto` con asunto inválido | 400, `message: "Asunto inválido."` |
| 4. Contacto | `POST /api/contacto` con `telefono` numérico (DEF-07) | 400, `message: "Formato de datos inválido."` |

Cada petición comprueba en su pestaña Tests el código de estado, que el cuerpo sea JSON y, en los errores, el campo `message`.

Tres diferencias con la lista T6, porque así es la API:

- **Puerto 3001, no 3000.** El backend escucha en `PORT`, que por defecto es 3001 (`server.js`, `.env.example`, proxy de Vite).
- **El login va a Supabase Auth.** El backend no tiene endpoint de login: el frontend inicia sesión directo contra Supabase (`/auth/v1/token`). Supabase devuelve el texto del error en `msg`, no en `message`, y eso es lo que se comprueba.
- **`GET /api/perfil/:userId`.** No existe `GET /api/perfil` a secas. El perfil propio se pide con el id del usuario, que la colección toma del login.

## Cómo correrla

Con Docker abierto, desde la raíz del repositorio:

```bash
npx supabase start -x studio,imgproxy,mailpit,realtime,storage-api,edge-runtime,logflare,vector,supavisor,postgres-meta
npx supabase db reset

# Backend contra la BD local (las variables exportadas ganan sobre backend/.env)
eval "$(npx supabase status -o env --override-name api.url=SUPABASE_URL --override-name auth.service_role_key=SUPABASE_SERVICE_KEY | grep -E '^(SUPABASE_URL|SUPABASE_SERVICE_KEY)=' | sed 's/^/export /')"
pnpm --filter backend start &

npx newman run docs/postman/brota.postman_collection.json -e docs/postman/local.postman_environment.json
```

**Ojo con el puerto 3001.** Si tienes encendido el entorno de `compose.yaml` (contenedor `documentacion_brota-backend-1`), ese backend ocupa el 3001 y habla con la Supabase remota del `backend/.env`. Tu backend no arranca y newman le pegaría al del contenedor, que escribiría el usuario y los contactos de prueba en esa base. Antes de correr la colección, confirma que `GET /api/programas` devuelve los programas del seed (ids `40000000-…`). Si el 3001 está ocupado, levanta el backend en otro puerto y pásalo a newman:

```bash
PORT=3101 pnpm --filter backend start &
npx newman run docs/postman/brota.postman_collection.json -e docs/postman/local.postman_environment.json --env-var baseUrl=http://localhost:3101
```

`/api/contacto` permite 5 envíos cada 15 minutos por IP y la colección usa 3. Si se corre dos veces seguidas, la segunda recibe 429 en contacto: hay que esperar o reiniciar el backend.

Los usuarios que crea la colección usan el dominio `@prueba.brota.test`, el mismo que borra la limpieza de las pruebas de integración (`backend/tests/helpers/bdPruebas.js`). Un `npx supabase db reset` también los elimina.
