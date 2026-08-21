# Journal 59: F007 SSE 实时状态推送 — 设计 Draft 撰写

**日期**: 2026-08-20
**角色**: design-writer (F007 委派)
**前置**: journal 58 (L1 委派三件套产出)
**产出**: `docs/design/feature-f007-sse-push.md` (Status: Draft)

---

## 任务概述

按 Controller Spec (`docs/handbook/controller-specs/f007-design-writer.md`) 撰写 F007 SSE 实时状态推送设计文档，覆盖 8 项验收标准。

## 冷启动确认

已按序读取：AGENTS.md / progress.txt 末行 / feature_list.json / _template.md / state-design.md / harness-flow.md / f007-design-writer.md (Controller Spec)。源码现状已验证：harness.py L104-117 stub 端点 / PipelinePage.tsx usePolling / definition.py 零 stream/callback。

## 设计决策记录

### D1: 推送触发机制 → 方案 B（自定义回调）

三候选比较：
- A (astream_events): 事件最丰富但需改 ainvoke→astream_events，执行模型变更侵入大
- B (自定义回调): config.callbacks 注入 BaseCallbackHandler，不改执行模型/拓扑/Node 逻辑，最外科手术式
- C (状态 diff): 本质仍是轮询，零新能力

选定 B，理由：执行模型不变 + 拓扑不变 + Node 逻辑不变 + 会话作用域自然。

### D2: SSE 事件契约 → 8 种事件类型

stage-start / stage-end / snapshot / status / gate / done / error / heartbeat。snapshot 为全量推送（同 _snapshot() 返回体），不做字段级 diff（留开放问题①）。

### D3: 断线回放 → 不支持 Last-Event-ID

F009 未实现，事件无持久存储。显式界定：重连仅获取当前快照 + 后续事件，历史不可回放。非缺陷，是有意识范围裁剪。

### D4: 前端改造 → useSSE hook 替换 usePolling

PipelinePage 从 usePolling 切换至 useSSE。首版不保留轮询回退（留开放问题②）。DAGView/LogPanel/StatGrid/DecisionPanel 各消费对应事件类型。

### D5: docstring 归属口径 → 统一为 F007

原 "流式框架属 F006/F009" 为历史标注与编号体系不一致，编码阶段回写为 "SSE 实时推送 (F007)"。留自报歧义α。

### D6: handler 生命周期 → 与 ainvoke 同生

在 start_harness() 创建 handler 注入 config，首事件通过 snapshot 兜底补偿。留自报歧义β。

## 8 项验收标准逐条对照

| # | 标准 | 覆盖位置 |
|---|---|---|
| 1 | SSE 事件契约 | §1: 8 事件类型 + 负载 + 映射 + 心跳 |
| 2 | 推送触发机制 | §2: 方案 B 选定 + 理由 + 时序衔接 |
| 3 | stub 端点真实化 | §3: 路径不变 + 生成器逻辑 + docstring 澄清 |
| 4 | 前端接线设计 | §4: useSSE hook + 消费方 + 卸载清理 |
| 5 | 生命周期与断线 | §5: 5 场景 + 无 F009 显式界定 |
| 6 | 数据契约 | §6: api-spec 回写口径 + TS 类型镜像 |
| 7 | 测试策略 | §7: 后端流式断言 + 前端 mock + 覆盖率 |
| 8 | 文档自身 | 本文件 ≤300 行 + 骨架 + 开放问题显式列出 |

## 开放问题清单

1. 事件粒度：Node 级 vs 字段级 diff（首版建议 Node 级 + snapshot 全量）
2. 轮询回退：SSE 失败是否保留轮询兜底（首版不保留）
3. 多订阅：同 session 并发 EventSource（首版单订阅）

## 自报歧义清单

α. docstring 归属口径：替换 vs 保留历史溯源标记
β. handler 生命周期绑定点：与 ainvoke 同生 vs 首次订阅惰性创建

## 约束遵守确认

- 技术栈基线不变（FastAPI StreamingResponse + 原生 SSE，零新依赖）
- F002 拓扑不变（无新 Node，回调在 config 层）
- Node 委派桩原则不变（handler 不侵入 Node 逻辑）
- 零代码变更（纯文档产出）
- ≤300 行（设计文档 150 行内）
