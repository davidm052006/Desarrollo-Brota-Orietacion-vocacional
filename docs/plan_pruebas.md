# Plan de pruebas — Brota

> Checklist T6, ítem 7 · Responsable: Julian · Versión 1.0 · 19 nov 2026
> Complementa a [`estrategia_pruebas.md`](./estrategia_pruebas.md) (el *por qué*: pirámide, AAA, elección de Jest). Este documento fija el *qué*, el *dónde* y el *cuándo*.

## 1. Objetivo

Verificar que las funciones del MVP de Brota se comportan según los requerimientos ([`requerimientos_funcionales.md`](./requerimientos_funcionales.md)) antes de la entrega del 23–27 nov 2026, y dejar evidencia trazable: caso → test automatizado → ejecución → defecto.

## 2. Alcance

**En alcance**

| Módulo | Qué se prueba |
|---|---|
| Autenticación y registro | Validación de campos, login correcto e incorrecto, errores de Supabase Auth (400, red caída, 429), rollback del registro |
| Perfil | Cálculo de edad (zona horaria de Colombia), actualización de datos |
| Test vocacional y recomendación | Cálculo del perfil vocacional, algoritmo de recomendación, consumo de programas MEN |
| Sincronización MEN | Datos enviados, cuándo no llamar al servicio externo, error externo, reloj |
| Comunidad | Foros, historias, preguntas, votos, likes, moderación y reportes |
| Seguridad de la API | 401 sin token, 403 por rol o permiso, usuario bloqueado |
| Contrato de errores | 404 y JSON mal formado responden JSON; los 500 no exponen mensajes internos |
| Panel admin e institución | CRUD de usuarios (individual y masivo), programas, permisos |

**Fuera de alcance (pasa a T7)**: diseño responsive, favoritos, CRUD de convocatorias, pruebas de carga y de accesibilidad automatizadas.

## 3. Niveles y herramientas

| Nivel | Qué cubre | Herramienta | Dónde vive | Comando |
|---|---|---|---|---|
| Unitario | Funciones puras y reglas (`calcularEdad`, `validarCampos`, algoritmo) | Jest 29 / Vitest 4 | `backend/tests/**`, `frontend/src/**/*.test.*` | `pnpm --filter backend test` / `pnpm --filter frontend test` |
| Componente | Pantallas y modales con interacción real del usuario | Vitest + React Testing Library + user-event | `frontend/src/**/*.test.jsx` | `pnpm --filter frontend test` |
| API | Endpoints con Express real y Supabase simulado (fake en memoria) | Jest + supertest + `tests/helpers/supabaseFake.js` | `backend/tests/api/`, `backend/tests/controllers/` | `pnpm --filter backend test` |
| Integración con BD | Endpoints y consultas contra una BD Postgres real | Jest + `pg` + Supabase local | `backend/tests/integracion/` | `pnpm --filter backend test:integracion` (ver §4) |
| E2E | Flujos completos en el navegador | Playwright (Chromium), `page.route` para simular Supabase | `e2e/tests/` | `pnpm --filter brota-e2e test` |

Los dobles de prueba (stub, mock, fake, spy) se usan solo para lo que el test no controla: Supabase, la API del MEN y el reloj. La lógica propia del proyecto nunca se simula.

## 4. Ambientes

El punto clave del plan: **las pruebas nunca escriben en la BD de desarrollo ni en la de producción.**

| Ambiente | BD | Quién lo usa | Notas |
|---|---|---|---|
| Producción | Supabase en la nube | Usuarios reales (Railway + Vercel) | Nunca se prueba contra él |
| Desarrollo | Supabase en la nube (proyecto de desarrollo) | El equipo al programar (`backend/.env`) | No se usa en tests automatizados |
| **Pruebas** | **Supabase local en Docker**: Postgres 17, puerto 54322, `project_id = brota_test` | Tests de integración | Se crea vacío con `supabase/migrations/`, el mismo esquema que producción |
| CI (GitHub Actions) | Ninguna | Cada PR | Unitarias, componente y API con fakes; la integración se salta sin `DATABASE_URL` (la BD llega al CI en la semana 8) |

**Por qué Supabase local y no un Postgres solo:** el esquema tiene llaves foráneas a `auth.users` y políticas RLS para `service_role`, y eso solo existe en un Postgres de Supabase. El CLI levanta la misma versión mayor que producción (17) y aplica las migraciones en orden:

1. `20260801000000_esquema_base.sql`: esquema consolidado (copia de `backend/setup_database.sql`).
2. `20260924000000_add_updated_at_to_preguntas.sql`
3. `20260930000000_test_vocacional_seleccion_unica.sql`

**Protecciones:**
- La conexión llega solo por variables de entorno (`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`), que se sacan de `supabase status -o env`. Ningún archivo de test tiene credenciales.
- `backend/tests/helpers/bdPruebas.js` aborta si alguna de esas URLs no es `127.0.0.1`/`localhost`. Así un test que trunca tablas no puede correr contra el Supabase remoto aunque `backend/.env` esté cargado.

Comandos para levantar, correr y apagar: [README → Integración contra la BD de pruebas](../README.md#integración-contra-la-bd-de-pruebas-supabase-local).

## 5. Datos de prueba y limpieza

- Cada test crea sus propios datos. No se usan ids fijos que el test no haya insertado.
- Los usuarios de prueba se crean en `auth.users` con correos `@prueba.brota.test`. La limpieza borra solo ese dominio, y las FK `ON DELETE CASCADE` se llevan sus filas.
- **Limpieza: truncado antes de cada test** (`limpiar([...tablas])` → `TRUNCATE … RESTART IDENTITY CASCADE`). Se eligió truncar en vez de usar una transacción con rollback porque el backend usa `supabase-js`, que habla con la BD por HTTP (PostgREST): cada petición abre su propia transacción en el servidor, así que un rollback abierto desde el test no alcanzaría los datos que escribe el API.
- Ningún dato personal real. En los E2E de login, la cuenta de prueba llega por variables locales (`E2E_TEST_EMAIL`) y nunca se versiona.

## 6. Criterios

**Entrada** (para empezar a probar un cambio):
- El código compila y pasa el lint.
- Existe una rama y un PR hacia `develop`.
- Para integración: Docker abierto y `supabase db reset` sin errores.

**Salida** (para fusionar o dar por cerrada una semana):
- CI en verde: lint, tests, cobertura con umbral y build.
- Cobertura ≥ al umbral vigente en frontend y backend. Meta de la semana 6: **70%** en sentencias, ramas, funciones y líneas.
- Ningún defecto de severidad alta abierto en el módulo.
- PR revisado y ejecutado por alguien de otra capa.
- La integración pasa dos veces seguidas y después de `supabase stop --no-backup` (prueba de fuego).

**Suspensión**: se detienen las pruebas de un módulo si la BD de pruebas no se puede reconstruir desde las migraciones, o si un defecto bloquea el flujo principal (login o test vocacional). Se reanudan cuando el defecto tiene corrección en un PR.

## 7. Cobertura

| Parte | Sentencias | Ramas | Funciones | Líneas | Umbral en CI |
|---|---:|---:|---:|---:|---|
| Backend (19 nov) | 80.27 | 67.66 | 77.73 | 83.51 | 73 / 62 / 69 / 76 |
| Frontend (19 nov) | 60.76 | 60.2 | 58.43 | 60.44 | 60 / 60 / 58 / 60 |

Regla del umbral: el mayor entre el piso de la semana y la cobertura real redondeada hacia abajo. Se mide **sin** `DATABASE_URL`, igual que el CI. El adaptador de BD queda fuera de la medición y se prueba con integración.

## 8. Gestión de defectos

- Cada defecto se registra como issue `DEF-NN: <síntoma>` con pasos, resultado esperado y obtenido, y una etiqueta de severidad (`sev:alta`, `sev:media`, `sev:baja`).
- Ciclo: **detectar** (test que falla, en el PR) → **corregir** (commit `fix: … (DEF-NN)`) → **verificar** (re-ejecución con el test en verde, anotada en el issue) → cerrar el issue.
- Defectos registrados: DEF-01 #54 (calcularEdad), DEF-02 #56 (botones sin `type` publican), DEF-03 #58 (errores en HTML con stack trace), DEF-04 #59 (500 con mensaje interno). Los cuatro tienen corrección fusionada en `main`.

## 9. Entregables y trazabilidad

| Entregable | Archivo | Fecha |
|---|---|---|
| Plan de pruebas | `docs/plan_pruebas.md` (este) | 19–20 nov |
| Matriz de ≥ 20 casos (≥ 8 negativos) | `docs/matriz_casos_prueba.md` | 23–24 nov |
| Reporte de ejecución | `docs/reporte_ejecucion.md` | 25 nov (congelamiento) |
| Reportes por semana | `docs/reportes/` | S2–S6 |
| Rotación de capas | `docs/matriz-rotacion.md` | Cada semana |

## 10. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Un test corre contra el Supabase remoto | Pérdida de datos de desarrollo | Guardia de host local en `bdPruebas.js` |
| `setup_database.sql` y la migración base se desincronizan | La BD de pruebas deja de ser igual a producción | Todo cambio de esquema va en una migración nueva en `supabase/migrations/`; el test `integracion/esquema.test.js` verifica las tablas |
| La integración no corre en el CI hasta la semana 8 | Una regresión de BD pasa el CI | Correr `test:integracion` antes de pedir revisión; anotarlo en el PR |
| Credenciales reales en `backend/.env.example` (#29) | Repositorio público expone la service key | Rotación a cargo de David antes de la entrega |
