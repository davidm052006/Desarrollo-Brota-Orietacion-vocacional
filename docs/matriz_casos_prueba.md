# Matriz de casos de prueba — Brota

> Checklist T6, ítem 8 · Responsable: Julian · Versión 1.0 · 19 nov 2026
> Plan y ambientes: [`plan_pruebas.md`](./plan_pruebas.md). Cada caso está automatizado: la columna **Test** dice dónde vive y con qué nombre aparece en la salida de Jest, Vitest o Playwright.

## Resumen

| | Cantidad |
|---|---:|
| Casos | **34** |
| Positivos | 11 |
| Negativos (entrada inválida, sin permiso, dependencia caída, restricción violada) | **23** |
| Ligados a un defecto (DEF-01 a DEF-06) | 11 |
| Resultado obtenido | 34 ✅ (corrida del 19 nov 2026, ver §3) |

**Niveles:** U = unitario · C = componente (RTL) · A = API con Supabase simulado · I = integración con la BD real (Supabase local) · E = E2E en navegador (Playwright).

## 1. Matriz

| ID | Módulo · Req. | Caso | Tipo | Nivel | Defecto | Obtenido |
|---|---|---|---|---|---|---|
| CP-01 | Autenticación · RNF4 | Login con los campos vacíos | Negativo | E | — | ✅ |
| CP-02 | Autenticación · RNF4 | Registro con los campos obligatorios vacíos | Negativo | E + C | — | ✅ |
| CP-03 | Autenticación · RNF4 | Credenciales inválidas (Supabase responde 400) | Negativo | E | — | ✅ |
| CP-04 | Autenticación · RNF4 | Servicio de autenticación caído | Negativo | E | — | ✅ |
| CP-05 | Autenticación · RNF4 | Demasiados intentos (429) | Negativo | E | — | ✅ |
| CP-06 | Registro · RNF4 | El backend rechaza un nombre de más de 100 caracteres | Negativo | A | — | ✅ |
| CP-07 | Perfil | Edad un día antes del cumpleaños (zona horaria de Colombia) | Límite (positivo) | U | DEF-01 #54 | ✅ |
| CP-08 | Perfil | Edad: 14 años justos (mínimo permitido) | Límite (positivo) | U | DEF-01 #54 | ✅ |
| CP-09 | Perfil | Edad: un día antes de cumplir 14 | Límite (negativo) | U | DEF-01 #54 | ✅ |
| CP-10 | Perfil | Fecha inexistente: 29 de febrero en año no bisiesto | Negativo | U | — | ✅ |
| CP-11 | Perfil | Actualizar el perfil y verificar la fila en la BD | Positivo | I | — | ✅ |
| CP-12 | Perfil | Actualizar con edad 13 (CHECK 14–100) | Negativo | U + I | DEF-05 #80 | ✅ |
| CP-13 | Perfil | Actualizar con nombre de 101 caracteres (VARCHAR 100) | Negativo | U + I | DEF-05 #80 | ✅ |
| CP-14 | Perfil | Actualizar con nombre `null` (NOT NULL) | Negativo | U + I | DEF-05 #80 | ✅ |
| CP-15 | Perfil | Un PATCH sin edad no borra la edad guardada | Positivo (regresión) | I | DEF-06 #81 | ✅ |
| CP-16 | Test vocacional · RF1, RF2 | El perfil vocacional ignora respuestas abiertas y puntúa las opciones | Positivo | U | — | ✅ |
| CP-17 | Recomendación · RF3 | El orden de las recomendaciones sigue a la categoría con más puntos | Positivo | U | — | ✅ |
| CP-18 | Recomendación · RF3 | Alias de categoría: `emprendimiento` → `negocios` | Positivo | U | — | ✅ |
| CP-19 | Programas · RF4 | El listado solo trae programas activos y con área | Positivo | I | — | ✅ |
| CP-20 | Programas · RF4 | El listado sale ordenado por nombre | Positivo | I | — | ✅ |
| CP-21 | Programas · RF4 | Paginación: página 2 y total de filas | Positivo | I | — | ✅ |
| CP-22 | Programas · RF4 | Búsqueda sin tilde ("ingenieria") | Negativo (observación) | I | — | ✅ |
| CP-23 | Programas · RF10 | Programa con una institución que no existe (FK) | Negativo | I | — | ✅ |
| CP-24 | Seguridad · RNF4 | Ruta de admin sin token | Negativo | A | — | ✅ |
| CP-25 | Seguridad · RNF4 | Ruta de admin con rol estudiante | Negativo | A | — | ✅ |
| CP-26 | Seguridad · RNF4 | Ruta de admin con rol admin | Positivo | A | — | ✅ |
| CP-27 | Seguridad · RNF4 | Cuenta bloqueada intenta publicar | Negativo | A | — | ✅ |
| CP-28 | Contrato de errores | Cuerpo con JSON mal formado | Negativo | A | DEF-03 #58 | ✅ |
| CP-29 | Contrato de errores | Ruta que no existe | Negativo | A | DEF-03 #58 | ✅ |
| CP-30 | Contrato de errores | Error de la BD no se filtra al cliente | Negativo | A | DEF-04 #59 | ✅ |
| CP-31 | Sincronización MEN · RF10 | El MEN responde 503 durante la sincronización | Negativo | A | — | ✅ |
| CP-32 | Sincronización MEN · RF10 | Un estudiante intenta sincronizar | Negativo | A | — | ✅ |
| CP-33 | Comunidad | Elegir un área o el modo anónimo no publica la pregunta | Negativo (regresión) | C | DEF-02 #56 | ✅ |
| CP-34 | Comunidad | El servidor rechaza la pregunta: se muestra el error y se puede reintentar | Negativo | C | — | ✅ |

## 2. Detalle de cada caso

Formato: **Datos** · **Pasos** · **Esperado** · **Obtenido** · **Test** (`archivo` › nombre).

### Autenticación y registro

**CP-01 · Login con los campos vacíos** (negativo, E)
- **Datos:** correo y contraseña vacíos.
- **Pasos:** abrir `/login` con la sesión limpia → pulsar «Ingresar».
- **Esperado:** se muestran «El correo es requerido» y «La contraseña es requerida».
- **Obtenido:** ✅ igual al esperado.
- **Test:** `e2e/tests/login-validation.spec.js` › el login vacío muestra las validaciones de correo y contraseña

**CP-02 · Registro con los campos obligatorios vacíos** (negativo, E + C)
- **Datos:** formulario de registro sin llenar.
- **Pasos:** `/login` → «Regístrate» → pulsar «Crear cuenta» sin llenar nada.
- **Esperado:** los 10 mensajes de campo requerido (nombre, apellido, correo, contraseña, confirmación, nivel educativo, grado, edad, ciudad y teléfono); sigue en «Crea tu cuenta» y en `/login`. En el test de componente, además, no se llama a `signUpWithEmail`.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `e2e/tests/signup-validation.spec.js` › el registro no avanza y muestra validación con los campos obligatorios vacíos · `frontend/src/pages/landing/Login.test.jsx` › Crear cuenta con el formulario vacío muestra la validación y no registra

**CP-03 · Credenciales inválidas** (negativo, E)
- **Datos:** `estudiante@brota.test` / `ClaveSegura123`; Supabase simulado con `page.route` responde 400 `invalid_credentials` («Invalid login credentials»).
- **Pasos:** llenar el login → «Ingresar».
- **Esperado:** «Correo o contraseña incorrectos.»; sigue en `/login` con «Ingresar» habilitado, y se envió una sola petición con el correo y la clave escritos.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `e2e/tests/login-route.spec.js` › ROUTE-01: credenciales inválidas muestran el error en español y no navegan

**CP-04 · Servicio de autenticación caído** (negativo, E)
- **Datos:** `page.route` corta la petición de login a nivel de red (`abort('failed')`).
- **Pasos:** llenar el login → «Ingresar».
- **Esperado:** «No se pudo conectar al servicio de autenticación…», sin el texto técnico «Failed to fetch»; sigue en `/login`.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `e2e/tests/login-route.spec.js` › ROUTE-02: servicio de autenticación caído muestra error de conexión

**CP-05 · Demasiados intentos** (negativo, E)
- **Datos:** `page.route` responde 429 `over_request_rate_limit`.
- **Pasos:** llenar el login → «Ingresar».
- **Esperado:** «Demasiados intentos. Espera unos minutos antes de intentarlo de nuevo.»; sigue en `/login`.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `e2e/tests/login-route.spec.js` › ROUTE-03: demasiados intentos (429) muestra el aviso de espera

**CP-06 · Nombre de más de 100 caracteres en el registro** (negativo, A)
- **Datos:** `POST /api/auth/register-perfil` con `nombre` de 101 caracteres.
- **Pasos:** llamar al controlador con un usuario autenticado.
- **Esperado:** `400` con «El campo nombre no puede superar 100 caracteres»; no se inserta en `perfiles_usuario` y no se borra la cuenta de Auth.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `backend/tests/authController.test.js` › rechaza un nombre que supera el límite antes de insertar en Supabase

### Perfil

**CP-07 · Un día antes del cumpleaños** (límite, U · DEF-01)
- **Datos:** nacimiento `2000-10-16`, hoy = 15 oct 2026 al mediodía en Colombia.
- **Pasos:** `calcularEdadDesdeFecha('2000-10-16', hoy)`.
- **Esperado:** `25` (todavía no cumple). Antes del arreglo de DEF-01 daba 26.
- **Obtenido:** ✅ `25`.
- **Test:** `backend/tests/calcularEdad.test.js` › un día antes del cumpleaños (2000-10-16) → 25 años

**CP-08 · 14 años justos** (límite, U · DEF-01)
- **Datos:** nacimiento `2012-10-15`, hoy = 15 oct 2026.
- **Pasos:** `calcularEdadDesdeFecha('2012-10-15', hoy)`.
- **Esperado:** `14`, el mínimo permitido.
- **Obtenido:** ✅ `14`.
- **Test:** `backend/tests/calcularEdad.test.js` › 14 años justos (mínimo) → 14

**CP-09 · Un día antes de cumplir 14** (límite, U · DEF-01)
- **Datos:** nacimiento `2012-10-16`, hoy = 15 oct 2026.
- **Pasos:** `calcularEdadDesdeFecha('2012-10-16', hoy)`.
- **Esperado:** `null` (menor de 14, no puede registrarse). Antes del arreglo daba 14 y dejaba pasar a un menor.
- **Obtenido:** ✅ `null`.
- **Test:** `backend/tests/calcularEdad.test.js` › un día antes de cumplir 14 → null

**CP-10 · 29 de febrero en año no bisiesto** (negativo, U)
- **Datos:** nacimiento `2001-02-29`.
- **Pasos:** `calcularEdadDesdeFecha('2001-02-29', hoy)`.
- **Esperado:** `null`, porque la fecha no existe (no se corre al 1 de marzo).
- **Obtenido:** ✅ `null`.
- **Test:** `backend/tests/calcularEdad.test.js` › 29 de febrero en año no bisiesto → null

**CP-11 · Actualizar el perfil, verificado en la BD** (positivo, I)
- **Datos:** usuario real del Auth local con perfil `Ana Pérez, 16, Montería`; cuerpo `{ nombre: 'Ana María', apellido: 'Pérez', edad: 17, ciudad: 'Lorica' }`.
- **Pasos:** `PATCH /api/perfil/:userId` con su token → consultar `perfiles_usuario`.
- **Esperado:** `200`, y en la fila `nombre = 'Ana María'`, `edad = 17`, `ciudad = 'Lorica'`.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `backend/tests/integracion/perfil.restricciones.test.js` › PER-01 caso feliz: guarda los cambios en la BD

**CP-12 · Edad 13** (negativo, U + I · DEF-05)
- **Datos:** `{ edad: 13 }`.
- **Pasos:** `PATCH /api/perfil/:userId` con su token → consultar la fila.
- **Esperado:** `400 { success: false, message: 'La edad debe ser un número entero entre 14 y 100' }` y la fila sin cambios. Antes del arreglo: `500` por el CHECK de la BD.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `backend/tests/validarCampos.test.js` › rechaza la edad 13 · `backend/tests/integracion/perfil.restricciones.test.js` › PER-03 edad menor a 14 (CHECK) responde 400 con el contrato y no toca la BD

**CP-13 · Nombre de 101 caracteres** (negativo, U + I · DEF-05)
- **Datos:** `{ nombre: 'x' × 101 }`.
- **Pasos:** igual que CP-12.
- **Esperado:** `400` con «El campo nombre no puede superar 100 caracteres»; la fila sin cambios. Antes: `500`. Con 100 caracteres se acepta.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `backend/tests/validarCampos.test.js` › acepta nombre y ciudad de 100 caracteres y rechaza 101 · `perfil.restricciones.test.js` › PER-03 nombre de 101 caracteres (VARCHAR 100) responde 400…

**CP-14 · Nombre `null`** (negativo, U + I · DEF-05)
- **Datos:** `{ nombre: null }`.
- **Pasos:** igual que CP-12.
- **Esperado:** `400` con «El campo nombre es obligatorio»; la fila sin cambios. Antes: `500` por el NOT NULL.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `backend/tests/validarCampos.test.js` › no deja nombre en null (es NOT NULL y obligatorio) · `perfil.restricciones.test.js` › PER-03 nombre null (NOT NULL) responde 400…

**CP-15 · PATCH sin edad** (positivo de regresión, I · DEF-06)
- **Datos:** perfil con `edad = 16`; cuerpo `{ telefono: '3001234567' }` (lo que envía `PerfilInstitucion.jsx`).
- **Pasos:** `PATCH /api/perfil/:userId` → consultar la fila.
- **Esperado:** `200`, `telefono` actualizado y `edad = 16`. Antes del arreglo quedaba `NULL`.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `perfil.restricciones.test.js` › PER-02 un PATCH sin edad no borra la edad guardada (PerfilInstitucion no la envía)

### Test vocacional y recomendación

**CP-16 · Respuestas abiertas y opciones puntuables** (positivo, U)
- **Datos:** una pregunta de opción cuya opción elegida suma 2 puntos a `arte`, y una pregunta abierta respondida con «Mi respuesta escrita».
- **Pasos:** `calcularDesdeRespuestas('cuestionario-1', respuestas)`.
- **Esperado:** `categoriaPrincipal = 'arte'` y `scores = [{ categoria: 'arte', puntos: 2, porcentaje: 100 }]`: la respuesta abierta no suma ni rompe el cálculo.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `backend/tests/perfilvocacional.test.js` › ignora respuestas abiertas y calcula las opciones puntuables

**CP-17 · Orden de recomendaciones** (positivo, U)
- **Datos:** catálogo con un programa de `arte` y uno de `salud`; perfil A (arte 6, salud 4) y perfil B (salud 6, arte 4).
- **Pasos:** `generarRecomendaciones` para cada perfil.
- **Esperado:** A guarda `[programa-arte, programa-salud]` y B `[programa-salud, programa-arte]`.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `backend/tests/algoritmoRecomendacion.test.js` › cambia el orden de las recomendaciones cuando cambia la categoría con más puntos

**CP-18 · Alias de categoría** (positivo, U)
- **Datos:** puntaje `{ categoria: 'emprendimiento', puntos: 6, porcentaje: 60 }`.
- **Pasos:** `normalizarScore(puntaje)`.
- **Esperado:** `{ categoria: 'negocios', puntos: 6, porcentaje: 60 }`: la clave que usa `programas.area_academica`. Sin este alias el test vocacional daba cero recomendaciones (bug #1).
- **Obtenido:** ✅ igual al esperado.
- **Test:** `backend/tests/algoritmoRecomendacion.test.js` › convierte emprendimiento a negocios y conserva los demás datos

### Programas (contra la BD real)

**CP-19 · Solo activos y con área** (positivo, I)
- **Datos:** 3 programas: activo con área, inactivo, y uno sin área («Sin clasificar» del MEN).
- **Pasos:** `programasRepository.listarActivos()`.
- **Esperado:** solo el activo con área; `count = 1`.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `backend/tests/integracion/programas.bd.test.js` › BD-01 listarActivos devuelve solo programas activos y con área asignada

**CP-20 · Orden por nombre** (positivo, I)
- **Datos:** Zootecnia, Medicina, Arquitectura, Enfermería (insertados en ese orden).
- **Pasos:** `listarActivos()`.
- **Esperado:** Arquitectura, Enfermería, Medicina, Zootecnia.
- **Obtenido:** ✅ igual al esperado. Si se quita el `ORDER BY`, este caso falla (mutante documentado).
- **Test:** `programas.bd.test.js` › BD-02 listarActivos ordena por nombre aunque se hayan insertado en otro orden

**CP-21 · Paginación** (positivo, I)
- **Datos:** A1 a A5.
- **Pasos:** `listarActivos({ offset: 2, limit: 2 })`.
- **Esperado:** `[A3, A4]` y `count = 5` (el total, no solo la página).
- **Obtenido:** ✅ igual al esperado.
- **Test:** `programas.bd.test.js` › BD-05 listarActivos pagina con range y el total cuenta todas las filas, no solo la página

**CP-22 · Búsqueda sin tilde** (negativo / observación, I)
- **Datos:** programa «Ingeniería de Sistemas».
- **Pasos:** `listarActivos({ search: 'ingenieria' })`.
- **Esperado (comportamiento actual documentado):** sin resultados, porque `ILIKE` de Postgres distingue tildes. En MySQL sí lo encontraría. Queda como deuda para T7 (`unaccent`).
- **Obtenido:** ✅ sin resultados, como se documentó.
- **Test:** `programas.bd.test.js` › BD-04 (Postgres vs MySQL) la búsqueda distingue tildes…

**CP-23 · Institución que no existe** (negativo, I)
- **Datos:** programa con `institucion_id = 00000000-0000-4000-8000-000000000000`.
- **Pasos:** insertar en `programas`.
- **Esperado:** la BD lo rechaza con `23503` (`programas_institucion_id_fkey`).
- **Obtenido:** ✅ igual al esperado.
- **Test:** `programas.bd.test.js` › BD-10 institucion_id debe existir en instituciones (llave foránea)

### Seguridad de la API

**CP-24 · Admin sin token** (negativo, A)
- **Datos:** sin cabecera `Authorization`.
- **Pasos:** `GET /api/admin/usuarios`.
- **Esperado:** `401` JSON `{ success: false, message: 'Token de autenticación requerido' }`.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `backend/tests/api/seguridad.test.js` › GET /api/admin/usuarios sin token responde 401 en JSON

**CP-25 · Admin con rol estudiante** (negativo, A)
- **Datos:** token válido de un usuario con rol `estudiante`.
- **Pasos:** `GET /api/admin/usuarios`.
- **Esperado:** `403` «Acceso denegado: se requiere rol admin».
- **Obtenido:** ✅ igual al esperado.
- **Test:** `seguridad.test.js` › GET /api/admin/usuarios con rol estudiante responde 403

**CP-26 · Admin con rol admin** (positivo, A)
- **Datos:** token válido con rol `admin`.
- **Pasos:** `GET /api/admin/usuarios`.
- **Esperado:** `200` con `data` (la lista) y `meta.total`.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `seguridad.test.js` › GET /api/admin/usuarios con rol admin responde 200 con la lista paginada

**CP-27 · Cuenta bloqueada** (negativo, A)
- **Datos:** usuario con `bloqueado_hasta` en el futuro.
- **Pasos:** `POST /api/comunidad/preguntas`.
- **Esperado:** `403 { error: 'BLOQUEADO', hasta }` y no se publica nada.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `seguridad.test.js` › POST /api/comunidad/preguntas con la cuenta bloqueada responde 403 BLOQUEADO

### Contrato de errores

**CP-28 · JSON mal formado** (negativo, A · DEF-03)
- **Datos:** cuerpo `{"email":` (cortado).
- **Pasos:** `POST /api/auth/register-perfil`.
- **Esperado:** `400` en JSON `{ message: 'JSON mal formado' }`, sin `SyntaxError`, rutas de `node_modules` ni HTML. Antes: página HTML con el stack trace.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `backend/tests/api/errores.test.js` › POST con JSON mal formado responde 400 en JSON, sin stack trace

**CP-29 · Ruta que no existe** (negativo, A · DEF-03)
- **Datos:** —
- **Pasos:** `GET /api/no-existe`.
- **Esperado:** `404` en JSON `{ message: 'Ruta no encontrada' }`. Antes: HTML de Express.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `errores.test.js` › una ruta inexistente responde 404 en JSON

**CP-30 · El error de la BD no se filtra** (negativo, A · DEF-04)
- **Datos:** Supabase simulado devuelve un error de Postgres (`42P01`, con IP interna en el mensaje).
- **Pasos:** `GET /api/programas`.
- **Esperado:** `500 { message: 'Error interno del servidor' }`, sin código ni IP; el detalle queda solo en el log del servidor.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `backend/tests/api/errores-internos.test.js` › si Supabase devuelve error, GET /api/programas responde 500 genérico

### Sincronización con el MEN

**CP-31 · MEN caído durante la sincronización** (negativo, A)
- **Datos:** `fetch` simulado: la metadata responde y el dataset responde `503`.
- **Pasos:** `POST /api/admin/sincronizacion/ejecutar` como admin.
- **Esperado:** `500`; **cero** inserts y deletes en `instituciones`, `programas` y `recomendaciones` (los datos previos quedan intactos), y la sync se registra como `fallida`.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `backend/tests/api/sincronizacion.test.js` › POST /ejecutar con el MEN caído no borra ni inserta datos y registra la sync fallida

**CP-32 · Estudiante intenta sincronizar** (negativo, A)
- **Datos:** token con rol `estudiante`.
- **Pasos:** `POST /api/admin/sincronizacion/ejecutar`.
- **Esperado:** `403`; `fetch` al MEN nunca se llama y no hay escrituras.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `sincronizacion.test.js` › POST /ejecutar sin rol admin responde 403 y no llama al MEN

### Comunidad

**CP-33 · Elegir área o modo anónimo no publica** (negativo de regresión, C · DEF-02)
- **Datos:** «Pregunta a medio escribir», área «Artes», interruptor «Publicar como anónimo.».
- **Pasos:** en `ModalHacerPregunta` escribir la pregunta → elegir el área → activar anónimo, **sin** pulsar «Publicar».
- **Esperado:** `crearPregunta` no se llama; el chip queda seleccionado (`aria-pressed=true`) y el interruptor activo. Antes, cada clic enviaba el formulario.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `frontend/src/pages/dashboard/comunidad/components/ModalHacerPregunta.test.jsx` › elegir un área o el modo anónimo no publica la pregunta antes de tiempo

**CP-34 · El servidor rechaza la pregunta** (negativo, C)
- **Datos:** el servicio responde `{ success: false, error: 'Debes iniciar sesión' }`.
- **Pasos:** escribir la pregunta → «Publicar pregunta».
- **Esperado:** el error se ve en un `role="alert"`, no hay confirmación, no se llama `onPublicada` y el botón queda habilitado para reintentar.
- **Obtenido:** ✅ igual al esperado.
- **Test:** `ModalHacerPregunta.test.jsx` › muestra el error del servidor, no confirma y deja reintentar

## 3. Ejecución que respalda la columna «Obtenido»

| Suite | Rama (PR) | Comando | Resultado (19 nov 2026) | Casos |
|---|---|---|---|---|
| Backend: unitario + API + integración con la BD real | `semana-06/julian-bd` (#82) | `pnpm --filter backend test` con `DATABASE_URL` del Supabase local | **295/295** | CP-06, CP-11 a CP-32 |
| Backend: `calcularEdad` (24 casos restaurados) | `fix/ci-main-integracion` (#78) | `pnpm --filter backend test` | **279/279** (24/24 de `calcularEdad`) | CP-07 a CP-10 |
| Frontend (componente) | `fix/ci-main-integracion` (#78) | `pnpm --filter frontend test:coverage` | **475/475**, cobertura 72.67 / 62.87 / 65.45 / 73.6 | CP-02, CP-33, CP-34 |
| E2E (Chromium) | `fix/ci-main-integracion` (#78) | `pnpm --dir e2e exec playwright test tests/login-validation.spec.js tests/login-route.spec.js tests/signup-validation.spec.js` | **5/5** | CP-01 a CP-05 |

Los casos dependen de tres PR abiertos: **#78** (restaura los 24 casos de `calcularEdad` que la integración dejó fuera), **#79** (BD de pruebas) y **#82** (tests contra la BD real, DEF-05 y DEF-06). Al fusionarlos, todos los tests de la columna **Test** quedan en `develop`.

Los E2E `login-success` y `login-invalid-password` no están en la matriz porque necesitan una cuenta real de Supabase (`E2E_TEST_EMAIL`) que no se versiona. El CI tampoco los corre.

## 4. Cómo mantener la matriz

- Un caso nuevo entra con su test automatizado en el mismo PR. Si no tiene test, no entra.
- Si un test cambia de nombre, se actualiza la columna **Test**.
- Un defecto nuevo se liga con su `DEF-NN` y su issue, como CP-12 a CP-15.
