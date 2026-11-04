# Semana 2 — David / Front

Pruebas nuevas: `frontend/src/utils/validation.bootcamp.test.js`. Casos parametrizados de correo, contraseña, fuerza y registro/recuperación.

## Mutación a ejecutar
Cambiar temporalmente `value.length >= 8` por `value.length > 8` en `validation.js`; el caso `abc12345` debe fallar. Restaurar antes de fusionar. **Aún no ejecutada**.

## Verificación pendiente
`cd frontend && npm test -- validation.bootcamp.test.js`. Revisión cruzada y cobertura real pendientes.
