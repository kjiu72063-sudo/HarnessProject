# F007 SSE 实时状态推送 — L3 独立测试审查 Controller Spec

## 任务定位

对 F007 编码产出（提交 71ac96a，diff 锚点 65dbd59..71ac96a，15 文件 +848/−110）做内容质量独立审查。你与 coder 无共享上下文，以 Spec 与设计文档为唯一依据独立验证。

**验证 diff 锚点**: `git diff 65dbd59..71ac96a`（其中 journal 62 + progress.txt 为 coder 配套记录，非审查对象本体）

## 审查对象

- 新增: server/schemas/sse.py · server/graph/callbacks.py · server/tests/test_sse.py · src/types/sse.ts · src/hooks/useSSE.ts · src/hooks/__tests__/useSSE.test.ts
- 修改: server/routes/harness.py · src/pages/PipelinePage.tsx · src/pages/PipelinePage.test.tsx · src/App.test.tsx · server/tests/test_harness_api.py · docs/reference/api-spec.md · feature_list.json

## 输入材料

- 本 Spec（12 项标准）
- 设计文档: docs/design/feature-f007-sse-push.md（Status: Approved，含 5 项裁决注记）
- journal 61（裁决口径）: docs/handbook/controller-specs 上层目录 ../handbook/controller-specs/f007-coder.md（coder Spec，含验收标准原文）
- 硬性规则: AGENTS.md（Node 委派桩、相对路径 /api、Pydantic、TS 类型镜像、单文件 ≤300 行等）

## 审查标准（12 项，独立验证）

1. **SSE 事件契约**: sse.py 含 8 事件类型（stage-start/stage-end/snapshot/status/gate/done/error/heartbeat），负载结构与设计 §1 一致，snapshot 与 HarnessState 同构
2. **方案 B 回调**: callbacks.py SSECallbackHandler 继承 BaseCallbackHandler，on_chain_start/end 映射 stage-start/end，**graph 拓扑零改动**（definition.py 不在本提交内为佐证）
3. **stream 真实化**: harness.py 生成器逻辑 = snapshot 兜底 → queue 消费 → 心跳 → done/error 退出，路径与 stub 一致（GET /api/harness/{session_id}/stream）
4. **裁决① Node 级**: 无字段级 diff 事件；stage-start/end + snapshot 全量
5. **裁决② 轮询回退**: useSSE 无轮询回退代码；EventSource 404 直接终止（不重试）
6. **裁决③ 单订阅**: _event_queues 单 queue 消费，同 session 二次订阅行为可界定（拒绝或排队，验证实际行为与设计 §5 一致）
7. **裁决④+⑤ start 注入**: start_harness() 构造 handler + config["callbacks"] 注入；docstring 归属 F007（无 F006/F009 残留）
8. **前端改造**: PipelinePage 轮询代码移除、EventSource 接线、卸载清理（useEffect cleanup 关闭连接）；四组件消费方与设计 §4 映射
9. **TS 镜像**: sse.ts 与 sse.py 字段级一致（事件类型联合、负载字段名、可空性）
10. **api-spec 回写**: §5 与实现一致（事件类型枚举、端点行为、断线语义）
11. **测试质量**: 后端 test_sse.py 断言真实（事件顺序/心跳/终止路径）；前端 useSSE.test.ts mock EventSource 覆盖重连/404/卸载；PipelinePage 测试改断言 SSE 而非轮询——**警惕断言空洞**（F005 N1 先例）
12. **verify.sh 独立复跑**: 14/14 PASS + uv.lock 零漂移 + 覆盖率 ≥80%

## 歧义/自报核实

coder 报告"无自报歧义"。如你在独立验证中发现 Spec 口径歧义或实现与设计偏差，列入裁定清单（可接受/需修复 + 理由），不默许。

## 输出要求

1. journal 63: `harness-journal/stage-04-coding/63-f007-test-review.md`（编号预留，禁占他用）
2. progress.txt 追加 1 行（[YYYY-MM-DDTHH:MMZ] 格式）
3. harness-journal/README.md 索引同步
4. 提交恰 3 文件（journal 63 + progress + README），P011 防护（git status --short + git diff --cached --stat 双向核对）
5. 结论格式: 12 项逐条 PASS/FAIL + 歧义裁定 + M/N 分级（M=必须修复，N=建议改进）+ 总结论

## 环境与防护

- 冷启动必读: AGENTS.md → progress.txt → feature_list.json → docs/plans/current-sprint.md → harness-journal/README.md 最近 3 条 → journal 61（裁决口径）
- P009: 先查 .venv 完好性与 uv 存在性；uv 缺失则 pip 装 uv（aliyun 镜像）；.venv 损坏才重建（UV_DEFAULT_INDEX 指镜像 + UV_FROZEN=1，journal 39 §9）
- P010: 全程 UV_FROZEN=1，uv.lock 零漂移
- P011: 提交前双向核对，40 秒复查无平台自动提交混入
- 禁改: .coze / 设计文档 / journal 61/62 / controller-specs / launch-prompts
