# F006 前端 UI 设计文档修订 Round 1

## 步骤名称
F006 前端平台 UI 设计文档 — Round 1 修订（3 项缺陷修复 + F002/F003 状态字段同步）

## 执行时间
2026-08-18

## 前置条件
- F011 Agent Runtime 已 Approved（271 行，缺陷链闭合）
- F002 LangGraph 编排引擎已 Approved（225 行，缺陷链闭合）
- F003 LLM 提供商层已 Approved（187 行，缺陷链闭合）
- F006 当前 Draft（149 行），存在 3 项缺陷（致命 2 + 概念 1）
- L1 产出 F006 修订 Controller Spec（3 项缺陷，12 条验收标准）委派 L3 修订

## 执行内容

### 1. 冷启动
按标准引导模板执行冷启动 5 步：
1. AGENTS.md — 项目全貌、硬性规则 13 条、L3 硬约束 8 条
2. progress.txt — 107 条历史进度，关注 F003-approved（line 106）
3. feature_list.json — F001 passing, F011/F002/F003 approved, F004-F010 todo, F006 todo
4. docs/plans/current-sprint.md — Sprint 1 范围（F002/F003/F006）
5. harness-journal/README.md — 开发日志索引 + 最近 3 条 journal（31/32/33）

### 2. 读取待修订文档和参考文档
- 待修订：docs/design/feature-f006-frontend-ui.md（149 行，Status: Draft）
- Controller Spec：docs/handbook/controller-specs/f006-design-writer-revision.md（3 项缺陷 + 12 条验收标准）
- 参考 F002（Approved）：HarnessState 含 TechStackSpec + max_iterations/current_iteration、HITL interrupt_before 机制、route_loop_budget
- 参考 F003（Approved）：token_usage_total: TokenUsage、TokenUsage 三字段定义
- 参考 F011（Approved）：6 闸门 actor 分配、循环预算、meta 层 vs runtime 层
- 参考 _template.md：设计文档模板结构

### 3. 逐项修复

#### 缺陷 #1 [致命] 缺 DAG 视图（Type 1，回环边画不出）
- **位置**: F006 §页面组件拆分 → 流程监控页（原 lines 47-52）
- **问题**: StageTimeline（8 阶段垂直拓扑线）无法渲染反馈循环和 DRR 长循环的回环边
- **修法**:
  1. 模块列表新增 `src/components/DAGView.tsx` — DAG 流程图视图（@xyflow/react Type 1 只读）
  2. StageNode/DiamondNode 描述补充"（DAGView 内使用）"明确归属
  3. 页面组件拆分 → 流程监控页：StageTimeline 替换为 DAGView（8 阶段节点 + 回环边 + 闸门决策点）
  4. 新增回环边描述：贝塞尔曲线 + 虚线 + 标签（"反馈循环"/"DRR 长循环"）
  5. LogPanel 描述从"等宽字体实时日志"改为"等宽字体日志"
  6. 验收标准更新为"DAG 视图展示 8 阶段 + 回环边 + 闸门决策点 + 日志面板 + 状态灯四色"

#### 缺陷 #2 [致命] TS HarnessState 与 F002/F003 漂移
- **位置**: F006 §TS 类型定义（原 lines 94-116）
- **问题**: TS HarnessState 缺 TechStackSpec/max_iterations/current_iteration/token_usage_total，旧 TechStack 枚举需删除
- **修法**:
  1. HarnessState 接口对齐 F002/F003 修订后字段：tech_stack: TechStackSpec + max_iterations: number + current_iteration: number + token_usage_total: TokenUsage
  2. 新增 TechStackSpec 接口（6 字段：frontend/backend/database/llm/frontend_package_manager/backend_package_manager）
  3. 新增 TokenUsage 接口（3 字段：prompt_tokens/completion_tokens/total_tokens）
  4. 删除旧 `type TechStack = 'react-fastapi' | ...` 枚举
  5. 保留 StageStatus 类型定义（pending/running/passed/failed）
  6. 闸门状态展示：通过 current_stage + human_intervention + interrupt 状态推导，不新增 6 个布尔字段
  7. 验收标准更新为"TS HarnessState 与 F002/F003 修订后字段对齐"
  8. 依赖段新增 state-design.md 跨文档同步待办

#### 缺陷 #3 [概念] 实时机制矛盾 + "实时日志"名不副实 + StatusBadge 三色 vs 4 状态
- **位置**: §状态管理（原 line 88）、§页面组件拆分（原 line 51）、§设计规范（原 line 121）、组件描述（原 line 31）
- **修法**:
  1. (a) 状态管理段：轮询描述补充"（F007 将替换为 SSE 实时推送）"，消除与 F002 SSE 端点的矛盾
  2. (b) LogPanel 名称从"实时日志面板"改为"日志面板"（模块列表 + 页面组件拆分 + 验收标准三处同步）
  3. (c) StatusBadge 改为四色对应四状态：pending=石墨灰 #4B5563 / running=琥珀 #F59E0B / passed=翡翠绿 #10B981 / failed=警示红 #EF4444
  4. 设计规范段"三色"→"四色对应四状态（含色值）"
  5. 组件描述段 StatusBadge 同步更新"（石墨灰/琥珀/翡翠绿/警示红 + Lucide 图标）"

### 4. 约束遵守
- ✅ 仅修改 F006 设计文档
- ✅ 不修改 F002/F003/F011/state-design.md/boundaries.md/AGENTS.md
- ✅ 不调用 skill
- ✅ 不修改 sub_id
- ✅ 修订后 174 行 ≤ 300 行
- ✅ 修订记录追加 Round 1 条目
- ✅ 代码示例为 TypeScript 类型定义和组件接口描述，非完整实现

### 5. Journal 编号说明
Controller Spec 指定 journal 路径 `33-f006-revision-r1.md`，但 harness-journal/README.md 已将编号 33 预录为 `33-f003-approved-and-f006-delegation.md`（已物理存在）。L3 按 Controller Spec 指定路径写入 `33-f006-revision-r1.md`，向 L1 报告此编号冲突，请 L1 调整 README 索引或 delegation 文件编号。

## 产出物
- docs/design/feature-f006-frontend-ui.md（修订后，174 行，Status: Draft）

## 验证结果

### 验收标准逐项自检

| # | 验收标准 | 结果 | 证据 |
|---|---|---|---|
| 1 | #1 DAG 视图组件定义（@xyflow/react Type 1 只读 + 回环边 + 闸门决策点） | ✅ 通过 | line 28 模块列表 + line 49 页面拆分 + line 52 回环边描述 |
| 2 | #1 组件列表新增 DAGView.tsx，StageTimeline 引用已替换 | ✅ 通过 | line 28 DAGView.tsx；grep 确认 StageTimeline 仅存于修订记录段 |
| 3 | #1 验收标准更新为"DAG 视图展示 8 阶段 + 回环边 + 闸门决策点" | ✅ 通过 | line 151 |
| 4 | #2 TS HarnessState 对齐 F002/F003 | ✅ 通过 | lines 98-117 HarnessState + lines 119-126 TechStackSpec + lines 128-132 TokenUsage |
| 5 | #2 旧 TechStack 枚举已删除，新增 TechStackSpec 接口 | ✅ 通过 | grep 确认 TechStack 枚举仅在修订记录段；TechStackSpec 接口 lines 119-126 |
| 6 | #2 跨文档同步待办已添加（state-design.md） | ✅ 通过 | line 169 blockquote |
| 7 | #3a 状态管理段明确"当前轮询 / F007 替换为 SSE" | ✅ 通过 | line 90 |
| 8 | #3b LogPanel 名称去掉"实时"，验收标准同步 | ✅ 通过 | line 31 模块列表 + line 53 页面拆分 + line 151 验收标准 |
| 9 | #3c StatusBadge 四色对应四状态，设计规范段同步更新 | ✅ 通过 | line 32 组件描述 + line 140 设计规范段 |
| 10 | 修订后单文件 ≤ 300 行 | ✅ 通过 | 174 行 |
| 11 | 添加修订记录段 | ✅ 通过 | line 174 |
| 12 | 不修改 F002/F003/F011/state-design.md/boundaries.md/AGENTS.md | ✅ 通过 | 仅修改 F006 |

### 跨文档一致性
- F002 HarnessState（TechStackSpec + max_iterations/current_iteration）→ F006 TS HarnessState 对齐 ✅
- F003 HarnessState（token_usage_total: TokenUsage）→ F006 TS HarnessState 对齐 ✅
- F011 §5 6 闸门 actor 分配 → F006 DAGView 闸门决策点展示 ✅
- F002 §Graph 拓扑（反馈循环 + DRR 长循环）→ F006 DAGView 回环边 ✅
- F002/F003 state-design.md 同步待办模式 → F006 遵循相同 blockquote 格式 ✅

## 备注
- L3 仅做设计文档修订，不做编码、不做校验、不做测试
- 产出将提交独立 L3 设计校验 Agent 审阅
- Journal 编号冲突已向 L1 报告
