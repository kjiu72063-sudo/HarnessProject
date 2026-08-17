# 02 - 初始化依赖配置

## 步骤名称
package.json（前端）+ pyproject.toml（后端）+ 版本约束

## 执行时间
2026-08-17

## 前置条件
- 项目结构已创建

## 执行内容

### 前端依赖（package.json）

在 Vite 模板基础上新增 React：

```bash
pnpm add react react-dom
pnpm add -D @types/react @types/react-dom @vitejs/plugin-react
```

版本锁定：
- React 18 + react-dom 18
- Vite 7
- TypeScript 5.6+
- Tailwind CSS 3.4+
- @vitejs/plugin-react 4.3.4（注意：不能用 6.x，与 Vite 7 不兼容）

踩坑记录：首次安装 @vitejs/plugin-react@6.0.5 导致 `ERR_PACKAGE_PATH_NOT_EXPORTED`，降级到 4.3.4 解决。

### 后端依赖（pyproject.toml）

使用 uv 管理依赖：

```toml
[project]
name = "harness-platform"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "langgraph>=0.2.50",
    "langchain-openai>=0.2.0",
    "langchain-core>=0.3.0",
    "psycopg2-binary>=2.9.9",
    "sqlalchemy>=2.0.0",
    "alembic>=1.13.0",
    "pydantic>=2.0.0",
    "pydantic-settings>=2.0.0",
    "python-dotenv>=1.0.0",
]
```

实际安装结果：71 个包，包括：
- langgraph 1.2.11
- fastapi 0.141.1
- openai 3.1.0
- sqlalchemy 2.0.52
- psycopg2-binary 2.9.12

### .coze 配置

补全字段：
- `sub_id = "6e9ff524"`（openssl rand -hex 4 生成）
- `name = "harness-platform"`
- `[preview] preview_enable = "enabled"`
- `[subprojects] path = ["."]`

### .preview 端口声明

```toml
[preview.port]
expose_port = 5000
```

## 产出物
- `package.json` — 前端依赖（含 React 18）
- `pyproject.toml` — 后端依赖（含 LangGraph + FastAPI + OpenAI）
- `pnpm-lock.yaml` — 前端锁文件
- `uv.lock` — 后端锁文件
- `.coze` — 平台配置（含 sub_id）
- `.preview` — 端口声明
- `.env.example` — 环境变量模板

## 验证结果
- `uv sync` 成功安装 71 个包
- `pnpm install` 成功
- `pnpm ts-check` 通过

## 备注
uv 需要手动安装（`pip3 install uv`），沙箱环境未预装。Python 版本实际为 3.12.3（非 3.11，但兼容）。
