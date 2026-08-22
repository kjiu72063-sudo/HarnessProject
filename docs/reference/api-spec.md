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
- `GET /api/harness/{session_id}/stream` — SSE 实时状态推送 (F007)。Content-Type: text/event-stream；8 事件类型见下表；心跳间隔 15s；Last-Event-ID 不支持（首版无 F009 持久化）

**SSE 事件类型表 (F007)**：

| event | 负载结构 | 时机 |
|---|---|---|
| stage-start | `{ node, stage, timestamp }` | 8 阶段 Node + 闸门 Node 开始执行 |
| stage-end | `{ node, stage, timestamp }` | 8 阶段 Node + 闸门 Node 执行完成 |
| snapshot | `{ session_id, status, next, state }` | 与 GET /state 同构全量快照；订阅时首事件兜底 |
| status | `{ status }` | 会话状态变化（running/interrupted/completed/ended） |
| gate | `{ gate, next }` | 闸门暂停等待人类决策 |
| done | `{}` | 流程结束（completed/ended） |
| error | `{ message, node? }` | 执行异常 |
| heartbeat | `{ ts }` | 每 15s 保活，超 30s 无心跳视为断连 |

**断线语义**：EventSource 内置重连；404（session 不存在）直接终止不重连；Last-Event-ID 不支持，重连后仅获当前快照 + 后续事件。
- `POST /api/harness/{session_id}/resume` — 闸门决策恢复。请求体: `{ gate, decision }`（gate: prototype_confirmation / design_approval / acceptance_check / human_intervention）；响应: `{ status, next, state }`
- `GET /api/harness/sessions` — 会话列表 (F013)。响应: `{ sessions: SessionListItem[], total }`；按 `started_at` 倒序；首版无分页/过滤参数（会话数 < 50）。`SessionListItem` 字段: `{ session_id, status, project_id, current_stage, requirement_summary(≤80字符), started_at }`

> 历史: 原 `/api/agent-sessions` 路由已在 F013 编码阶段删除（被 `/api/harness/sessions` 取代）。

### 约束管理 (F004 已实现，server/routes/constraints.py)
- `GET /api/constraints?project_id=` — 约束规则列表。响应: `{ rules: Constraint[] }`；`project_id` **可选**：省略 → 仅返回系统规则（source=agents_md）；提供 → 系统规则 + 该项目规则，按 `rule_no` 升序
- `POST /api/constraints` — 新增约束规则（仅 source=manual，project_id 必填）。请求体: `{ project_id, rule_type, title, detail, enabled }`；`rule_type` ∈ rule_linter_config | test_coverage | file_size | fn_complexity | tech_stack_lock | api_prefix | no_print | logging | type_safety | project_layout（十类）；422: 未知 rule_type / 空 title(<1 字符) / 空 project_id
- `PUT /api/constraints/{id}` — 更新约束规则（enabled 切换 / title / detail；rule_type/project_id/source 不可变）。请求体: `{ title?, detail?, enabled? }`；422: id 非正整数 / 空 title / 规则不存在时 404
- `Constraint` 字段: `{ id, project_id, source(agents_md|manual), source_key, rule_no, title, detail, rule_type, enforcer, enforcement(mechanized|manual_review), gate_ids, enabled, created_at, updated_at }`；`source_key`: 条目唯一标识键（agents-md-rule-{n} / manual-{auto}）；`enforcer`: 执行器标识（"ruff T20" 等）；系统规则（source=agents_md）由服务启动时从 AGENTS.md「硬性规则」段解析注册，不可通过 API 增删改

### 产物管理
- `GET /api/projects/{id}/artifacts` — 产物列表
- `GET /api/projects/{id}/preview` — 应用预览
- `POST /api/projects/{id}/deploy` — 部署

### 沙箱状态 (F005 已实现，server/routes/sandbox.py)
- `GET /api/sandbox/status` — 沙箱执行器状态查询（只读）。响应: `{ executor_type, docker_available }`；`executor_type` ∈ docker | local | disabled；`docker_available` = (executor_type == "docker")。执行由委派桩内部调用，不经 API 暴露。

### 健康
- `GET /api/health` — 健康检查
