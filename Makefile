.PHONY: brota-respaldar brota-demo-up brota-demo-reset brota-demo-down brota-demo-info

# Exporta el estado remoto completo antes de convertirlo en el baseline local.
# Pide la URI PostgreSQL de forma oculta; no guarda credenciales en el repo.
brota-respaldar:
	python3 scripts/exportar_brota.py

brota-demo-up:
	bash scripts/brota-demo-up.sh

brota-demo-reset:
	bash scripts/brota-demo-reset.sh

brota-demo-down:
	bash scripts/brota-demo-down.sh

brota-demo-info:
	@printf '%s\n' \
	  'Aplicación:      http://127.0.0.1:5174' \
	  'API:             http://127.0.0.1:3001/api/health' \
	  'Supabase API:    http://127.0.0.1:55321' \
	  'Supabase Studio: http://127.0.0.1:55323' \
	  'Mailpit:         http://127.0.0.1:55324' \
	  'Analytics:       http://127.0.0.1:55327'
