# Semana 6 · Julian · Capa BD — integración contra la BD real

> Fecha: 19 nov 2026 · Ambiente: Supabase local (Postgres 17.6, puerto 54322, `brota_test`), Windows 11 + Docker Desktop 29.8.2
> Montaje de la BD de pruebas: PR #79. Plan: [`docs/plan_pruebas.md`](../plan_pruebas.md).

## 1. Qué se probó

**Entidad principal: `programas`**, el catálogo que alimenta Profesiones y las recomendaciones. Sus consultas pasaron del controlador a un repositorio (`backend/src/repositories/programasRepository.js`) con dos métodos, y se prueban contra la BD real. El controlador mantiene el mismo comportamiento: la suite previa sigue en verde.

| ID | Test | Qué verifica | Resultado |
|---|---|---|---|
| BD-01 | `listarActivos` | Filtro `activo = true` y `area_academica IS NOT NULL` | ✅ |
| BD-02 | `listarActivos` | `ORDER BY nombre` con filas insertadas en otro orden | ✅ |
| BD-03 | `listarActivos` | Filtro por área, búsqueda `ILIKE` sin importar mayúsculas, `area=todos` | ✅ |
| BD-04 | `listarActivos` | Postgres vs MySQL: `ILIKE` distingue tildes | ✅ (documenta el comportamiento) |
| BD-05 | `listarActivos` | Paginación con `range` y `count` exacto del total | ✅ |
| BD-06 | `listarActivos` | JOIN (embed) con `instituciones` por la FK; LEFT JOIN con `null` | ✅ |
| BD-07 | `contarActivos` | Conteo por área y total, sin inactivos ni sin área | ✅ |
| BD-08 | Restricción | `nombre NOT NULL` → `23502` | ✅ |
| BD-09 | Restricción | `nombre VARCHAR(200)`: 200 entra, 201 → `22001` | ✅ |
| BD-10 | Restricción | FK `institucion_id` inexistente → `23503` | ✅ |
| BD-11 | Restricción | `ON DELETE CASCADE`: borrar la institución borra sus programas | ✅ |

`programas` no tiene `UNIQUE`: dos instituciones pueden ofrecer un programa con el mismo nombre.

**Red de integración del hallazgo** (`tests/integracion/perfil.restricciones.test.js`): Express real, `verificarAuth` real con un usuario y una sesión del Auth local, y verificación en la BD.

| ID | Caso | Antes de corregir | Después |
|---|---|---|---|
| PER-01 | Caso feliz, fila verificada en la BD | 200 ✅ | 200 ✅ |
| PER-02 | PATCH sin `edad` no la borra | ❌ quedaba `NULL` | ✅ |
| PER-03 | `edad: 13` (CHECK) | ❌ 500 | 400 ✅ |
| PER-03 | `edad: 101` (CHECK) | ❌ 500 | 400 ✅ |
| PER-03 | `nombre` de 101 caracteres | ❌ 500 | 400 ✅ |
| PER-03 | `ciudad` de 101 caracteres | ❌ 500 | 400 ✅ |
| PER-03 | `nombre: null` (NOT NULL) | ❌ 500 | 400 ✅ |
| PER-03 | `apellido: "   "` | ❌ 200, se guardaba vacío | 400 ✅ |

Además, `tests/integracion/esquema.test.js` (3 tests de humo del montaje): versión 17, 22 tablas y limpieza en cascada.

## 2. Por qué estos tests encuentran lo que el fake no

`tests/helpers/supabaseFake.js` devuelve lo que el test le indica. No sabe si `.order('nombre')` ordena, si `.not('area_academica','is',null)` filtra o si `instituciones(...)` existe como relación. Tampoco conoce los `CHECK`, `VARCHAR` y `NOT NULL` de la tabla. Por eso los dos defectos de abajo pasaban todos los tests con el fake y solo aparecieron contra la BD real.

## 3. Hallazgos

### DEF-05 (#80): PATCH /api/perfil responde 500 al violar restricciones
- **Causa:** `actualizarPerfil` escribía el cuerpo directo en `perfiles_usuario` sin validar. `registerPerfil` sí validaba.
- **Corrección:** regla en el servicio, `validarActualizacionPerfil` en `src/utils/validarCampos.js`. Responde 400 `{ success: false, message }` antes de tocar la BD y solo valida los campos que trae el PATCH.
- **Test unitario en el valor límite** (`tests/validarCampos.test.js`): edad 13/14 y 100/101, decimal y texto; 100/101 caracteres; nombre `null`/`''`, apellido en blanco; PATCH sin nombre ni apellido. 14 tests nuevos: fallaban antes de la regla y pasan después.

### DEF-06 (#81): guardar el perfil de una institución borra la edad
- **Causa:** `edad: edad ? parseInt(edad) : null` escribía `null` cuando el cuerpo no traía `edad`, que es lo que pasa con `PerfilInstitucion.jsx`.
- **Corrección:** `edad` solo se actualiza si viene en el cuerpo (vacía o `null` sí la borra, a propósito).
- **Test:** PER-02, verificado en la fila de la BD.

### Observación (sin corregir): la búsqueda de programas distingue tildes (BD-04)
`ILIKE` en Postgres ignora mayúsculas pero no tildes: buscar "ingenieria" no encuentra "Ingeniería de Sistemas". En MySQL, con la collation por defecto (`utf8mb4_0900_ai_ci`), `LIKE` sí lo encontraría. Corregirlo pide la extensión `unaccent` o una columna normalizada; queda como deuda para T7.

## 4. Mutación

| Mutante | Test que lo detectó |
|---|---|
| Quitar `.order('nombre')` en `programasRepository.listarActivos` | **BD-02** (orden) y **BD-03** (la búsqueda devolvía las dos ingenierías en orden de inserción). 2 fallidos, 12 pasan. Restaurado → 14/14 |
| Quitar la limpieza (`beforeEach(limpiar)`) en `programas.bd.test.js` | BD-01, BD-02, BD-03, BD-05, BD-06, BD-07 y BD-11 (7 de 11). Los que pasan (BD-08 a BD-10) solo prueban restricciones y no leen filas ajenas. Restaurado → 22/22 |

## 5. Limpieza y conexión

- **Limpieza:** `DELETE` explícito antes de cada test (`limpiar(['programas', 'instituciones'])` y los usuarios `@prueba.brota.test`). El motivo para no usar rollback ni `TRUNCATE … CASCADE` está en el plan de pruebas, §5. Si se quita, fallan 7 de 11 tests, porque ven filas de tests anteriores (ver el segundo mutante).
- **Conexión:** solo por `DATABASE_URL`, `SUPABASE_URL` y `SUPABASE_SERVICE_KEY`, sacadas de `supabase status -o env`. No es la BD de desarrollo: el helper aborta si el host no es local.

## 6. Ejecución

| Corrida | Resultado |
|---|---|
| Integración, 1.ª | 22/22 |
| Integración, 2.ª seguida | 22/22 |
| Prueba de fuego local: `supabase stop --no-backup` → `start` → 2 corridas | 22/22 y 22/22 |
| Suite sin `DATABASE_URL` (como el CI) | 273 pasan, 22 se saltan |
| Cobertura backend sin BD | 80.5 / 67.89 / 78 / 83.69 (sent. / ramas / func. / líneas) |
| ESLint backend | 0 errores |

Pendiente del grupo: la prueba de fuego en el computador de alguien que no montó la BD (Parte 3).
