# Semana 3 · Brayan · Front — `FeedReciente.jsx` con React Testing Library

> Fecha de ejecución: 23 nov 2026 (entrega tardía) · Base: `develop` · Ejecución local, Windows 11

## Componente

`frontend/src/pages/dashboard/components/FeedReciente.jsx`: las "Últimas publicaciones" del Dashboard. Mezcla publicaciones reales (`getFeedReciente`) con un relleno fijo hasta completar `limite`, y cada tarjeta navega a su detalle (o, si es relleno, a la pestaña de Comunidad de su tipo). No tenía ningún test.

`FeedReciente.test.jsx` (7 tests): `getFeedReciente` simulado con `vi.mock` (stub) y el componente envuelto en `MemoryRouter`, con una ruta comodín que muestra a dónde navegó y con qué `state`.

| Test | Tipo |
|---|---|
| "Cargando…" mientras la petición no responde | Estado de carga |
| Reales primero y relleno hasta el límite | Estado feliz |
| Nunca más reales que el límite ni relleno si sobran | Valor límite |
| Si el feed falla no se queda cargando: muestra el relleno | **Estado no feliz** |
| Clic en una publicación real navega a su detalle | **user-event** |
| Clic en un relleno lleva a la pestaña de su tipo (`state.tab`) | user-event |
| "Ver comunidad →" lleva a Comunidad | user-event |

Queries por rol (`getByRole('button', { name })`); no hizo falta corregir etiquetas en este componente.

**Error propio encontrado y corregido:** `beforeEach(() => mock.mockReset())` devolvía el mock, y Vitest trata lo que devuelve un `beforeEach` como limpieza: lo llamaba al terminar el test de carga y se quedaba esperando la promesa pendiente ("Hook timed out"). Se usa `beforeEach(() => { … })` con llaves y quedó comentado en el archivo.

## Mutación

| Mutante | Test que falló | Resultado |
|---|---|---|
| `RELLENO.slice(0, faltan)` → `RELLENO` (relleno completo siempre) | "reales primero y relleno hasta el límite" y "si el feed falla… muestra el relleno" (2 fallan, 5 pasan) | Restaurado con `git restore` → 7/7 |

## Ejecución

- `npx vitest run src/pages/dashboard/components/FeedReciente.test.jsx` → 7/7, dos corridas seguidas. ESLint sin errores.
- Revisión cruzada: pendiente (según el plan, la ejecuta David).
