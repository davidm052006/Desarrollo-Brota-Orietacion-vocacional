# Semana 5 · Brayan · Capa E2E — dobles de red con `page.route`

> Fecha de ejecución: 23 nov 2026 (entrega tardía) · Base: `develop` · Ejecución local, Windows 11 + Chromium (Playwright 1.64)

## Pantalla y dependencias

#64 (Julian) ya cubre el mínimo de `page.route` en **login**. Estas pruebas van sobre otra pantalla: **`/contacto`**, el formulario público que llama a `POST /api/contacto`. No necesita sesión ni Supabase.

**Inventario de dependencias de la pantalla:** `POST /api/contacto` (backend propio; detrás, Supabase y el rate limit de 5/15 min). Ninguna prueba llega al backend.

`e2e/tests/contacto-route.spec.js` (5 pruebas). Cada una indica en un comentario el tipo de doble:

| Prueba | Doble | Lo que ve la persona |
|---|---|---|
| CONTACTO-01 API caída | stub de error (`route.abort`) | "Error de conexión. Intenta de nuevo.", conserva lo escrito y el botón sigue activo |
| CONTACTO-02 400 de validación | stub (`route.fulfill` con el contrato real) | El `message` del servidor ("Asunto inválido."), no un texto genérico |
| CONTACTO-03 rate limit 429 | stub | "Demasiadas solicitudes. Intenta de nuevo más tarde." |
| CONTACTO-04 envío correcto | spy + stub | "¡Mensaje recibido!" y el cuerpo enviado es exactamente lo del formulario (**comportamiento**) |
| CONTACTO-05 mensaje corto | spy | "Mínimo 20 caracteres." y **0 peticiones** (**estado**: la validación local corta antes de la red) |

`e2e/run-tests.mjs` suma esta suite, para que `pnpm test` la corra. El CI (`ci.yml`) corre solo `login-validation` y `login-route`: agregar este archivo allí lo decide el grupo.

## Observación de accesibilidad
Los `<label>` de `Contacto.jsx` no están asociados a sus campos (falta `htmlFor`/`id`), así que no se pueden usar `getByLabel`: las pruebas buscan por placeholder. Corregirlo es un cambio aparte en la interfaz.

## Mutación

| Mutante | Test que falló | Resultado |
|---|---|---|
| `contactoService.enviarContacto` ignora el `message` del servidor (`error: 'Error del servidor.'`) | CONTACTO-02 y CONTACTO-03 (2 fallan, 3 pasan) | Restaurado con `git restore` → 5/5 |

## Ejecución

| Corrida | Resultado |
|---|---|
| 1.ª (Vite en frío, primera optimización de dependencias) | 3 fallaron por tiempo de espera en `goto`/`fill`, no por aserciones |
| 2.ª y 3.ª | 5/5 y 5/5 (junto con las 3 de `login-route`: 8/8) |

Revisión de mocks excesivos: los 5 tests verifican lo que se ve en pantalla. Solo CONTACTO-04 y 05 cuentan llamadas, y en ambos esa interacción es el comportamiento a probar.
