# Controller Spec: F006 R2 聚焦校验

## 角色
design-reviewer (L3 设计校验 Agent)

## 任务
对 F006 R2 修订版做聚焦校验（非全量重审），验证 5 项缺陷修复 + 修订影响 + 范围确认。

## 被审文档
`docs/design/feature-f006-frontend-ui.md`（185 行，Status: Draft）

## 审阅参考文档
- `docs/design/feature-f002-langgraph.md`（Approved）— ResumeRequest 定义、TechStackSpec 双包管理器、interrupt 拓扑
- `docs/design/feature-f003-llm-provider.md`（Approved）— TechStackSpec 引用
- `docs/design/feature-f011-agent-runtime.md`（Approved）— human_intervention 机制
- `docs/handbook/prompts/_bootstrap.md`（标准引导模板）
- `AGENTS.md` — 规则 #5/#8、技术栈基线

## Part A: R2 缺陷修复验证（5 项）

### A1. 石墨灰同名异值消除
- 验证点: line 32 + line 148，#4B5563 改名"青灰"，#1A1D24 保持"石墨灰"
- 检查: grep 确认设计内容中无"石墨灰 #4B5563"残留

### A2. boundaries.md 跨文档同步待办
- 验证点: line 179 blockquote 存在，列出前端子目录 + 依赖方向
- 检查: 格式与 F002/F011/F003 的 boundaries.md 同步待办一致

### A3. DiamondNode 四状态对齐 StageStatus
- 验证点: line 51，pending/running/passed/failed 四状态
- 检查: 与 StageStatus 定义一致，能区分"未到达"和"等待决策"

### A4. resumeHarness API 封装 + stream 删除
- 验证点: lines 86-91 resumeHarness 封装，参数 gate+decision 对齐 F002 ResumeRequest
- 检查: line 34 模块列表改为 start/getState/resume，grep 确认"stream"仅存于修订记录

### A5. TechStackSelector 6 字段表单
- 验证点: line 44，6 字段含默认值（React/FastAPI/PostgreSQL/OpenAI/pnpm/uv）
- 检查: 与 F002 TechStackSpec 6 字段对齐

## Part B: 修订影响检查（3 项）

- B1. 内部一致性: 无"石墨灰 #4B5563"残留、DiamondNode 四状态全文一致、TechStackSelector 6 字段全文一致
- B2. 修订记录: line 185 Round 2 条目存在，格式与 Round 1 一致
- B3. 行数: 185 行 ≤ 300

## Part C: 修订范围确认（3 项）

- C1. R1 修复完整性: 3 项原缺陷修复保持完整（DAGView / TS HarnessState / 轮询+F007+LogPanel+StatusBadge）
- C2. 修改点清单: R2 仅触及组件描述/API段/设计规范/依赖段/修订记录，未触及其他章节
- C3. 无意外修改: 未修改跨文档

## Part D: 跨文档快速复核（4 项）

- D1. resumeHarness 参数与 F002 ResumeRequest 对齐（gate: str + decision: bool）
- D2. TechStackSelector 6 字段与 F002 TechStackSpec 对齐（frontend/backend/database/llm/frontend_package_manager/backend_package_manager）
- D3. DiamondNode 四状态与 StageStatus 对齐
- D4. boundaries.md 同步待办格式与 F002/F011/F003 一致

## 输出格式
```
=== Part A: R2 缺陷修复验证 ===
  A1-A5 逐条: 已修复/未修复/部分修复 + 证据

=== Part B: 修订影响检查 ===
  B1-B3 逐条: 通过/缺陷

=== Part C: 修订范围确认 ===
  C1-C3 逐条: 通过/缺陷

=== Part D: 跨文档快速复核 ===
  D1-D4 逐条: 通过/缺陷

=== 新引入缺陷 ===
  [#N] 级别/维度/位置/描述/修法
  （无则写"无"）

=== 最终结论 ===
  通过 / 需修订后重审
```

## 约束
- 只读不写（除 journal + progress.txt）
- 不修改 F006 或任何设计文档
- journal 路径: harness-journal/stage-02-feature-breakdown/38-f006-r2-review.md
