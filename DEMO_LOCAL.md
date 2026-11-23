# Entorno local de Brota

```bash
make brota-demo-up
```

El mismo comando también se puede invocar como `make demo-brota-up`.

Para ver las direcciones y cuentas locales:

```bash
make demo-brota-info
```

- Aplicación: http://127.0.0.1:5174
- API: http://127.0.0.1:3001/api/health
- Supabase Studio: http://127.0.0.1:55323
- Mailpit: http://127.0.0.1:55324
- Analytics: http://127.0.0.1:55327

Las cuentas sintéticas se recrean con cada `make brota-demo-reset`:

- `admin.demo@brota.local` / `Demo123!` (administrador)
- `estudiante.demo@brota.local` / `Demo123!` (estudiante)

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

## Vista de la app móvil

Con el repositorio hermano `../brota-flutter` disponible:

```bash
make demo-brota-movil-up
make demo-brota-movil-info
```

Abre http://127.0.0.1:5175 y activa un tamaño de teléfono en las herramientas
del navegador. Este comando compila la app Flutter como web y la sirve en
Docker; usa el mismo backend y Supabase local que la demo web. La vista web de
Brota sigue disponible en http://127.0.0.1:5174 si ya estaba iniciada.

La primera compilación móvil descarga Flutter 3.44.8 y puede tardar. El script
envía a Docker solo `lib/`, `assets/`, `web/`, `pubspec.yaml` y
`pubspec.lock` del repositorio hermano. Genera un `.env` para la compilación
con la URL local, la clave pública de Supabase y la URL de la API; no usa el
`.env` privado del repositorio móvil.

Para ejecutar Android o iOS nativo, inicia esta demo local y ejecuta
`flutter run` desde `../brota-flutter` con su `.env` configurado para las
direcciones accesibles desde el emulador o dispositivo. El contenedor móvil
sirve una vista de navegador, no un emulador Android/iOS.
