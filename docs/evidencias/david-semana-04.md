# Semana 4 — David / BD

Cinco escenarios API para `GET /api/programas`, con `jest.mock` de Supabase: vacíos, filtros, conteo/paginación y error. No usa la BD real.

## Mutación a ejecutar
Omitir temporalmente la condición del filtro de área en `obtenerProgramas`; el test de `.eq('area_academica', 'tecnologia')` debe fallar. **Aún no ejecutada**.

## Verificación pendiente
`cd backend && npm test -- programas.datos-api.test.js`. Si falla al importar módulos que crean clientes externos, corregir el aislamiento y volver a ejecutar. Revisión cruzada pendiente.
