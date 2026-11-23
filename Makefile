.PHONY: brota-respaldar brota-demo-up brota-demo-reset brota-demo-down brota-demo-info demo-brota-up demo-brota-info demo-brota-movil-up demo-brota-movil-info

# Exporta el estado remoto completo antes de convertirlo en el baseline local.
# Pide la URI PostgreSQL de forma oculta; no guarda credenciales en el repo.
brota-respaldar:
	python3 scripts/exportar_brota.py

brota-demo-up:
	bash scripts/brota-demo-up.sh

demo-brota-up: brota-demo-up

demo-brota-movil-up:
	bash scripts/brota-demo-movil-up.sh

demo-brota-movil-info:
	@printf '%s\n' \
	  'Flutter (vista móvil): http://127.0.0.1:5175' \
	  'API (salud):          http://127.0.0.1:3001/api/health' \
	  'Supabase Studio:      http://127.0.0.1:55323'

brota-demo-reset:
	bash scripts/brota-demo-reset.sh

brota-demo-down:
	bash scripts/brota-demo-down.sh

brota-demo-info:
	@printf '%s\n' \
	  'Aplicación:            http://127.0.0.1:5174' \
	  'API (salud):           http://127.0.0.1:3001/api/health' \
	  'Supabase API:          http://127.0.0.1:55321' \
	  'Supabase Studio:       http://127.0.0.1:55323' \
	  'Supabase DB:           postgresql://postgres:postgres@127.0.0.1:55322/postgres' \
	  'Mailpit:               http://127.0.0.1:55324' \
	  'Analytics:             http://127.0.0.1:55327' \
	  '' \
	  'Cuentas locales (contraseña: Demo123!):' \
	  '  Administrador: admin.demo@brota.local' \
	  '  Estudiante:    estudiante.demo@brota.local'

demo-brota-info: brota-demo-info
