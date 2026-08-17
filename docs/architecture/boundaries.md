last_updated: 2026-08-17
status: active
owner: @K总

# 分层边界

## 前端 (src/)
- 只通过相对路径 `/api/...` 调用后端
- 禁止直接访问数据库或文件系统
- 禁止硬编码域名/IP/localhost

## 后端 (server/)
- server/routes/ — API 路由，只做请求转发和响应
- server/graph/ — LangGraph 状态图定义
- server/nodes/ — Harness Node 实现（纯函数）
- server/models/ — 数据库模型
- server/schemas/ — Pydantic 请求/响应 schema
- server/config/ — 配置管理

## 依赖方向
routes → schemas → models → config
graph → nodes → schemas → models
nodes 之间不直接调用，只通过 State 传递数据

## 禁止
- routes 直接操作数据库（必须经 models）
- nodes 直接操作 HTTP 响应（只返回 State）
- 前端直接 import 后端代码
