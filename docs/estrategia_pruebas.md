# 🧪 Estrategia de Pruebas - Sistema Brota

## Objetivo

Garantizar la calidad y funcionalidad del MVP mediante pruebas estructuradas.

## Tipos de Pruebas

### 1. Pruebas Unitarias
Validar componentes individuales del sistema.

### 2. Pruebas de Integración
Verificar la comunicación entre módulos.

### 3. Pruebas de Usuario
Validar la experiencia del usuario final.

## Alcance del MVP

- Cuestionario vocacional completo
- Algoritmo de recomendación
- Filtro de convocatorias
- Panel administrativo básico

---

[← Volver al inicio](00_START_HERE.md)

## Estado actual (resumen de lo implementado)

- **Backend:** Jest; 8 suites y 31 pruebas aprobadas en la medición del 12 de octubre de 2026. La suite incluye un smoke test de API que consulta Supabase remoto.
- **Frontend:** Vitest + Testing Library + V8; 7 archivos y 50 pruebas aprobadas en la misma medición.
- **E2E:** Playwright está configurado en `e2e/`. Hay un flujo de login exitoso que requiere credenciales dedicadas en `E2E_TEST_EMAIL` y `E2E_TEST_PASSWORD`, y un flujo de validación de login vacío que no necesita Supabase. El segundo se ejecutó en Chromium y se confirmó primero su fallo por una aserción incorrecta y luego se corrigió.
- La CI ejecuta el E2E de validación del formulario en Chromium; el login real no se ejecuta en CI porque necesita credenciales de prueba privadas.
- **Codegen:** queda pendiente grabar con `pnpm exec playwright codegen http://localhost:5173/login` y guardar evidencia segura de la sesión grupal.

## Línea base y umbrales de cobertura

Medición local del 12 de octubre de 2026, incluyendo todos los archivos fuente
(`src/**/*.{js,jsx}` en frontend y `src/**/*.js` en backend). Las pruebas y
archivos de setup están excluidos. Los porcentajes medidos quedaron fijados como
umbrales mínimos en Jest y Vitest; CI ejecuta los tests con cobertura y falla si
alguna métrica cae por debajo del valor indicado.

| Paquete | Sentencias | Ramas | Funciones | Líneas |
|---|---:|---:|---:|---:|
| Backend (Jest) | 32.81% | 15.21% | 20.57% | 35.85% |
| Frontend (Vitest + V8) | 8.79% | 9.63% | 5.10% | 9.49% |

Comandos para ejecutar cobertura:

```bash
pnpm --filter backend test:coverage
pnpm --filter frontend test:coverage
```

## Pendientes relevantes

- `createUsuariosMasivo`: pruebas por fila implementadas — se añadieron casos que verifican errores por fila en fallos de red y respuestas de error genéricas (frontend `adminService` tests). ✅
- Ejecutar el E2E de login exitoso con un usuario de prueba Supabase y variables de entorno locales; no guardar las credenciales en el repositorio.
- Grabar y documentar la práctica de Playwright Codegen sin capturar contraseñas, tokens ni datos personales.
- Cada integrante debe aportar un flujo distinto, su commit individual y participar en la revisión cruzada y retrospectiva.
- Completar `docs/matriz-rotacion.md` con nombres y flujos del grupo.

## Decisión: Jest para backend

- Elección: **Jest** en lugar de `node --test`.
- Motivos breves:
	- Mocking y utilidades maduras para pruebas de unidades y controladores (spies, mocks de módulos y timers).
	- Ecosistema más amplio: herramientas auxiliares, snapshots y fácil integración con patrones de tests existentes en el repo.
	- Facilita pruebas de rollback y escenarios con dependencias externas (como Supabase) vía mocks controlados.

> Nota: `node --test` es válido y ligero, pero para los tipos de pruebas que requerimos (mocks complejos, simulación de fallos y control fino sobre módulos) `Jest` aporta mayor productividad y menos fricción.

## Qué se hizo en este sprint

- Se instalaron y configuraron `vitest` en frontend y `jest` en backend.
- Se añadieron los comandos de cobertura con reportes LCOV y umbrales globales; la CI ejecuta ambas suites con cobertura.
- Se añadió un E2E de validación del login vacío, que no depende de credenciales ni de Supabase. El login exitoso existente aún requiere una cuenta de prueba local.
- Las mediciones, comandos y tareas grupales pendientes están anotadas arriba y en `docs/matriz-rotacion.md`.
