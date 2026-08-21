# Controller Spec: F007 Coder — SSE 实时状态推送编码

## 任务身份
你是 F007 编码 Agent。按已 Approved 的设计文档 `docs/design/feature-f007-sse-push.md`（205→207 行，含裁决注记）完成编码。本 Spec 是验收契约。

## 交付物（全部同提交）
- `server/schemas/sse.py`——SSE 事件 Pydantic schema（8 事件类型）
- `server/routes/harness.py` 修改——stream stub 真实化（路径不变）
- `server/graph/callbacks.py`（或设计指定位置）——SSECallbackHandler
- `server/routes/harness.py` start_harness 修改——构造注入 handler（歧义 β 裁决）
- `src/types/sse.ts`——TS 类型镜像
- `src/hooks/useSSE.ts`——前端 hook
- `src/pages/PipelinePage.tsx` 修改——轮询改 EventSource
- 对应测试文件（后端 httpx 流式断言 + 前端 EventSource mock）
- `docs/reference/api-spec.md` 回写（stream 端点事件类型表）
- `harness-journal/stage-04-coding/62-f007-coder-execution.md`（journal 62，你自写）
- `progress.txt` 追加恰 1 行

## 验收标准（12 项）

1. **SSE 事件契约**：8 事件类型（stage-start/stage-end/snapshot/status/gate/done/error/heartbeat）Pydantic schema 完整，负载结构与设计 §1 一致；snapshot 与 HarnessState 同构映射；15s 心跳
2. **推送触发机制**：方案 B 自定义回调——SSECallbackHandler 实现 LangGraph callback 接口，在 Node 边界发事件；graph 拓扑零改动（不新增 Node）
3. **stub 端点真实化**：`GET /api/harness/{session_id}/stream` 路径不变；StreamingResponse + text/event-stream；生成器逻辑=先 snapshot 兜底 → queue 消费 → 心跳 → done/error 退出；原生 StreamingResponse 禁 WebSocket
4. **handler 绑定点【歧义 β 裁决】**：SSECallbackHandler 在 start_harness() 构造并注入 ainvoke config（与执行同生）；首事件 snapshot 兜底补偿 start→首订阅间事件
5. **docstring 归属【歧义 α 裁决】**：原 "流式框架属 F006/F009" docstring 替换为 F007 口径，不保留历史溯源标记
6. **轮询回退【开放问题②裁决】**：不保留轮询回退；EventSource onerror 用内置重连；404 直接终止
7. **多订阅【开放问题③裁决】**：每 session 单 queue 单订阅；第二个订阅者的行为按设计 §5 定义（拒绝/顶替，以设计文档为准）
8. **事件粒度【开放问题①裁决】**：仅 Node 级事件（stage-start/end）+ snapshot 全量推送；不实现字段级 diff
9. **前端接线**：useSSE hook（订阅/卸载清理/重连语义）+ PipelinePage 轮询改 EventSource + DAGView/LogPanel/StatGrid/DecisionPanel 消费方按设计 §4 映射；统一 /api/ 相对路径
10. **api-spec.md 回写**：stream 端点条目补 8 事件类型表与断线语义，与实现一致
11. **TS 类型镜像**：src/types/sse.ts 与 Pydantic schema 字段级一致
12. **verify.sh 14/14 PASS** + uv.lock 零漂移 + 测试覆盖新增代码 ≥80%（设计 §7 策略）

## 硬性约束
- 单文件 ≤300 行；单函数 ≤50 行
- POST/PUT 请求体 Pydantic BaseModel（P003）；SSE 为 GET 流无需 Body
- 前端禁 `as any`/隐式 any；统一 `/api/` 相对路径（规则 1）
- 后端禁裸 print，用 logging（规则 2）
- LangGraph Node 委派桩原则不破坏（规则 5）
- 端口：前端 5000 后端 8000（规则 6）
- **禁改清单**：`.coze`、`docs/design/feature-f007-sse-push.md`（已 Approved 冻结）、journal 58/59/60/61、`docs/handbook/` 本 Spec 与 launch prompt
- journal 62 为你的执行记录（自写），journal 63 = test-reviewer 预留禁占

## 环境（P 编号防护，必读）
- P009：沙箱环境漂移——会话可能无 uv/无 .venv。先查 `.venv/bin/python --version` 完好性：完好仅 `pip install uv -i https://mirrors.aliyun.com/pypi/simple/` 重装；损坏按 journal 39 §9 替代构建法重建（`UV_DEFAULT_INDEX` 指镜像 + `UV_FROZEN=1` + `uv venv` + `uv pip install -r <(uv export --frozen --no-hashes)`）
- P010：全程 `export UV_FROZEN=1` 前置；结束时 `git diff -- uv.lock` 必须为空
- P011：提交前 `git status --short` + `git diff --cached --stat` 双向核对暂存区恰为产出文件；提交后 40 秒复查无平台自动提交混入；验收锚定 diff 范围而非 HEAD

## 提交规范
- 提交消息：`feat(F007): SSE实时状态推送——8事件类型+方案B回调+前端EventSource改造(journal 62)`
- 提交前自跑 `bash scripts/verify.sh`（UV_FROZEN=1）须 14/14

## 报告格式（回 K总）
12 项标准对照表 + 提交哈希与 diff 锚点 + 验证环境表 + P 编号命中表 + 产出物清单 + 自报歧义（不裁定，备审查）。
