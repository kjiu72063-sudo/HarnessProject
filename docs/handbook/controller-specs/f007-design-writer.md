# Controller Spec: F007 设计文档撰写 Agent（design-writer）

## 角色
你是 F007 SSE 实时状态推送的设计文档撰写 Agent。产出 `docs/design/feature-f007-sse-push.md`（Status: Draft），供 K总 设计审批 HITL 闸门裁决。

## 任务背景
F007（feature_list.json）：SSE 实时状态推送——LangGraph Node 执行回调推送到前端。依赖 F006（前端平台 UI，已 passing）。

## 已核实的现状（设计输入，勿重复调研）
- **stub 端点已存在**：`server/routes/harness.py` L104-117 `GET /api/harness/{session_id}/stream`——当前一次性 yield snapshot/status/done 三事件即关闭，docstring 标注"stub 数据，流式框架属 F006/F009"（注意：feature_list 中流式功能归 F007，docstring 归属口径与编号体系存在历史不一致，设计中需澄清并统一口径，编码阶段回写）
- **前端消费方现状**：`src/pages/PipelinePage.tsx`（流程监控页，F006 已 passing）当前为**轮询模式**（测试断言 "polls session state"）——SSE 接入后该页需改造，改造策略属本设计范围
- **编排层出口现状**：`server/graph/definition.py` 零 stream/callback 命中——LangGraph 事件流出口是本设计的核心增量
- **State 契约**：`_snapshot()` 返回 HarnessState 24 字段 + next + status（`GET /{session_id}/state` 同源）；state-design.md 含 current_stage 字段
- **F009 未实现**：持久化记忆（PostgreSQL + Checkpointer）仍 todo——断线重连/事件回放的持久化依赖不存在，设计必须显式界定无 F009 时的范围（如内存事件环 + 放弃回放），禁止隐性依赖未实现能力
- **F002 拓扑不变原则**（F004/F005 同款先例）：不新增 Node，推送机制不得侵入 Node 业务逻辑；Node 委派桩原则不变——推送是编排层/路由层横切能力
- **多会话事实**：`_get_session(session_id)` 内存会话表——事件订阅与会话生命周期（结束/不存在）语义需覆盖

## 设计文档必须覆盖（验收标准，内容项由 K总 审批 + 后续 test-reviewer 验证）
1. **SSE 事件契约**：事件类型枚举（如 stage-start/stage-end/snapshot/status/done/error）、每类负载结构、与 HarnessState 快照的字段映射；事件序列化格式（JSON in data）；心跳/保活策略
2. **推送触发机制**：LangGraph 执行事件如何转化为 SSE 事件——候选路径（astream_events 消费 / 自定义回调 / Node 间状态 diff 探测）需比较选定并说明理由；与现有 `POST /start` 异步执行模型的衔接（start 后流式订阅的时序）
3. **stub 端点真实化方案**：现有 stream 端点改造设计（路径不变 `/api/harness/{session_id}/stream`），docstring 归属口径澄清（F007 vs F006/F009 历史注释）
4. **前端接线设计**：PipelinePage 轮询→EventSource 改造策略（SSE 失败回退轮询与否）、React 挂载/卸载时订阅生命周期、组件状态更新粒度；DAGView/LogPanel 组件如何消费事件
5. **生命周期与断线语义**：会话不存在（404）、会话已结束（done 后流关闭）、客户端断开（服务端资源回收）、Last-Event-ID 回放是否支持（无 F009 的显式界定）
6. **数据契约**：api-spec.md stream 端点条目细化回写口径（绑编码阶段，F004 裁决①先例）；事件负载的 TS 类型镜像（src/types/）
7. **测试策略**：SSE 测试方法（httpx/TestClient 流式断言、事件序列断言、断开/不存在/已结束场景），前端 EventSource mock 测试；覆盖率 ≥80%
8. **文档自身**：≤300 行，遵循 docs/design/_template.md 骨架；开放问题显式列出提交 K总（预期至少：事件粒度粗细——Node 级 vs 字段级 diff；轮询是否保留为回退）

## 硬性约束
- 技术栈基线不变（AGENTS.md）：Python 3.12 + FastAPI + LangGraph + React 19；SSE 用原生 StreamingResponse/text-event-stream，禁止引入 WebSocket/新依赖
- F002 拓扑不变、Node 委派桩原则——已定架构裁决，设计只能在既定框架内细化
- 不写任何代码，纯设计文档产出

## 产出与提交
- `docs/design/feature-f007-sse-push.md`（Status: Draft）
- journal 59 写入（含设计决策记录 + 开放问题清单 + 自报歧义）
- progress.txt 追加 1 行（design-draft）
- 提交前 P011 双向核对（git status --short + git diff --cached --stat），恰 3 文件
- 报告含：提交哈希、diff 锚点、逐条标准对照、开放问题清单

## L1 验收范围（预告，内容项不判定）
产出存在 / journal 与 progress 写入 / 约束遵守（行数、恰3文件、零代码）/ verify.sh 复跑记录。设计质量由 K总 HITL 闸门裁决。
