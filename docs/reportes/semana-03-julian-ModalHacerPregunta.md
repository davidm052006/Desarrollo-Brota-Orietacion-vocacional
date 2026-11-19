# Reporte de ejecución — Semana 3 · Front (RTL) · Julian

| Campo | Valor |
|---|---|
| Responsable | Julian Machado (JulianMg20) |
| Fecha de ejecución | 2026-11-11 |
| Rama | `semana-03/julian-front` → PR hacia `test/semana-03` |
| Componente bajo prueba | `ModalHacerPregunta` — `frontend/src/pages/dashboard/comunidad/components/ModalHacerPregunta.jsx` |
| Archivo de pruebas | `frontend/src/pages/dashboard/comunidad/components/ModalHacerPregunta.test.jsx` |
| Herramientas | Node v24.12.0, Vitest 4.1.11, React Testing Library, user-event, jsdom |
| Comando | `cd frontend && npx vitest run src/pages/dashboard/comunidad/components/ModalHacerPregunta.test.jsx` |

## 1. Alcance

`ModalHacerPregunta` es el formulario de Comunidad para publicar una pregunta: texto, área (chips) y modo anónimo (interruptor). Al enviar llama a `crearPregunta` de `comunidadService`, muestra "¡Pregunta publicada!" si sale bien o el mensaje de error si falla.

El servicio se reemplaza con `vi.mock`: ninguna prueba toca el backend ni Supabase. Los elementos se buscan como los ve una persona (`getByLabelText`, `getByRole` con nombre accesible) y las interacciones usan `user-event`.

## 2. Matriz de casos

| ID | Tipo | Caso | Esperado | Resultado |
|---|---|---|---|---|
| MP-01 | Feliz · user-event | Escribe la pregunta, elige «Salud», activa anónimo y publica | `crearPregunta` recibe `{ titulo, area: 'Salud', anonimo: true }`, se ve la confirmación y se llama `onPublicada` | ✅ |
| MP-02 | Regresión DEF-02 | Escribe, elige «Artes» y activa anónimo **sin** publicar | `crearPregunta` no se llama; el chip queda `aria-pressed=true` y el interruptor `aria-checked=true` | ✅ |
| MP-03 | No feliz · validación | Pulsa «Publicar pregunta» con el campo vacío | No se llama al servicio; el campo queda `valueMissing` | ✅ |
| MP-04 | No feliz · error API | El servicio responde `{ success: false, error: 'Debes iniciar sesión' }` | Se ve el error en un `role="alert"`, no hay confirmación, no se llama `onPublicada`, el botón queda habilitado para reintentar | ✅ |
| MP-05 | No feliz · error sin mensaje | El servicio responde `{ success: false }` | Se ve «Error al publicar. Intenta de nuevo.» | ✅ |
| MP-06 | Asíncrono · carga | El servicio tarda en responder | El botón cambia a «Publicando…», queda deshabilitado y un segundo clic no envía otra vez | ✅ |
| MP-07 | Interacción | Clic en «Cerrar» | Se llama `onClose` y no se publica nada | ✅ |

## 3. Problemas de accesibilidad corregidos

La primera corrida falló en los 7 casos porque el componente no se podía encontrar como lo encuentra una persona con lector de pantalla:

| Elemento | Antes | Corrección |
|---|---|---|
| Campo de la pregunta | `<div>Tu pregunta</div>` sin relación con el `<textarea>` | `<label htmlFor="pregunta-titulo">` |
| Botón ✕ | Sin nombre accesible | `aria-label="Cerrar"` |
| Mensaje de error | `<div>` sin rol | `role="alert"` (se anuncia al aparecer) |
| Interruptor anónimo (`Toggle`) | `<button>` sin nombre ni estado | `role="switch"`, `aria-checked`, `aria-label` |
| Chips de área (`AreaChips`) | Sin estado de selección | `aria-pressed` |

## 4. Defecto encontrado

**DEF-02 — Elegir un área o el modo anónimo publica la pregunta**

| Campo | Detalle |
|---|---|
| Severidad | Alta: la pregunta se publica a medio escribir, sin que la persona pulse «Publicar», y puede publicarse con el nombre real antes de activar «anónimo» |
| Causa | Los `<button>` de `AreaChips` y `Toggle` (`primitivos.jsx`) no tenían `type`. Dentro de un `<form>` un botón sin `type` es `submit`, así que cada clic enviaba el formulario |
| Alcance | También afecta a `ModalCompartirHistoria`, que usa los mismos `AreaChips` y `Toggle` |
| Corrección | `type="button"` en ambos botones |
| Test que lo detecta | MP-02 |

### Ejecución antes del fix (solo con las etiquetas accesibles)

```
× envía la pregunta con el área y el modo anónimo elegidos y muestra la confirmación
× elegir un área o el modo anónimo no publica la pregunta antes de tiempo
  AssertionError: expected "vi.fn()" to not be called at all, but actually been called 2 times
Tests  2 failed | 5 passed (7)
```

Las 2 llamadas son el clic en «Artes» y el clic en el interruptor de anónimo.

### Re-ejecución después del fix

```
ModalHacerPregunta.test.jsx   Tests  7 passed (7)
Suite completa del frontend   Test Files  7 passed (7) · Tests  34 passed (34)
ESLint (archivos tocados)     sin errores
```

## 5. Mutación deliberada

| Campo | Detalle |
|---|---|
| Mutante | Quité `disabled={enviando}` del botón «Publicar pregunta» |
| Test que falló | MP-06 «bloquea el botón mientras publica para evitar envíos dobles» — `expected false to be true` |
| Resultado | 1 failed, 6 passed. Restauré el archivo y volvió a 7 passed |

## 6. Pendiente

- Revisión cruzada: otra persona del equipo ejecuta estas pruebas en su equipo.
- Cobertura real del frontend y backend con todo integrado (PR de umbrales del equipo, piso 40%).
