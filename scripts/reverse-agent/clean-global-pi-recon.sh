#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cat >&2 <<'MSG'
This legacy cleanup alias is deprecated.
Use scripts/reverse-agent/clean-global-repi-profile.sh for REPI cleanup.
MSG
exec "$ROOT/scripts/reverse-agent/clean-global-repi-profile.sh" "$@"
