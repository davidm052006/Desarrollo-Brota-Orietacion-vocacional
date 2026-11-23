# Semana 6 · Brayan · Capa API — `POST /api/contacto` contra la BD real

> Fecha: 23 nov 2026 · Ambiente: Supabase local (PostgreSQL 17.12, puerto 54322, `brota_test`), Windows 11 + Docker Desktop 29.6.2
> Montaje de la BD de pruebas: PR #79. Plan: [`docs/plan_pruebas.md`](../plan_pruebas.md).

## 1. Qué se probó

**Endpoint: `POST /api/contacto`**, el formulario público de `/contacto` (sin sesión). También es la puerta de entrada de las instituciones ("¿Sos una institución?" → asunto "Alianzas institucionales"). Se prueba con el `server.js` real, incluido su rate limit, y cada caso se verifica en la tabla `contactos`, no solo en la respuesta HTTP.

`tests/integracion/contacto.api.test.js`:

| ID | Caso | Qué verifica en la BD | Antes de corregir | Después |
|---|---|---|---|---|
| CON-01 | Envío válido | Una fila con nombre sin espacios, email en minúsculas y `estado = 'pendiente'` (DEFAULT de la tabla) | 200 ✅ | 200 ✅ |
| CON-02 | Mensaje de 2001 caracteres (valor límite) | Se guarda recortado a 2000; teléfono vacío → `NULL` | 200 ✅ | 200 ✅ |
| CON-03 | Asunto fuera de la lista | 400 y la tabla sigue vacía | 400 ✅ | 400 ✅ |
| CON-04 | `telefono` numérico (DEF-07) | 400 y la tabla sigue vacía | ❌ 500 | 400 ✅ |

El rate limit del formulario es de 5 solicitudes cada 15 minutos por proceso: el archivo hace 4 y lo deja anotado para que nadie agregue casos sin tenerlo en cuenta.

## 2. Hallazgo

### DEF-07 (#86): `POST /api/contacto` responde 500 si un campo no es texto
- **Pasos:** `POST /api/contacto` con un cuerpo válido pero `"telefono": 3001234567` (número, no texto). Lo mismo pasa con `nombre`, `email`, `asunto` o `mensaje` como número, lista, objeto o booleano.
- **Esperado:** 400 `{ success: false, message }`, sin guardar nada.
- **Obtenido:** 500 `Error al procesar la solicitud.`
- **Causa:** el controlador llamaba a `.trim()` sobre cada campo sin revisar su tipo; con un número, `.trim` no existe y lanza `TypeError`, que cae en el `catch` del 500. El formulario web siempre manda texto, pero el endpoint es público: cualquier cliente (la app móvil, un script) puede mandar el teléfono como número.
- **Corrección:** las reglas pasan a `src/utils/validarContacto.js` (`validarContacto`), que revisa primero el tipo de cada campo y después las reglas que ya existían (obligatorios, formato de email, lista de asuntos). El controlador la llama antes de tocar cualquier campo. Los mensajes de error existentes no cambian.
- **Test unitario** (`tests/validarContacto.test.js`, 16 casos): tipos inválidos en los 5 campos, teléfono opcional (`undefined`/`null`/`''`), cada obligatorio vacío o solo espacios, email y asunto inválidos, y cuerpo ausente.
- **Severidad propuesta:** `sev:media` (no hay pérdida de datos ni filtración; el usuario recibe un error de servidor en vez de uno de validación).

## 3. Por qué estos tests encuentran lo que el fake no

Con el fake de Supabase, un `insert` "funciona" aunque la fila quede mal. Contra la BD real, CON-01 comprueba que el `estado` por defecto lo pone la tabla y que el email llega en minúsculas, y CON-02 que el recorte a 2000 ocurre antes de guardar. CON-03 y CON-04 comprueban en la tabla que una solicitud rechazada no deja nada escrito.

## 4. Mutación

| Mutante | Test que lo detectó |
|---|---|
| Quitar `.toLowerCase()` del email en `contactoController` | **CON-01** (1 fallido, 3 pasan) |
| Quitar la regla de tipo en `validarContacto` (DEF-07) | 5 unitarios (uno por campo) + **CON-04** y otro caso de integración |
| Recortar el mensaje a 2001 en vez de 2000 | **CON-02** (1 fallido, 3 pasan) |

Restaurado el código → 23/23 (7 de integración + 16 unitarios).

## 5. Limpieza y conexión

- **Limpieza:** `limpiar(['contactos'])` antes de cada test. `contactos` no tiene FK ni hijas.
- **Conexión:** solo por `DATABASE_URL`, `SUPABASE_URL` y `SUPABASE_SERVICE_KEY`, sacadas de `supabase status -o env`. El helper aborta si el host no es local.

## 6. Ejecución

| Corrida | Resultado |
|---|---|
| Integración antes de corregir | 3 pasan, CON-04 falla (500 en vez de 400) |
| Integración, 1.ª | 7/7 (4 de contacto + 3 de esquema) |
| Integración, 2.ª seguida | 7/7 |
| Prueba de fuego: `supabase stop --no-backup` → `start` → 2 corridas | 7/7 y 7/7 |
| Suite sin `DATABASE_URL` (como el CI) | 275 pasan, 7 se saltan |
| ESLint backend | 0 errores |

También revisé y ejecuté #79 (3/3 dos veces) y #82 (22/22 dos veces, más la guarda de host no local) en este mismo equipo.
