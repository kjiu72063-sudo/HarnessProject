# F007 SSE 实时状态推送 — L3 独立测试审查报告

## 执行时间

2026-08-20

## 审查对象

- 提交: 71ac96a（diff 锚点 65dbd59..71ac96a）
- 范围: 15 文件 +848/−110
- 新增: server/schemas/sse.py · server/graph/callbacks.py · server/tests/test_sse.py · src/types/sse.ts · src/hooks/useSSE.ts · src/hooks/__tests__/useSSE.test.ts
- 修改: server/routes/harness.py · src/pages/PipelinePage.tsx · src/pages/PipelinePage.test.tsx · src/App.test.tsx · server/tests/test_harness_api.py · docs/reference/api-spec.md · feature_list.json

## 审查依据

- Controller Spec: docs/handbook/controller-specs/f007-test-review.md（12 项标准）
- 设计文档: docs/design/feature-f007-sse-push.md（Status: Approved，5 项裁决注记）
- 硬性规则: AGENTS.md（14 条）
- 独立验证: 读代码 + 运行测试 + 复跑 verify.sh，不采信 coder 自报

## 12 项标准逐条审查

### 1. SSE 事件契约 — PASS

**验证方法**: 读 server/schemas/sse.py，独立 import 验证 EVENT_PAYLOAD_MAP。

- 8 事件类型: stage-start / stage-end / snapshot / status / gate / done / error / heartbeat ✅
- EVENT_PAYLOAD_MAP 映射完整，8 键全覆盖 ✅
- HEARTBEAT_INTERVAL_S = 15 ✅
- 负载结构对齐设计 §1:
  - SSEStageEvent: {node: str, stage: str, timestamp: str} ✅
  - SSESnapshotEvent: {session_id: str, status: str, next: list[str], state: dict} — 与 _snapshot() 返回体同构 ✅
  - SSEStatusEvent: {status: str} ✅
  - SSEGateEvent: {gate: str, next: list[str]} ✅
  - SSEErrorEvent: {message: str, node: str | None} ✅
  - SSEHeartbeatEvent: {ts: str} ✅
  - SSEDoneEvent: {} (空) ✅
- 事件序列化: `_sse_line()` → `event: <type>\ndata: <json>\n\n`，ensure_ascii=False ✅

### 2. 方案 B 回调 — PASS

**验证方法**: 读 callbacks.py + git diff 验证 graph/definition.py 零改动。

- SSECallbackHandler 继承 BaseCallbackHandler (langchain_core.callbacks) ✅
- on_chain_start → stage-start ✅（line 81）
- on_chain_end → stage-end ✅（line 97）
- on_chain_error → error ✅（line 108）
- MONITORED_NODES = STAGE_NODES | GATE_NODES，精选 8+4=12 个节点，忽略 LLM 子链 ✅
- GATE_NODES 在 on_chain_start 额外发 gate 事件 ✅（line 82-86）
- graph/definition.py diff = 0 行（拓扑零改动）✅
- emit_done / emit_status 辅助方法供 harness.py 调用 ✅

### 3. stream 真实化 — PASS

**验证方法**: 读 harness.py stream_harness 端点（line 132-169）。

- 路径: GET /api/harness/{session_id}/stream ✅
- StreamingResponse + media_type="text/event-stream" ✅
- 生成器逻辑 event_source():
  1. 先 yield snapshot（兜底补偿）✅（line 139）
  2. queue is None → yield done + return ✅（line 140-142）
  3. queue.get() 循环 + wait_for 超时 → heartbeat ✅（line 147-155）
  4. "event: done" / "event: error" → break ✅（line 150-151）
  5. CancelledError → remove_event_queue + raise ✅（line 157-159）
- Headers: Cache-Control: no-cache / X-Accel-Buffering: no / Connection: keep-alive ✅

### 4. 裁决① Node 级 — PASS

**验证方法**: 搜索 sse.py + callbacks.py，确认无字段级 diff 事件类型。

- 事件类型枚举仅含 stage-start/end + snapshot，无 field-diff / state-delta 类型 ✅
- snapshot 为全量推送（SSESnapshotEvent.state: dict）✅

### 5. 裁决② 轮询回退 — PASS

**验证方法**: grep useSSE.ts + PipelinePage.tsx 搜索 setInterval / usePolling / polling。

- useSSE.ts 无 setInterval / usePolling / 任何轮询代码 ✅
- PipelinePage.tsx 仅 import useSSE，无 usePolling ✅
- onerror 处理: 仅检查 readyState === CLOSED → setConnected(false)，无重试/回退逻辑 ✅

### 6. 裁决③ 单订阅 — PASS

**验证方法**: 读 callbacks.py _event_queues 数据结构 + stream_harness 消费逻辑。

- _event_queues: dict[str, asyncio.Queue[str]]，每 session 单 queue ✅
- SSECallbackHandler.__init__ 赋值 _event_queues[session_id] = queue ✅
- stream_harness 通过 get_event_queue(session_id) 获取同一 queue ✅
- 设计 §5 声明"首版单订阅"，实现与此范围一致 ✅
- **附注**: 同 session 二次订阅无显式拒绝（两 generator 竞争 queue.get()），但此场景在设计 scope 外，见 N2

### 7. 裁决④+⑤ start 注入 — PASS

**验证方法**: 读 harness.py start_harness() + 各文件 docstring 归属。

- start_harness() 构造: queue = asyncio.Queue() (line 103) → handler = SSECallbackHandler(session_id, queue) (line 104) → config["callbacks"] = [handler] (line 106) ✅
- 歧义β裁决落地: "与执行同生；首事件 snapshot 兜底补偿" — docstring 注记 ✅
- stream 端点 docstring: "SSE 实时状态推送 (F007)" ✅（line 134）
- callbacks.py 模块 docstring: "F007 SSE 推送回调" ✅
- harness.py 模块 docstring line 5: "SSE 实时状态推送 (F007)" ✅
- 无 F006/F009 残留归属（line 8 F009 提及为范围界定非归属）✅
- resume_harness 同样注入 handler ✅（line 186-188）

### 8. 前端改造 — PASS

**验证方法**: 读 PipelinePage.tsx + useSSE.ts，确认轮询移除与 SSE 接线。

- PipelinePage.tsx import useSSE (line 8)，调用 useSSE(sessionId) (line 23) ✅
- 无 usePolling / setInterval / 任何轮询代码 ✅
- useEffect cleanup: es.close() + setConnected(false) ✅（line 116-118）
- 四组件消费方:
  - DAGView: `<DAGView snapshot={data} />` ✅（line 45）
  - StatGrid: `<StatGrid data={data} />` ✅（line 34）
  - LogPanel: `<LogPanel entries={buildLogEntries(data)} />` ✅（line 58）
  - DecisionPanel: 条件渲染于 interrupted 状态 ✅（line 50-56）
- SSE 连接状态指示: `{connected && <span>SSE 实时</span>}` ✅（line 42）
- 错误显示: SSE 连接失败 banner ✅（line 63-67）

### 9. TS 镜像 — PASS

**验证方法**: 逐字段比对 src/types/sse.ts vs server/schemas/sse.py。

| TS 类型 | Py 类型 | 字段一致 |
|---|---|---|
| SSEEventType (8 联合) | SSEEventType Literal (8) | ✅ |
| SSEStageEvent {node, stage, timestamp} | SSEStageEvent(node, stage, timestamp) | ✅ |
| SSESnapshotEvent {session_id, status, next, state} | SSESnapshotEvent(session_id, status, next, state) | ✅ |
| SSEStatusEvent {status} | SSEStatusEvent(status) | ✅ |
| SSEGateEvent {gate, next} | SSEGateEvent(gate, next) | ✅ |
| SSEErrorEvent {message, node?} | SSEErrorEvent(message, node: None) | ✅ |
| SSEHeartbeatEvent {ts} | SSEHeartbeatEvent(ts) | ✅ |
| SSEDoneEvent = Record<string, never> | SSEDoneEvent() 空类 | ✅ |

### 10. api-spec 回写 — PASS

**验证方法**: 读 docs/reference/api-spec.md §SSE 段。

- GET /api/harness/{session_id}/stream 端点描述 + Content-Type: text/event-stream ✅
- 8 事件类型枚举表完整（stage-start / stage-end / snapshot / status / gate / done / error / heartbeat）✅
- 负载结构与实现一致 ✅
- 心跳间隔 15s ✅
- Last-Event-ID 不支持 + 原因（首版无 F009 持久化）✅
- 断线语义段: EventSource 内置重连 / 404 直接终止 / Last-Event-ID 不支持 ✅
- (F007) 归属标注 ✅

### 11. 测试质量 — PASS

**验证方法**: 读 test_sse.py + useSSE.test.ts + PipelinePage.test.tsx，评估断言真实性。

**后端 test_sse.py (7 用例)**:
- test_stream_returns_sse_content_type: 断言 200 + text/event-stream ✅
- test_stream_first_event_is_snapshot: 逐行解析断言首事件 ✅
- test_stream_snapshot_contains_session_state: 断言 session_id/status/state 字段 ✅
- test_stream_emits_done_event: 断言 done 事件存在 ✅
- test_stream_404_for_unknown_session: 404 非 SSE ✅
- test_stream_has_cache_control_headers: no-cache + x-accel-buffering ✅
- test_sse_event_format_standard: 逐行验证 event: + data: JSON 格式 ✅

**前端 useSSE.test.ts (7 用例)**:
- URL 构造 / null 不创建 / unmount 关闭 / snapshot 更新 / error 设置 / done 关闭 / handler 回调 ✅
- MockEventSource 自建，覆盖生命周期 ✅

**PipelinePage.test.tsx (4 用例)**:
- 空状态 / SSE snapshot 渲染统计 / 闸门决策提交 / SSE 错误 banner ✅
- MockEventSource 覆盖事件分发 ✅
- 断言非空洞: 验证 DOM 文本内容 / fetch 调用 / readyState ✅

**App.test.tsx 更新**: MockES + esInstances 适配 SSE ✅

### 12. verify.sh 独立复跑 — PASS

**验证方法**: 独立执行 `UV_FROZEN=1 bash scripts/verify.sh` + `uv lock --check`。

- verify.sh: 14/14 PASS ✅
- 后端覆盖率: 92.98%（≥80%）✅
- uv.lock 零漂移: `uv lock --check` 通过 ✅
- 环境表: python3.12 + uv 0.12.5 + .venv 完好

## 歧义裁定

coder 报告"无自报歧义"。独立验证未发现 Spec 口径歧义或实现与设计偏差。无需裁定项。

## M/N 清单

### M（必须修复）: 0 项

无。

### N（建议改进）: 2 项

| 编号 | 描述 | 位置 | 理由 |
|---|---|---|---|
| N1 | usePolling 死代码清理 | src/hooks/usePolling.ts + src/hooks/usePolling.test.tsx (56+行) | PipelinePage 已切 useSSE，grep 全 src/ 无消费方，属死代码。建议后续批次清理 |
| N2 | 二次订阅防御 | server/graph/callbacks.py _event_queues + server/routes/harness.py stream_harness | 同 session 二次 EventSource 订阅无显式拒绝，两 generator 竞争 queue.get() 消息分配不可预测。首版单订阅 scope 内可接受，但防御性检查（如 stream_harness 检查已有活跃连接并拒绝）可避免生产误用 |

## 验证环境表

| 项目 | 值 |
|---|---|
| 审查提交 | 71ac96a |
| diff 锚点 | 65dbd59..71ac96a |
| Python | 3.12 |
| uv | 0.12.5 |
| .venv | 完好 |
| verify.sh | 14/14 PASS |
| 覆盖率 | 92.98% |
| uv.lock | 零漂移 |
| 审查时间 | 2026-08-20 |

## 总结论

**12 项标准全 PASS / 0 M / 2 N / 0 歧义**

F007 编码产出与设计文档 5 项裁决完全对齐，SSE 事件契约完整，方案 B 回调零侵入，stream 端点真实化逻辑正确，前端轮询完全移除、useSSE 接线完备，TS 镜像字段级一致，api-spec 回写完整，测试断言真实无空洞，verify.sh 14/14 通过。2 项 N 级建议（死代码清理 + 二次订阅防御）均非阻塞。

**建议推进 F007 → passing。**
