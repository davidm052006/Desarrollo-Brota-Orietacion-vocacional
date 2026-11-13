# Reporte de ejecución — Semana 5 · Dobles de prueba · Capa API · Julian

| Campo | Valor |
|---|---|
| Responsable | Julian Machado (JulianMg20) |
| Fecha de ejecución | 2026-11-13 |
| Rama | `semana-05/julian-api` → PR hacia `test/semana-05` |
| Capa y ángulo | API · sincronización con el MEN (datos.gov.co): datos enviados, cuándo no llamar a la dependencia, fallo externo y reloj |
| Archivo de pruebas | `backend/tests/api/sincronizacion.test.js` |
| Unidad probada | `backend/src/controllers/sincronizacionController.js` (`GET /api/admin/sincronizacion/estado`, `POST /api/admin/sincronizacion/ejecutar`) |
| Herramientas | Node v24.12.0, Express 5.2.1, Jest 29.7.0, supertest 7.2.2 |
| Comando | `cd backend && npx jest tests/api/sincronizacion.test.js` |

## 1. Inventario de dependencias

| Dependencia | Dónde se usa | ¿Se puede caer? | Doble en estos tests |
|---|---|---|---|
| API del MEN (datos.gov.co): metadata y dataset | `sincronizacionController` con `fetch` global | Sí: red, 5xx, timeout | `global.fetch = jest.fn()` (stub o mock según el test) |
| Supabase (PostgreSQL) | Todo el backend, aquí las tablas `instituciones`, `programas`, `recomendaciones`, `men_sincronizacion` y `perfiles_usuario` | Sí | Fake en memoria con `jest.mock('../../src/config/supabase')` que registra cada insert y delete |
| Reloj del sistema (`Date.now`) | Duración de la sincronización | No, pero no es determinista | `jest.spyOn(Date, 'now')` |
| Servicios del frontend (`services/*.js`) | Cliente HTTP de la interfaz | — | Fuera de esta capa; los cubre la capa Front con MSW (PR #53) |

## 2. Matriz de casos

| ID | Doble | Tipo de verificación | Caso | Esperado | Resultado |
|---|---|---|---|---|---|
| SINC-01 | Stub que falla (`fetch` rechaza) | Estado | `GET /estado` con la metadata del MEN caída | `200`, `hayActualizacion: true`, `remoteDate: null` y los datos de la última sync | ✅ |
| SINC-02 | Stub (respuesta fija) | Estado | `rowsUpdatedAt` remoto igual al guardado | `hayActualizacion: false` y `remoteDate` en ISO | ✅ |
| SINC-03 | Mock de `fetch` | Comportamiento | `POST /ejecutar` con un lote incompleto | 2 llamadas: metadata y datos con `nombreestadoprograma='Activo'`, `$limit=5000`, `$offset=0`; no pide otra página; registra `exitosa` con el `remote_timestamp` | ✅ |
| SINC-04 | Fake de Supabase | Estado | 3 registros: 2 de la misma institución (con mayúsculas y espacios distintos) y 1 sin institución | 1 institución insertada; 2 programas con título en formato título, `area_academica` (`tecnologia`, `social`), duración y modalidad normalizadas | ✅ |
| SINC-05 | Stub que falla (MEN responde 503) | Estado + "no se llamó" | `POST /ejecutar` con el dataset caído | `500`; **cero** insert y delete en `instituciones`, `programas` y `recomendaciones` (datos previos intactos); registro `fallida` | ✅ |
| SINC-06 | Fake con fallo en el borrado | Estado | Falla la purga de los datos viejos | `200`, programas insertados y sync `exitosa` | ✅ |
| SINC-07 | Spy sobre `Date.now` y sobre `res` | Estado | Reloj fijado en 1 000 ms y 4 500 ms | `duracionSegundos: 3.5` | ✅ |
| SINC-08 | Mock de `fetch` | Comportamiento ("no se llamó") | Usuario con rol `estudiante` | `403`, `fetch` nunca se llamó, cero escrituras | ✅ |

Por qué cada doble:

- **Stub** cuando solo importa lo que responde el MEN (SINC-01, 02 y 05). Es la única forma de "tumbar" datos.gov.co cuando queramos.
- **Mock** cuando el contrato es la llamada misma: qué consulta se envía (SINC-03) o que no se envíe ninguna (SINC-08).
- **Fake** de Supabase para comprobar el **estado final** (qué filas quedaron) en vez de contar llamadas (SINC-04 y 06). Así los tests no dependen del orden interno de `.select().eq()`.
- **Spy** sobre el reloj (SINC-07). SINC-07 llama al controlador directo y no por supertest, porque Express y `express-rate-limit` también leen `Date.now` y consumirían los valores fijados.

## 3. Mutación deliberada

| Mutante | Test que falló | Resultado |
|---|---|---|
| En `fetchAllActivos` se comentó `if (!res.ok) throw new Error(...)`: el controlador trata un 503 del MEN como si fuera respuesta válida | SINC-05: «con el MEN caído no borra ni inserta datos y registra la sync fallida» | Falló (1 de 8). Se restauró con `git restore` y quedó 8/8 |

## 4. Revisión de mocks excesivos (autoevaluación)

- Se **conservó** el fake de Supabase en vez de un `jest.fn().mockReturnThis()` por método. Las aserciones leen `db.escrituras` (estado) y no qué métodos del query builder se encadenaron.
- Solo SINC-03 y SINC-08 verifican interacciones, porque ahí la llamada es el contrato.
- La revisión del grupo (un test por persona) y quién la ejecuta quedan anotados en la descripción del PR.

## 5. Hallazgo para seguimiento (sin corregir en este PR)

Con el dataset del MEN caído, `POST /ejecutar` responde `500` con `error: "MEN API 503: <cuerpo de la respuesta externa>"`. Además, guarda ese mismo texto en `men_sincronizacion.error`. Es el mismo patrón de **DEF-04 (#59)**, que dejó `sincronizacionController` fuera de alcance. El riesgo es bajo, porque la ruta solo es para admins, pero el contrato debería ser el mismo `500` genérico. Queda propuesto para cuando se integre el arreglo de DEF-04 (que está en `semana-04/julian-e2e`, todavía sin fusionar).

## 6. Resultados y cobertura

- `npx jest tests/api/sincronizacion.test.js`: **8/8**.
- Suite completa del backend (`npx jest`): **27/27**. `npx eslint .` sin errores.

| Medición (Jest, local) | Sentencias | Ramas | Funciones | Líneas |
|---|---:|---:|---:|---:|
| `sincronizacionController.js` antes | 5.48% | 0% | 0% | 6.87% |
| `sincronizacionController.js` después | 80.48% | 53.42% | 100% | 89.31% |
| Backend completo antes | 28.43% | 7.75% | 11.21% | 31.42% |
| Backend completo después | 34.80% | 13.35% | 17.48% | 37.67% |

El piso del 60% es para todo el backend y se resuelve en el PR de umbrales del grupo. Este PR no cambia umbrales.
