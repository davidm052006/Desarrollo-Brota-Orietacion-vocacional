# Reporte de ejecución — Semana 2 · Capa BD · Julian

| Campo | Valor |
|---|---|
| Responsable | Julian Machado (JulianMg20) |
| Fecha de ejecución | 2026-11-08 |
| Rama | `semana-02/julian-bd` |
| Unidad bajo prueba | `calcularEdadDesdeFecha` — `backend/src/utils/calcularEdad.js` |
| Archivo de pruebas | `backend/tests/calcularEdad.test.js` |
| Herramientas | Node v24.12.0, Jest 30.5.2 |
| Comando | `cd backend && npx jest tests/calcularEdad.test.js` |

## 1. Alcance

`calcularEdadDesdeFecha` convierte la fecha de nacimiento a edad entera. La usan el registro público (`authController.registerPerfil`) y la creación individual y masiva de usuarios del panel admin. Solo acepta edades entre 14 y 100 años; fuera de ese rango devuelve `null`.

Para que las pruebas no dependan del reloj, la función recibe un parámetro opcional `hoy`. En todas las pruebas se fija en **15 de octubre de 2026** (salvo en los casos de año bisiesto, que usan su propia fecha).

## 2. Matriz de casos

Técnicas usadas: partición de equivalencia, valores límite y entradas inválidas. Todas las pruebas siguen la estructura AAA (Arrange, Act, Assert).

| ID | Grupo | Entrada (fecha de nacimiento) | `hoy` | Esperado | Obtenido (después del fix) |
|---|---|---|---|---|---|
| CE-01 | Cumpleaños | `2000-10-16` (un día antes) | 2026-10-15 | 25 | ✅ 25 |
| CE-02 | Cumpleaños | `2000-10-15` (el mismo día) | 2026-10-15 | 26 | ✅ 26 |
| CE-03 | Cumpleaños | `2000-10-14` (un día después) | 2026-10-15 | 26 | ✅ 26 |
| CE-04 | Cumpleaños | `2000-11-01` (mes aún no llega) | 2026-10-15 | 25 | ✅ 25 |
| CE-05 | Cumpleaños | `2000-09-30` (mes ya pasó) | 2026-10-15 | 26 | ✅ 26 |
| CE-06 | Límite | `2013-10-15` (13 años) | 2026-10-15 | null | ✅ null |
| CE-07 | Límite | `2012-10-16` (un día antes de 14) | 2026-10-15 | null | ✅ null |
| CE-08 | Límite | `2012-10-15` (14 justos, mínimo) | 2026-10-15 | 14 | ✅ 14 |
| CE-09 | Límite | `1926-10-15` (100 justos, máximo) | 2026-10-15 | 100 | ✅ 100 |
| CE-10 | Límite | `1925-10-16` (un día antes de 101) | 2026-10-15 | 100 | ✅ 100 |
| CE-11 | Límite | `1925-10-15` (101 años) | 2026-10-15 | null | ✅ null |
| CE-12 | Inválida | `''` (cadena vacía) | 2026-10-15 | null | ✅ null |
| CE-13 | Inválida | `null` | 2026-10-15 | null | ✅ null |
| CE-14 | Inválida | `undefined` | 2026-10-15 | null | ✅ null |
| CE-15 | Inválida | `'no-es-una-fecha'` | 2026-10-15 | null | ✅ null |
| CE-16 | Inválida | `2000-13-01` (mes 13) | 2026-10-15 | null | ✅ null |
| CE-17 | Inválida | `2000-02-31` (31 de febrero) | 2026-10-15 | null | ✅ null |
| CE-18 | Inválida | `2001-02-29` (29 feb, año no bisiesto) | 2026-10-15 | null | ✅ null |
| CE-19 | Inválida | `2000-04-31` (31 de abril) | 2026-10-15 | null | ✅ null |
| CE-20 | Inválida | `2000-05-00` (día 0) | 2026-10-15 | null | ✅ null |
| CE-21 | Inválida | `2030-01-01` (fecha futura) | 2026-10-15 | null | ✅ null |
| CE-22 | Bisiesto | `2012-02-29` | 2027-02-28 | 14 | ✅ 14 |
| CE-23 | Bisiesto | `2012-02-29` | 2027-03-01 | 15 | ✅ 15 |
| CE-24 | Producción | Hoy menos 20 años (sin `hoy`) | reloj del sistema | 20 | ✅ 20 |

## 3. Defecto encontrado

**DEF-01 — La edad sube un día antes del cumpleaños en Colombia**

| Campo | Detalle |
|---|---|
| Severidad | Media: con la fecha límite, deja registrarse a alguien de 13 años un día antes de cumplir 14 |
| Causa | `new Date('YYYY-MM-DD')` se interpreta como medianoche **UTC**. En Colombia (UTC-5) eso cae en las 7 p. m. del día anterior, así que la fecha de nacimiento queda un día antes |
| Por qué no se había visto | La CI corre en UTC, donde el error no aparece. Solo falla con la zona horaria de Colombia |
| Corrección | Las fechas `'YYYY-MM-DD'` se construyen como fecha local con `new Date(año, mes, día)`, igual que en `frontend/src/utils/calcularEdad.js`. También se rechazan meses y días inexistentes |
| Commits | `527a9a2` (pruebas que lo detectan) → `3ef24e1` (fix) → `d2b3850` (casos de días inexistentes) |

### Ejecución antes del fix (código de `527a9a2`, 20 casos de esa versión)

| Zona horaria | Resultado |
|---|---|
| `TZ=UTC` | 20 passed, 20 total |
| `TZ=America/Bogota` | **4 failed**, 16 passed, 20 total |

Casos que fallaron en `America/Bogota`:

| Caso | Esperado | Obtenido |
|---|---|---|
| CE-01: un día antes del cumpleaños | 25 | 26 |
| CE-07: un día antes de cumplir 14 | null | **14** (deja pasar a un menor de 14) |
| CE-10: un día antes de cumplir 101 | 100 | null |
| CE-22: 29 feb, consultado el 28 feb de año no bisiesto | 14 | 15 |

### Re-ejecución después del fix (`d2b3850`, 24 casos)

| Zona horaria | Resultado |
|---|---|
| `TZ=America/Bogota` | ✅ 24 passed, 24 total |
| `TZ=UTC` | ✅ 24 passed, 24 total |
| `TZ=Asia/Tokyo` | ✅ 24 passed, 24 total |

Para repetirlo (Git Bash, Linux o macOS):

```bash
cd backend
for tz in America/Bogota UTC Asia/Tokyo; do
  echo "$tz: $(TZ=$tz npx jest tests/calcularEdad.test.js 2>&1 | grep 'Tests:')"
done
```

## 4. Calidad de las pruebas: mutación manual

Se cambió a mano `edad >= 14` por `edad > 14` en `calcularEdad.js`. Con ese cambio fallan 2 pruebas (CE-08, y CE-22 cuando la edad calculada es 14). Esto confirma que la regla de edad mínima está cubierta. Después se revirtió el cambio.

## 5. Resultado

- 24 casos diseñados, 24 pasan en las tres zonas horarias.
- Se encontró y corrigió 1 defecto (DEF-01), con el ciclo completo: prueba que falla → fix → re-ejecución en verde.
