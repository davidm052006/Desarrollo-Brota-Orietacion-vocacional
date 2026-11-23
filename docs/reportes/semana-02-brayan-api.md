# Semana 2 · Brayan · Capa API — reglas de `algoritmoRecomendacion.js`

> Fecha de ejecución: 23 nov 2026 (entrega tardía) · Base: `develop` · Ejecución local, Windows 11

## Unidad y por qué estos casos

El plan asigna a la capa API: puntuación base, categorías normalizadas, bonificaciones y **límite máximo de compatibilidad**. Edward (#49) y los tests de `tests/utils/algoritmoRecomendacion.test.js` ya cubren el alias de categorías, el cap 4-3-1 y las razones. Faltaba el tope `Math.min(1.0, …)` y la tabla de bonificaciones por tipo de área, así que estos tests son nuevos y no repiten casos.

`calcularCompatibilidad` no se exporta: se observa en las filas que `generarRecomendaciones` inserta en `recomendaciones`, con el fake de Supabase del proyecto.

`backend/tests/utils/algoritmoRecomendacion.limites.test.js` (11 tests, AAA, deterministas):

| Bloque | Casos | Técnica |
|---|---|---|
| Base + bonificaciones | principal sin datos (0.58), principal con 3 datos (0.595), secundaria con 1 dato (0.345), sin bonus de área (0.2 y 0.21) | Partición de equivalencia, `it.each` |
| Límite máximo | 0.92 + 0.08 = **1** (justo en el límite), por encima con datos → 1, 100 % + bonus → 1, 0.91 + 0.08 = **0.99** (justo debajo) | Valor límite, `it.each` |
| Tope sin desempate | Dos programas al 100 %, con y sin datos completos → ambos 1 | Valor límite |
| Consulta | Solo `activo = true`, sin `Posgrado`, `limit(50)` en cada una de las 3 categorías | Contrato de la consulta |

## Mutación

| Mutante | Test que falló | Resultado |
|---|---|---|
| `Math.min(1.0, base + bonus)` → `(base + bonus)` | "por encima con datos", "100 % + bonus", "en el tope no desempata" (3 fallan, 16 pasan) | Restaurado con `git restore` → 19/19 |

## Ejecución

- `npx jest tests/utils/algoritmoRecomendacion` → 19/19 (11 nuevos + 8 previos).
- ESLint sin errores en el archivo nuevo.
- Revisión cruzada: pendiente (según el plan, la ejecuta David).
