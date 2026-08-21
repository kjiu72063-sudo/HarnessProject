last_updated: 2026-08-20
status: draft
owner: @K总

# Feature: F007 SSE 实时状态推送

## Status: Approved

**裁决注记（2026-08-20 K总，journal 61）**：5 项待裁决全部收口——①事件粒度：按建议采纳，首版 Node 级 + snapshot 全量推送；②轮询回退：按建议采纳，首版不保留（EventSource 内置重连 + 404 直接终止）；③多订阅：按建议采纳，首版单订阅，broadcast 语义留后续；歧义 α：docstring 替换为 F007（不保留 F006/F009 历史溯源标记）；歧义 β：SSECallbackHandler 在 start_harness() 构造注入 ainvoke config（与执行同生，首事件 snapshot 兜底补偿）。

## 目标

将 PipelinePage 的**轮询模式**改造为**服务端推送模式**：LangGraph Node 执行事件经由 SSE 实时推送至前端，消除 2s 轮询延迟，让用户感知 Harness 8 阶段流转的即时状态变化。推送是编排/路由层横切能力，不侵入 Node 业务逻辑。

## 非目标

- 不新增 LangGraph Node 或改变 F002 已 Approved 拓扑
- 不侵入 Node 委派桩业务逻辑——推送触发经回调机制接入，非 Node 内调用
- 不支持 Last-Event-ID 事件回放（F009 持久化未实现，事件无持久存储）
- 不实现 WebSocket 方案——SSE 单向推送满足状态更新场景，不引入新依赖
- 不处理跨标签页同步——单标签页 EventSource 订阅即足
- 不改动 `_snapshot()` 函数签名或 HarnessState 字段

## 技术方案

### 1. SSE 事件契约（验收标准 1）

**事件类型枚举**：

| event | 触发时机 | 负载 |
|---|---|---|
| `stage-start` | Harness 阶段 Node 开始执行 | `{ node: str, stage: str, timestamp: str }` |
| `stage-end` | 阶段 Node 完成 | `{ node: str, stage: str, timestamp: str }` |
| `snapshot` | 每次 stage-end 后推送全量快照 | HarnessStateSnapshot（同 `_snapshot()` 返回结构） |
| `status` | 会话状态变化时 | `{ status: str }`（interrupted/running/completed/ended） |
| `gate` | 到达人类闸门 | `{ gate: str, next: list[str] }` |
| `done` | 图执行完毕 | `{}` |
| `error` | 执行异常 | `{ message: str, node?: str }` |
| `heartbeat` | 每 15s 保活 | `{ ts: str }` |

**事件序列化**：标准 SSE 格式 `event: <type>\ndata: <json>\n\n`，JSON ensure_ascii=False。

**字段映射**：`snapshot` 事件的 `data` 与 `GET /{session_id}/state` 返回体同构（session_id + status + next + state 24 字段），前端现有 `HarnessStateSnapshot` 类型无需变更即可消费。

**心跳策略**：每 15 秒发送 `heartbeat` 事件，客户端以此判断连接存活；超 30 秒无心跳视为连接断开触发重连。

### 2. 推送触发机制（验收标准 2）

**候选路径比较**：

| 方案 | 原理 | 优点 | 缺点 |
|---|---|---|---|
| A. astream_events | 消费 LangGraph 原生事件流 | 事件最丰富 | 需改 `ainvoke`→`astream_events`，事件量爆炸需大量过滤，改变执行模型 |
| B. 自定义回调 | `config.callbacks` 注入 BaseCallbackHandler | 不改执行模型，最外科手术式，会话作用域自然隔离 | 需自建 Queue→SSE 桥接，回调粒度需精选 |
| C. 状态 diff 探测 | 定时读 state 比前后差异 | 零侵入 | 本质仍是轮询，延迟与轮询同量级 |

**选定方案 B**，理由：
1. **执行模型不变**——`ainvoke(initial_state, config={...callbacks: [handler]})` 仅追加 config，不改调用方式
2. **拓扑不变**——不新增 Node，回调在 config 层接入，符合"推送是编排/路由层横切能力"裁决
3. **Node 逻辑不变**——handler 挂在 LangGraph 回调系统，Node 代码零感知
4. **会话作用域自然**——每 session 一个 handler + 一个 asyncio.Queue，生命周期随会话

**回调精选**：只监听 `on_chain_start` / `on_chain_end`，且仅对 8 阶段 Node + 闸门 Node 的 start/end 产出事件，忽略 LLM 子链回调。通过 `tags` 或 `name` 前缀过滤。

**与 POST /start 时序衔接**：
- `start_harness()` 创建 session → 构造 handler + queue → 将 handler 注入 config → `ainvoke(config={"callbacks": [handler], ...})` → 返回 `{session_id, status}`
- 客户端收到 start 响应后立即 `new EventSource(/api/harness/{session_id}/stream)` 订阅
- 若订阅先于首个事件，`stream` 端点先推送一次 `snapshot`（当前快照）再进入 queue 消费，确保不丢初始状态

### 3. stub 端点真实化方案（验收标准 3）

**路径不变**：`GET /api/harness/{session_id}/stream`

**改造设计**：

```python
@router.get("/{session_id}/stream")
async def stream_harness(session_id: str) -> StreamingResponse:
    app = _get_session(session_id)
    queue = _event_queues.get(session_id)   # 会话作用域 Queue
    return StreamingResponse(
        _sse_generator(app, session_id, queue),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
```

**生成器逻辑** `_sse_generator`：
1. 先 yield `snapshot` 事件（当前快照，防客户端订阅时已错过首事件）
2. 进入 `queue.get()` 循环，每条转 SSE 格式 yield
3. 每消息后重置 15s 心跳定时器
4. 收到 `done` 或 `error` 事件后 yield 并 break
5. 客户端断开（asyncio.CancelledError）时清理：从 `_event_queues` 移除

**docstring 归属口径澄清**：原 docstring "流式框架属 F006/F009" 为历史标注，与 feature_list 编号体系不一致。**统一口径**：SSE 流式推送归 F007，docstring 编码阶段更新为 "SSE 实时推送 (F007)"。F006 为前端 UI 消费方（不改动组件内部逻辑属 F007 设计范围），F009 为持久化（首版不依赖）。

### 4. 前端接线设计（验收标准 4）

**PipelinePage 改造策略**：

```
usePolling (当前) → useSSE (新增 hook)
```

**`useSSE` hook**（`src/hooks/useSSE.ts`）：
- 挂载时 `new EventSource(/api/harness/${sessionId}/stream)` 订阅
- 按 `event` 类型分发：`snapshot` → 全量更新 state；`status` → 状态更新；`stage-start`/`stage-end` → 可选阶段动画触发；`gate` → 闸门提示；`done` → 关闭连接
- 卸载时 `eventSource.close()`，组件 unmount 自动清理
- `onerror` 处理：EventSource 内置重连（readyState 0→2），不做额外回退轮询（见开放问题②）

**SSE 失败回退**：首版**不保留轮询回退**。理由：EventSource 内置重连机制已覆盖短暂断线；若 SSE 端点 404（session 不存在）则直接终止，轮询回退会掩盖错误。回退轮询留开放问题②待 K总裁决。

**组件消费**：
- `DAGView`：消费 `snapshot` 事件的 `state.current_stage` 字段高亮当前阶段
- `LogPanel`：消费 `stage-start`/`stage-end` 事件追加日志条目，`snapshot` 事件刷新全量
- `StatGrid`：消费 `snapshot` 事件的 state 字段更新统计卡片
- `DecisionPanel`：消费 `gate` 事件触发闸门 UI 显示

**状态更新粒度**：`snapshot` 事件为全量更新（整份 HarnessStateSnapshot），不做字段级 diff——前端 React 状态替换开销可忽略，全量更新实现最简且与现有 `_snapshot()` 同构。

### 5. 生命周期与断线语义（验收标准 5）

| 场景 | 服务端行为 | 客户端行为 |
|---|---|---|
| 会话不存在 | 404 JSON 错误（非 SSE 流） | EventSource.onerror → 检查 404 → 关闭不重连 |
| 会话已结束 | 正常发送 `done` 事件后关闭流 | 收到 `done` → eventSource.close() |
| 客户端断开 | generator 捕获 CancelledError → 从 `_event_queues` 移除 queue → 资源回收 | 浏览器 tab 关闭，EventSource 自动 abort |
| 服务端重启 | 所有 in-memory session + queue 丢失 | EventSource onerror → 自动重连 → 404（session 不存在）→ 关闭 |
| Last-Event-ID 回放 | **不支持** | 不发送 Last-Event-ID header；重连后仅获取当前快照 + 后续事件 |

**无 F009 的显式界定**：首版事件仅存于内存（asyncio.Queue），无持久化。断线重连后只获取重连时刻快照 + 后续实时事件，**历史事件不可回放**。此为无 F009 时的有意识范围裁剪，非缺陷。F009 实现后可扩展 Last-Event-ID + 事件持久化回放。

### 6. 数据契约（验收标准 6）

**api-spec.md 回写口径**：编码阶段回写（F004 裁决①先例——api-spec 回写绑编码阶段而非设计阶段）。回写内容：
- `GET /api/harness/{session_id}/stream` 条目补充：事件类型枚举表、负载结构、心跳间隔、断线语义、Last-Event-ID 不支持声明
- 标注 `(F007)` 归属

**TS 类型镜像**（`src/types/sse.ts`）：

```typescript
export type SSEEventType =
  | 'stage-start' | 'stage-end' | 'snapshot'
  | 'status' | 'gate' | 'done' | 'error' | 'heartbeat'

export interface SSEStageEvent {
  node: string; stage: string; timestamp: string
}
export interface SSEStatusEvent { status: string }
export interface SSEGateEvent { gate: string; next: string[] }
export interface SSEErrorEvent { message: string; node?: string }
export interface SSEHeartbeatEvent { ts: string }
```

### 7. 测试策略（验收标准 7）

**后端 SSE 测试**（`server/tests/test_sse.py`）：
- httpx `AsyncClient` + `stream=True` 请求 stream 端点，逐行断言事件格式
- 事件序列断言：启动会话 → 订阅 → 断言首事件为 `snapshot` → 断言 `stage-start`/`stage-end` 交替 → 断言终事件 `done`
- 断开场景：客户端中途关闭 → 验证服务端 queue 被移除
- 404 场景：不存在 session_id → 断言 404 非 SSE
- 已结束场景：completed 会话 → 断言直接返回 snapshot + done

**前端 mock 测试**（`src/hooks/__tests__/useSSE.test.ts`）：
- Mock EventSource 构造函数，模拟事件派发
- 断言 snapshot 事件触发 state 更新
- 断言 unmount 调用 close()
- 断言 done 事件关闭连接

**覆盖率**：≥80%，由 verify.sh 第 5 项强制度量。

### 8. 文档自身（验收标准 8）

本文件 ≤300 行，遵循 `_template.md` 骨架（Status/目标/非目标/技术方案/验收标准/依赖）。

## 验收标准（8 项，对齐 Controller Spec）

1. SSE 事件契约完整：8 种事件类型、负载结构、与 HarnessState 快照映射、心跳策略
2. 推送触发机制选定并给出理由：方案 B（自定义回调）胜出，与 POST /start 时序衔接
3. stub 端点真实化：路径不变、生成器逻辑、docstring 归属口径澄清为 F007
4. 前端接线：useSSE hook、PipelinePage 改造、DAGView/LogPanel 消费、卸载清理
5. 生命周期语义：5 种场景覆盖、无 F009 时 Last-Event-ID 不支持的显式界定
6. 数据契约：api-spec.md 回写口径 + TS 类型镜像
7. 测试策略：后端流式断言 + 前端 EventSource mock + 覆盖率 ≥80%
8. 文档规范：≤300 行、_template.md 骨架、开放问题显式列出

## 依赖

- F006（前端平台 UI，已 passing）——PipelinePage + DAGView + LogPanel 消费方
- F002（LangGraph 编排引擎，已 passing）——graph 定义 + ainvoke + State 契约
- F009（持久化记忆系统，todo）——**不阻塞**，首版内存事件环，无持久化依赖

## 开放问题（提交 K总裁决）

1. **事件粒度**：当前设计为 Node 级事件（stage-start/end），是否需要字段级 diff（如 State 子字段变更事件）？字段级 diff 信息更丰富但实现复杂（需 deep diff + 增量序列化），首版建议 Node 级 + snapshot 全量推送。
2. **轮询回退**：SSE 连接失败时是否保留轮询回退？当前设计不保留（EventSource 内置重连 + 404 直接终止），但生产环境网络代理可能剥离 SSE 支持时轮询为安全兜底。
3. **多订阅**：同一 session_id 是否允许并发多个 EventSource 订阅（多标签页）？当前设计每个 session 单 queue，多订阅者共享 queue 需改 broadcast 语义（asyncio.Queue→list[Queue]）。首版建议单订阅，多标签页场景留后续。

## 自报歧义

α **docstring 归属口径**：Controller Spec 指出原 docstring "流式框架属 F006/F009" 与 feature_list 编号体系不一致。本设计统一口径为 F007，编码阶段回写。若 K总认为应保留历史注释作为溯源标记而非替换，请在裁决中指示。

β **handler 生命周期绑定点**：SSECallbackHandler 创建时机是在 `start_harness()` 构造并注入 ainvoke config，还是在 `stream_harness()` 首次订阅时惰性创建？前者 handler 与执行同生命周期（事件不丢但无人消费时 queue 积压需背压）；后者无积压但可能错过 start→首订阅间事件。本设计取前者（与执行同生），首事件通过 `snapshot` 兜底补偿。若 K总倾向后者请裁决。
