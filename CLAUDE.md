# CLAUDE.md — Contexto del proyecto Brota

## Manual de marca
Ver **[BRAND.md](./BRAND.md)** para colores, tipografía, voz, tono, componentes UI y contexto del producto.
Cualquier cambio visual debe respetar la paleta y los tokens definidos ahí.

## Stack
- **Frontend**: React 19 + Vite 7 + TailwindCSS 4 (en `frontend/`)
- **Backend**: Node.js + Express 5 CommonJS (en `backend/`, puerto **3001**)
- **DB/Auth**: Supabase (PostgreSQL + Supabase Auth)
- **Dev server frontend**: `npm run dev` desde `frontend/` — corre en puerto 5173 o 5174

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
| `/dashboard` | `pages/dashboard/Dashboard.jsx` | home, layout 2 columnas + sidebar perfil. Columna principal: `FeedReciente` (últimas publicaciones de comunidad) → `QuickActions` → `ContinueSection`. El saludo/CTA del test (antes un banner grande arriba) ahora es `HeroBannerMini`, dentro del sidebar debajo de la racha — agosto 2026 |
| `/dashboard/test` | `pages/dashboard/test-vocacional/TestVocacional.jsx` | subcomponentes en `test-vocacional/components/` |
| `/dashboard/profesiones` | `pages/dashboard/Profesiones.jsx` | |
| `/dashboard/recursos` | `pages/dashboard/Recursos.jsx` | |
| `/dashboard/comunidad` | `pages/dashboard/Comunidad.jsx` | + detalle en `comunidad/{ForoDetalle,HistoriaDetalle,ConvocatoriaDetalle,PostDetalle}.jsx` |
| `/dashboard/admin` | `pages/dashboard/admin/AdminPanel.jsx` | secciones en `admin/sections/*Section.jsx` |
| `/dashboard/ajustes` | `pages/dashboard/Ajustes.jsx` | mi perfil (autoedición — la edad se ingresa como fecha de nacimiento en 3 `GlassSelect` día/mes/año, `utils/calcularEdad.js` la convierte a entero con la misma fórmula que `authController.registerPerfil`; no se persiste la fecha, solo la edad calculada, igual que el registro), cambio de contraseña (con el mismo flujo de código OTP de 8 dígitos que "Olvidé mi contraseña", vía `authService.sendPasswordReset`/`verifyOtpAndUpdatePassword`), cerrar sesión — implementado agosto 2026 |
| `/dashboard/racha` | `pages/dashboard/Racha.jsx` | mascota animada según estado real de la racha (feliz/triste/guiño/neutral), fondo que va de gris a rojo según `racha_dias` — se llega clickeando la card de racha en el Dashboard (pasa `profile` por `location.state` para no re-pedirlo) |
| `/dashboard/notificaciones` | `pages/dashboard/Notificaciones.jsx` | reemplaza al viejo placeholder `/dashboard/mensajes` (agosto 2026) — no hay chat, es un feed de respuestas a tus preguntas de comunidad + likes a tus historias, armado al vuelo sin tabla de notificaciones ni estado leído/no-leído |
| `/dashboard/rutas` | `pages/dashboard/Rutas.jsx` | chips de área académica (mismas 14 claves que `area_academica`) → contenido estático de `contenido_rutas` (materias comunes, temas previos, proyectos, links de búsqueda). **Sin IA en tiempo real** — contenido curado una vez (agosto 2026, ver `backend/scripts/migration_rutas.sql`). Si ya hizo el test, separa las áreas de `categoriaPrincipal`/`categoriaSecundaria` (normalizadas con el mismo `CATEGORIA_ALIAS` que `algoritmoRecomendacion.js`) en "Relacionadas con tus resultados"; si no lo hizo, muestra un CTA a `/dashboard/test` en vez de la sección |
| `/dashboard/favoritos` | `PaginaEnConstruccion` (inline en `App.jsx`) | placeholder, sin implementar |

Todas las `/dashboard/*` se protegen inline en `App.jsx` con `puedeAcceder` (sesión o modo demo) — no hay un `ProtectedRoute` wrapper reusable (existe `components/ProtectedRoute.jsx` pero no está en uso en las rutas de arriba, verificar antes de asumir que aplica).

`Ajustes.jsx` también tiene una tarjeta "Apariencia" (selector de tipo de letra, `hooks/useFontFamily.js` — mismo patrón que `useDarkMode.js`, guarda en `localStorage` y setea `--font-body` en `<html>`; se inicializa desde `TopNavbar.jsx` para que se aplique en todo `/dashboard/*`, no solo al entrar a Ajustes) y una tarjeta "Próximamente" con configuraciones sugeridas pero sin implementar (notificaciones por correo, perfil público en Comunidad, tamaño de texto, exportar/eliminar cuenta, idioma) — son filas deshabilitadas a propósito, para no perder la idea; si se implementa alguna, sacarla de esa lista.

### Layout del dashboard
- **TopNavbar** (`components/Layout/TopNavbar.jsx`) — navbar horizontal sticky con tabs
- **DashboardLayout** (`components/Layout/DashboardLayout.jsx`) — wrapper simple con TopNavbar
- **ELIMINADO**: sidebar vertical (`Sidebar.jsx` ya no se usa en DashboardLayout, pero el archivo sigue existiendo)
- **Logout por inactividad** (`hooks/useInactivityLogout.js`, inicializado en `TopNavbar.jsx` — cubre todo `/dashboard/*`): 30 min sin interacción (mouse/teclado/scroll/touch) cierra sesión automático; avisa 1 min antes con un banner fijo abajo ("Seguir conectado" / "Cerrar sesión"). Cualquier actividad reinicia el timer, incluso con el aviso abierto.

### Backend — API (`backend/src/routes/*.js`, montadas bajo `/api`)
| Router | Base | Contenido |
|---|---|---|
| `auth.js` | `/api/auth` | `POST /register-perfil` |
| `perfil.js` | `/api/perfil` | cuestionario, resultado, recomendaciones, `GET/PATCH /:userId` (PATCH = autoedición, usado por `Ajustes.jsx`; el `GET` también actualiza la racha de días como efecto secundario, ver `actualizarRacha()` en el controller) |
| `programas.js` | `/api/programas` | `GET /`, `GET /stats` |
| `comunidad.js` | `/api/comunidad` | foros, posts, historias, preguntas (+ `POST /:id/reportar`), convocatorias, `GET /notificaciones`, `GET /feed` (últimas 8 publicaciones mezclando posts/historias/preguntas, para `FeedReciente` del Dashboard) |
| `contacto.js` | `/api/contacto` | `POST /` |
| `admin.js` | `/api/admin` | CRUD usuarios/instituciones/programas/cuestionarios/preguntas/contactos + moderación `preguntas-comunidad` (`GET`/`DELETE`) + sincronización MEN |
| `rutas.js` | `/api/rutas` | `GET /` (áreas disponibles), `GET /:area` (contenido estático — temas previos, proyectos, recursos) |

`backend/src/routes/` también tiene un archivo `router.use` (sin extensión `.js`) — es código muerto y roto, un pegado de IA sin limpiar que nunca se importó en ningún lado (detalle completo en `docs/modelo_datos.md`, sección "Tablas huérfanas"). No confundirlo con una ruta real.

Cada router habla con controladores en `backend/src/controllers/` — **ya no son un archivo por router**: `admin.js` reparte entre `controllers/admin/{usuarios,instituciones,programas,cuestionarios,preguntas,contactos,preguntasComunidad}Controller.js`, y `comunidad.js` entre `controllers/comunidad/{foros,historias,preguntas,convocatorias,notificaciones}Controller.js` (split por SOLID/SRP en el commit `ca87128`, agosto 2026 — antes eran `adminController.js`/`comunidadController.js` monolíticos, esos nombres ya no existen). Middlewares: `verificarAuth.js` (JWT), `verificarAdmin.js` (rol admin, ver Bug #8 más abajo — **ojo**: la entrada de ese bug menciona una tabla `roles` separada que ya no existe en el diseño actual, el middleware compara `perfiles_usuario.rol` directo, ver `docs/modelo_datos.md`).

### Servicios frontend (`frontend/src/services/*.js`)
Un service por dominio, todos hablan con el backend vía `VITE_API_URL`: `authService`/`authServiceDemo` (modo demo), `perfilService`, `programasService`, `comunidadService`, `contactoService`, `adminService`, `rutasService`. `getAuthHeaders`/`parseResponse`/`API_URL` viven en `services/apiClient.js` (compartido, no duplicar en cada service nuevo). `utils/validation.js` es la única fuente de validación de formularios — no crear otra en `services/`.

### Archivos grandes — evitar leerlos completos si el cambio es puntual
`TestVocacional.jsx` / `Profesiones.jsx` / `Dashboard.jsx` (~350-390L). Preferir `grep -n` para ubicar la función/sección y `Read` con `offset`/`limit` sobre ese rango.
`Comunidad.jsx`, `UsuariosSection.jsx`, `ContactosSection.jsx`, y los antiguos `comunidadController.js`/`adminController.js` ya NO están en esta lista — se dividieron en julio/agosto 2026, ver sección siguiente.

### Módulos divididos por SOLID/SRP (julio 2026)
Estos tres eran archivos únicos de 280-760 líneas mezclando fetch de datos, estado de modales y presentación. Se dividieron en un componente orquestador (estado + llamadas al service) + subcomponentes de presentación en una carpeta `components/` hermana. Patrón a seguir si otro archivo grande necesita el mismo tratamiento:

- **`pages/dashboard/Comunidad.jsx`** (760L → 158L) — orquesta tabs/modales; UI de cada tab vive en `comunidad/components/{Foros,Historias,Preguntas,Convocatorias,Sidebar}.jsx`, los formularios modales en `ModalCompartirHistoria.jsx`/`ModalHacerPregunta.jsx`, y las piezas compartidas en `primitivos.jsx` (solo componentes, por Fast Refresh) + `constantes.js` (datos/helpers puros — `avatarColor`, `TIPO_COLOR`, etc).
- **`pages/dashboard/admin/sections/UsuariosSection.jsx`** (426L → 229L) — orquesta CRUD; tabla+paginación en `usuarios/TablaUsuarios.jsx`, los 4 modales (Ver/Editar/Eliminar/Nuevo) en `usuarios/Modal*.jsx`, constantes de roles en `usuarios/constants.js`. `Campo`/`Detalle` (inputs de formulario reutilizables) se movieron a `admin/components/formPrimitives.jsx` — **este mismo patrón Campo/Detalle sigue duplicado sin migrar en `CuestionariosSection.jsx`, `InstitucionesSection.jsx` y `OportunidadesSection.jsx`**, sería el siguiente paso si se tocan esos archivos.
  **Carga masiva de usuarios (CSV, agregada por Julián, commit `a4d5bd2`)**: parseo client-side con `papaparse` (columnas esperadas en `COLUMNAS_CSV_ESPERADAS`), previsualización de filas y reporte por fila tras importar. **No hay endpoint de bulk-insert en el backend** — `adminService.createUsuariosMasivo()` es un loop que llama `POST /api/admin/usuarios` (creación individual) una vez por fila. Para un CSV grande esto son N requests secuenciales contra el límite general de 300/15min (`server.js`); con las clases/grupos actuales (decenas de filas) no es problema, pero si se sube a cientos de usuarios de una sola vez conviene revisarlo antes (subir el límite puntualmente o, mejor, agregar un endpoint real de bulk-insert).
  **`OportunidadesSection.jsx` es un nombre engañoso**: pese a llamarse "Oportunidades" en el menú, hace CRUD de **`programas`** (académicos), no de `convocatorias` (becas/eventos). `convocatorias` **no tiene CRUD en el panel admin** — solo lectura pública (`GET /api/comunidad/convocatorias`) y las 5 filas semilla de `migration_comunidad.sql`; para agregar una convocatoria nueva hoy hay que hacerlo a mano en Supabase.
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
- `frontend/src/services/adminService.js` — `getSincronizacionEstado()` y `ejecutarSincronizacion()`
- `frontend/src/pages/dashboard/admin/sections/ConfiguracionSection.jsx` — panel de sync con estado, botones verificar/sincronizar
- `backend/scripts/migration_men_sincronizacion.sql` — **EJECUTAR EN SUPABASE antes de usar**

### Tabla requerida en Supabase
Ejecutar `backend/scripts/migration_men_sincronizacion.sql` en el SQL Editor de Supabase:
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
- Eliminar `backend/scripts/seed_instituciones.js` (datos hardcoded ya obsoletos)
- Borrar datos viejos de Bogotá de las tablas antes de primera sync nacional

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
`backend/.env.example`, `backend/scripts/import_snies.js` y `backend/scripts/seed_instituciones.js` tienen la `SUPABASE_SERVICE_KEY` real, el `JWT_SECRET` y el `SMTP_PASS` (Gmail app password) hardcodeados, en un repo **público** de GitHub.
Decisión del usuario (2026-07-11): se mantiene así **durante la fase de desarrollo** a propósito, para facilitar el arranque en cualquier máquina sin gestionar secretos. Antes de ir a producción se rotarán todas las credenciales (Supabase service_role key, SMTP app password, JWT_SECRET) y se sacarán del repo (placeholders + `.env` real fuera de git).
**No volver a reportar esto como hallazgo urgente ni intentar "arreglarlo" de forma proactiva** — es un riesgo aceptado temporalmente. Sí se puede recordar como pendiente si se habla de checklist de despliegue a producción.

### RLS (Row Level Security)
Todas las tablas de `public` tienen RLS habilitado con una policy `"solo_service_role"` (`FOR ALL TO service_role`) — el backend con `SUPABASE_SERVICE_KEY` bypassea RLS igual, así que es defensa en profundidad, no algo que cambie el comportamiento actual. El frontend nunca hace `.from()` directo (solo `supabase.auth.*`), así que no hace falta ninguna policy para `anon`/`authenticated`. **Si se crea una tabla nueva, agregarle RLS en el mismo script de migración** (`ALTER TABLE x ENABLE ROW LEVEL SECURITY` + la policy de `service_role`, ver `migration_contactos.sql` o `migration_rls_comunidad_rutas.sql` como plantilla) — 10 tablas se quedaron sin esto por varias migraciones seguidas (agosto 2026) hasta que el linter de seguridad de Supabase lo marcó.

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

## Modo Demo
Si no hay `VITE_SUPABASE_URL` en `.env`, la app entra en modo demo.
- Login demo: cualquier email/password
- Admin demo: email `davidm20.05.2006@gmail.com`
- La racha de días (streak) ya no está hardcodeada (agosto 2026) — se calcula real en `perfilController.obtenerPerfil` (columnas `racha_dias`/`ultima_actividad` en `perfiles_usuario`, `backend/scripts/migration_racha.sql`). En modo demo no hay perfil real, así que se ve en 0 en vez del "3 días" fijo que mostraba antes.
