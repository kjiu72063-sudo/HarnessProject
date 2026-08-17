#!/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

EXPOSE_PORT=$(awk -F '[ =]+' '/^expose_port/ {gsub(/[^0-9]/, "", $2); print $2; exit}' .preview 2>/dev/null || echo 5000)

echo "Starting FastAPI production server on port ${EXPOSE_PORT}..."
cd "$PROJECT_DIR"

export PORT="${EXPOSE_PORT}"
exec uv run uvicorn server.main:app --host 0.0.0.0 --port "${EXPOSE_PORT}"
