# 🎤 Guion de sustentación — Sistema Brota

15 minutos netos, repartidos exactamente como pide la rúbrica: **Seguridad (5 min) → Arquitectura y CRUDs (7 min) → Metodología ágil (3 min)**. Reparto por persona basado en quién construyó qué de verdad (`git log`, ver [`auditoria_sustentacion.md`](auditoria_sustentacion.md)), no por orden alfabético.

**Antes de arrancar:** tener dos pestañas abiertas — la app corriendo (`localhost:5173` o el túnel) y DevTools → Network, para que el token/headers se vean en vivo cuando toque.

---

## Bloque 1 — Seguridad y Control de Acceso (5 min) — **David**

Este bloque queda con David completo porque cubre la parte más técnica (Supabase Auth vs. JWT propio, middlewares) — mejor una sola voz consistente que cortes entre personas.

| Tiempo | Qué mostrar | Qué decir |
|---|---|---|
| 0:00–0:40 | (sin pantalla, o landing page) | Presentación rápida del grupo + una frase de la idea: "Brota es una plataforma de orientación vocacional para estudiantes colombianos de colegio — cuestionario, recomendación de programas con el dataset oficial del MEN, comunidad y panel admin." |
| 0:40–2:00 | Login real en la app + DevTools → Network → request a `/api/perfil/...` | Mostrar el header `Authorization: Bearer <token>` en una request real. Explicar: "el token lo emite Supabase Auth al hacer login, lo guardamos en la sesión del cliente de Supabase (no en `localStorage` manual) y lo mandamos en cada request protegida." |
| 2:00–3:00 | `backend/src/middlewares/verificarAuth.js` y `verificarAdmin.js` (abrir en editor o mostrar snippet) | "El backend valida el token con `supabase.auth.getUser(token)` en cada endpoint protegido. Para rutas de admin, además comprobamos `perfiles_usuario.rol === 'admin'` — así `/api/admin/*` completo queda cerrado a usuarios normales." |
| 3:00–4:00 | Login con usuario NO admin → intentar entrar a `/dashboard/admin` → redirige a `/dashboard` | "Esto no es solo un `if` en el frontend por estética — el backend vuelve a validar el rol en cada endpoint de `/api/admin/*`, así que aunque alguien fuerce la URL, no hay datos que ver." |
| 4:00–5:00 | (opcional si da tiempo) Mencionar el fix reciente | "Esta misma semana encontramos y corregimos un bug real: el chequeo de rol duplicaba lógica y no contemplaba el modo demo. Lo unificamos con un solo hook (`useAdmin`) — PR #28." Es una buena nota de cierre: muestra proceso real, no solo el resultado. |

**Si preguntan "¿dónde está su JWT_SECRET / su bcrypt?"** — respuesta lista: *"Decidimos no reinventar la rueda: delegamos la autenticación completa (emisión de token, hash de contraseña) a Supabase Auth, que ya lo hace de forma auditada. Nuestro backend solo verifica el token que Supabase emitió — es más seguro que mantener nuestro propio esquema."*

---

## Bloque 2 — Arquitectura, Integración y CRUDs (7 min) — **Julián + Brayan + Eduard**

### Julián — 0:00–3:00 (Frontend / integración / demo CRUD)

| Tiempo | Qué mostrar | Qué decir |
|---|---|---|
| 0:00–0:20 | DevTools → Network, consola limpia | "Frontend y backend se comunican por HTTP async sin errores de CORS — el backend valida origen explícitamente contra una whitelist." |
| 0:20–2:30 | Panel admin → sección Instituciones (o Programas): crear una fila, editarla, borrarla en vivo | Recorrer el flujo completo create→read→update→delete de una entidad real, mostrando que persiste (recargar la página o mostrar la tabla actualizada). |
| 2:30–3:00 | Mencionar las otras entidades | "Lo mismo aplica para usuarios, programas, cuestionarios y preguntas — 5 entidades con CRUD completo conectadas a Supabase." |

### Brayan — 3:00–5:00 (Backend / persistencia)

| Tiempo | Qué mostrar | Qué decir |
|---|---|---|
| 3:00–4:00 | `backend/src/routes/admin.js` (las rutas GET/POST/PATCH/DELETE) | "Cada entidad tiene sus 4 verbos HTTP mapeados a un controller que habla con Supabase (PostgreSQL). Row Level Security activado en todas las tablas — el backend usa `service_role` y lo bypassea a propósito, doble capa de defensa." |
| 4:00–5:00 | `setup_database.sql` (esquema de una tabla, ej. `perfiles_usuario` o `programas`) | Explicar brevemente el modelo de datos y las relaciones clave. |

### Eduard — 5:00–7:00 (Tests / calidad)

| Tiempo | Qué mostrar | Qué decir |
|---|---|---|
| 5:00–6:00 | Correr `npm test` en backend y frontend en vivo, mostrar que pasan | "Tenemos suites reales corriendo — Jest en backend, Vitest en frontend — cubriendo el flujo del cuestionario vocacional y el CRUD de usuarios." |
| 6:00–7:00 | Ser honestos sobre el alcance | "La cobertura hoy es un punto de partida, no el 80% completo — arrancamos la infraestructura de testing esta semana. Ya identificamos qué falta (issue #23: middlewares de auth y controllers de comunidad) y quedó asignada para el siguiente sprint." |

**Por qué decirlo así y no inflar el número:** es más fácil defender "esto es lo que tenemos y esto es lo que sigue" que un 80% que no resiste una pregunta de seguimiento tipo "muéstrenme el reporte de cobertura".

---

## Bloque 3 — Metodología Ágil y Control de Versiones (3 min) — **Todos, rápido**

### David — 0:00–1:00 (tablero)

Mostrar el tablero real en pantalla: [github.com/users/davidm052006/projects/1](https://github.com/users/davidm052006/projects/1).

> "Esta semana hicimos limpieza honesta del tablero: teníamos 16 issues de marzo que nunca se movieron aunque el trabajo ya estaba hecho — las cerramos explicando por qué en vez de fingir que pasaron por el flujo. El tablero arranca de cero hoy con 5 issues reales repartidas por persona."

### Julián / Brayan / Eduard — 1:00–2:30 (30s cada uno)

Cada quien señala **su propia issue** en el tablero y dice en una frase qué va a hacer:

- **Julián:** "Tengo asignadas #24 (CRUD real de convocatorias en el panel admin — hoy solo se puede leer, no crear) y #25 (hacer el dashboard responsive, hoy es solo desktop)."
- **Brayan:** "Tengo la #26 — hoy la carga masiva de usuarios por CSV hace un request por fila, voy a agregar un endpoint de bulk-insert real."
- **Eduard:** "Tengo la #23 — ampliar la cobertura de tests que arrancamos esta semana."

### Cierre — 2:30–3:00

Mostrar el PR real: [#28](https://github.com/davidm052006/Desarrollo-Brota-Orietacion-vocacional/pull/28) (`feature/admin-route-guard` → `main`).

> "Este PR es el primero de un flujo de ramas por característica que usamos desde ahora: rama `feature/algo`, commits, PR con descripción y vínculo a la issue que cierra. Es el modelo para lo que sigue con #23 a #26."

---

## Preguntas probables del jurado (y respuesta corta)

| Pregunta | Respuesta |
|---|---|
| "¿Por qué el tablero recién se movió hoy?" | "Preferimos ser honestos: el trabajo se hizo, pero no pasó por el tablero. Lo reseteamos en vez de simular un historial de uso continuo." |
| "¿Dónde está su JWT_SECRET propio?" | "Delegamos la autenticación completa a Supabase Auth — es más seguro que mantener nuestro propio esquema." |
| "¿Cuál es su cobertura real de tests?" | Dar el número real de tests (7 backend + 19 frontend), no un porcentaje inventado, y mencionar la issue #23 como plan concreto. |
| "¿Por qué la mayoría de los commits son de una sola persona?" | "David coordinó gran parte de la integración; el resto del equipo tiene issues propias asignadas ahora mismo (#23–#26) para que la distribución sea pareja de acá en adelante — no lo escondemos." |
