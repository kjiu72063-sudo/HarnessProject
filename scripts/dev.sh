#!/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

EXPOSE_PORT=$(awk -F '[ =]+' '/^expose_port/ {gsub(/[^0-9]/, "", $2); print $2; exit}' .preview 2>/dev/null || echo 5000)
BACKEND_PORT=8000

kill_port_if_listening() {
    local port=$1
    local pids
    pids=$(ss -H -lntp 2>/dev/null | awk -v port="${port}" '$4 ~ ":"port"$"' | grep -o 'pid=[0-9]*' | cut -d= -f2 | paste -sd' ' - || true)
    if [[ -n "${pids}" ]]; then
      echo "Port ${port} in use by PIDs: ${pids} (SIGKILL)"
      echo "${pids}" | xargs -I {} kill -9 {} 2>/dev/null || true
      sleep 1
    fi
}

echo "Clearing ports ${EXPOSE_PORT} and ${BACKEND_PORT} before start."
kill_port_if_listening "${EXPOSE_PORT}"
kill_port_if_listening "${BACKEND_PORT}"

echo "Starting FastAPI backend on port ${BACKEND_PORT}..."
(cd "$PROJECT_DIR" && uv run uvicorn server.main:app --host 0.0.0.0 --port "${BACKEND_PORT}" --reload) &
BACKEND_PID=$!
echo "Backend PID: ${BACKEND_PID}"

sleep 2

echo "Starting Vite dev server on port ${EXPOSE_PORT}..."
cd "$PROJECT_DIR"
export PORT="${EXPOSE_PORT}"
exec pnpm exec vite --host 0.0.0.0 --port "${EXPOSE_PORT}"
