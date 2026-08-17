#!/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "Installing frontend dependencies..."
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

if command -v coze-dev > /dev/null 2>&1 && coze-dev check-bins --help > /dev/null 2>&1; then
  coze-dev check-bins --fix
fi

echo "Installing backend dependencies..."
uv sync 2>/dev/null || uv pip install -e .

echo "Prepare completed."
