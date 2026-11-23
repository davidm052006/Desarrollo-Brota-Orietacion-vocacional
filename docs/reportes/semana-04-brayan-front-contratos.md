# Semana 4 · Brayan · Capa Front — contratos que consume la interfaz

> Fecha de ejecución: 23 nov 2026 (entrega tardía) · Base: `develop` · Ejecución local, Windows 11

## Capa elegida

El plan le daba BD a Brayan en S4, pero esa capa la tomó David (#52). La matriz deja la decisión abierta (nota 3). Se toma el ángulo **Front** ("contratos de endpoints que consume la interfaz"), que nadie subió en S4 y que Brayan no repite (S2 API, S5 E2E; la S3 no rota). Hay que confirmarlo en equipo y anotarlo en la matriz.

## Endpoints y contrato probado

`backend/tests/api/comunidadContratoFront.test.js` (10 tests, supertest contra el `server.js` real; Supabase simulado con el fake del proyecto, ningún test toca datos reales). Las listas se responden con una "tabla" en memoria que aplica los `.eq()` del controlador, para verificar **estado** (qué filas salen) y no solo llamadas.

| Endpoint | Lo consume | Casos |
|---|---|---|
| `GET /api/comunidad/feed` | `FeedReciente.jsx` | 401 sin token (status, cuerpo y **Content-Type**); 200 con los campos que lee la tarjeta (`id`, `tipo`, `titulo`, `autor`, `time`, `link`, `linkState`), orden por fecha y autor "Anónimo" sin filtrar el nombre real; máximo 8; **DEF-08** |
| `PATCH /api/comunidad/moderacion/:tipo/:id/ocultar` | `ModeracionBar` (`primitivos.jsx`) | **401** sin token sin tocar tablas; **403** estudiante con el `message` que muestra la barra; **200 autorizado** (moderador) para `post`/`historia`/`pregunta` con `update({ oculta: true })` en la tabla correcta; 400 con un tipo que no existe |

El frontend lee los errores con `body.error || body.message` (`services/apiClient.js`): todos los casos de error comprueban ese `message`.

## Hallazgo

### DEF-08 (sin issue todavía): el feed del Dashboard muestra publicaciones ocultadas por moderación
- **Pasos:** un moderador oculta una pregunta (`oculta = true`). Cualquier estudiante abre `/dashboard`.
- **Esperado:** la pregunta no aparece, igual que en Comunidad. **Obtenido:** sigue en "Últimas publicaciones".
- **Causa:** `getForos`/`getHistorias`/`getPreguntas` filtran `.eq('oculta', false)`, pero `feedController.getFeedReciente` no lo hacía en ninguna de sus 3 consultas.
- **Detectado:** el test DEF-08 devolvía `Oculta 1`, `Oculta 2` y `Oculta 3`.
- **Corrección:** `.eq('oculta', false)` en las 3 consultas del feed. **Verificado:** 10/10, y el test previo del controlador (`feedYNotificaciones.test.js`) sigue en verde.
- **Severidad propuesta:** `sev:media` (contenido moderado visible para todos en la pantalla de inicio).

## Mutación

| Mutante | Test que falló | Resultado |
|---|---|---|
| Quitar `.eq('oculta', false)` solo de `preguntas_comunidad` | DEF-08 (1 falla, 9 pasan) | Restaurado → 10/10 |

## Ejecución

- `npx jest tests/api/comunidadContratoFront.test.js tests/controllers/comunidad/feedYNotificaciones.test.js` → 20/20. ESLint sin errores.
- Suite backend completa: 278 pasan; las 2 que fallan (`forosYModeracion`, `programasApi`) ya fallan en `develop` y las corrige #78. Cobertura backend: 80.27 / 67.66 / 77.73 / 83.51.
- Revisión cruzada: pendiente.
