last_updated: 2026-08-19
status: draft
owner: @K总

# API 接口规范

## 基础
- 前缀: `/api`
- 内容类型: `application/json`
- 认证: Bearer token (后续实现)

## 接口清单

### 项目管理
- `GET /api/projects` — 项目列表
- `POST /api/projects` — 创建项目
- `GET /api/projects/{id}` — 项目详情
- `DELETE /api/projects/{id}` — 删除项目

### Harness 会话 (F002 已实现，server/routes/harness.py)
- `POST /api/harness/start` — 启动 Harness 流程。请求体: `{ project_id, requirement, tech_stack }`；响应: `{ session_id, status: "running" }`
- `GET /api/harness/{session_id}/state` — 完整状态快照 (HarnessState 24 字段 + next + status)
- `GET /api/harness/{session_id}/stream` — SSE 实时状态推送
- `POST /api/harness/{session_id}/resume` — 闸门决策恢复。请求体: `{ gate, decision }`（gate: prototype_confirmation / design_approval / acceptance_check / human_intervention）；响应: `{ status, next, state }`

> 历史: 原规划的 `/api/agent-sessions` 路由（阶段1骨架草案）已被 F002 的 `/api/harness/*` 取代；server/routes/agent_sessions.py 为占位 stub，消费方一律走 `/api/harness/*`。

### 约束管理
- `GET /api/constraints?project_id=` — 约束规则列表
- `POST /api/constraints` — 新增约束规则
- `PUT /api/constraints/{id}` — 更新约束规则

### 产物管理
- `GET /api/projects/{id}/artifacts` — 产物列表
- `GET /api/projects/{id}/preview` — 应用预览
- `POST /api/projects/{id}/deploy` — 部署

### 健康
- `GET /api/health` — 健康检查
