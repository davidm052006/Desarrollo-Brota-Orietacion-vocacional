# Brief de diseño — Versión móvil de Brota

> Este documento es un **dossier de información**, no un mockup. La arquitectura (rutas, componentes, backend) ya está resuelta — lo único que falta es el **diseño visual de la versión móvil**. Toda la información aquí fue extraída directamente del código fuente actual (no de documentación desactualizada) para que el diseño se apoye en la realidad del proyecto, no en supuestos.
>
> **Tu trabajo:** diseñar la experiencia móvil (layouts, navegación móvil, jerarquía visual, interacciones) para cada pantalla listada abajo, respetando el sistema de marca ya establecido. Las decisiones de diseño visual específicas (cómo se ve cada pantalla, qué patrón de navegación usar, cómo se reorganiza cada sección) son tuyas — este documento te da los hechos, no la solución.

---

## 0. Instrucciones de diseño (reglas de diseñador profesional)

Diseña como lo haría un diseñador de producto senior en un equipo de primer nivel. Concretamente:

- **Animaciones suaves y con propósito.** Transiciones de 150-300ms con easing natural (`ease-out` para entradas, `ease-in-out` para transiciones de estado). Nada de animaciones que se sientan mecánicas o que retrasen al usuario. El proyecto ya usa este lenguaje (`fadeSlideIn` 280ms, `revealField` 220ms) — mantén esa cadencia, no la rompas con algo más lento o más brusco.
- **Los botones deben verse clickeables/tocables.** Elevación sutil (sombra), feedback táctil claro al presionar (scale-down o darken en `:active`, no solo en `:hover` porque en móvil no hay hover), áreas de toque de mínimo 44×44px (guía de accesibilidad táctil de Apple/Google). El botón primario actual ya usa `hover:-translate-y-0.5` + sombra con glow de color — traduce ese mismo lenguaje de "elevación" a estados táctiles (`:active` con scale 0.97-0.98, por ejemplo).
- **Jerarquía visual clara.** Un elemento primario de acción por pantalla, no varios compitiendo. Usa el color primario (verde) con moderación — es acento, no relleno.
- **Consistencia con el sistema existente.** No inventes una nueva paleta, tipografía o radios de borde — usa los tokens documentados en la sección 1. Si algo no está cubierto por los tokens actuales (ej. un nuevo patrón de navegación inferior), extiéndelo con el mismo lenguaje visual, no con uno nuevo.
- **Mobile-first real, no "desktop encogido".** El desktop actual usa anchos fijos (1180px máx, sidebar fijo de 300px) y **no tiene ningún breakpoint responsive implementado todavía** — esto es diseño desde cero para móvil, no una adaptación de algo que ya funciona en pantallas chicas.
- **Accesibilidad táctil y legibilidad.** Contraste suficiente en ambos modos (claro/oscuro), tamaños de fuente legibles sin zoom (mínimo 14-16px en cuerpo), espaciado que no genere toques accidentales.
- **Estados vacíos, de carga y de error también son diseño.** El código actual ya maneja estos casos (ver spinners, mensajes "Cargando tu perfil…", estados de error) — no los omitas al diseñar cada pantalla.
- **Public vs. dashboard:** hay una landing pública (marketing, con animación de máquina de escribir en el hero) y un dashboard autenticado — ambos necesitan tratamiento móvil, con objetivos distintos (conversión vs. uso diario).

---

## 1. Sistema de marca (fuente de verdad: código, no BRAND.md)

⚠️ **Aviso importante:** el proyecto tiene un `BRAND.md` en la raíz, pero está **desactualizado** — documenta un verde `#16A34A` y tipografía genérica del sistema. El código real (`frontend/src/index.css`) usa una paleta y tipografía **distintas y más específicas**. Usa los valores de abajo (extraídos directamente de `index.css`), no los de `BRAND.md`.

### 1.1 Identidad

- **Nombre:** Brota
- **Concepto:** "Brotar" — crecimiento personal, el estudiante llega sin saber quién es y sale con un camino claro.
- **Tagline:** *"Descubre quién quieres ser."*
- **Producto:** plataforma colombiana de orientación vocacional gratuita para estudiantes de bachillerato (grados 9°-11°, 14-20 años) que van a elegir carrera, muchos sin acceso a un orientador vocacional profesional.
- **Voz:** segunda persona ("tú", "tu camino"), cercana, honesta, alentadora — nunca corporativa. Mensaje central: *"No hay respuesta incorrecta. No hay camino equivocado. Hay el tuyo."*
- **Emoji de marca:** 🌱 (aparece en saludos y contextos informales, nunca en botones de acción ni labels de formulario)

### 1.2 Logo

- **Archivo:** `frontend/public/logo-brota.png`
- **Uso actual en código:** `<img src="/logo-brota.png" alt="Brota" style={{ height: 28, width: 'auto' }} />` (navbar compacto) — en contextos más grandes se usa hasta 58px de alto (ver `Login.jsx` → `BrotaLogo`)
- Siempre `width: auto` — nunca distorsionar proporciones
- Hay también una imagen de fondo temática: `frontend/public/fondo-planta-crema.jpg` (usada en pantallas de auth)

### 1.3 Paleta de colores — tokens reales (CSS custom properties, `frontend/src/index.css`)

El proyecto define variables CSS que cambian automáticamente entre modo claro/oscuro vía la clase `.dark` en `<html>`. **Todo componente debe soportar ambos modos.**

**Modo claro** (`:root`):
```css
--bg:           #F4F3EC   /* fondo general de la app */
--surface:      #FFFFFF   /* fondo de cards, navbar, modales */
--surface-2:    #EFEEE5   /* fondo secundario, hover states sutiles */
--ink:          #15241B   /* texto principal */
--ink-soft:     #67756B   /* texto secundario/meta */
--line:         #E6E4DA   /* bordes y separadores */
--primary:      #21BD68   /* verde de marca — acento, CTA, íconos activos */
--primary-deep: #0E7D43   /* verde oscuro — hover, texto sobre fondo claro-verde */
--primary-ink:  #FFFFFF   /* texto sobre fondo primary */
--primary-soft: #E2F6EC   /* fondo verde muy sutil (tags, chips activos) */
--primary-glow: rgba(33,189,104,.28)  /* para sombras con glow de color */
--accent:       #E07A42   /* naranja — segundo acento (notificaciones, highlights) */
--accent-soft:  #FBE8DC   /* fondo naranja sutil */
--shadow:       0 4px 18px rgba(20,40,28,.06)
--shadow-md:    0 8px 24px rgba(20,40,28,.10)
```

**Modo oscuro** (`html.dark`):
```css
--bg:           #0C1310
--surface:      #151F19
--surface-2:    #1C2A22
--ink:          #EAF3EC
--ink-soft:     #94A69B
--line:         #27362D
--primary:      #34D27D   /* el verde se aclara en modo oscuro */
--primary-deep: #1FA862
--primary-ink:  #04301C
--primary-soft: #16301F
--primary-glow: rgba(52,210,125,.22)
--accent:       #F0996A
--accent-soft:  #2C2018
--shadow:       0 10px 30px rgba(0,0,0,.45)
--shadow-md:    0 14px 40px rgba(0,0,0,.55)
```

Otros tokens: `--radius-md: 12px` (radio de borde estándar para botones/inputs). Cards y elementos más grandes usan radios mayores ad-hoc (16-24px, ver componentes).

**Regla de uso:** el naranja (`--accent`) es el segundo color de marca — se usa para notificaciones (punto rojo/naranja en ícono de mensajes), highlights de racha/gamificación, y variación de acentos junto al verde en gradientes (ver `HeroBanner` y racha en `Dashboard.jsx`, que usan `linear-gradient(135deg, var(--accent), var(--primary))`).

### 1.4 Tipografía

Dos familias, cargadas vía Google Fonts (`@import` en `index.css`):

| Familia | Uso | Clase/selector |
|---|---|---|
| **Bricolage Grotesque** (400/700/800) | Titulares, display, nombres, cifras destacadas | clase `.font-display` |
| **Plus Jakarta Sans** (400-800) | Todo el cuerpo de texto, UI, formularios | fuente base del `body` |

Ejemplo real: el saludo del dashboard "Hola, {nombre} 👋" usa `.font-display` con `font-weight: 800, font-size: 30px`. El nombre "BROTA" en el navbar también usa Bricolage Grotesque 800.

### 1.5 Animaciones y micro-interacciones ya existentes (mantener este lenguaje)

Definidas en `index.css`:
- `fadeSlideIn` (280ms ease-out): opacity 0→1 + translateY(10px→0) — usada en cards de programas al aparecer
- `revealField` (220ms ease-out): similar pero translateY(-6px→0) — campos de formulario
- `blinkCursor` (900ms step-end infinite): cursor parpadeante de máquina de escribir — usado en el **efecto typewriter del hero de la landing** (`useTypewriter` en `LandingPage.jsx`)

Patrones inline (no en CSS global, pero consistentes en todo el código):
- Botones: `transition-all duration-200`, `hover:-translate-y-0.5` (elevación al hover), `active:translate-y-0`
- Cards interactivas (ej. quick actions del dashboard): `transform: translateY(-2px)` + sombra con glow de color al hover
- Barras de progreso: `transition-all duration-500`

**Para móvil:** todo lo que hoy es `:hover` debe tener equivalente en `:active`/touch (no hay hover real en móvil). El lenguaje de "elevación + sombra con glow de color" es la firma visual del proyecto — consérvalo en botones y tarjetas tocables.

### 1.6 Componentes UI existentes (`frontend/src/components/Shared/`)

- **`Button.jsx`** — variantes `primary`, `secondary`, `danger`, `outline`. Base: `rounded-[12px]`, `px-5 py-2.5`, `font-semibold`, transición de 200ms con elevación al hover.
- **`Input.jsx`** — incluye toggle de mostrar/ocultar contraseña integrado, focus ring de `var(--color-primary)/30`, borde rojo + mensaje de error si `error` está presente.
- **`ProgressBar.jsx`** — barra simple, color configurable, transición de 500ms.
- **`Avatar.jsx`** — círculo con inicial del nombre, fondo `var(--primary)`.
- **`UserMenu.jsx`** — menú de usuario (navbar).

⚠️ Nota técnica menor: `Input.jsx` referencia `var(--color-surface)`, que **no está definido** en ningún lado del CSS actual (solo existe `--surface`, sin el prefijo `color-`). Es un bug latente preexistente — probablemente el input queda con fondo transparente. Vale la pena que el otro agente lo tenga en cuenta si toca ese componente, aunque no es parte del encargo de diseño en sí.

---

## 2. Mapa de pantallas — qué hay en cada una y qué hace

### 2.1 Público (sin autenticación)

| Ruta | Pantalla | Contenido / función |
|---|---|---|
| `/` | **Landing** | Navbar (logo + links: Conoce Brota, Beneficios, Testimonios, FAQ + CTA "Empezar gratis") → Hero con **efecto typewriter** en el titular + CTA dobles (primario "Empezar gratis" / secundario "Saber más") → TrustBar (4 stats: orientación gratuita, explorar áreas, resultados personalizados, toma decisiones) → sección "Cómo funciona" → Beneficios → Testimonial → FooterCTA → Footer. Redirige a `/dashboard` si ya hay sesión. |
| `/login` | **Login/Registro/Recuperar** | Un solo componente con 3 modos (`login`/`signup`/`forgotPassword`) manejados por `useAuth`. Layout desktop: grid de 2 columnas (branding a la izquierda, que cambia texto según el modo — ver copys en sección 1.1 — / card blanca de formulario a la derecha). Fondo crema `#F2EFEA` (exclusivo de pantallas de auth, no se usa en el dashboard). |
| `/reset-password` | **Reset de contraseña** | Formulario simple post-link de email. |
| `/servicios`, `/saber-mas`, `/privacidad`, `/terminos` | Páginas informativas estáticas | Contenido legal/institucional, prioridad baja para diseño móvil dedicado (pueden heredar patrones simples de texto+scroll). |
| `/contacto` | **Formulario de contacto** | Campos + selector de "asunto" (`asuntos_validos`), conecta a backend real (ver sección 3). |

### 2.2 Dashboard (autenticado) — usa `TopNavbar` horizontal + `DashboardLayout`

**Navegación actual (desktop):** `TopNavbar.jsx` es una barra horizontal sticky con: logo, 6 tabs de navegación (Inicio, Explorar, Test vocacional, Rutas, Recursos, Comunidad), y a la derecha: badge de Panel Admin (condicional), ícono de favoritos ⭐, ícono de mensajes 💬 (con punto de notificación), toggle de modo oscuro 🌙/☀️, y bloque de perfil (avatar + nombre + rol) que lleva a ajustes, más botón de logout. **Esto es lo primero que hay que rediseñar para móvil** — un patrón horizontal de 6 tabs + 5 acciones no cabe en una pantalla de teléfono; probablemente se traduce en tab bar inferior + menú/drawer para el resto, pero esa decisión es tuya.

| Ruta | Pantalla | Contenido / función |
|---|---|---|
| `/dashboard` | **Inicio** | `HeroBanner` (saludo + fecha + mini-card de progreso del test con CTA) → `QuickActions` (grid 2×2 de accesos: Explorar profesiones, Realizar test, Rutas formativas, Explorar recursos) → `ContinueSection` (contenido dinámico "continuar donde quedaste"). Columna derecha (rail fijo de 300px, **no existe en mobile por falta de espacio**): `ProfileSidebar` con card de perfil + barra de completitud, card de racha (🔥 N días, con 7 casillas tipo streak-calendar estilo Duolingo) y "frase del día". |
| `/dashboard/test` | **Test vocacional** | Flujo de 3 fases ya con diseño "un paso a la vez" (naturalmente mobile-friendly en su lógica, falta solo el visual): `intro` → preguntas una por una con `ProgressBand` (segmentos + contador "Pregunta X/Y" + minutos restantes estimados) → `TestResult`. Subcomponentes en `test-vocacional/components/`: `TestIntro`, `TestProgress`, `TestQuestion`, `TestResult`. |
| `/dashboard/profesiones` | **Explorar profesiones** | Búsqueda + `FilterSidebar` (categoría académica, modalidad) + grid de `ProgramaCard` con paginación/scroll infinito (`cargandoMas`) + `SkeletonCard` de loading. Header con contador grande de programas totales. |
| `/dashboard/recursos` | **Recursos** | Tabs de categoría (Todos ✨, Guías 📄, YouTube ▶️, Becas 🎓, Podcasts) + búsqueda inline + grid de `RecursoCard` (cada una con link externo). |
| `/dashboard/comunidad` | **Comunidad** | 4 tabs: Foros, Historias reales, Preguntas, Convocatorias. **Ya tiene un FAB (botón flotante de acción)** que cambia de función según el tab activo (compartir historia / hacer pregunta) — este patrón ya es mobile-native, consérvalo. Dos modales: `ModalCompartirHistoria`, `ModalHacerPregunta`. Vistas de detalle en rutas propias: `/comunidad/foro/:id`, `/comunidad/historia/:id`, `/comunidad/convocatoria/:id`, `/comunidad/post/:id`. |
| `/dashboard/admin` | **Panel Admin** (solo rol admin) | 6 módulos con nav propia (`ModulesNav`): Usuarios 👥, Programas 💼, Instituciones 🏛️, Cuestionarios 📋, Preguntas ❓, Contactos, y Configuración (incluye panel de sincronización con datos del Ministerio de Educación). Es una herramienta interna, no cara al estudiante — **prioridad baja para móvil**, puede diseñarse "responsive-legible" en vez de un rediseño móvil completo; queda a tu criterio si vale la pena invertir tiempo de diseño aquí. |
| `/dashboard/rutas`, `/favoritos`, `/mensajes`, `/ajustes` | **Placeholders** | Actualmente páginas "en construcción" (`PaginaEnConstruccion`), sin funcionalidad real todavía — no requieren diseño detallado, solo un estado vacío coherente si se diseñan. |

---

## 3. Conexión con el backend — qué pantalla habla con qué API

Todas las llamadas van a `VITE_API_URL` (backend Express en puerto 3001), autenticadas vía JWT de Supabase (`Authorization: Bearer <token>`, inyectado por `getAuthHeaders()` en `apiClient.js`). Esto es puramente informativo — no cambia con el rediseño móvil, pero ayuda a entender qué es dato real (paginado, con estados de carga/error) vs. estático:

| Service frontend | Endpoints backend | Pantallas que lo usan |
|---|---|---|
| `authService.js` | `POST /api/auth/register-perfil` | Registro (`/login` modo signup) |
| `perfilService.js` | `GET/POST /api/perfil/cuestionario`, `/resultado`, `/recomendaciones`, `GET /api/perfil/:userId` | Test vocacional, Dashboard (perfil), recomendaciones |
| `programasService.js` | `GET /api/programas`, `GET /api/programas/stats` | Profesiones (listado paginado real, ~14.644 programas del MEN) |
| `comunidadService.js` | `GET/POST /api/comunidad/foros`, `/foros/:id/posts`, `/posts/:id`, `/posts/:id/votar`, `/posts/:id/respuestas`, `/historias`, `/historias/:id`, `/historias/:id/like`, `/preguntas`, `/preguntas/:id`, `/preguntas/:id/respuestas`, `/convocatorias`, `/convocatorias/:id` | Comunidad (los 4 tabs + vistas de detalle) — es la sección con más variedad de tipos de contenido (posts, votos, respuestas, likes) |
| `contactoService.js` | `POST /api/contacto`, `GET/PATCH /api/admin/contactos` | Formulario de contacto público + AdminPanel |
| `adminService.js` | CRUD completo bajo `/api/admin/*` (usuarios, instituciones, programas, cuestionarios, preguntas, contactos) + `/api/admin/sincronizacion/*` | Panel Admin únicamente |

**Implicación de diseño:** las pantallas de Comunidad y Profesiones son las que más manejan estados de carga/paginación/infinite-scroll con datos reales — merecen especial atención a skeletons, pull-to-refresh (patrón móvil nativo que no existe en desktop) y estados vacíos. El resto de pantallas informativas (landing, recursos, páginas legales) son más estáticas.

---

## 4. Estructura visual del grafo de dependencias (contexto adicional)

Se generó un grafo de dependencias del código (`graphify-out/graph.json` y `graphify-out/graph.html`, navegable en el navegador) que agrupa el frontend en comunidades funcionales coherentes con lo descrito arriba: *Admin Panel*, *Comunidad (frontend)*, *Auth UI compartida*, *Layout y navegación*, *Config y componentes dashboard sueltos*. Confirma que no hay acoplamiento cruzado inesperado entre secciones — cada pantalla es razonablemente independiente, lo cual es una buena señal para poder rediseñar/reconstruir la capa visual pantalla por pantalla sin romper otras.

---

## 5. Restricciones técnicas a tener en cuenta

- **TailwindCSS v4**: el oxide scanner requiere `@source` explícitos en `frontend/src/index.css` para cada subdirectorio nuevo — si se agregan componentes en carpetas nuevas, hay que registrar la ruta ahí o el CSS no se genera.
- **Modo oscuro** vía clase `.dark` en `<html>` (no `prefers-color-scheme` automático) — todo diseño nuevo debe cubrir ambos modos con los tokens de la sección 1.3.
- **Sin sidebar vertical** — decisión de producto ya tomada para desktop (existe un `Sidebar.jsx` legado que ya no se usa). No es un requisito para móvil, pero indica que el equipo prefiere navegación horizontal/superior sobre lateral cuando es posible.
- El proyecto **no tiene ningún framework ni librería de componentes UI de terceros** (no MUI, no Chakra, no shadcn) — todo es Tailwind + estilos inline + CSS custom properties hechos a mano. Cualquier propuesta de diseño debe poder implementarse con ese mismo enfoque artesanal, no asumir una librería de componentes disponible.

---

## 6. Referencias visuales existentes (para tono, no para copiar literal)

Hay 8 mockups de diseño **de escritorio** ya implementados en `frontend/public/diseños/` (`01-Landing.png` … `08-Recursos.png`) — útiles como referencia de tono visual y jerarquía de contenido, pero fueron diseñados para desktop, no para trasladarse 1:1 a móvil.
