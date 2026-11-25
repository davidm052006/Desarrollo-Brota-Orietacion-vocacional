#!/usr/bin/env bash
set -euo pipefail

supabase start >/dev/null
eval "$(supabase status -o env)"

: "${API_URL:?Supabase local no entregó API_URL}"
: "${ANON_KEY:?Supabase local no entregó ANON_KEY}"
: "${SERVICE_ROLE_KEY:?Supabase local no entregó SERVICE_ROLE_KEY}"

export BROTA_SUPABASE_INTERNAL_URL="${API_URL/127.0.0.1/host.docker.internal}"
export BROTA_SUPABASE_ANON_KEY="$ANON_KEY"
export BROTA_SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"

docker compose -f compose.brota-demo.yml up -d --build
