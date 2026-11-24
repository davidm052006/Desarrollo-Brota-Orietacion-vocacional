#!/usr/bin/env bash
set -euo pipefail

supabase start >/dev/null
supabase db reset
"$(dirname "$0")/brota-demo-up.sh"
