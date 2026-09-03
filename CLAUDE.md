# CLAUDE.md — Contexto del proyecto Brota

## Manual de marca
Ver **[BRAND.md](./BRAND.md)** para colores, tipografía, voz, tono, componentes UI y contexto del producto.
Cualquier cambio visual debe respetar la paleta y los tokens definidos ahí.

## Stack
- **Frontend**: React 19 + Vite 7 + TailwindCSS 4 (en `frontend/`)
- **Backend**: Node.js + Express 5 CommonJS (en `backend/`, puerto **3001**)
- **DB/Auth**: Supabase (PostgreSQL + Supabase Auth)
- **Dev server frontend**: `npm run dev` desde `frontend/` — corre en puerto 5173 o 5174

## Sincronización con la app móvil (Flutter)

Existe una app móvil hermana en `~/Proyectos/brota_flutter_app/` (Clean
Architecture, consume este mismo backend). Su documentación de contexto
(`MOBILE_DESIGN_BRIEF.md`, `FUNCTIONAL_CONTENT_BRIEF.md`,
`WEB_PARITY_ROADMAP.md`) se escribió auditando este repo en un momento
dado y **se desactualiza silenciosamente** cada vez que acá se agrega un
endpoint, se cambia el esquema de una tabla, se agrega/quita una
pantalla, o se toca algo de marca (colores, tipografía, la mascota
Broti). La sesión anterior tuvo que hacer una auditoría manual completa
(backend+frontend+`git log`) para reconstruir 48 commits de diferencia
— evitable si se deja un rastro incremental.

**Regla:** cuando termines un cambio en este repo que afecte a algo de lo
de arriba (endpoint nuevo/cambiado/borrado, tabla o columna nueva,
pantalla nueva o que cambió de alcance, cambio de paleta/tipografía/
assets de marca, o cualquier decisión de producto que el móvil debería
replicar), agregá una entrada corta a
**`CHANGELOG_PARA_MOVIL.md`** (raíz de este repo) — fecha, hash del
commit, qué cambió, por qué le importa al móvil. Dos líneas alcanzan; no
hace falta prosa larga, es para que la próxima sesión del lado móvil lea
el changelog en vez de re-auditar todo el repo desde cero.

## Túnel de pruebas (para que compañeros prueben desde internet, fase de beta con el equipo — el despliegue real es a fin de semestre)
Solo hace falta tunelizar el **frontend** (puerto 5173) — el `/api` del frontend ya proxea a `localhost:3001` vía `vite.config.js` (`server.proxy['/api']`), así que el backend no necesita exponerse por separado.

**Con ngrok (actual, agosto 2026)** — se prefirió sobre cloudflared por tener dominio estático gratis (no cambia entre reinicios, a diferencia del quick tunnel de cloudflared):
```bash
ngrok http 5173
```
Requiere cuenta gratuita en ngrok.com + `ngrok config add-authtoken <token>` una vez (token en `~/.config/ngrok/ngrok.yml`, no versionado). El plan gratis da 1 dominio estático — reclamarlo desde el dashboard de ngrok (Domains → Create) y correr `ngrok http --domain=<tu-dominio>.ngrok-free.app 5173` para que la URL no cambie más entre reinicios.

**Alternativa sin cuenta:** `cloudflared tunnel --url http://localhost:5173` — funciona igual pero la URL es aleatoria y cambia en cada reinicio del proceso, con el aviso propio de Cloudflare de que estos "quick tunnels" no tienen garantía de uptime.

Tres cosas que hay que tener en cuenta o el registro/login falla en silencio o con error de servidor:
1. **`vite.config.js`** tiene `server.allowedHosts: true` (Vite 5+ rechaza por defecto cualquier `Host` header que no sea localhost — necesario para que el dev server acepte el dominio del túnel, sea `*.ngrok-free.app` o `*.trycloudflare.com`).
2. **`backend/.env` → `FRONTEND_URL`** debe apuntar a la URL del túnel (no a `localhost:5173`) y el backend debe reiniciarse después de cambiarla (nodemon no vigila `.env`). El navegador manda el header `Origin` del túnel en cada POST aunque la request sea "same-origin" desde su perspectiva (pasa por el proxy de Vite hacia el backend), y `ORIGENES_PERMITIDOS` en `server.js` lo rechaza si no está en la lista → CORS bloquea silenciosamente `register-perfil` y cualquier otra llamada a la API, lo que se siente como "me regresa al login" sin mensaje de error claro (el signUp de Supabase Auth sí funciona porque pega directo a Supabase, no pasa por nuestro backend/CORS; el que falla es el segundo paso que crea la fila en `perfiles_usuario`).
3. **`server.js` → `app.set('trust proxy', 1)`**: tanto ngrok como cloudflared agregan `X-Forwarded-For` con la IP real del visitante. Sin esto, `express-rate-limit` tira `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` en cada petición que pasa por el túnel (Express ve el header pero no hay proxy de confianza declarado) — se manifestaba como "Error del servidor (429)" en el frontend. **Ojo:** usar `true` (confiar en cualquier cantidad de proxies) en vez de `1` dispara otro error, `ERR_ERL_PERMISSIVE_TRUST_PROXY` — `1` es el valor correcto porque solo el agente del túnel agrega ese header (Vite solo lo reenvía tal cual al proxear `/api`, no agrega otro salto). Si en el despliegue final hay más capas de proxy delante de Express (ej. el load balancer de Render/Railway), este número hay que revisarlo.

Si no está claro cuál es la URL del túnel activa en un momento dado, `ps -ef | grep -E "ngrok|cloudflared"` + revisar `backend/.env` (`FRONTEND_URL`) da el estado real.

## Despliegue — Railway (backend) + Vercel (frontend), agosto 2026

Reemplaza al túnel de la sección anterior para la fase de beta con el equipo (el túnel ngrok/cloudflared queda como alternativa rápida para pruebas puntuales sin depender de un despliegue).

**Desplegado y verificado (2026-09-02):**
- Backend (Railway): `https://desarrollo-brota-orietacion-vocacional-production.up.railway.app` — rama `main`, auto-deploy activado, healthcheck en `/api/health`.
- Frontend (Vercel): `https://desarrollo-brota-orietacion-vocacio.vercel.app` — rama `main`, auto-deploy activado.

**Gotcha real que costó un deploy roto:** Railway usa **Node 18** por defecto (Railpack), pero `@supabase/supabase-js` necesita WebSocket nativo (Node 22+) para inicializar el cliente Realtime — sin esto el deploy queda "CRASHED" al arrancar con `Error: Node.js 18 detected without native WebSocket support`. Fix: `backend/package.json` tiene `"engines": { "node": ">=22" }`, que Railpack respeta. Si se crea otro servicio Node en Railway, agregar lo mismo de entrada.

**El código no necesitó ningún otro cambio** — `server.js` ya leía `PORT`/`trust proxy`/`FRONTEND_URL` desde variables de entorno por el trabajo previo con el túnel (ver sección de arriba), así que Railway reutiliza exactamente el mismo mecanismo (su proxy de borde agrega un solo salto de `X-Forwarded-For`, igual que ngrok/cloudflared — `trust proxy: 1` sigue siendo el valor correcto).

**Archivos de config nuevos:**
- `backend/railway.json` — build con Nixpacks, `startCommand: npm start`, healthcheck en `/api/health` (ya existía, no es nuevo).
- `frontend/vercel.json` — `buildCommand`/`outputDirectory` explícitos + rewrite catch-all a `/index.html` (necesario para que las rutas de React Router no den 404 al refrescar, ej. `/dashboard/perfil`).

**Es un monorepo** — en ambas plataformas hay que fijar el "Root Directory" del servicio/proyecto (`backend` en Railway, `frontend` en Vercel) al crear el servicio; no alcanza con los `railway.json`/`vercel.json` solos.

**Variables de entorno:**
- Railway (backend): `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SMTP_*`, `FRONTEND_URL` (la URL real de Vercel, sin barra final). `PORT` la inyecta Railway solo, no seteársela a mano.
- Vercel (frontend): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (la URL real de Railway, sin `/api` al final — los services ya arman `${API_URL}/api/...`).
- **No reutilizar los valores de `backend/.env.example`** — son credenciales de desarrollo aceptadas como expuestas a propósito (ver sección de credenciales más abajo), no deben terminar siendo las de producción/beta.

**Orden de despliegue** (hay dependencia circular de URLs): desplegar primero el backend en Railway sin `FRONTEND_URL` todavía → tomar la URL que asigna Railway → desplegar el frontend en Vercel con `VITE_API_URL` apuntando a esa URL → tomar la URL de Vercel → volver a Railway y setear `FRONTEND_URL` con la URL real de Vercel (un cambio de variable de entorno dispara redeploy solo).

Ya avisado en `CHANGELOG_PARA_MOVIL.md` (entrada `2026-09-02`) que el backend tiene URL fija ahora — la app Flutter debería apuntar ahí en vez de a un túnel/IP local.

## TailwindCSS v4 — IMPORTANTE
El oxide scanner NO recursiona subdirectorios profundos sin `@source` explícito.
Ver `frontend/src/index.css` — tiene `@source` explícitos por cada subdirectorio (`pages/**`, `components/**`, etc.).
**No quitar los @source**, si no el CSS cae de 88 kB a ~9 kB y todo se ve sin estilos.

## Mapa de rutas y archivos clave
Referencia rápida para no tener que releer `App.jsx` / routers backend en cada sesión. Si cambian rutas o archivos, actualizar aquí.

### Frontend — rutas (`frontend/src/App.jsx`)
| Ruta | Componente | Notas |
|---|---|---|
| `/` | `pages/landing/LandingPage.jsx` | redirige a `/dashboard` si hay sesión |
| `/login` | `pages/landing/Login.jsx` | modos `login`/`signup`/`forgotPassword` vía `useAuth` |
| `/reset-password` | `pages/landing/ResetPassword.jsx` | |
| `/servicios`, `/saber-mas`, `/privacidad`, `/terminos`, `/contacto` | `pages/landing/*.jsx` | públicas, sin auth |
| `/dashboard` | `pages/dashboard/Dashboard.jsx` | home, layout 2 columnas (sin tarjeta de perfil en el sidebar — se movió al navbar, ver más abajo). Columna principal: `BannerCarousel` (carrusel de 5 slides: estado real del test + 4 banners informativos inventados, autoplay 6s + flechas + dots) → `FeedReciente` (recorta a 4, con relleno inventado si faltan publicaciones reales). Sidebar: racha + frase del día. Rediseño agosto 2026 — reemplaza al viejo `HeroBannerMini`/`QuickActions`/`ContinueSection` |
| `/dashboard/test` | `pages/dashboard/test-vocacional/TestVocacional.jsx` | subcomponentes en `test-vocacional/components/`. `TestResult.jsx` incluye radar (Chart.js) coloreado según familia de la categoría dominante + botón "Descargar PDF" |
| `/dashboard/profesiones` | `pages/dashboard/Profesiones.jsx` | |
| `/dashboard/recursos` | `pages/dashboard/Recursos.jsx` | |
| `/dashboard/comunidad` | `pages/dashboard/Comunidad.jsx` | + detalle en `comunidad/{ForoDetalle,HistoriaDetalle,ConvocatoriaDetalle,PostDetalle}.jsx` |
| `/dashboard/admin` | `pages/dashboard/admin/AdminPanel.jsx` | secciones en `admin/sections/*Section.jsx`, incluye `AnaliticasSection.jsx` (agosto 2026) |
| `/dashboard/ajustes` | `pages/dashboard/Ajustes.jsx` | **solo configuración** desde agosto 2026 (antes también tenía el formulario de perfil, ver fila de abajo): tipo de letra, cambio de contraseña (código OTP de 8 dígitos, vía `authService.sendPasswordReset`/`verifyOtpAndUpdatePassword`), cerrar sesión, sección "Próximamente" |
| `/dashboard/perfil` | `pages/dashboard/Perfil.jsx` | **NUEVO agosto 2026** — el formulario de "Mi perfil" que antes vivía dentro de Ajustes: nombre, apellido, ciudad, fecha de nacimiento (3 `GlassSelect` día/mes/año → `utils/calcularEdad.js` la convierte a entero, misma fórmula que `authController.registerPerfil`; no se persiste la fecha, solo la edad calculada), nivel educativo. Se llega desde el botón "Editar perfil" de la card flotante de `TopNavbar.jsx` (ver abajo) |
| `/dashboard/racha` | `pages/dashboard/Racha.jsx` | mascota animada según estado real de la racha (feliz/triste/guiño/neutral), fondo que va de gris a rojo según `racha_dias` — se llega clickeando la card de racha en el Dashboard (pasa `profile` por `location.state` para no re-pedirlo) |
| `/dashboard/broti` | `pages/dashboard/Broti.jsx` | **NUEVO agosto 2026** — personalización de la mascota, ver sección "Broti" más abajo para el detalle |
| `/dashboard/notificaciones` | `pages/dashboard/Notificaciones.jsx` | reemplaza al viejo placeholder `/dashboard/mensajes` (agosto 2026) — no hay chat, es un feed de respuestas a tus preguntas de comunidad + likes a tus historias, armado al vuelo sin tabla de notificaciones ni estado leído/no-leído |
| `/dashboard/rutas` | `pages/dashboard/Rutas.jsx` | chips de área académica (mismas 14 claves que `area_academica`) → contenido estático de `contenido_rutas` (materias comunes, temas previos, proyectos, links de búsqueda). **Sin IA en tiempo real** — contenido curado una vez (agosto 2026, ver `backend/scripts/historico/migration_rutas.sql` para el detalle del proceso; el contenido en sí vive en `backend/setup_database.sql`). Si ya hizo el test, separa las áreas de `categoriaPrincipal`/`categoriaSecundaria` (normalizadas con el mismo `CATEGORIA_ALIAS` que `algoritmoRecomendacion.js`) en "Relacionadas con tus resultados"; si no lo hizo, muestra un CTA a `/dashboard/test` en vez de la sección |
| `/dashboard/favoritos` | `PaginaEnConstruccion` (inline en `App.jsx`) | placeholder, sin implementar |

Todas las `/dashboard/*` se protegen inline en `App.jsx` con `puedeAcceder` (sesión o modo demo) — no hay un `ProtectedRoute` wrapper reusable (`components/ProtectedRoute.jsx` existió pero nunca se usó en ninguna ruta; se eliminó en la limpieza de código muerto de agosto 2026).

`Ajustes.jsx` también tiene una tarjeta "Apariencia" (selector de tipo de letra, `hooks/useFontFamily.js` — mismo patrón que `useDarkMode.js`, guarda en `localStorage` y setea `--font-body` en `<html>`; se inicializa desde `TopNavbar.jsx` para que se aplique en todo `/dashboard/*`, no solo al entrar a Ajustes) y una tarjeta "Próximamente" con configuraciones sugeridas pero sin implementar (notificaciones por correo, perfil público en Comunidad, tamaño de texto, exportar/eliminar cuenta, idioma) — son filas deshabilitadas a propósito, para no perder la idea; si se implementa alguna, sacarla de esa lista.

### Layout del dashboard
- **TopNavbar** (`components/Layout/TopNavbar.jsx`) — navbar horizontal sticky con tabs. Botón "Configuración" (ícono engranaje) → `/dashboard/ajustes`. Botón "Mi perfil" (avatar+nombre) → **ya no navega**, abre una card flotante (`position: absolute`, animación de opacidad+escala ~160ms, se cierra con clic afuera vía listener en `document`) con nombre, ciudad, edad, nivel educativo y % de perfil completo, más un botón "Editar perfil →" que sí navega a `/dashboard/perfil` — agosto 2026, reemplaza al panel que se había puesto primero en el sidebar del Dashboard (se movió acá tras feedback: "hay dos perfiles", el navbar es global a todo `/dashboard/*` y el sidebar solo vivía en la home)
- **DashboardLayout** (`components/Layout/DashboardLayout.jsx`) — wrapper simple con TopNavbar
- **ELIMINADO**: sidebar vertical (`components/Layout/Sidebar.jsx` — dejó de usarse en DashboardLayout y el archivo huérfano se borró en la limpieza de código muerto de agosto 2026; no confundir con `pages/dashboard/comunidad/components/Sidebar.jsx`, que sí sigue en uso en `Comunidad.jsx`)
- **Logout por inactividad** (`hooks/useInactivityLogout.js`, inicializado en `TopNavbar.jsx` — cubre todo `/dashboard/*`): 30 min sin interacción (mouse/teclado/scroll/touch) cierra sesión automático; avisa 1 min antes con un banner fijo abajo ("Seguir conectado" / "Cerrar sesión"). Cualquier actividad reinicia el timer, incluso con el aviso abierto.
- **`pages/dashboard/components/BannerCarousel.jsx`** (agosto 2026) — carrusel de la home del Dashboard, 5 slides: la primera es el estado real del test vocacional (mismo estado que tenía el viejo `ContinueSection.jsx`, que ya no se usa ahí — el archivo huérfano se borró en la limpieza de código muerto de agosto 2026, junto con `HeroBanner.jsx`, `ProfileCard.jsx` y `QuickActions.jsx`, los otros componentes que reemplazó este mismo rediseño), las otras 4 son banners informativos con copy inventado (SNIES, RIASEC, Rutas, Comunidad) — **contenido de relleno, no datos reales**, ajustar si se quiere promocionar otra cosa. Autoplay cada 6s (`setInterval`, se pausa en `onMouseEnter`), navegación manual con flechas y dots que reinician el ciclo.
- **`pages/dashboard/components/FeedReciente.jsx`** — acepta prop `limite` (Dashboard la usa en 4). Si las publicaciones reales son menos que `limite`, rellena con `RELLENO` (array hardcodeado en el mismo archivo, 5 publicaciones inventadas) para que el feed no se vea vacío durante la beta — **nunca reemplaza publicaciones reales, solo completa lo que falta**, y los ítems de relleno enlazan a `/dashboard/comunidad` en general (no a un detalle inventado, para no romper la navegación). Cuando haya suficiente actividad real, el `RELLENO` deja de aparecer solo.

### Backend — API (`backend/src/routes/*.js`, montadas bajo `/api`)
| Router | Base | Contenido |
|---|---|---|
| `auth.js` | `/api/auth` | `POST /register-perfil` |
| `perfil.js` | `/api/perfil` | cuestionario, resultado, recomendaciones, `GET/PATCH /:userId` (PATCH = autoedición, usado por `Ajustes.jsx`; el `GET` también actualiza la racha de días como efecto secundario, ver `actualizarRacha()` en el controller) |
| `programas.js` | `/api/programas` | `GET /`, `GET /stats` |
| `comunidad.js` | `/api/comunidad` | foros, posts, historias, preguntas (+ `POST /:id/reportar`), convocatorias, `GET /notificaciones`, `GET /feed` (últimas 8 publicaciones mezclando posts/historias/preguntas, para `FeedReciente` del Dashboard) |
| `contacto.js` | `/api/contacto` | `POST /` |
| `admin.js` | `/api/admin` | CRUD usuarios/instituciones/programas/cuestionarios/preguntas/contactos + moderación `preguntas-comunidad` (`GET`/`DELETE`) + sincronización MEN + `GET /analytics` (agosto 2026) |
| `rutas.js` | `/api/rutas` | `GET /` (áreas disponibles), `GET /:area` (contenido estático — temas previos, proyectos, recursos) |

`backend/src/routes/` también tiene un archivo `router.use` (sin extensión `.js`) — es código muerto y roto, un pegado de IA sin limpiar que nunca se importó en ningún lado (detalle completo en `docs/modelo_datos.md`, sección "Tablas huérfanas"). No confundirlo con una ruta real.

Cada router habla con controladores en `backend/src/controllers/` — **ya no son un archivo por router**: `admin.js` reparte entre `controllers/admin/{usuarios,instituciones,programas,cuestionarios,preguntas,contactos,preguntasComunidad}Controller.js`, y `comunidad.js` entre `controllers/comunidad/{foros,historias,preguntas,convocatorias,notificaciones}Controller.js` (split por SOLID/SRP en el commit `ca87128`, agosto 2026 — antes eran `adminController.js`/`comunidadController.js` monolíticos, esos nombres ya no existen). Middlewares: `verificarAuth.js` (JWT), `verificarAdmin.js` (rol admin, ver Bug #8 más abajo — **ojo**: la entrada de ese bug menciona una tabla `roles` separada que ya no existe en el diseño actual, el middleware compara `perfiles_usuario.rol` directo, ver `docs/modelo_datos.md`).

### Servicios frontend (`frontend/src/services/*.js`)
Un service por dominio, todos hablan con el backend vía `VITE_API_URL`: `authService`, `perfilService`, `programasService`, `comunidadService`, `contactoService`, `adminService`, `rutasService`. El modo demo (ver más abajo) no usa un service propio — es lógica inline en `App.jsx`/`Login.jsx` (`isDemoMode` + `localStorage`); existió un `authServiceDemo.js` de un enfoque anterior, quedó huérfano y se eliminó en la limpieza de código muerto de agosto 2026. `getAuthHeaders`/`parseResponse`/`API_URL` viven en `services/apiClient.js` (compartido, no duplicar en cada service nuevo). `utils/validation.js` es la única fuente de validación de formularios — no crear otra en `services/`.

### Archivos grandes — evitar leerlos completos si el cambio es puntual
`TestVocacional.jsx` / `Profesiones.jsx` / `Dashboard.jsx` (~350-390L). Preferir `grep -n` para ubicar la función/sección y `Read` con `offset`/`limit` sobre ese rango.
`Comunidad.jsx`, `UsuariosSection.jsx`, `ContactosSection.jsx`, y los antiguos `comunidadController.js`/`adminController.js` ya NO están en esta lista — se dividieron en julio/agosto 2026, ver sección siguiente.

### Módulos divididos por SOLID/SRP (julio 2026)
Estos tres eran archivos únicos de 280-760 líneas mezclando fetch de datos, estado de modales y presentación. Se dividieron en un componente orquestador (estado + llamadas al service) + subcomponentes de presentación en una carpeta `components/` hermana. Patrón a seguir si otro archivo grande necesita el mismo tratamiento:

- **`pages/dashboard/Comunidad.jsx`** (760L → 158L) — orquesta tabs/modales; UI de cada tab vive en `comunidad/components/{Foros,Historias,Preguntas,Convocatorias,Sidebar}.jsx`, los formularios modales en `ModalCompartirHistoria.jsx`/`ModalHacerPregunta.jsx`, y las piezas compartidas en `primitivos.jsx` (solo componentes, por Fast Refresh) + `constantes.js` (datos/helpers puros — `avatarColor`, `TIPO_COLOR`, etc).
- **`pages/dashboard/admin/sections/UsuariosSection.jsx`** (426L → 229L) — orquesta CRUD; tabla+paginación en `usuarios/TablaUsuarios.jsx`, los 4 modales (Ver/Editar/Eliminar/Nuevo) en `usuarios/Modal*.jsx`, constantes de roles en `usuarios/constants.js`. `Campo`/`Detalle` (inputs de formulario reutilizables) se movieron a `admin/components/formPrimitives.jsx` — **este mismo patrón Campo/Detalle sigue duplicado sin migrar en `CuestionariosSection.jsx`, `InstitucionesSection.jsx` y `OportunidadesSection.jsx`**, sería el siguiente paso si se tocan esos archivos.
  **Carga masiva de usuarios (CSV, agregada por Julián, commit `a4d5bd2`; soporte Excel + endpoint real de bulk-insert, agosto 2026)**: acepta `.csv`, `.xlsx` y `.xls`. El CSV se sigue parseando con `papaparse`; el Excel se parsea client-side con `xlsx` (SheetJS, `import()` dinámico dentro de `handleArchivo`/`descargarPlantilla` en `UsuariosSection.jsx` — mismo patrón que `utils/exportarPDF.js` con jspdf/html2canvas, para no sumar los ~430kB de la librería al bundle inicial). Ambos formatos se normalizan a la misma forma de filas (columnas esperadas en `COLUMNAS_ESPERADAS`), con previsualización y reporte por fila tras importar. Botón "Descargar plantilla" genera un `.xlsx` de ejemplo con `XLSX.utils.json_to_sheet`.
  **Ya no es un loop client-side**: `POST /api/admin/usuarios/masivo` (`createUsuariosMasivo` en `controllers/admin/usuariosController.js`) crea todas las filas en una sola request del backend — resuelve el problema viejo de N requests secuenciales contra el límite general de 300/15min (`server.js`). Valida formato de email, `rol` contra el enum (`estudiante/orientador/moderador/admin`), `edad` numérica y duplicados de email dentro del mismo archivo antes de crear cada fila; límite de `MAX_FILAS_MASIVO = 500` por carga. La lógica de creación (Auth + `perfiles_usuario` + rol) se extrajo a `crearUsuarioUnico()`, reutilizada también por el `POST /api/admin/usuarios` individual.
  El parseo de Excel es client-side, no en el backend — `backend/package.json` sigue teniendo `xlsx` como dependencia sin usar (ya estaba así desde antes de esto, quedó de un intento previo sin terminar). Se agregó `xlsx` (misma versión, `^0.18.5`) a `frontend/package.json`, que es donde realmente se usa ahora.
  **Mismo formato que el registro público (agosto 2026)**: tanto "Nuevo usuario" como la carga masiva piden ahora `fecha_nacimiento` (no una edad suelta), `grado` y `telefono`, con los mismos values que usa `SignupCard.jsx` para `nivel_educativo`/`grado` (`NIVEL_EDUCATIVO_OPCIONES`/`GRADO_OPCIONES` en `usuarios/constants.js`, no inventar otros valores). El backend calcula la edad entera desde `fecha_nacimiento` con `backend/src/utils/calcularEdad.js` (`calcularEdadDesdeFecha`, misma fórmula que `frontend/src/utils/calcularEdad.js`) — reutilizado también por `authController.registerPerfil`, que de paso quedó arreglado: antes recibía `grado`/`telefono` del formulario de registro real y los descartaba en silencio (no había columna donde guardarlos), ahora si las persiste. `ModalEditarUsuario.jsx` sigue editando `edad` como número (un usuario ya existente no tiene la fecha de nacimiento guardada, nunca se persiste, mismo criterio que `Perfil.jsx`) pero sí ganó `grado`/`telefono`.
  **⚠️ Requiere migración manual pendiente**: `grado VARCHAR(50)` y `telefono VARCHAR(50)` se agregaron a `perfiles_usuario` en `backend/setup_database.sql` (instalaciones nuevas) y en `backend/scripts/historico/migration_grado_telefono.sql` (para la base ya existente) — **este último no se ha corrido contra Supabase todavía**, hay que ejecutarlo a mano en el SQL Editor de Supabase antes de usar cualquiera de estas rutas (`register-perfil`, `POST /api/admin/usuarios`, `POST /api/admin/usuarios/masivo`, `PATCH /api/admin/usuarios/:id`) o los inserts/updates van a fallar contra columnas que no existen.
  **`OportunidadesSection.jsx` es un nombre engañoso**: pese a llamarse "Oportunidades" en el menú, hace CRUD de **`programas`** (académicos), no de `convocatorias` (becas/eventos). `convocatorias` **no tiene CRUD en el panel admin** — solo lectura pública (`GET /api/comunidad/convocatorias`) y las 5 filas semilla de `backend/setup_database.sql`; para agregar una convocatoria nueva hoy hay que hacerlo a mano en Supabase.
- **`pages/dashboard/admin/sections/ContactosSection.jsx`** (280L → 125L) — orquesta fetch/filtro/paginación; la tarjeta expandible de cada solicitud vive en `contactos/ContactoCard.jsx`, estados/labels en `contactos/constants.js`.

**Backend (agosto 2026, commit `ca87128`):** `adminController.js` (~630L) y `comunidadController.js` (~700L) monolíticos se dividieron en un archivo por entidad, sin capa orquestadora — cada router (`routes/admin.js`, `routes/comunidad.js`) importa directo de `controllers/admin/*.js` / `controllers/comunidad/*.js`. Al agregar un endpoint nuevo de un dominio existente, va en el controller de ese dominio (ej. moderación de preguntas de comunidad → `controllers/admin/preguntasComunidadController.js`), no en un archivo nuevo por endpoint.

Regla de Fast Refresh de Vite (`react-refresh/only-export-components`): un archivo `.jsx` que exporta componentes no debe exportar también constantes/funciones sueltas — por eso los datos puros siempre quedaron en un `.js` separado (`constantes.js`, `formatFecha.js`), nunca mezclados con los componentes.

## Rediseño visual implementado (junio 2026)

### Basado en diseños en `frontend/public/diseños/`
Se implementaron todos los cambios visuales basados en los 8 archivos PNG de diseño.

#### ✅ Completado

**01-Landing**
- Nav links actualizados: Conoce Brota, Beneficios, Testimonios, FAQ
- Botón CTA → "Empezar gratis"
- Stats row: 4 bloques verdes (Orientación gratuita, Explorar áreas, Resultados personalizados, Toma decisiones)
- Sección Features con `id="por-que-brota"` para anchor

**02-Registro / 03-Login** (`Login.jsx` + `AuthCardShell.jsx` + `LoginCard.jsx`)
- Fondo: crema/off-white `bg-[#f2efea]` (claro) / `bg-[#0d110e]` (oscuro)
- Layout dos columnas: izquierda = branding (cambia por modo), derecha = card blanca limpia
- Modo login: "Tu camino sigue justo donde lo dejaste."
- Modo signup: "Crea tu cuenta y empieza a crecer." + lista de features
- Footer bar mínimo con links y dark mode toggle
- `AuthCardShell.jsx` rediseñado: fondo blanco, borde sutil, sin fondo ámbar

**04-Dashboard** (`Dashboard.jsx`)
- Top navbar horizontal en lugar de sidebar vertical
- HeroBanner verde con saludo "¡Hola, {nombre}! 🌱"
- 4 quick action cards en grid 2×2
- ProfileSidebar derecho: avatar con inicial, nombre, badge admin, "Completar perfil", racha 7 días

**05-TopNavbar** (`components/Layout/TopNavbar.jsx`) — NUEVO ARCHIVO
- Logo + "BROTA" a la izquierda
- Tabs: Inicio, Explorar, Test vocacional, Rutas, Recursos, Comunidad
- Derecha: Panel Admin (condicional para admins), ⭐ favoritos, 🌙/☀️ dark mode, avatar

**06-Profesiones** 
- Header actualizado: "Explora tu futuro profesional" + contador de programas grande

**08-Recursos**
- Tabs actualizados: Todos, Guías, YouTube (era Videos), Becas, Podcasts (era Herramientas)
- Layout más limpio: header con búsqueda inline + tabs debajo

#### 🔲 Pendiente (para próxima sesión)
- **Admin panel (05)**: revisar vs diseño — puede necesitar ajustes de layout
- **Test vocacional (07)**: progress bar superior con dots (actualmente usa sidebar de progreso)
- **Landing**: agregar secciones Testimonios y FAQ reales con IDs para los anchors
- **Registro (02)**: verificar que el card de signup tenga el `description` correcto
## ✅ Integración MEN API (completado junio 2026)

### Archivos creados/modificados
- `backend/src/controllers/sincronizacionController.js` — lógica completa de sync
- `backend/src/routes/admin.js` — rutas `GET /api/admin/sincronizacion/estado` y `POST /api/admin/sincronizacion/ejecutar`

## Analíticas y exportación a PDF (agosto 2026)
- **Panel admin → pestaña "Analíticas"** (`admin/sections/AnaliticasSection.jsx`): radar (promedio de afinidad % por categoría, entre todos los `resultados` guardados) + barras (cuántos usuarios tienen cada categoría como principal). Datos de `GET /api/admin/analytics` (`controllers/admin/analyticsController.js`), que reutiliza `CATEGORIA_ALIAS`/`normalizarScore`/`pctAbsoluto` de `utils/algoritmoRecomendacion.js` (ahora exportados) en vez de duplicar la normalización de categorías otra vez.
- **Resultado del test vocacional** (`test-vocacional/components/TestResult.jsx`): mismo radar por usuario individual, coloreado según la familia (verde primario / naranja acento) de su categoría principal.
- **`frontend/src/utils/areaColors.js`** — NUEVO, única fuente de la asignación de familia de color por área académica (misma que usa `Profesiones.jsx` para las 14 categorías) + `normalizarCategoria` (mismo alias que `Rutas.jsx`/backend, sin duplicarlo por 5ta vez) + `getCssVar` (lee custom properties resueltas para pasarle colores reales a Chart.js, que no siempre resuelve `var(--x)` dentro de `<canvas>`).
- **`frontend/src/utils/exportarPDF.js`** — NUEVO, `exportarElementoAPDF(elemento, nombreArchivo)` con `html2canvas` + `jsPDF`, usado por ambas pantallas. Ambas librerías se importan con `import()` dinámico dentro de la función (no en el top del archivo) para no sumar ~180kB al bundle inicial de toda la app — solo se descargan cuando alguien hace clic en "Descargar PDF".
- Librerías nuevas: `chart.js` + `react-chartjs-2` (gráficas), `jspdf` + `html2canvas` (export PDF).
- `frontend/src/services/adminService.js` — `getSincronizacionEstado()` y `ejecutarSincronizacion()`
- `frontend/src/pages/dashboard/admin/sections/ConfiguracionSection.jsx` — panel de sync con estado, botones verificar/sincronizar
- `men_sincronizacion` ya está incluida en `backend/setup_database.sql` (consolidado agosto 2026) — no hace falta un script aparte para instalaciones nuevas.

### Tabla `men_sincronizacion`
```sql
CREATE TABLE men_sincronizacion (
  id SERIAL PRIMARY KEY, ejecutada_en TIMESTAMPTZ DEFAULT NOW(),
  remote_timestamp BIGINT, programas_importados INT, instituciones_importadas INT,
  estado TEXT DEFAULT 'exitosa', error TEXT
);
```

### Cómo funciona
1. **Verificar**: llama a metadata de datos.gov.co, compara `rowsUpdatedAt` con el timestamp guardado en `men_sincronizacion`
2. **Sincronizar**: descarga todos los programas activos (paginado 5000/lote), borra las tablas `programas` e `instituciones`, inserta los nuevos datos aplicando el `NBC_MAP` para asignar `area_academica`
3. Admin Panel → Configuración → panel "Datos educativos"

### Dataset MEN
- Endpoint: `https://datos.gov.co/resource/upr9-nkiz.json`
- Metadata: `https://datos.gov.co/api/views/upr9-nkiz.json` (campo `rowsUpdatedAt`)
- ~14.644 programas activos de todo el país
- Licencia CC-BY-SA 4.0 — oficial del Ministerio de Educación Nacional

### Pendiente
- Borrar datos viejos de Bogotá de las tablas antes de primera sync nacional

`backend/scripts/seed_instituciones.js` (datos hardcoded obsoletos) y `backend/scripts/import_snies.js` (import puntual de SNIES Bogotá, superado por esta sync nacional) se eliminaron en la limpieza de código muerto de agosto 2026. `backend/scripts/run_migration.js` también se eliminó — la tabla `men_sincronizacion` que creaba ya vive en `backend/setup_database.sql`.

---

## 🐛 Bugs del sistema de recomendaciones (junio 2026)

Causaban que el test vocacional mostrara el perfil de áreas pero ningún programa recomendado. Todos resueltos salvo el #4.

| # | Archivo | Qué pasaba | Fix |
|---|---|---|---|
| 1 ✅ | `utils/algoritmoRecomendacion.js` | Cuestionario usa claves `emprendimiento`/`ambiente`; `programas.area_academica` solo tiene `negocios`/`ambiental` → 0 resultados | `CATEGORIA_ALIAS` normaliza el perfil (scores, categoriaPrincipal/Secundaria) antes de las queries. **Si se agregan categorías nuevas al cuestionario, añadirlas aquí.** |
| 2 ✅ | `utils/algoritmoRecomendacion.js` | `generarRazones()` retorna `string[]`, pero `razones` es columna `TEXT` → insert fallaba silenciosamente | `razones: JSON.stringify(item.razones)` al insertar. Para leerlo en frontend habría que `JSON.parse`; hoy no se muestra en la UI. |
| 3 ✅ | `controllers/sincronizacionController.js` | Sync hace `DELETE FROM programas`; FK `recomendaciones.programa_id` con `ON DELETE CASCADE` borraba las recomendaciones de todos los usuarios | `DELETE FROM recomendaciones` explícito antes de borrar programas. Limitación: los usuarios igual pierden recomendaciones en cada sync (se regeneran al rehacer el test); para evitarlo habría que pasar a upsert. |
| 4 ⚠️ ABIERTO — diagnóstico corregido (agosto 2026) | `controllers/sincronizacionController.js` → `getAreaAcademica()` | 1.342 de 14.644 programas activos (9.2%) quedan con `area_academica = NULL` y nunca aparecen en recomendaciones (el algoritmo filtra `.eq('area_academica', cat)`) | **No es un mapeo incompleto** — se verificó trayendo el dataset completo del MEN y probando cada fila: el 99.7% de los NULL tienen `nombrenbc`/`nombreareaconocimiento` = `"Sin clasificar"` **en la fuente misma del MEN**, no hay NBC real que agregar a `NBC_MAP`. No bloqueante — sí aparecen en Profesiones. Única vía real de reducirlo: inferir el área por palabras clave del *nombre* del programa (heurístico, no mapeo exacto contra la taxonomía oficial) — evaluado y descartado por ahora (2026-08-18), decisión del usuario. |
| 5 ✅ | `controllers/perfilController.js` → `obtenerRecomendaciones` | `.limit(6)` no coincidía con `MAX_RECOMENDACIONES = 8` | Cambiado a `.limit(8)` |
| 6 ✅ | `utils/perfilvocacional.js` | `calcularPorcentajes` trataba `perfilVocacional` como `{categoria: puntos}` cuando en realidad es `{categoriaPrincipal, categoriaSecundaria, scores: [...]}` → porcentajes basura | Ahora itera `perfilVocacional.scores` |
| 7 ✅ | `backend/setup_database.sql` (líneas 155/170/184) | Conflicto de git sin resolver | Resuelto manteniendo numeración de HEAD (tablas 10, 11, 12) |
| 8 ✅ | `middlewares/verificarAdmin.js` | Tabla `perfiles` (no existe, es `perfiles_usuario`) + `.eq('id', user.id)` (debe ser `user_id`) + comparaba contra un rol mal resuelto. Tumbaba **todos** los endpoints `/api/admin/*` con 403, incluso para admins reales | Fix de esta fila (histórico, junio 2026): `from('perfiles_usuario').select('roles ( nombre )').eq('user_id', user.id)`, check `perfil?.roles?.nombre !== 'Administrador'`. **⚠️ Ya no es así**: verificado contra Supabase real en agosto 2026 (ver `docs/modelo_datos.md`) — la tabla `roles` sigue existiendo pero es legado sin uso (2 filas, ningún código la referencia). El middleware actual compara `perfiles_usuario.rol !== 'admin'` directo, que es lo correcto para el esquema de hoy. Si se vuelve a tocar este archivo, **no** reintroducir el join a `roles`. |

---

## Variables de entorno — arranque rápido

Los archivos example tienen credenciales reales de desarrollo. Para arrancar en cualquier máquina:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

**Backend** (`backend/.env`): `SUPABASE_URL` (sin `/rest/v1/`), `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `SMTP_*`, `PORT=3001`, `FRONTEND_URL`

**Frontend** (`frontend/.env.local`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL=http://localhost:3001`

> ⚠️ En producción reemplazar TODAS las credenciales de los example antes de deployar.

### ⚠️ Credenciales reales expuestas en el repo (decisión consciente, no reportar como hallazgo nuevo)
`backend/.env.example` tiene la `SUPABASE_SERVICE_KEY` real, el `JWT_SECRET` y el `SMTP_PASS` (Gmail app password) hardcodeados, en un repo **público** de GitHub. (`backend/scripts/import_snies.js` y `seed_instituciones.js` también las tenían hardcodeadas, pero ambos scripts se eliminaron en la limpieza de código muerto de agosto 2026 — esa key ya no vive ahí; sigue expuesta en `.env.example`.)
Decisión del usuario (2026-07-11): se mantiene así **durante la fase de desarrollo** a propósito, para facilitar el arranque en cualquier máquina sin gestionar secretos. Antes de ir a producción se rotarán todas las credenciales (Supabase service_role key, SMTP app password, JWT_SECRET) y se sacarán del repo (placeholders + `.env` real fuera de git).
**No volver a reportar esto como hallazgo urgente ni intentar "arreglarlo" de forma proactiva** — es un riesgo aceptado temporalmente. Sí se puede recordar como pendiente si se habla de checklist de despliegue a producción.

### RLS (Row Level Security)
Todas las tablas de `public` tienen RLS habilitado con una policy `"solo_service_role"` (`FOR ALL TO service_role`) — el backend con `SUPABASE_SERVICE_KEY` bypassea RLS igual, así que es defensa en profundidad, no algo que cambie el comportamiento actual. El frontend nunca hace `.from()` directo (solo `supabase.auth.*`), así que no hace falta ninguna policy para `anon`/`authenticated`. **Si se crea una tabla nueva, agregarle RLS en el mismo lugar donde se define** (`ALTER TABLE x ENABLE ROW LEVEL SECURITY` + la policy de `service_role`, ver el bloque `DO $$ ... FOREACH t IN ARRAY [...]` al final de `backend/setup_database.sql` como plantilla — agrega la tabla nueva a ese array) — 10 tablas se quedaron sin esto por varias migraciones seguidas (agosto 2026) hasta que el linter de seguridad de Supabase lo marcó. Detalle histórico en `backend/scripts/historico/migration_rls_comunidad_rutas.sql`.

## Deuda técnica y decisiones abiertas conocidas (auditoría agosto 2026)
Consolidado en un solo lugar — antes esto vivía disperso en historial de conversación, no en el repo.

| Ítem | Estado | Detalle |
|---|---|---|
| `GET /api/programas` y `/api/programas/stats` sin `verificarAuth` | ✅ Intencional, confirmado | Son el catálogo de programas del MEN, dataset público (CC-BY-SA) — no hay dato sensible que proteger. No agregarle auth por reflejo si se vuelve a tocar ese router. |
| `JWT_SECRET` en `.env` | Variable muerta | `verificarAuth.js` valida con `supabase.auth.getUser(token)`, no con JWT propio (el comentario del propio archivo lo dice). Queda en `.env.example` por inercia; se puede quitar cuando se limpien credenciales para producción (ver sección de arriba). |
| `Campo`/`Detalle` duplicados | Sin resolver | Ya migrado a `admin/components/formPrimitives.jsx` solo en `UsuariosSection.jsx`/`ContactosSection.jsx`. Sigue copiado en `CuestionariosSection.jsx`, `InstitucionesSection.jsx`, `OportunidadesSection.jsx`. |
| Panel admin y landing sin migrar al sistema de tokens | ✅ Resuelto agosto 2026 | `admin/sections/*.jsx` y `pages/landing/*.jsx` usaban clases Tailwind con verdes hardcodeados (`bg-green-600 dark:bg-green-900/50`). Migradas a `bg-primary`/`text-primary`/etc., que ahora son parte del bloque `@theme` de `index.css` como referencias vivas a `var(--primary)` — dark mode automático sin `dark:` manual. Detalle en `BRAND.md` sección 7. |
| Taxonomía de 14 áreas académicas | Cuadruplicada | Definida por separado en `Profesiones.jsx`, `TestResult.jsx`, `utils/vocacionalCategorias.js` y `Rutas.jsx`. Si se agrega/renombra un área, tocar las 4. |
| Responsive / mobile | **Cero `@media` queries en todo el proyecto** | Todo el dashboard usa `style={{}}` inline con grids fijos (ej. `gridTemplateColumns: '1fr 1fr'` en `Dashboard.jsx`, `Profesiones.jsx`, `Ajustes.jsx`). En una pantalla angosta el layout se rompe (columnas no colapsan a 1). Hubo un prompt de rediseño mobile generado en junio 2026 para explorar en una herramienta de diseño externa, pero **nunca se llevó a código** — sigue siendo 100% desktop-only. Alto impacto si el usuario final (estudiantes de colegio) navega mayormente desde el celular. |
| Tests automatizados | **No existen** | Cero archivos `*.test.js`/`*.spec.js` en todo el repo (frontend y backend). Todo el QA de esta sesión fue manual (curl + revisión visual). |
| CI/CD | **No existe** | No hay `.github/workflows/` — nada corre lint/tests automático en cada push o PR. |
| Rate limiting en `/api/auth` | Solo el general (300/15min, compartido con toda la API) | No hay un límite específico y más estricto para intentos de login/registro (a diferencia de `/api/contacto`, que sí tiene el suyo de 5/15min). Para un despliegue público real, un atacante podría intentar fuerza bruta contra una cuenta puntual sin un límite dedicado a ese endpoint. |
| `backend/src/routes/router.use` | Código muerto, no borrado | Ver detalle en `docs/modelo_datos.md` — pegado de IA roto de junio 2026, nunca importado. Candidato a borrar, decisión pendiente del usuario. |
| Tablas huérfanas (`perfiles`, `roles`, `programa_categorias`, `perfiles_vocacionales`) | Sin borrar | Ver `docs/modelo_datos.md` — decisión pendiente del usuario, no proactiva. |
| `/dashboard/favoritos` | Placeholder sin implementar | Renderiza `PaginaEnConstruccion` en `App.jsx`; el link ya existe en la navegación pero no hay funcionalidad detrás. |

## Broti — personalización de la mascota (agosto 2026)

`perfiles_usuario.broti_config JSONB DEFAULT '{}'` (ya en `backend/setup_database.sql`, corrida contra producción — la migración aislada quedó archivada en `backend/scripts/historico/migration_broti.sql`) guarda un objeto `{ variante, fondo }` (ambas claves opcionales, `null`/ausente = nada equipado en esa categoría).

### `/dashboard/broti` (`Broti.jsx`)
Dos pestañas: **"Mi Broti"** (preview grande + lista de lo equipado por categoría con botón "Quitar") y **"Tienda"** (grid de 3 columnas por categoría, cada botón con thumbnail/nombre/badge Gratis-Premium, `disabled` mientras guarda). Se llega desde un botón en `/dashboard/racha` y desde la tarjeta de `Perfil.jsx`. `equipar(itemId)` en `Broti.jsx` hace toggle (clickear el mismo item ya equipado lo quita) y persiste con `actualizarBroti(user.id, nuevoConfig)` — en modo demo actualiza el estado local pero no llama al backend.

### Categorías (`frontend/src/utils/brotiCatalog.js`)
Fuente única de verdad del catálogo: `CATEGORIAS` (orden en que se muestran en la tienda), `ITEMS` (todos los items de todas las categorías), `getItem(id)`, `getItemsPorCategoria(categoria)`, `getBadgeBackground(item)` (CSS `background` para un thumbnail — swatch+color si no tiene `imagen`, o `url(...) center/cover` si la tiene), y `MASCOTA_BASE` (`/logos/logo-feliz.svg`, la mascota por defecto si no hay variante equipada). Dos categorías, **combinables entre sí** (una variante se puede tener puesta a la vez que un fondo):

- **`variante`** — imágenes completas alternativas de Broti, no piezas sueltas. Items actuales: `variante-panda` (gratis), `variante-zorro` (premium), `variante-lentes-rojos` y `variante-lentes-azules` (agosto 2026, gratis), en `frontend/public/broti/variantes/`. `BrotiAvatar.jsx`/`Broti.jsx` (`BrotiPreview`) eligen el `src` de la mascota con `config?.variante ? getItem(config.variante).imagen : MASCOTA_BASE`. Dos formas de sumar una variante, según qué tan distinta es del Broti base:
  - **Animal distinto** (panda, zorro): el usuario genera la imagen aparte con IA (mismo estilo de trazo grueso oscuro que el mascota original, para que no choquen visualmente) y la pasa ya armada. Llegan en PNG 1254×1254 con fondo negro sólido (no vienen con canal alfa real) — se les quita el fondo con flood-fill desde las 4 esquinas sobre negro (`scipy.ndimage.label`, para no tocar el contorno oscuro propio del dibujo, que no está conectado al fondo), se recortan al bounding box del contenido con un margen chico, se reducen a 600px de ancho y se guardan en `frontend/public/broti/variantes/<nombre>.png`.
  - **Paleta distinta del MISMO Broti** (lentes-rojos, lentes-azules): no hace falta IA externa. `logo-feliz.svg` es vectorial, cada pieza vive en su propio `<path id="...">` con color explícito (ej. `id="lentes-marco"` es el marco de los lentes, `fill="#16A34A"` en el original) y ya tiene fondo transparente — clonar el SVG completo y recolorear el `fill` de la pieza deseada alcanza. Guardado como `.svg` en la misma carpeta (los `<img src>` del catálogo aceptan `.png` y `.svg` por igual).
  En ambos casos, después solo hace falta un item nuevo en `ITEMS` con `categoria: 'variante'` e `imagen` apuntando al archivo.
- **`fondo`** — 6 fotos reales en `frontend/public/broti/fondos/` (cielo con arcoíris, bosque encantado, arrecife, desierto, ciudad de noche, espacio; 2 gratis + 4 premium), se dibujan como `background: url(...) center / cover` detrás de la mascota (círculo/card completo), no como badge encima.

**Se probó y se descartó** (antes de llegar a `variante`) un sistema de lentes/accesorios fusionados de verdad dentro del SVG del mascota — piezas sueltas combinables con `fondo`, cada una con su propio `transform` calculado para calzar con los ojos o un punto de anclaje. El resultado nunca terminó de verse bien: primera versión con accesorios de Recraft chocaba de estilo con el mascota base (doble contorno, doble brillo en los lentes); segunda versión con stickers generados a mano ya combinaba mejor de estilo pero tenía un bug real de z-order (las orejas, dibujadas después en el SVG, tapaban las patillas de los lentes). Se sacó todo el mecanismo (`BrotiMascota.jsx`, `brotiFusion.js`, los assets en `frontend/public/broti/lentes|accesorios/`) a favor de `variante` — quedan de referencia en `logos/variantes/` (lámina de stickers generada con IA, recortes individuales, SVG de Recraft) por si se retoma la idea de piezas combinables más adelante, pero no están en uso.

**`Racha.jsx` todavía NO respeta `variante`** — sigue mostrando siempre las 4 expresiones del perezoso (feliz/triste/guiño/base, según `racha_dias`/`racha_rota`) sin importar la variante equipada, porque cada variante hoy es una sola imagen estática sin sus propias expresiones. Si se agregan expresiones por variante habría que resolver ese cruce ahí (hoy `estadoMascota()` devuelve un path fijo a uno de los 4 SVG del perezoso).

Cada item tiene `gratis: true/false` pero **no hay economía real todavía** — todo se puede usar sin costo, la tienda de verdad (con algo para "ganar" los items premium vía racha/minijuegos futuros) es una iteración futura explícitamente pospuesta.

### Dónde se ve
**`frontend/src/components/Shared/BrotiAvatar.jsx`** — el avatar de Broti (`config.variante` o `MASCOTA_BASE`, más `config.fondo` de fondo). **Reemplaza el círculo de inicial como "foto de perfil" en todos lados**: `TopNavbar.jsx` (navbar + card flotante de perfil), `Perfil.jsx` (tarjeta "Tu foto de perfil es Broti" arriba del formulario), y en comunidad (foros/historias/preguntas, listas y detalle) **solo cuando la publicación no es anónima** — mismo criterio que el nombre real: mostrar el Broti de alguien anónimo lo deanonimizaría igual que mostrar su nombre. Si es anónima o el usuario no tiene nada equipado en `broti_config`, cae al círculo de color + inicial de siempre (`avatarColor`).

### Backend
`PATCH /api/perfil/:userId/broti` (`perfilController.actualizarBroti`) guarda el `broti_config`. `comunidadHelpers.resolverAutor()` también resuelve `brotiConfig` con la misma regla que el nombre (anónimo → `null`, salvo que quien mira sea admin/moderador). Aplicado en los mismos endpoints que ya revelaban el autor real a moderación: `getPostsByForo`/`getPost`, `getHistorias`/`getHistoria`, `getPreguntas`/`getPregunta` (top-level, no en respuestas anidadas).

## Rol "moderador" y moderación de comunidad (agosto 2026)

Columna `oculta BOOLEAN DEFAULT false` en `posts_foro`/`historias`/`preguntas_comunidad` — ya corrida contra producción y consolidada en `backend/setup_database.sql` (detalle histórico en `backend/scripts/historico/migration_moderacion_comunidad.sql`).

- **Rol nuevo**: `rol` en `perfiles_usuario` sigue siendo texto libre sin CHECK (igual que `orientador`, que ya existía sin lógica real detrás) — `'moderador'` se agrega a `ROLES_OPCIONES`/`ROLES_FILTRO`/`ROL_COLORS` en `admin/sections/usuarios/constants.js`, se asigna desde el CRUD de Usuarios como cualquier otro rol. No hay todavía una forma más específica de asignarlo (el usuario dijo que lo resuelve después).
- **`backend/src/middlewares/verificarModeracion.js`** — mismo patrón self-contained que `verificarAdmin.js` (verifica el token él mismo), pero acepta `rol IN ('admin', 'moderador')`.
- **`backend/src/controllers/comunidad/moderacionController.js`** — 3 endpoints bajo `/api/comunidad/moderacion/*`, todos protegidos por `verificarModeracion`:
  - `PATCH /:tipo/:id/ocultar` — marca `oculta=true` (no borra la fila). **No hay endpoint para des-ocultar todavía.**
  - `DELETE /:tipo/:id` — hard delete (mismo `:tipo` en `{post, historia, pregunta}` → `posts_foro`/`historias`/`preguntas_comunidad`).
  - `GET /autor/:userId` — perfil completo + email real (vía `supabase.auth.admin.getUserById`, requiere `SUPABASE_SERVICE_KEY` que el backend ya usa) de quien hizo una publicación, para la página privada `/dashboard/comunidad/autor/:userId` (`AutorInfo.jsx`, guardada con `useModeracion()`).
- **Autor real en publicaciones anónimas**: `user_id` siempre se guarda en la fila aunque `anonimo=true` (nunca se pierde) — `comunidadHelpers.resolverAutor()` centraliza la lógica: admin/moderador ven el nombre real con `es_anonimo_real: true`, el resto sigue viendo "Anónimo". Aplicado en `getPostsByForo`/`getPost` (foros), `getHistorias`/`getHistoria`, `getPreguntas`/`getPregunta` — **solo en las publicaciones de nivel superior, no en las respuestas/comentarios anidados** (decisión de alcance, no un olvido — si se pide después, es el mismo patrón).
- **`autor_id`** solo viaja en la respuesta del backend cuando quien pide es admin/moderador (`puedeModerar ? row.user_id : undefined`) — la autorización real de qué se puede ver vive en el backend, no en el frontend. `frontend/src/pages/dashboard/comunidad/components/primitivos.jsx` → `<ModeracionBar tipo id autorId onCambio />`: si no le llega `autorId`, no renderiza nada. Montado en `ForoDetalle.jsx`, `PostDetalle.jsx`, `HistoriaDetalle.jsx`, `Historias.jsx`, `Preguntas.jsx`.
- **`frontend/src/hooks/useModeracion.js`** — NUEVO, mismo patrón que `useAdmin.js` (consulta `perfiles_usuario` directo desde el cliente) pero devuelve `puedeModerar` (admin O moderador). De paso se corrigió un bug real en `useAdmin.js`: consultaba la tabla/columna viejas (`perfiles`/`id` en vez de `perfiles_usuario`/`user_id`), el mismo error que tenía `AdminPanel.jsx` antes de corregirse — por eso el botón "Panel Admin" del navbar nunca aparecía en modo real (no demo), aunque `/dashboard/admin` funcionaba igual porque hace su propio chequeo correcto por separado.

## Modo Demo
Si no hay `VITE_SUPABASE_URL` en `.env`, la app entra en modo demo.
- Login demo: cualquier email/password
- Admin demo: email `davidm20.05.2006@gmail.com`
- La racha de días (streak) ya no está hardcodeada (agosto 2026) — se calcula real en `perfilController.obtenerPerfil` (columnas `racha_dias`/`ultima_actividad` en `perfiles_usuario`, incluidas en `backend/setup_database.sql`). En modo demo no hay perfil real, así que se ve en 0 en vez del "3 días" fijo que mostraba antes.
