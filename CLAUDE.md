# CLAUDE.md — Contexto del proyecto Brota

## Manual de marca
Ver **[BRAND.md](./BRAND.md)** para colores, tipografía, voz, tono, componentes UI y contexto del producto.
Cualquier cambio visual debe respetar la paleta y los tokens definidos ahí.

## Stack
- **Frontend**: React 19 + Vite 7 + TailwindCSS 4 (en `frontend/`)
- **Backend**: Node.js + Express 5 CommonJS (en `backend/`, puerto **3001**)
- **DB/Auth**: Supabase (PostgreSQL + Supabase Auth)
- **Dev server frontend**: `npm run dev` desde `frontend/` — corre en puerto 5173 o 5174

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
| `/dashboard` | `pages/dashboard/Dashboard.jsx` | home, layout 2 columnas + sidebar perfil |
| `/dashboard/test` | `pages/dashboard/test-vocacional/TestVocacional.jsx` | subcomponentes en `test-vocacional/components/` |
| `/dashboard/profesiones` | `pages/dashboard/Profesiones.jsx` | |
| `/dashboard/recursos` | `pages/dashboard/Recursos.jsx` | |
| `/dashboard/comunidad` | `pages/dashboard/Comunidad.jsx` | + detalle en `comunidad/{ForoDetalle,HistoriaDetalle,ConvocatoriaDetalle,PostDetalle}.jsx` |
| `/dashboard/admin` | `pages/dashboard/admin/AdminPanel.jsx` | secciones en `admin/sections/*Section.jsx` |
| `/dashboard/{rutas,favoritos,mensajes,ajustes}` | `PaginaEnConstruccion` (inline en `App.jsx`) | placeholders, sin implementar |

Todas las `/dashboard/*` se protegen inline en `App.jsx` con `puedeAcceder` (sesión o modo demo) — no hay un `ProtectedRoute` wrapper reusable (existe `components/ProtectedRoute.jsx` pero no está en uso en las rutas de arriba, verificar antes de asumir que aplica).

### Layout del dashboard
- **TopNavbar** (`components/Layout/TopNavbar.jsx`) — navbar horizontal sticky con tabs
- **DashboardLayout** (`components/Layout/DashboardLayout.jsx`) — wrapper simple con TopNavbar
- **ELIMINADO**: sidebar vertical (`Sidebar.jsx` ya no se usa en DashboardLayout, pero el archivo sigue existiendo)

### Backend — API (`backend/src/routes/*.js`, montadas bajo `/api`)
| Router | Base | Contenido |
|---|---|---|
| `auth.js` | `/api/auth` | `POST /register-perfil` |
| `perfil.js` | `/api/perfil` | cuestionario, resultado, recomendaciones, `GET /:userId` |
| `programas.js` | `/api/programas` | `GET /`, `GET /stats` |
| `comunidad.js` | `/api/comunidad` | foros, posts, historias, preguntas, convocatorias |
| `contacto.js` | `/api/contacto` | `POST /` |
| `admin.js` | `/api/admin` | CRUD usuarios/instituciones/programas/cuestionarios/preguntas/contactos + sincronización MEN |

Cada router tiene su controlador homónimo en `backend/src/controllers/`. Middlewares: `verificarAuth.js` (JWT), `verificarAdmin.js` (rol admin, ver Bug #8 más abajo).

### Servicios frontend (`frontend/src/services/*.js`)
Un service por dominio, todos hablan con el backend vía `VITE_API_URL`: `authService`/`authServiceDemo` (modo demo), `perfilService`, `programasService`, `comunidadService`, `contactoService`, `adminService`.

### Archivos grandes — evitar leerlos completos si el cambio es puntual
`Comunidad.jsx` (~760L), `comunidadController.js` (~700L), `adminController.js` (~630L), `UsuariosSection.jsx` (~430L), `TestVocacional.jsx` / `Profesiones.jsx` / `Dashboard.jsx` (~350-390L). Preferir `grep -n` para ubicar la función/sección y `Read` con `offset`/`limit` sobre ese rango.

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
| 4 ⚠️ ABIERTO | `controllers/sincronizacionController.js` → `getAreaAcademica()` | NBC codes sin mapeo en `NBC_MAP`/`AREA_FALLBACK` quedan con `area_academica = NULL` y nunca aparecen en recomendaciones (el algoritmo filtra `.eq('area_academica', cat)`) | No bloqueante — sí aparecen en Profesiones. Fix futuro: ampliar `NBC_MAP` o agregar un fallback genérico. |
| 5 ✅ | `controllers/perfilController.js` → `obtenerRecomendaciones` | `.limit(6)` no coincidía con `MAX_RECOMENDACIONES = 8` | Cambiado a `.limit(8)` |
| 6 ✅ | `utils/perfilvocacional.js` | `calcularPorcentajes` trataba `perfilVocacional` como `{categoria: puntos}` cuando en realidad es `{categoriaPrincipal, categoriaSecundaria, scores: [...]}` → porcentajes basura | Ahora itera `perfilVocacional.scores` |
| 7 ✅ | `backend/setup_database.sql` (líneas 155/170/184) | Conflicto de git sin resolver | Resuelto manteniendo numeración de HEAD (tablas 10, 11, 12) |
| 8 ✅ | `middlewares/verificarAdmin.js` | Tabla `perfiles` (no existe, es `perfiles_usuario`) + `.eq('id', user.id)` (debe ser `user_id`) + comparaba `rol === 'admin'` (el campo real es `roles.nombre === 'Administrador'`). Tumbaba **todos** los endpoints `/api/admin/*` con 403, incluso para admins reales | `from('perfiles_usuario').select('roles ( nombre )').eq('user_id', user.id)`, check `perfil?.roles?.nombre !== 'Administrador'` |

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

## Modo Demo
Si no hay `VITE_SUPABASE_URL` en `.env`, la app entra en modo demo.
- Login demo: cualquier email/password
- Admin demo: email `davidm20.05.2006@gmail.com`
- La racha de días (streak) está hardcodeada en 3 días (por implementar)
