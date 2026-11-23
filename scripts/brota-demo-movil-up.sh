#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f ../brota-flutter/pubspec.yaml ]]; then
  echo 'No se encontró ../brota-flutter. Clona la app móvil junto a brota-web.' >&2
  exit 1
fi

# El repositorio Flutter incluye un SDK local y un .env privado. El build solo
# necesita estas fuentes; crear un contexto temporal evita enviarlos a Docker.
BROTA_MOBILE_CONTEXT="$(mktemp -d /tmp/brota-mobile-build.XXXXXX)"
trap 'rm -rf "$BROTA_MOBILE_CONTEXT"' EXIT
cp mobile/Dockerfile "$BROTA_MOBILE_CONTEXT/Dockerfile"
cp ../brota-flutter/pubspec.yaml ../brota-flutter/pubspec.lock "$BROTA_MOBILE_CONTEXT/"
cp -a ../brota-flutter/lib ../brota-flutter/assets ../brota-flutter/web "$BROTA_MOBILE_CONTEXT/"
export BROTA_MOBILE_CONTEXT

supabase start >/dev/null
eval "$(supabase status -o env)"

: "${API_URL:?Supabase local no entregó API_URL}"
: "${ANON_KEY:?Supabase local no entregó ANON_KEY}"
: "${SERVICE_ROLE_KEY:?Supabase local no entregó SERVICE_ROLE_KEY}"

export BROTA_SUPABASE_INTERNAL_URL="${API_URL/127.0.0.1/host.docker.internal}"
export BROTA_SUPABASE_ANON_KEY="$ANON_KEY"
export BROTA_SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"

docker compose -f compose.brota-demo.yml -f compose.brota-movil.yml up -d --build backend mobile
