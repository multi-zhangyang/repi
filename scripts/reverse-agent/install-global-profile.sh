#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(pwd)}"
ROOT="$(cd "$ROOT" && pwd)"
BIN_DIR="${2:-${REPI_INSTALL_BIN_DIR:-/usr/local/bin}}"
AGENT_DIR="${REPI_CODING_AGENT_DIR:-${REPI_AGENT_DIR:-$HOME/.repi/agent}}"

cat <<MSG
install-global-profile.sh is deprecated.
REPI no longer installs a file-based global profile. The independent product uses
its built-in --recon kernel plus isolated runtime state in ~/.repi/agent.
This compatibility wrapper only initializes the isolated REPI runtime profile and
installs the repi launcher; it does not copy SYSTEM.md, APPEND_SYSTEM.md,
extensions, skills, prompts, vendor links, node_modules links, or write ~/.pi/agent.
MSG

if [ ! -x "$ROOT/repi" ]; then
  echo "missing executable $ROOT/repi" >&2
  exit 1
fi
if [ ! -f "$ROOT/scripts/reverse-agent/init-repi-profile.mjs" ]; then
  echo "missing $ROOT/scripts/reverse-agent/init-repi-profile.mjs" >&2
  exit 1
fi
if [ ! -x "$ROOT/scripts/reverse-agent/install-repi.sh" ]; then
  echo "missing executable $ROOT/scripts/reverse-agent/install-repi.sh" >&2
  exit 1
fi

node "$ROOT/scripts/reverse-agent/init-repi-profile.mjs" "$ROOT"
"$ROOT/scripts/reverse-agent/install-repi.sh" "$ROOT" "$BIN_DIR"

cat <<MSG
Initialized isolated REPI runtime profile: $AGENT_DIR
Compatibility command complete. Prefer: npm run install:repi
MSG
