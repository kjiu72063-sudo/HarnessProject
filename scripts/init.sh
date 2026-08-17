#!/usr/bin/env bash
# Harness Platform - 初始化脚本
# 用途: 一键启动开发环境 (前端 Vite + 后端 FastAPI)
# 对应 Anthropic 两阶段模型中的 init.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "[HARNESS] Starting initialization..."

# 1. 前端依赖
echo "[HARNESS] Installing frontend dependencies..."
pnpm install --frozen-lockfile

# 2. 后端依赖
echo "[HARNESS] Installing backend dependencies..."
uv sync 2>/dev/null || uv pip install -e .

# 3. 创建 .env 文件（如果不存在）
if [ ! -f .env ]; then
  echo "[HARNESS] Creating .env from .env.example..."
  cp .env.example .env 2>/dev/null || true
fi

# 4. 验证前端可编译
echo "[HARNESS] Verifying frontend build..."
pnpm ts-check

# 5. 验证后端可导入
echo "[HARNESS] Verifying backend import..."
uv run python -c "from server.main import app; print('FastAPI app OK')" 2>/dev/null || \
  python -c "from server.main import app; print('FastAPI app OK')" 2>/dev/null || \
  echo "[HARNESS] WARNING: Backend import failed, check Python environment"

echo "[HARNESS] Initialization complete."
echo "[HARNESS] Run './scripts/dev.sh' to start development servers."
