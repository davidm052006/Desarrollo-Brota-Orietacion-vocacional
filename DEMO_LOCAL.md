# Entorno local de Brota

```bash
make brota-demo-up
```

- Aplicación: http://127.0.0.1:5174
- API: http://127.0.0.1:3001/api/health
- Supabase Studio: http://127.0.0.1:55323
- Mailpit: http://127.0.0.1:55324
- Analytics: http://127.0.0.1:55327

La base se crea desde `supabase/migrations/` y carga solamente datos
sintéticos desde `supabase/seed.sql`. Para volver al estado inicial:

```bash
make brota-demo-reset
```

El registro desde la aplicación crea cuentas únicamente en el Supabase local.
Nunca usar datos de `backups/` como seed: esos respaldos pueden contener datos
personales y están excluidos de Git.

Para detener los servicios:

```bash
make brota-demo-down
```
