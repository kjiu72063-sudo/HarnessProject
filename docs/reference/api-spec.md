last_updated: 2026-08-20
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

### 约束管理 (F004 已实现，server/routes/constraints.py)
- `GET /api/constraints?project_id=` — 约束规则列表。响应: `{ rules: Constraint[] }`；`project_id` **可选**：省略 → 仅返回系统规则（source=agents_md）；提供 → 系统规则 + 该项目规则，按 `rule_no` 升序
- `POST /api/constraints` — 新增约束规则（仅 source=manual，project_id 必填）。请求体: `{ project_id, rule_type, title, detail, enabled }`；`rule_type` ∈ rule_linter_config | test_coverage | file_size | fn_complexity | tech_stack_lock | api_prefix | no_print | logging | type_safety | project_layout（十类）；422: 未知 rule_type / 空 title(<1 字符) / 空 project_id
- `PUT /api/constraints/{id}` — 更新约束规则（enabled 切换 / title / detail；rule_type/project_id/source 不可变）。请求体: `{ title?, detail?, enabled? }`；422: id 非正整数 / 空 title / 规则不存在时 404
- `Constraint` 字段: `{ id, project_id, source(agents_md|manual), rule_type, rule_no, title, detail, enabled, enforcement(verify_gate|agent_hint), gate_ids, created_at, updated_at }`；系统规则（source=agents_md）由服务启动时从 AGENTS.md「硬性规则」段解析注册，不可通过 API 增删改

### 产物管理
- `GET /api/projects/{id}/artifacts` — 产物列表
- `GET /api/projects/{id}/preview` — 应用预览
- `POST /api/projects/{id}/deploy` — 部署

### 健康
- `GET /api/health` — 健康检查
