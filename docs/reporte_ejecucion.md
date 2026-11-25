# Reporte de ejecución de pruebas — Brota

> Checklist T6, ítem 10 · Responsables: Julian (ejecución) y Brayan (revisión y re-ejecución) · Versión 1.0 · 25 nov 2026 (0.9: 23 nov)
> Plan: [`plan_pruebas.md`](./plan_pruebas.md) · Casos: [`matriz_casos_prueba.md`](./matriz_casos_prueba.md) · Reportes por semana: [`reportes/`](./reportes/)

**Estado de este documento:** versión final del congelamiento. La corrida de Julian (23 nov) se hizo sobre `develop` con los PR abiertos fusionados en local. El 25 nov Brayan la repitió en su equipo sobre `develop` ya fusionado (`5e09a76`, con #79, #82, #83 y #84) más los PR que faltaban (#87 y #89 a #93) y obtuvo **los mismos números en todos los niveles** (§10).

## 1. Resumen

| | Resultado |
|---|---|
| Pruebas ejecutadas | **946 pasan · 0 fallan** · 3 E2E saltadas (necesitan una cuenta real, §3.3) |
| Integración contra la BD real | 26/26, dos corridas seguidas y otras dos después de borrar la BD (prueba de fuego) |
| Re-ejecución independiente | Brayan, 25 nov, en su equipo: **946 · 0 · 3**, igual en todos los niveles y en la cobertura (§10) |
| Matriz de casos | **36/36 ✅** (11 positivos, 25 negativos), versión 1.1 con CP-35 (DEF-07) y CP-36 (DEF-08) |
| Cobertura backend | 84.97 / 72.73 / 82.93 / 87.65 (umbral 84 / 72 / 82 / 87) ✅ |
| Cobertura frontend | 81.94 / 73.34 / 75.88 / 82.77 (umbral 81 / 73 / 75 / 82) ✅ |
| Defectos | 8 registrados: **6 cerrados** (DEF-01 a DEF-06). DEF-07 y DEF-08 están corregidos y verificados en PR aprobados (#87, #91) y se cierran al fusionarlos |
| Criterios de salida (plan §6) | **5 de 5 cumplidos** (§6) |

Cobertura en el orden sentencias / ramas / funciones / líneas, medida sin `DATABASE_URL`, igual que el CI.

## 2. Qué se ejecutó

**Código:** `develop` (`dd48dba`) más los 11 PR abiertos, fusionados en local en el orden de fusión previsto (rama local `integ/rc-25nov`, `2b61271`). Ningún PR tuvo conflictos.

| PR | Rama | Commit | Autor |
|---|---|---|---|
| #78 | `fix/ci-main-integracion` | `1084822` | Julian |
| #79 | `test/bd-pruebas-supabase` | `2c0a42a` | Julian |
| #82 | `semana-06/julian-bd` | `0d61155` | Julian |
| #84 | `test/umbral-70` | `da34681` | Julian |
| #83 | `docs/matriz-casos-prueba` | `f98c11b` | Julian |
| #87 | `semana-06/brayan-api` | `b55c911` | Brayan |
| #89 | `semana-02/brayan-api` | `669d632` | Brayan |
| #90 | `semana-03/brayan-front` | `189b234` | Brayan |
| #91 | `semana-04/brayan-front` | `94fd39a` | Brayan |
| #92 | `semana-05/brayan-e2e` | `52fdf4e` | Brayan |
| #93 | `docs/matriz-brayan-s2-s5` | `f24f1b6` | Brayan |

**Ambiente:** Windows 11, Node 24.12, pnpm 10, Docker Desktop 29.8, Supabase CLI 2.117 (Postgres 17), Playwright 1.64 con Chromium. La BD de pruebas es el Supabase local del proyecto (`brota-demo`, puerto 55322), creada desde cero con `supabase db reset`: 3 migraciones y `seed.sql`, sin errores.

**Fecha:** 23 nov 2026, de 21:30 a 21:55 (hora de Colombia).

**Re-ejecución (25 nov, Brayan):** `develop` en `5e09a76`, que ya trae #79, #82, #83 y #84 fusionados, más #87, #89 a #93 y esta rama, fusionados en local sin conflictos. BD creada desde cero con `supabase db reset`. Los resultados de §3 coinciden al número.

**Estado de los PR al congelamiento:** #79, #82, #83 y #84 fusionados en `develop`, con el CI en verde (`5e09a76`). #87, #89, #90, #91, #92 y #93 tienen revisión aprobada de otra capa y esperan fusión.

## 3. Resultados por nivel

| Nivel | Herramienta | Archivos | Pasan | Fallan | Comando |
|---|---|---:|---:|---:|---|
| Unitario backend | Jest | 20 | 172 | 0 | `pnpm --filter backend test` |
| API backend (Express real, Supabase simulado) | Jest + supertest | 11 | 190 | 0 | `pnpm --filter backend test` |
| Integración con la BD real | Jest + `pg` + Supabase local | 4 | 26 | 0 | `pnpm --filter backend test:integracion` |
| Unitario frontend | Vitest | 8 | 247 | 0 | `pnpm --filter frontend test` |
| Componente (RTL + user-event) | Vitest + Testing Library | 27 | 300 | 0 | `pnpm --filter frontend test` |
| E2E en navegador | Playwright | 5 | 11 | 0 | ver §3.3 |
| **Total** | | **75** | **946** | **0** | |

Criterio de nivel en el backend: API = `tests/api/` y `tests/controllers/`; integración = `tests/integracion/`; el resto es unitario.

### 3.1 Integración y prueba de fuego

| Corrida | Resultado |
|---|---|
| `supabase db reset` (3 migraciones + seed) | Sin errores |
| `test:integracion`, 1.ª | 26/26 |
| `test:integracion`, 2.ª seguida | 26/26 |
| `supabase stop --no-backup` → `start` → `test:integracion` dos veces | 26/26 y 26/26 |
| Suite completa del backend con `DATABASE_URL` (`test:coverage`) | 388/388 |
| Suite completa del backend sin `DATABASE_URL` (como el CI) | 362 pasan, 26 saltadas |

Los 26 casos de integración: `esquema.test.js` (3, montaje de la BD), `programas.bd.test.js` (11, Julian, S6), `perfil.restricciones.test.js` (8, Julian, S6, DEF-05 y DEF-06) y `contacto.api.test.js` (4, Brayan, S6, DEF-07).

### 3.2 Cobertura frente al umbral

| Parte | Sentencias | Ramas | Funciones | Líneas | Umbral en CI (#84) | Meta S6 |
|---|---:|---:|---:|---:|---|---|
| Backend | 84.97 | 72.73 | 82.93 | 87.65 | 84 / 72 / 82 / 87 ✅ | ≥ 70 ✅ |
| Backend con BD (informativo) | 85.01 | 73.10 | 82.93 | 87.70 | — | — |
| Frontend | 81.94 | 73.34 | 75.88 | 82.77 | 81 / 73 / 75 / 82 ✅ | ≥ 70 ✅ |

El margen más corto es ramas del backend (72.73 frente a 72). Un PR que agregue ramas sin tests puede bajar del umbral.

### 3.3 E2E

| Archivo | Casos | Resultado | Doble de red |
|---|---|---|---|
| `login-validation.spec.js` | Login vacío (CP-01) | ✅ 1/1 | — |
| `signup-validation.spec.js` | Registro vacío (CP-02) | ✅ 1/1 | — |
| `login-route.spec.js` | ROUTE-01 a 03: 400, red caída, 429 (CP-03 a CP-05) | ✅ 3/3 | `page.route` sobre Supabase Auth |
| `contacto-route.spec.js` | CONTACTO-01 a 05 (Brayan, S5) | ✅ 5/5 | `page.route` sobre `/api/contacto` |
| `recursos-navigation.spec.js` | Búsqueda de recursos | ✅ 1/1 | — |
| `login-success.spec.js`, `login-invalid-password.spec.js`, `login.spec.js` | Login con una cuenta real | ⏭️ saltadas | Necesitan `E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD`, que no se versionan |

`pnpm --filter brota-e2e test` (`e2e/run-tests.mjs`) no incluye `login-route.spec.js` ni `login.spec.js`, así que el primero se corrió aparte con `npx playwright test tests/login-route.spec.js` (#95 lo agrega al runner). El CI corre `login-validation` y `login-route`, pero todavía no `contacto-route` (§7).

## 4. Matriz de casos (36)

Los 36 casos de [`matriz_casos_prueba.md`](./matriz_casos_prueba.md) (versión 1.1) se ejecutaron: **36 ✅, 0 ❌**. CP-35 y CP-36 son los casos de los defectos nuevos y se verifican con los tests de #87 y #91.

| Módulo | Casos | Nivel | Resultado |
|---|---|---|---|
| Autenticación y registro | CP-01 a CP-06 | E, C, A | 6 ✅ |
| Perfil y edad | CP-07 a CP-15 | U, I | 9 ✅ |
| Test vocacional y recomendación | CP-16 a CP-18 | U | 3 ✅ |
| Programas | CP-19 a CP-23 | I | 5 ✅ |
| Seguridad de la API | CP-24 a CP-27 | A | 4 ✅ |
| Contrato de errores | CP-28 a CP-30 | A | 3 ✅ |
| Sincronización MEN | CP-31 y CP-32 | A | 2 ✅ |
| Comunidad | CP-33 y CP-34 | C | 2 ✅ |
| Contacto (DEF-07) | CP-35 | U, I | 1 ✅ |
| Comunidad · moderación (DEF-08) | CP-36 | A | 1 ✅ |

**Pruebas de los PR de Brayan del 23 nov**, también en verde en las dos corridas:

| PR | Pruebas | Resultado |
|---|---|---|
| #87 (S6, API) | CON-01 a 04 contra la BD + 16 unitarias de `validarContacto` (DEF-07) | ✅ 20/20 |
| #89 (S2, API) | `algoritmoRecomendacion.limites.test.js`: tope de compatibilidad y bonificaciones | ✅ 11/11 |
| #90 (S3, Front) | `FeedReciente.test.jsx` con RTL | ✅ 7/7 |
| #91 (S4, Front) | `comunidadContratoFront.test.js`: contratos que consume la interfaz, con DEF-08 | ✅ 10/10 |
| #92 (S5, E2E) | `contacto-route.spec.js` con `page.route` | ✅ 5/5 |

Julian revisó y ejecutó cada uno de estos PR en su equipo, con su mutante, antes de aprobarlos (detalle en la revisión de cada PR).

## 5. Defectos

Ciclo del plan §8: detectar (test en rojo) → corregir → verificar (re-ejecución en verde) → cerrar el issue.

| Defecto | Issue | Severidad | Detectado por | Corrección | Verificado en esta corrida | Estado |
|---|---|---|---|---|---|---|
| DEF-01 · `calcularEdad` suma el año un día antes (zona horaria de Colombia) | #54 | baja | `calcularEdad.test.js` | `4885eb9` (en `develop`) | ✅ 24/24 | Cerrado |
| DEF-02 · elegir un área o el modo anónimo publica la pregunta | #56 | media | `ModalHacerPregunta.test.jsx` | `4a7b2eb` (en `develop`) | ✅ CP-33 | Cerrado |
| DEF-03 · errores de la API en HTML con stack trace | #58 | media | `tests/api/errores.test.js` | #60 (en `develop`) | ✅ CP-28, CP-29 | Cerrado |
| DEF-04 · los 500 exponen el mensaje interno de la BD | #59 | media | `tests/api/errores-internos.test.js` | #60 (en `develop`) | ✅ CP-30 | Cerrado |
| DEF-05 · PATCH de perfil responde 500 al violar las restricciones | #80 | media | `perfil.restricciones.test.js` (BD real) | #82 (`e69105a`, en `develop`) | ✅ PER-03 | Cerrado |
| DEF-06 · un PATCH sin edad borra la edad guardada | #81 | **alta** | `perfil.restricciones.test.js` (BD real) | #82 (`e69105a`, en `develop`) | ✅ PER-02 | Cerrado |
| DEF-07 · POST de contacto responde 500 si un campo no es texto | #86 | media | `contacto.api.test.js` (BD real) | #87 (aprobado) | ✅ CON-04, CP-35 | Abierto: se cierra al fusionar #87 |
| DEF-08 · el feed del Dashboard muestra publicaciones ocultadas | #88 | media | `comunidadContratoFront.test.js` | #91 (aprobado, `Closes #88`) | ✅ caso DEF-08, CP-36 | Abierto: se cierra al fusionar #91 |

Ningún defecto quedó sin corrección. Los dos abiertos tienen el test que los detectó en verde con la corrección aplicada, y su PR ya está aprobado.

**Observaciones que no son defectos** (pasan a T7):
- La búsqueda de programas distingue tildes: "ingenieria" no encuentra "Ingeniería" (CP-22, BD-04).
- Los `<label>` de `Contacto.jsx` no están asociados a sus campos (falta `htmlFor`). Afecta la accesibilidad; lo encontró Brayan en S5.

## 6. Criterios de salida (plan §6)

| Criterio | Estado | Detalle |
|---|---|---|
| CI en verde: lint, tests, cobertura con umbral y build | ✅ | `develop` en verde en `5e09a76` (tras fusionar #82, #84 y #83). `QUIZ_SECRET` ya está configurado: el check `generar` pasa en todos los PR. |
| Cobertura ≥ umbral vigente (meta S6: 70 %) | ✅ | §3.2. El umbral del CI (#84) ya está en `develop`. |
| Ningún defecto de severidad alta abierto | ✅ | DEF-06 (`sev:alta`) cerrado: el arreglo está en `develop` (#82). |
| PR revisado y ejecutado por alguien de otra capa | ✅ | #79 y #82: Brayan. #83 y #84: Edward. #87 y #89 a #93: Julian. Cada uno anotó en su revisión lo que ejecutó. |
| Integración dos veces seguidas y después de borrar la BD | ✅ | §3.1, y Brayan la repitió en su equipo el 25 nov (26/26 y 26/26) |

## 7. Hallazgos de la ejecución

1. **`develop` no arrancaba desde cero.** La migración `20260924` altera `preguntas` antes de que exista, porque el volcado del esquema tenía fecha 21 nov y corría de último. Se corrigió en #79: el volcado pasa a ser la migración base (`20260801000000_…`).
2. **La integración debe correr en serie.** Con `jest` en paralelo, la limpieza de un archivo borra los usuarios de prueba de otro y aparecen 401 falsos (pasó en esta corrida: 2 fallos en `perfil.restricciones`). Los scripts `test`, `test:coverage` y `test:integracion` ya usan `--runInBand`; no hay que llamar a `jest` directo con `DATABASE_URL`.
3. **Las pruebas y el demo comparten la BD local.** Correr la integración borra los datos del demo. Se recuperan con `make brota-demo-reset` (anotado en el README).
4. **Playwright 1.64 necesita su navegador.** En un equipo nuevo, primero `npx playwright install chromium`; si no, las E2E fallan sin llegar a abrir la página.
5. **Huecos en las corridas E2E.** `run-tests.mjs` no incluye `login-route.spec.js` (lo agrega #95, aprobado) ni `login.spec.js` (login con cuenta real; lo encontró Brayan en la re-ejecución). El CI no corre `contacto-route.spec.js`, aunque no necesita secretos (sugerido en la revisión de #92).

## 8. Cómo reproducir

```bash
# BD de pruebas desde cero (Docker Desktop abierto)
npx supabase start && npx supabase db reset

# Backend sin BD, como el CI
pnpm --filter backend test:coverage

# Integración contra la BD real (dos veces)
eval "$(npx supabase status -o env --override-name db.url=DATABASE_URL --override-name api.url=SUPABASE_URL --override-name auth.service_role_key=SUPABASE_SERVICE_KEY | grep -E '^(DATABASE_URL|SUPABASE_URL|SUPABASE_SERVICE_KEY)=' | sed 's/^/export /')"
pnpm --filter backend test:integracion
pnpm --filter backend test:integracion

# Frontend
pnpm --filter frontend test:coverage

# E2E
pnpm --dir e2e exec playwright install chromium
pnpm --filter brota-e2e test
pnpm --dir e2e exec playwright test tests/login-route.spec.js
```

## 9. Estado al congelamiento (25 nov)

- [x] Fusionados en `develop`: #79, #82, #84 y #83.
- [x] Re-ejecución independiente sobre `develop` fusionado (Brayan): coincide al número (§10).
- [x] DEF-05 y DEF-06 cerrados con el commit de fusión (`e69105a`).
- [x] CI de `develop` en verde, incluido `generar` (`QUIZ_SECRET` configurado).
- [ ] Fusionar #87 y #89 a #93 (aprobados) y cerrar DEF-07 (#86) y DEF-08 (#88) con su commit de fusión.
- [ ] Fusionar #95 (`login-route` en el runner) y agregar `contacto-route.spec.js` al CI.

## 10. Firmas

| Rol | Persona | Fecha | Resultado |
|---|---|---|---|
| Ejecutó | Julian | 23 nov 2026 | 946 ✅ · 0 ❌ · 3 saltadas |
| Revisó y re-ejecutó | Brayan | 25 nov 2026 | 946 ✅ · 0 ❌ · 3 saltadas (coincide con la corrida de Julian) |
