# Semana 6 — David — E2E con BD real

## Alcance

Tres escenarios en `e2e/tests/semana-06-david-local.spec.js`: registro por API y login por navegador, edición y lectura persistente del perfil, aislamiento entre dos usuarios y acceso anónimo. Cada escenario crea usuarios nuevos con UUID y elimina exclusivamente sus propios usuarios de prueba por Auth Admin. El modo local es explícito y rechaza URLs remotas. No se versionan claves.

## Ejecución reproducible

Desde la raíz, con Docker activo y dependencias instaladas:

```bash
npx supabase start
npx supabase db reset
# Obtener API_URL, ANON_KEY y SERVICE_ROLE_KEY del entorno local
npx supabase status -o env
# Exportar E2E_SUPABASE_URL, E2E_SUPABASE_ANON_KEY,
# E2E_SUPABASE_SERVICE_KEY con esos valores locales.
export E2E_LOCAL_DB=1
export E2E_API_URL=http://localhost:3001
```

En otra terminal, iniciar Express con `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` apuntando al mismo Supabase local, `PORT=3001` y `FRONTEND_URL=http://localhost:5173`; usar `pnpm --filter backend start`. No reutilizar un backend conectado a una BD remota. Instalar Chromium con `pnpm --dir e2e exec playwright install chromium`.

```bash
pnpm --dir e2e test
pnpm --dir e2e test
npx supabase stop --no-backup
npx supabase start
# Volver a exportar las claves locales si cambiaron y reiniciar Express.
pnpm --dir e2e test
```

## Mutante

```bash
E2E_MUTANTE_SIN_LIMPIEZA=1 pnpm --dir e2e test
```

Hipótesis: el primer escenario deja una cuenta sintética y el siguiente falla en la aserción de ausencia de usuarios residuales, demostrando pérdida de aislamiento. Tras el mutante, reconstruir únicamente la BD local con `npx supabase db reset` antes de repetir. El resultado real debe registrarse con el log, no se afirma observado.

| Evidencia | Resultado |
|---|---|
| Primera corrida | Pendiente de ejecución |
| Segunda corrida | Pendiente de ejecución |
| Tras stop/start | Pendiente de ejecución |
| Mutante | Pendiente de ejecución |
| Revisión cruzada | Pendiente |

No se ejecutaron Docker ni Playwright en esta sesión. Los checks normales de CI no sustituyen estas evidencias.
