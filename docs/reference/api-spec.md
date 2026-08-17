last_updated: 2026-08-17
status: draft

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

### Agent 会话
- `GET /api/agent-sessions?project_id=` — 会话列表
- `POST /api/agent-sessions` — 启动 Harness 流程
- `GET /api/agent-sessions/{id}` — 会话状态
- `GET /api/agent-sessions/{id}/stream` — SSE 实时状态推送

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
