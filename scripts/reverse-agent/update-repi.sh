#!/usr/bin/env bash
set -euo pipefail

ROOT=""
BIN_ARGS=()
BIN_DIR=""
NO_PULL=0
FAST=0
FULL=0
SKIP_NPM=0

usage() {
  cat <<'MSG'
Usage:
  repi update [--fast|--full|--no-pull] [--user|--system|--bin-dir <dir>]
  bash scripts/reverse-agent/update-repi.sh [ROOT] [options]

Options:
  --fast            Pull/install only; skip smoke test.
  --full            Run npm run check after smoke.
  --no-pull         Do not git pull; reinstall current checkout.
  --skip-npm        Do not run npm install.
  --user            Install launcher into ~/.local/bin.
  --system          Install launcher into /usr/local/bin.
  --bin-dir <dir>   Install launcher into a custom directory.
  -h, --help        Show this help.
MSG
}

POSITIONAL=()
while [ "$#" -gt 0 ]; do
  case "$1" in
    --root)
      ROOT="${2:-}"
      if [ -z "$ROOT" ]; then echo "--root requires a value" >&2; exit 2; fi
      shift 2
      ;;
    --fast)
      FAST=1
      shift
      ;;
    --full)
      FULL=1
      shift
      ;;
    --no-pull)
      NO_PULL=1
      shift
      ;;
    --skip-npm)
      SKIP_NPM=1
      shift
      ;;
    --user|--system)
      BIN_ARGS+=("$1")
      if [ "$1" = "--user" ]; then BIN_DIR="$HOME/.local/bin"; else BIN_DIR="/usr/local/bin"; fi
      shift
      ;;
    --bin-dir)
      BIN_ARGS+=("$1" "${2:-}")
      if [ -z "${2:-}" ]; then echo "--bin-dir requires a value" >&2; exit 2; fi
      BIN_DIR="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      POSITIONAL+=("$1")
      shift
      ;;
  esac
done

if [ -z "$ROOT" ] && [ "${#POSITIONAL[@]}" -ge 1 ]; then ROOT="${POSITIONAL[0]}"; fi
if [ -z "$ROOT" ]; then
  SCRIPT_SOURCE="${BASH_SOURCE[0]}"
  while [ -L "$SCRIPT_SOURCE" ]; do
    DIR="$(cd -P "$(dirname "$SCRIPT_SOURCE")" && pwd)"
    TARGET="$(readlink "$SCRIPT_SOURCE")"
    if [[ "$TARGET" != /* ]]; then SCRIPT_SOURCE="$DIR/$TARGET"; else SCRIPT_SOURCE="$TARGET"; fi
  done
  ROOT="$(cd -P "$(dirname "$SCRIPT_SOURCE")/../.." && pwd)"
fi
ROOT="$(cd "$ROOT" && pwd)"

echo "==> Updating REPI in $ROOT"

if [ "$NO_PULL" -eq 0 ]; then
  if git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "==> Pulling latest main branch"
    git -C "$ROOT" pull --ff-only --tags
  else
    echo "==> Not a git checkout; skipping pull"
  fi
else
  echo "==> Skipping git pull"
fi

if [ "$SKIP_NPM" -eq 0 ]; then
  command -v npm >/dev/null 2>&1 || { echo "npm is required. Install Node.js 24+ first." >&2; exit 1; }
  echo "==> Installing dependencies"
  (cd "$ROOT" && npm install)
else
  echo "==> Skipping npm install"
fi

echo "==> Refreshing launcher and runtime profile"
bash "$ROOT/scripts/reverse-agent/install-repi.sh" --root "$ROOT" "${BIN_ARGS[@]}"

echo "==> Running doctor --fix"
if [ -z "$BIN_DIR" ]; then
  if [ -d /usr/local/bin ] && [ -w /usr/local/bin ]; then
    BIN_DIR="/usr/local/bin"
  else
    BIN_DIR="$HOME/.local/bin"
  fi
fi
REPI_INSTALLED_BIN_PATH="$BIN_DIR/repi" "$ROOT/repi" doctor --fix

if [ "$FAST" -eq 0 ]; then
  echo "==> Running smoke test"
  "$ROOT/repi" smoke
else
  echo "==> Fast mode: skipping smoke test"
  "$ROOT/repi" --offline --help >/dev/null 2>&1
  "$ROOT/repi" --offline --list-models >/dev/null 2>&1
fi

if [ "$FULL" -eq 1 ]; then
  echo "==> Running full repository check"
  (cd "$ROOT" && npm run check)
fi

cat <<'MSG'
Update complete.

Useful next commands:
  repi doctor
  repi model doctor
  repi smoke
MSG
