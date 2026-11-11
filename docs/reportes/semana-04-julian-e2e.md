# Reporte de ejecución — Semana 4 · Pruebas de API · Capa E2E · Julian

| Campo | Valor |
|---|---|
| Responsable | Julian Machado (JulianMg20) |
| Fecha de ejecución | 2026-11-11 |
| Rama | `semana-04/julian-e2e` → PR hacia `test/semana-04` |
| Capa y ángulo | E2E · transversal: seguridad (401, 403, autorizado) y contrato de errores de toda la API |
| Archivos de pruebas | `backend/tests/api/seguridad.test.js`, `backend/tests/api/errores.test.js`, `backend/tests/api/errores-internos.test.js` |
| Herramientas | Node v24.12.0, Express 5.2.1, Jest 29.7.0, supertest 7.2.2 |
| Comando | `cd backend && npx jest tests/api` |

## 1. Alcance

Las pruebas llaman a la API real de Brota (`app` de `backend/src/server.js`) con supertest, sin levantar el servidor. **Supabase se reemplaza con `jest.mock`** (`src/config/supabase`): ninguna prueba lee ni modifica datos reales. Cada test configura qué devuelve el doble (usuario del token, perfil con su rol y permisos, lista o error de la base).

Rutas probadas, sin repetir dominios de otras capas:

| Ruta | Protección | Por qué |
|---|---|---|
| `GET /api/admin/usuarios` | `verificarAdmin` (token + rol `admin`) | Ruta de administración con datos personales |
| `POST /api/comunidad/preguntas` | `verificarAuth` + `requierePermiso('comunidad.publicar')` | Permiso fino que se puede quitar por usuario (`permisos_override`) o por bloqueo |
| `POST /api/auth/register-perfil`, `POST /api/contacto` | — | Rutas que reciben JSON, para probar JSON mal formado |
| `GET /api/programas`, `GET /api/rutas` | Pública / `verificarAuth` | Para simular fallos de la base (errores 500) |

## 2. Matriz de casos

| ID | Ángulo | Caso | Esperado | Resultado |
|---|---|---|---|---|
| SEG-01 | 401 | `GET /api/admin/usuarios` sin token | `401`, `Content-Type: application/json`, cuerpo exacto `{ success: false, message: 'Token de autenticación requerido' }` | ✅ |
| SEG-02 | 401 | Token inválido o expirado | `401`, «Token inválido o expirado» | ✅ |
| SEG-03 | 403 | Token válido con rol `estudiante` | `403`, «Acceso denegado: se requiere rol admin» | ✅ |
| SEG-04 | Autorizado | Token válido con rol `admin` | `200`, JSON con `data` (la lista) y `meta.total` | ✅ |
| SEG-05 | 403 | `POST /api/comunidad/preguntas` con `comunidad.publicar: false` por override | `403`, «No tenés permiso para "comunidad.publicar"» | ✅ |
| SEG-06 | 403 | Misma ruta con la cuenta bloqueada (`bloqueado_hasta` en el futuro) | `403`, `{ error: 'BLOQUEADO', hasta }` | ✅ |
| ERR-01 | Contrato · DEF-03 | `POST /api/auth/register-perfil` con `{"email":` | `400` en JSON `{ message: 'JSON mal formado' }`, sin `SyntaxError`, `node_modules` ni HTML | ✅ (tras fix) |
| ERR-02 | Contrato · DEF-03 | `POST /api/contacto` (pública) con JSON mal formado | `400` en JSON, sin detalles internos | ✅ (tras fix) |
| ERR-03 | Contrato · DEF-03 | `GET /api/no-existe` | `404` en JSON `{ message: 'Ruta no encontrada' }` | ✅ (tras fix) |
| ERR-04 | Seguridad · DEF-04 | `GET /api/programas` con Supabase devolviendo un error de Postgres | `500` `{ message: 'Error interno del servidor' }`, sin `42P01` ni la IP interna | ✅ (tras fix) |
| ERR-05 | Seguridad · DEF-04 | `GET /api/rutas` con el controlador lanzando una excepción (`asyncHandler`) | `500` genérico, sin el texto del error | ✅ (tras fix) |
| ERR-06 | Seguridad · DEF-04 | Mismo fallo que ERR-04 | El detalle completo sí queda en el log del servidor (`console.error`) | ✅ (tras fix) |

Status, cuerpo y `Content-Type` se verifican juntos en SEG-01, SEG-04, ERR-01, ERR-02, ERR-03 y ERR-04.

## 3. Defectos encontrados

### DEF-03 (#58) — Errores en HTML con stack trace

| Campo | Detalle |
|---|---|
| Severidad | Media: rompe el contrato (el frontend y la app móvil esperan JSON) y filtra el stack trace con rutas internas del servidor |
| Causa | `server.js` no tenía manejador de 404 ni manejador de errores final; Express respondía su página HTML por defecto |
| Corrección | Manejador de 404 en JSON y manejador de errores final: `400` para JSON mal formado, `413` para cuerpo demasiado grande, `500` genérico para el resto |
| Tests que lo detectan | ERR-01, ERR-02, ERR-03 |

Respuesta real antes del arreglo:

```
POST /api/auth/register-perfil   body: {"email":
400  text/html; charset=utf-8
<pre>SyntaxError: Unexpected end of JSON input<br> &nbsp; &nbsp;at JSON.parse (&lt;anonymous&gt;)<br> &nbsp; &nbsp;at parse (C:\...\backend\node_modules\...
```

Ejecución antes del fix: `Tests: 3 failed, 3 total` (las tres con `Received string: "text/html; charset=utf-8"`).
Re-ejecución después del fix: `Tests: 3 passed, 3 total`.

### DEF-04 (#59) — Los errores 500 devuelven el mensaje interno de la base

| Campo | Detalle |
|---|---|
| Severidad | Media: nombres de tablas, códigos SQL y direcciones internas de Supabase/Postgres llegan al cliente, incluso en `GET /api/programas`, que es pública |
| Causa | `utils/asyncHandler.js` y 33 respuestas en 9 controladores hacían `res.status(500).json({ ..., message: err.message })` |
| Corrección | `utils/errorInterno.js` → `responderErrorInterno(res, label, err)`: el detalle va al log y el cliente recibe `{ success: false, message: 'Error interno del servidor' }`. Lo usan `asyncHandler` y los 9 controladores |
| Fuera de alcance | `sincronizacionController.js` (solo admin; el panel muestra a propósito el error de la sincronización MEN) y `routes/router.use` (código muerto) |
| Tests que lo detectan | ERR-04, ERR-05, ERR-06 |

Ejecución antes del fix: `Tests: 3 failed, 3 total` (el cuerpo traía el mensaje de Postgres y no había log con la etiqueta del controlador).
Re-ejecución después del fix: `Tests: 3 passed, 3 total`.

## 4. Mutación deliberada

| Campo | Detalle |
|---|---|
| Mutante | Quité `requierePermiso('comunidad.publicar')` de `POST /api/comunidad/preguntas` en `backend/src/routes/comunidad.js` |
| Test que falló | SEG-05: `Expected: 403 · Received: 500` (sin el chequeo, la petición llegó al controlador) |
| Resultado | `1 failed, 5 passed`. Restauré la ruta y volvió a `6 passed` |

## 5. Ejecución final

```
tests/api/seguridad.test.js         6 passed
tests/api/errores.test.js           3 passed
tests/api/errores-internos.test.js  3 passed
Suite completa del backend          Tests: 1 failed, 30 passed, 31 total
ESLint (backend/src y backend/tests) sin errores
```

El único fallo es `tests/api.test.js › GET /api/programas responde 200`, que consulta Supabase remoto. Falla igual sin los cambios de esta rama; el arreglo (mock de Supabase) lo hace Mateo en su PR.

## 6. Cobertura

| Alcance | Sentencias | Ramas | Funciones | Líneas |
|---|---:|---:|---:|---:|
| Backend completo (`npx jest --coverage`, local, con `api.test.js` fallando) | 30.46% | 9.09% | 13.71% | 33.57% |
| Archivos de seguridad y errores (`server.js`, `verificarAuth`, `verificarAdmin`, `requierePermiso`, `permisos`, `asyncHandler`, `errorInterno`), solo con `tests/api` | 84.31% | 59.09% | 92.30% | 84.15% |

El umbral de la semana (máx. 50 o la cobertura real) se fija en el PR de umbrales del equipo, con todos los PR de la semana integrados.

## 7. Pendiente

- Revisión cruzada: alguien de otra capa ejecuta estas pruebas en su equipo y aprueba el PR.
- Cerrar a mano #58 y #59 después del merge (el PR va a `test/semana-04`, no a `main`, así que «Closes» no los cierra solo).
- Completar la columna S4 de `docs/matriz-rotacion.md` con el equipo.
