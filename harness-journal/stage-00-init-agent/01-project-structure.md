# 01 - 创建标准项目结构

## 步骤名称
创建前端 / 后端 / 数据库目录骨架

## 执行时间
2026-08-17

## 前置条件
- 阶段0（需求与可行性）已完成
- 技术栈确认：React 18 + Vite + FastAPI + LangGraph + PostgreSQL
- 工作区已有 Git 仓库和 .gitignore

## 执行内容

使用 Coze CLI 初始化 Vite 模板项目：

```bash
coze init . --template vite
```

CLI 自动完成：
- 创建 Vite + TypeScript 脚手架
- 安装前端依赖（pnpm）
- 生成 .coze 配置文件
- 生成 AGENTS.md（模板版）
- 生成 scripts/ 脚本目录
- 生成 server/ 目录（Express 模板）
- 提交 Git

随后手动调整：
- 清理模板自带的 Express server（server/server.ts, server/vite.ts）
- 创建 Python 后端目录结构：
  ```
  server/
  ├── graph/          # LangGraph 状态图定义
  ├── nodes/          # Harness 各阶段 Node 实现
  ├── models/         # 数据库模型
  ├── routes/         # API 路由
  ├── config/         # 配置
  └── schemas/        # Pydantic schema
  ```
- 创建 docs/ 知识库目录

## 产出物
```
src/                    # 前端源码 (React + Vite)
server/                 # 后端源码 (Python + FastAPI + LangGraph)
  ├── graph/
  ├── nodes/
  ├── models/
  ├── routes/
  ├── config/
  └── schemas/
docs/                   # 结构化知识库
scripts/                # 构建与启动脚本
```

## 验证结果
- `ls -la` 确认目录结构完整
- 前端 `pnpm ts-check` 通过
- 后端 `python -c "from server.main import app"` 通过

## 备注
Coze CLI 的 Vite 模板自带 Express 后端，我们替换为 Python FastAPI。保留了 scripts/ 脚本目录但重写了内容。
