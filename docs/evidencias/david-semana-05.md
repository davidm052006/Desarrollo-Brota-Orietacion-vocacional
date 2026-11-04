# Semana 5 — David / Front

Dependencias inventariadas: API de Brota, cliente fetch, Supabase (backend), servicios MEN, y reloj del sistema. Este PR aísla únicamente el servicio frontend `programasService` mediante MSW.

## Doble usado
Servidor MSW: fake/stub HTTP de respuestas para éxito, 500, 422 y HTML. Las aserciones comprueban el estado que consume la UI.

## Instalación pendiente
MSW no está en package.json ni package-lock.json en el punto de partida. Ejecutar `cd frontend && npm install --save-dev msw@2` y subir ambos archivos sincronizados; el PR no queda listo sin ello.

## Mutación pendiente
Ignorar temporalmente `res.ok` en `obtenerProgramas`: el caso 500 debe fallar. Restaurar. **No ejecutada**.

## Verificación pendiente
`cd frontend && npm test -- programasService.msw.test.js`; medir cobertura y realizar revisión cruzada.
