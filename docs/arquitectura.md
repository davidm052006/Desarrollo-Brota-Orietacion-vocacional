# Arquitectura lógica de Brota

Corte: 24 de noviembre de 2026. Diagrama del sistema actual, no de la infraestructura objetivo.

```mermaid
flowchart LR
  U[Usuario] --> F[React + Vite / Vercel]
  F -->|HTTPS / JWT| B[API Express / Railway]
  F -->|Inicio de sesión| A[Supabase Auth]
  B -->|Verificación de identidad| A
  B -->|Consultas y escrituras| P[(Supabase PostgreSQL)]
  B -->|Sincronización de programas| M[API del MEN]
  G[GitHub Actions] -->|Lint, tests, build| F
  G -->|Lint y tests| B
  G --> E[Playwright]
  E -->|Flujos de navegador| F
  subgraph S[Supabase]
    A
    P
  end
```

## Responsabilidades

- React: presentación, navegación, formularios y sesión del usuario.
- Express: reglas de negocio, autorización, perfiles, comunidad, recomendaciones, administración e integración MEN.
- Supabase: autenticación, persistencia relacional y políticas de acceso. La clave de servicio pertenece exclusivamente al servidor.
- GitHub Actions: controles de calidad de los PR; Playwright verifica flujos del navegador. La integración con la BD local se ejecuta por separado (ver plan de pruebas).

## Entornos

Producción/beta: Vercel, Railway y Supabase remoto. Pruebas: Supabase local mediante Docker y migraciones; no escribir en producción. El diagrama de despliegue objetivo se mantiene en [guia_deploy.md](guia_deploy.md).

Referencias: [contexto técnico](CLAUDE.md), [modelo de datos](modelo_datos.md), [plan de pruebas](plan_pruebas.md).
