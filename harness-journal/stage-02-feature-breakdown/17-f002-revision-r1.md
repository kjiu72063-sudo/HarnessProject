# F002 设计文档修订 Round 1

## 步骤名称
F002 LangGraph 编排引擎设计文档 — 修复 6 项致命缺陷 + 新增 F011 引用段

## 执行时间
2026-08-18

## 前置条件
- F011 已 Approved（16-f011-approved-and-f002-start.md）
- F002 修订 ControllerSpec 已就绪（docs/handbook/launch-prompts/f002-revision-launch.md）
- L3 设计编写 Agent 完整启动提示词已由 L1 产出

## 执行内容

### 1. 冷启动
按标准引导模板执行冷启动 5 步，读取 AGENTS.md / progress.txt / feature_list.json / current-sprint.md / harness-journal README + 最近 3 条 journal（14-revision-r2 / 15-r2-review / 16-f011-approved-and-f002-start）。

### 2. 读取待修订文档和参考文档
- 待修订文档：docs/design/feature-f002-langgraph.md（103 行，Status: Draft）
- F011（已 Approved）：docs/design/feature-f011-agent-runtime.md（271 行）— 特别关注 §4 Skill≠Agent、§5 闸门 actor 分配表+多节点 interrupt_before 拓扑、§6 循环预算机制
- state-design.md：HarnessState 定义（校验 State 字段对齐）
- harness-flow.md：8 阶段流程（校验阶段编号和闸门对齐）
- AGENTS.md 规则 #5：Node 是委派桩/状态转换器

### 3. 逐项修复 6 项致命缺陷

#### 缺陷 #1 — 纯函数自相矛盾
**问题**：F002 定义 Node 为纯函数（line 72-78 代码示例 `def node_name(state) -> state`），但实际 Node 需要调 LLM 和 Agent Runtime，纯函数定义与实际需求矛盾。验收标准 line 94 "所有 Node 为纯函数"。

**修复**：
- "Node 接口规范"段改为"Node 委派桩规范"，列出 5 步委派流程
- 代码示例改为 `async def node_name(state: HarnessState) -> dict`，内含 `agent_runtime.delegate()` 调用
- 验收标准改为"所有 Node 为委派桩，不含业务逻辑（mypy strict 通过）"

#### 缺陷 #2 — HITL 没落地
**问题**：6 个闸门用布尔值路由（line 82-84 `return "feature_breakdown" if state["prototype_confirmed"]`），没有 LangGraph 的 interrupt 机制，人类无法在闸门处暂停流程。

**修复**：
- "Conditional Edge 函数"段改为"HITL 闸门机制"段
- 人类闸门（原型确认/设计审批/验收通过）用 `interrupt_before` + `Command(resume=...)`
- 自动闸门（测试结果/解决成功）用 conditional edge 路由函数
- 审查通过闸门：默认 Agent 审查，可疑时 `human_intervention = True` 转逃生口（与 F011 §5 对齐）
- 多节点 interrupt_before 拓扑与 F011 §5 对齐
- 验收标准改为"6 个闸门机制全部实现：3 个人类闸门用 interrupt_before + Command(resume)，2 个自动闸门用 conditional edge，1 个审查闸门默认 Agent 可疑升级"
- API 新增 `POST /api/harness/{session_id}/resume` 端点

#### 缺陷 #3 — 循环无终止保护
**问题**：反馈循环和 DRR 长循环没有终止保护，HarnessState 定义中无 max_iterations / current_iteration。

**修复**：
- 数据模型变更段新增循环预算字段（与 F011 §6 和 state-design.md 对齐）：`max_iterations: int`（默认 5）、`current_iteration: int`（初始 0）
- 新增"循环预算"段，包含 `route_feedback_loop` 函数示例（超限转 human_intervention）
- 标注"循环预算运行规则详见 F011 §6，包括成功重置（per-loop 不跨循环累积）"
- 验收标准新增"反馈循环和 DRR 长循环有 max_iterations 终止保护，超限转 human_intervention"

#### 缺陷 #4 — 熵管理矛盾
**问题**：line 31 说熵管理是"阶段8"（独立阶段），line 55 说"穿插"（横切），两种描述矛盾。

**修复**：
- 涉及模块中 entropy.py 标注从"阶段8: 熵管理"改为"横切: 熵管理（事件驱动，非线性阶段）"
- 在涉及模块后添加说明："entropy 不是线性阶段节点，而是横切关注点——在 verify 通过/文档反馈/功能完成后触发的事件驱动任务。不计入阶段编号。"
- Graph 拓扑中 entropy 描述更新为"横切关注点——verify通过/doc反馈/功能完成后触发（事件驱动，非线性阶段）"

#### 缺陷 #5 — 阶段编号不自洽
**问题**：称"8 阶段"但列了阶段 0-8 共 9 个节点，编号不自洽。

**修复**：
- 目标段"Harness 8 阶段"改为"Harness 8 阶段（阶段 0-7）"
- entropy 标注从"阶段8"改为"横切"（与缺陷 #4 一致）
- Node 列表为 8 个线性阶段节点（initializer 到 observability），entropy 单独列为横切

#### 缺陷 #6 — tech_stack 契约缺校验
**问题**：HarnessState 的 tech_stack 字段无验证定义，API Request 中 tech_stack 是裸 str。

**修复**：
- 数据模型变更段新增 TechStackSpec 定义（Pydantic BaseModel，5 字段：frontend/backend/database/llm/package_manager）
- HarnessState 的 tech_stack 类型从 `dict` 改为 `TechStackSpec`（标注 [CHANGE]）
- API Request 的 tech_stack 从 `str` 改为 `TechStackSpec`
- initializer Node 入口校验 tech_stack 一致性（与 AGENTS.md 技术栈基线比对），含代码示例
- 验收标准新增"tech_stack 字段有 Pydantic 校验，initializer Node 入口校验技术栈一致性"

### 4. 新增 F011 引用段
在依赖段添加 F011 Agent Runtime 依赖说明，描述 Node 作为委派桩通过 Controller Spec 调用 Agent Runtime 的完整链路，引用 F011 §2 和 §4。

## 产出物
- `docs/design/feature-f002-langgraph.md`（修订后 199 行，Status: Draft）
- `harness-journal/stage-02-feature-breakdown/17-f002-revision-r1.md`（本文件）

## 验证结果

| # | 验收标准 | 结果 | 说明 |
|---|---|---|---|
| 1 | Node 从纯函数改为委派桩/状态转换器 | ✅ | "Node 委派桩规范"段含 5 步流程 + async 代码示例；验收标准改为委派桩 |
| 2 | 6 闸门从布尔路由改为 interrupt 机制 | ✅ | "HITL 闸门机制"段：3 人类闸门 interrupt_before + 2 自动闸门 conditional edge + 1 审查闸门可疑升级；API 新增 resume 端点 |
| 3 | 循环预算 max_iterations + current_iteration 加入 | ✅ | 数据模型段新增字段 + "循环预算"段含路由函数 + 验收标准新增终止保护 |
| 4 | 熵管理统一为横切关注点 | ✅ | entropy.py 标注改"横切" + 说明段 + Graph 拓扑描述更新 |
| 5 | 阶段编号统一为 0-7（8 阶段） | ✅ | 目标段"8 阶段（阶段 0-7）" + entropy 不计入编号 |
| 6 | tech_stack 加 Pydantic 校验 | ✅ | TechStackSpec 定义 + HarnessState 类型变更 + API 类型变更 + initializer 校验 + 验收标准 |
| 7 | Conditional Edge 函数示例更新为 interrupt 机制 | ✅ | 原"Conditional Edge 函数"段改为"HITL 闸门机制"段 |
| 8 | 新增 F011 引用段 | ✅ | 依赖段新增 F011 Agent Runtime 引用，链接 §2 和 §4 |
| 9 | 修订后单文件 ≤ 300 行 | ✅ | 199 行 |
| 10 | 添加修订记录段 | ✅ | 末尾 Round 1 修订记录 |

## 备注
- journal 编号使用 17（16 已被 f011-approved-and-f002-start 占用）
- 未修改 AGENTS.md / state-design.md / harness-flow.md / F011 设计文档（跨文档同步由 L1 统一执行）
- 未调用任何 skill
- 未修改 sub_id
- Status 仍为 Draft（待 L3 校验 Agent 重审）
- 未引入 AGENTS.md 技术栈基线以外的框架
