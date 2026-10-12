# 🧪 Estrategia de Pruebas - Sistema Brota

## Objetivo

Garantizar la calidad y funcionalidad del MVP mediante pruebas estructuradas.

## Tipos de Pruebas

### 1. Pruebas unitarias
Validan una función, componente o módulo aislado. Son rápidas y ayudan a localizar con precisión una regresión. En Brota, ejemplos adecuados son las validaciones de formularios, el cálculo de resultados vocacionales y funciones de servicios con dependencias simuladas.

### 2. Pruebas de integración
Verifican que varias piezas colaboren correctamente, por ejemplo un controlador Express con sus middlewares o un componente React con sus servicios simulados. Conviene aislar servicios externos cuando el objetivo no sea probar la integración real con Supabase.

### 3. Pruebas end-to-end (E2E)
Recorren la aplicación desde el navegador y comprueban un flujo como lo haría una persona usuaria. Son valiosas para detectar fallos entre la interfaz, la API y los servicios externos, pero suelen ser más lentas y sensibles a datos y configuración.

## Pirámide y patrón AAA

La estrategia debe tener muchas pruebas unitarias, menos pruebas de integración y unas pocas E2E para los recorridos de mayor valor. Un defecto detectado tarde puede requerir más diagnóstico y coordinación porque ya alcanzó otras capas o usuarios; probar de forma continua permite detectarlo antes.

Organiza cada prueba con AAA:

1. **Arrange (preparar):** crea el estado inicial y los datos o mocks necesarios.
2. **Act (actuar):** ejecuta una acción concreta.
3. **Assert (comprobar):** verifica el resultado observable esperado.

El E2E de login de Brota sigue este patrón: abre el formulario, envía las credenciales de prueba y comprueba que se muestra el dashboard.

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
- **E2E:** Playwright está configurado en `e2e/` con los flujos aportados por Brayan y David: login con contraseña incorrecta (requiere Supabase real y el correo de una cuenta de prueba en `E2E_TEST_EMAIL`) y validación del login vacío (no necesita Supabase). Ambos pasaron en Chromium el 12 de octubre de 2026; la validación del login vacío también se confirmó primero con una aserción incorrecta para comprobar que falla.
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
- Se añadieron los E2E de contraseña incorrecta y validación del login vacío; ambos pasaron localmente. El primero requiere Supabase y una cuenta de prueba, el segundo no.
- Las mediciones, comandos y tareas grupales pendientes están anotadas arriba y en `docs/matriz-rotacion.md`.
