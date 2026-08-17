# 03 - 编写启动脚本

## 步骤名称
init.sh — 一键启动开发环境

## 执行时间
2026-08-17

## 前置条件
- 依赖配置已就绪

## 执行内容

### 新建脚本

`scripts/init.sh` — 初始化脚本（Anthropic 两阶段模型的 init.sh）：
- 安装前端依赖（pnpm install）
- 安装后端依赖（uv sync）
- 创建 .env 文件（从 .env.example 复制）
- 验证前端可编译（pnpm ts-check）
- 验证后端可导入（python -c "from server.main import app"）

### 重写模板脚本

模板自带的 4 个脚本全部重写以支持双栈（Vite + FastAPI）：

`scripts/prepare.sh` — 预处理脚本：
- 安装前端依赖
- 安装后端依赖

`scripts/dev.sh` — 开发环境启动脚本：
- 从 .preview 读取 expose_port（fallback 5000）
- 清理 5000 和 8000 端口残留
- 启动 FastAPI 后端（uvicorn，端口 8000，--reload）
- 启动 Vite 前端（vite dev，端口 5000，host 0.0.0.0）
- Vite 配置 /api 代理到 127.0.0.1:8000

`scripts/build.sh` — 构建脚本：
- 安装前后端依赖
- pnpm vite build 构建前端

`scripts/start.sh` — 生产环境启动脚本：
- 从 .preview 读取端口
- uv run uvicorn 启动 FastAPI

### Vite 配置更新

`vite.config.ts` 新增：
- `@vitejs/plugin-react` 插件
- `/api` 代理到 `http://127.0.0.1:8000`

### 脚本规范

所有脚本遵循 web-dev skill 规范：
- `set -euo pipefail`
- 基于 SCRIPT_DIR 推导 PROJECT_DIR（不依赖调用时 pwd）
- 从 .preview 读取端口（不 hardcode）
- 绑定 0.0.0.0（不绑 127.0.0.1）
- `exec` 启动最终常驻进程
- 绝不碰 9000 端口

## 产出物
- `scripts/init.sh` — 初始化脚本
- `scripts/prepare.sh` — 预处理脚本（重写）
- `scripts/dev.sh` — 开发启动脚本（重写）
- `scripts/build.sh` — 构建脚本（重写）
- `scripts/start.sh` — 生产启动脚本（重写）
- `vite.config.ts` — Vite 配置（新增 React 插件 + API 代理）

## 验证结果
- 前端 dev server 启动成功，curl 返回 200
- 后端 FastAPI 启动成功，/api/health 返回 {"status":"ok"}
- API 代理连通：curl localhost:5000/api/health 返回后端数据
- 端口绑定确认：5000 和 8000 均绑定 0.0.0.0

## 备注
模板自带的 dev.sh 启动 Express，我们改为双栈启动（FastAPI + Vite）。Vite 的 /api 代理解决了前端跨域问题。
