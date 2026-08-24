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

- **Backend**
	- Infra de tests elegida: **Jest** (ver motivo abajo).
	- Suites implementadas: `usuariosController.createUsuario` (tests de creación, validaciones y rollback) y regresión para `middlewares/verificarAdmin.js` — ✅ todas las pruebas backend actuales pasan (7/7).

- **Frontend**
	- Infra de tests: `vitest` + `@testing-library/react` configurados en `frontend/vitest.config.cjs` y `src/test/setupTests.js`.
	- Tests implementados: flujo `TestVocacional` → `TestResult` y `createUsuariosMasivo` (mocks y ajustes para Chart.js en jsdom). ✅ (4 archivos, 19 tests, 19/19 pasan).

## Pendientes relevantes

- `createUsuariosMasivo`: pruebas por fila implementadas — se añadieron casos que verifican errores por fila en fallos de red y respuestas de error genéricas (frontend `adminService` tests). ✅
- Documentación adicional o ejemplos de uso de los mocks de Supabase (opcional).

## Decisión: Jest para backend

- Elección: **Jest** en lugar de `node --test`.
- Motivos breves:
	- Mocking y utilidades maduras para pruebas de unidades y controladores (spies, mocks de módulos y timers).
	- Ecosistema más amplio: herramientas auxiliares, snapshots y fácil integración con patrones de tests existentes en el repo.
	- Facilita pruebas de rollback y escenarios con dependencias externas (como Supabase) vía mocks controlados.

> Nota: `node --test` es válido y ligero, pero para los tipos de pruebas que requerimos (mocks complejos, simulación de fallos y control fino sobre módulos) `Jest` aporta mayor productividad y menos fricción.

## Qué se hizo en este sprint

- Se instaló y configuró `vitest` en frontend y `jest` en backend (scripts y archivos de configuración añadidos).
-- Se agregaron y estabilizaron tests críticos listados en la tarea; se implementaron además pruebas por fila para `createUsuariosMasivo` (errores de red y respuestas sin mensaje). Ahora las suites frontend y backend están verdes.

---

Si querés que deje más detalle técnico (comandos exactos ejecutados, fragmentos de configuración o ejemplos de mocks usados), lo agrego en un apartado "Evidencia / comandos ejecutados" debajo.
