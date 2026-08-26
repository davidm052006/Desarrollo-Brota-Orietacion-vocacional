# 🔍 Auditoría pre-sustentación — Sistema Brota

**Fecha:** 26 de agosto de 2026
**Motivo:** revisión contra la rúbrica de exposición (15 min: Seguridad 5 min / Arquitectura y CRUDs 7 min / Metodología ágil 3 min), para saber qué mostrar con confianza, qué explicar de forma proactiva y qué corregir antes de presentar.
**Método:** grafo de código (graphify) + lectura directa de `backend/` y `frontend/` + `git log`/ramas + `gh issue`/`gh pr`/`gh project`.

Este documento es la versión honesta de "qué tenemos". Ver también [`gestion_proyecto.md`](gestion_proyecto.md) (estado real del tablero) y [`guion_sustentacion.md`](guion_sustentacion.md) (reparto de la exposición).

---

## Bloque 1 — Seguridad y Control de Acceso

| Criterio | Estado | Evidencia |
|---|---|---|
| Login con token, `Authorization: Bearer` | ✅ | `frontend/src/services/apiClient.js:6-12` saca `session.access_token` de Supabase y lo manda como Bearer. `backend/src/middlewares/verificarAuth.js` lo valida con `supabase.auth.getUser(token)`. |
| Roles y permisos (backend) | ✅ | `verificarAdmin.js` (rol `admin`) protege todo `/api/admin/*`. `verificarModeracion.js` (`admin`+`moderador`) protege `/api/comunidad/moderacion/*`. |
| Roles y permisos (frontend) | ✅ (corregido) | `AdminPanel.jsx` tenía un chequeo de rol duplicado y con bug (no manejaba modo demo — ver más abajo). Se reemplazó por el hook `useAdmin()` ya existente. PR [#28](https://github.com/davidm052006/Desarrollo-Brota-Orietacion-vocacional/pull/28), issue [#27](https://github.com/davidm052006/Desarrollo-Brota-Orietacion-vocacional/issues/27). |
| Cero contraseñas en texto plano | ✅ (con matiz) | No hay `bcrypt` en el repo porque **no hace falta** — las contraseñas nunca tocan nuestro backend, las maneja 100% Supabase Auth (que internamente sí hashea). Tenerlo claro para explicarlo antes de que lo pregunten. |
| JWT propio | ⚠️ matiz a explicar | El token es el de Supabase Auth, no uno firmado por nosotros. `JWT_SECRET` en `.env` es variable muerta (no se usa en ningún `require`). Respuesta lista: "delegamos la emisión y verificación a Supabase Auth en vez de mantener nuestro propio esquema JWT". |

### Bug real encontrado y corregido
`AdminPanel.jsx` verificaba el rol con una query propia a `perfiles_usuario` que **no contemplaba modo demo**. El cliente dummy de Supabase (`frontend/src/config/supabase.js`, usado cuando no hay `VITE_SUPABASE_URL`) devuelve `{ data: null, error: null }` en cualquier `.from().select()`. Como la condición era `!error && data?.rol === 'admin'`, el resultado era siempre `false` — **el admin demo (`davidm20.05.2006@gmail.com`) nunca podía entrar al panel en modo demo.** Corregido usando el hook `useAdmin()` (mismo que ya usa `TopNavbar.jsx`), que sí resuelve demo mode.

---

## Bloque 2 — Arquitectura, Integración y CRUDs

| Criterio | Estado | Evidencia |
|---|---|---|
| CORS sin errores | ✅ | `ORIGENES_PERMITIDOS` explícito + `trust proxy` configurado en `server.js`. |
| 5 CRUDs completos con persistencia | ✅✅ | `backend/src/routes/admin.js:33-57` — **5 entidades con GET+POST+PATCH+DELETE completo**: `usuarios`, `instituciones`, `programas`, `cuestionarios`, `preguntas`. Supera el mínimo pedido. |
| Cobertura ~80% end-to-end | ❌ pendiente real | Tests arrancaron el 24 ago 2026: backend 7/7 (solo `usuariosController` + `verificarAdmin`), frontend 19/19 (solo `TestVocacional`→`TestResult`, `validation`, `adminService`). Lejos del 80%. Sin medición de cobertura configurada. Issue nueva: [#23](https://github.com/davidm052006/Desarrollo-Brota-Orietacion-vocacional/issues/23) (Eduard). |

**Recomendación para la demo:** no prometer 80%. Mostrar los tests reales que existen y ser honestos sobre el alcance — es más creíble que una cifra que no se sostiene si preguntan.

---

## Bloque 3 — Metodología Ágil

### Tablero Kanban — reseteado (no fabricado)
El tablero ["issus BROTA"](https://github.com/users/davidm052006/projects/1) tenía 16 issues, todas en `Backlog`, todas de marzo 2026, sin una sola movida en 5 meses — mientras la mayoría de esas features ya estaban implementadas en `main`. **No se marcaron como "Done" retroactivamente** (habría simulado un uso del tablero que no tuvimos). En su lugar:

- Se cerraron las 16 issues viejas (`#6`–`#21`) con un comentario explicando que el trabajo se hizo por fuera del tablero.
- Se crearon 5 issues nuevas con trabajo pendiente real, asignadas por persona (detalle abajo).
- El tablero arranca de cero, de verdad, desde el 26 ago 2026.

Columnas reales del tablero (no coinciden con lo que decía `gestion_proyecto.md` — ya corregido ahí): `Backlog` / `Ready` / `In progress` / `In review` (sin `Done`; `Ready` cumple ese rol).

### Issues nuevas (trabajo real pendiente)

| # | Título | Asignado | Por qué es real (no relleno) |
|---|---|---|---|
| [#23](https://github.com/davidm052006/Desarrollo-Brota-Orietacion-vocacional/issues/23) | Ampliar cobertura de tests | Eduard | Cobertura actual mínima, confirmado arriba |
| [#24](https://github.com/davidm052006/Desarrollo-Brota-Orietacion-vocacional/issues/24) | CRUD real de convocatorias en admin | Julian | Hoy solo hay lectura pública; `OportunidadesSection` maneja `programas`, no `convocatorias`, pese al nombre |
| [#25](https://github.com/davidm052006/Desarrollo-Brota-Orietacion-vocacional/issues/25) | Responsive / mobile del dashboard | Julian | Cero `@media` queries en todo el proyecto (`CLAUDE.md`, deuda técnica conocida) |
| [#26](https://github.com/davidm052006/Desarrollo-Brota-Orietacion-vocacional/issues/26) | Endpoint bulk-insert para CSV | Brayan | `createUsuariosMasivo()` hace N requests secuenciales, no escala |
| [#27](https://github.com/davidm052006/Desarrollo-Brota-Orietacion-vocacional/issues/27) | Guard de rol admin a nivel de ruta | David | Resuelta en esta misma sesión — PR #28 |

### Ramas y PRs
- **Antes de hoy:** 0 ramas `feature/`, solo 2 PRs en toda la historia del repo (marzo/abril, sobre diagramas UML). Los ~250 commits del desarrollo real se hicieron directo a `main`.
- **Desde hoy:** primer PR real de un flujo `feature/` → `main`: [`feature/admin-route-guard`](https://github.com/davidm052006/Desarrollo-Brota-Orietacion-vocacional/pull/28), que cierra la issue #27. Sirve de modelo para el resto del equipo: rama `feature/<algo-descriptivo>`, commits, PR con descripción y "Closes #N".

### Commits distribuidos
- Global: David ~69%, Julián ~19%, Brayan ~13%, Eduar ~3%.
- Últimos 14 días (26 ago 2026): David 46, Julián 5, Eduar 1, Brayan 1 — muy concentrado.
- **No se puede corregir retroactivamente sin fabricar historial.** La mitigación real es que, de acá a la sustentación, cada quien haga al menos un commit visible en su propia issue asignada (#23–#26) — aporta a la distribución real y además dan contexto para hablar de su parte en la exposición.

### README y `.env.example`
✅ Ya cumplía: `README.md` raíz con instalación clara, `backend/.env.example` y `frontend/.env.local.example` presentes.

---

## Pendientes que NO se resolvieron en esta sesión (a propósito)

- **Cobertura del 80%** — no es alcanzable en el tiempo disponible sin fabricar tests vacíos; mejor ser honestos en la demo.
- **Commits históricos desbalanceados** — no se puede corregir sin reescribir historia (riesgoso e innecesario); se mitiga hacia adelante, no hacia atrás.
- **CRUD de convocatorias, responsive, bulk-insert** — quedaron como issues reales (#24, #25, #26) en vez de resolverse apurados y sin probar antes de la sustentación.
