last_updated: 2026-08-18
status: active
owner: @K总

# 分层边界

## 前端 (src/)
- 只通过相对路径 `/api/...` 调用后端
- 禁止直接访问数据库或文件系统
- 禁止硬编码域名/IP/localhost
- 子目录: src/pages/（页面组件）、src/components/（UI 组件）、src/api/（API 封装）、src/types/（TS 类型定义）

## 后端 (server/)
- server/routes/ — API 路由，只做请求转发和响应
- server/graph/ — LangGraph 状态图定义
- server/nodes/ — Harness Node 实现（委派桩/状态转换器，F011/F002）
- server/llm/ — LLM 提供商层（OpenAI 实现 + 抽象接口，F003）
- server/models/ — 数据库模型
- server/schemas/ — Pydantic 请求/响应 schema
- server/constraints/ — 约束管理层（F004: parser/registry/store，引擎不执行检查，只注册/注入/消费）
- server/config/ — 配置管理

## 依赖方向
### 后端
routes → schemas → models → config
routes → constraints
graph → nodes → schemas → models
nodes → constraints（coding_agent 注入/controller_spec 消费, validation 读取注册表产 gates）
nodes → llm → schemas, config
nodes 之间不直接调用，只通过 State 传递数据

### 前端
pages → components, api → types

## 禁止
- routes 直接操作数据库（必须经 models）
- nodes 直接操作 HTTP 响应（只返回 State）
- 前端直接 import 后端代码
- nodes 内含业务逻辑（Node 是委派桩，业务逻辑由 L3 Agent 执行）
