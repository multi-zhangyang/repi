#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_ARGS=()
SKIP_NPM=0

usage() {
  cat <<'MSG'
Usage:
  bash install.sh [--user|--system|--bin-dir <dir>] [--skip-npm]

Options:
  --user            Install launcher into ~/.local/bin.
  --system          Install launcher into /usr/local/bin.
  --bin-dir <dir>   Install launcher into a custom directory.
  --skip-npm        Do not run npm install; only refresh the repi launcher/profile.
  -h, --help        Show this help.

Default behavior:
  1. install npm dependencies
  2. write the repi launcher
  3. initialize ~/.repi/agent
  4. run offline startup checks
MSG
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --user|--system)
      BIN_ARGS+=("$1")
      shift
      ;;
    --bin-dir)
      BIN_ARGS+=("$1" "${2:-}")
      if [ -z "${2:-}" ]; then echo "--bin-dir requires a value" >&2; exit 2; fi
      shift 2
      ;;
    --skip-npm)
      SKIP_NPM=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

echo "==> Installing REPI from $ROOT"
if [ "$SKIP_NPM" -eq 0 ]; then
  command -v npm >/dev/null 2>&1 || { echo "npm is required. Install Node.js 24+ first." >&2; exit 1; }
  (cd "$ROOT" && npm install)
else
  echo "==> Skipping npm install"
fi

bash "$ROOT/scripts/reverse-agent/install-repi.sh" --root "$ROOT" "${BIN_ARGS[@]}"

echo "==> Verifying offline startup"
"$ROOT/repi" --offline --help >/dev/null 2>&1
"$ROOT/repi" --offline --list-models >/dev/null 2>&1

cat <<'MSG'
Done.

Useful next commands:
  repi commands
  repi doctor
  repi model add --provider <id> --api openai-completions --base-url <url> --model <model>
  repi model login --provider <id> --api-key-stdin
  repi model test --provider <id> --model <model>
MSG
