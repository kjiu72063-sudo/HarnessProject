# F002 修订校验

## 步骤名称
F002 LangGraph 编排引擎设计文档 — Round 1 修订校验（Part A 6 项缺陷修复验证 + Part B 7 维度全量检查）

## 执行时间
2026-08-18

## 前置条件
- F002 修订 Round 1 已完成（17-f002-revision-r1.md 记录）
- L1 已流程验收 F002 修订通过并委派 L3 校验 Agent（progress.txt line 87）
- 待审文档：docs/design/feature-f002-langgraph.md（199 行，Status: Draft）

## 执行内容

### 1. 冷启动
按标准引导模板执行冷启动 5 步：
1. AGENTS.md — 项目全貌、硬性规则 13 条、L1 职责边界
2. progress.txt — 87 条历史进度，特别关注 F002-revision-r1（line 86）和 F002-review-delegation（line 87）
3. feature_list.json — F001 passing, F011 approved, F002-F010 todo
4. docs/plans/current-sprint.md — Sprint 1 范围
5. harness-journal/README.md — 开发日志索引 + 最近 3 条 journal（14-revision-r2 / 15-r2-review / 16-f011-approved-and-f002-start）

### 2. 读取待审文档和参考文档
- 待审：docs/design/feature-f002-langgraph.md（199 行，Status: Draft）
- 修订依据：02-agent-society-and-revision-plan.md §3.2（6 项致命缺陷原始描述和修法）
- 核心参考：docs/design/feature-f011-agent-runtime.md（已 Approved，271 行）— 特别关注 §4 Skill≠Agent、§5 闸门 actor 分配+多节点 interrupt_before、§6 循环预算（含成功重置规则 6）
- 跨文档参考：state-design.md / harness-flow.md / boundaries.md / orchestrator-prompt.md / AGENTS.md

### 3. Part A: 缺陷修复验证

#### 缺陷 #1 — 纯函数自相矛盾 → 已修复
- Node 接口规范从"纯函数"改为"委派桩/状态转换器"（line 97-98）✅
- 代码示例含 `agent_runtime.delegate()` 调用（line 109）✅
- 验收标准从"纯函数无副作用"改为"委派桩不含业务逻辑"（line 184）✅
- 全文"纯函数"仅出现在修订记录段（line 199，描述修复内容），无定义残留 ✅

#### 缺陷 #2 — HITL 没落地 → 已修复
- 6 闸门从布尔值路由改为 interrupt 机制（lines 124-159）✅
- 3 个人类闸门有 interrupt_before + Command(resume=...) 设计（lines 128-140）✅
- 2 个自动闸门用 conditional edge 路由函数（lines 142-150）✅
- 1 个审查闸门有可疑升级机制（human_intervention = True 转逃生口，lines 152-159）✅
- 与 F011 §5 多节点 interrupt_before 拓扑对齐（line 126, 134）✅
- 新增 POST /resume 端点（lines 92-94）✅

#### 缺陷 #3 — 循环无终止保护 → 已修复
- HarnessState 新增 max_iterations + current_iteration，标注 [NEW] 和 F011 §6 引用（lines 54-56）✅
- routing 函数有超限检查逻辑（route_feedback_loop, lines 166-170）✅
- 标注运行规则详见 F011 §6，含成功重置（line 172）✅
- 与 F011 §6 字段定义一致（默认值 5、初始值 0、重置规则 per-loop）✅

#### 缺陷 #4 — 熵管理矛盾 → 已修复
- entropy.py 标注从"阶段8"改为"横切"（line 31）✅
- Graph 拓扑中 entropy 标注为横切关注点（line 76）✅
- 添加说明段："entropy 不是线性阶段节点，而是横切关注点"（line 35）✅
- 全文无"阶段8"残留（grep 确认零命中）✅

#### 缺陷 #5 — 阶段编号不自洽 → 已修复
- "8 阶段"表述改为"8 阶段（阶段 0-7）"（line 10）✅
- Node 列表为 7 个线性阶段文件覆盖 8 阶段（coding_agent 覆盖阶段 3+4）+ entropy 横切不计入编号 ✅
- entropy 单独列为横切不计入编号（line 31, 35）✅

#### 缺陷 #6 — tech_stack 契约缺校验 → 部分修复
- TechStackSpec(BaseModel) 定义新增，5 字段（lines 43-48）✅
- HarnessState tech_stack 从 dict 改为 TechStackSpec（line 52）✅
- API Request tech_stack 从 str 改为 TechStackSpec（line 83）✅
- initializer Node 有入口校验逻辑（lines 116-121）✅
- TechStackSpec 字段与 AGENTS.md 技术栈基线对齐：⚠️ 部分 — AGENTS.md 声明"包管理: 前端 pnpm，后端 uv"两个包管理器，但 TechStackSpec 仅有一个 `package_manager` 字段（示例 "pnpm"），uv（后端包管理器）未被显式表示

### 4. Part B: 全维度检查

#### 维度 1: 内部一致性 — 1 个缺陷
- Node 委派桩 5 步流程无逻辑漏洞 ✅
- HITL 闸门 4 类机制互斥且完整（6 闸门全覆盖）✅
- 循环预算 routing 函数与 F011 §6 基本一致，但 DRR 长循环检查缺失（见新缺陷 #1）⚠️
- TechStackSpec 字段与 API Request 字段一致 ✅
- Graph 拓扑图与文字描述的 Node/Edge 基本对应 ✅

#### 维度 2: 跨文档一致性 — 3 个缺陷
- HarnessState 字段与 state-design.md 不一致：state-design.md 仍为旧定义（tech_stack: dict, 无 max_iterations/current_iteration），F002 声称对齐但未标注同步待办（见新缺陷 #2）⚠️
- 6 闸门与 F011 §5 actor 分配表对齐 ✅
- 6 闸门与 harness-flow.md 菱形门控对齐 ✅（harness-flow.md 阶段 8 熵管理仍存在，属已知跨文档同步范围）
- Node 委派桩定义与 AGENTS.md 规则 #5 一致 ✅
- Node 委派桩定义与 F011 §4 Skill≠Agent 一致 ✅
- 循环预算与 F011 §6 基本一致，但 route_feedback_loop 绕过标志位机制（见新缺陷 #6）⚠️
- boundaries.md 仍为"纯函数"，F002 未标注同步待办（见新缺陷 #3）⚠️

#### 维度 3: HITL 落地 — 1 个缺陷
- interrupt_before 配置完整（3 个人类闸门节点名：prototype_confirmation/design_approval/acceptance_check）✅
- Command(resume=...) 有参数定义 ✅
- POST /resume 端点有 Request/Response 定义 ✅
- 可疑升级触发条件引用 F011 §5（line 152）✅
- POST /resume 请求体缺命名 Pydantic BaseModel + 参数命名不一致（见新缺陷 #4）⚠️

#### 维度 4: 循环安全 — 1 个缺陷
- 反馈循环有终止保护（route_feedback_loop, lines 166-170）✅
- DRR 长循环终止保护：设计声明共用预算（line 163）但路由函数未展示（见新缺陷 #1）⚠️
- 超限转 human_intervention 与 F011 §6 基本一致，但机制有差异（见新缺陷 #6）⚠️
- 引用 F011 §6 成功重置规则（line 172）✅

#### 维度 5: Node 定义 — 通过
- Node 定义为委派桩/状态转换器 ✅
- Node 代码示例含 agent_runtime.delegate() 调用 ✅
- Node 不含业务逻辑 ✅
- async def 与 F003 的 async 一致（WorkBuddy 指出的矛盾已解决）✅

#### 维度 6: 非目标边界 — 通过
- F002 与 F003 职责边界清晰（F002 做 Graph 拓扑，F003 做 LLM 调用）✅
- F002 与 F009 职责边界清晰（F002 用 in-memory Checkpointer，F009 做持久化）✅
- F002 与 F011 职责边界清晰（F002 做 Node 委派桩，F011 做 Agent Runtime 基础设施）✅

#### 维度 7: 遗漏检查 — 通过
- F011 引用段完整（Controller Spec → Agent Runtime → L3 Agent → 产出回 Node → Node 更新 State），引用 F011 §2/§4/§5/§6 ✅
- 修订记录段完整（Round 1 条目，格式与 F011 一致）✅
- 方案 §3.2 中提到的 6 项缺陷 F002 全部覆盖 ✅

### 5. 新引入缺陷

#### 新缺陷 #1 — DRR 长循环预算检查路由函数未展示
- 级别: 概念
- 维度: 循环安全 / 内部一致性
- 位置: F002 lines 161-172（循环预算段）
- 描述: 设计声明"反馈循环和 DRR 长循环共用循环预算"（line 163）且验收标准要求"反馈循环和 DRR 长循环有 max_iterations 终止保护"（line 179），但仅定义 `route_feedback_loop` 函数，DRR 长循环（observability→coding_agent）的预算检查路由函数未展示
- 修法: 新增 `route_drr_loop` 函数，或将 `route_feedback_loop` 重命名为 `route_loop_budget` 并注明两个循环共用此函数

#### 新缺陷 #2 — F002 缺少 state-design.md 跨文档同步待办标注
- 级别: 跨文档
- 维度: 跨文档一致性
- 位置: F002 line 40（"与 F011 §6 和 state-design.md 对齐"）
- 描述: F002 声称与 state-design.md 对齐，但 state-design.md 仍为旧定义（tech_stack: dict, 无 max_iterations/current_iteration, interrupt_before=["human_interrupt"] 单节点）。F011 有显式同步待办标注（line 172），F002 缺失
- 修法: 在依赖段或数据模型段添加跨文档同步待办标注，列出 state-design.md 需同步的 3 项变更

#### 新缺陷 #3 — F002 缺少 boundaries.md 跨文档同步待办标注
- 级别: 跨文档
- 维度: 跨文档一致性
- 位置: F002 依赖段（缺失标注）
- 描述: boundaries.md line 15 仍为"server/nodes/ — Harness Node 实现（纯函数）"，F002 定义 Node 为"委派桩/状态转换器"但未标注需同步。F011 line 264 已标注此待办，F002 缺失
- 修法: 在依赖段添加跨文档同步待办标注，引用 F011 line 264 已有标注

#### 新缺陷 #4 — POST /resume 端点缺命名 Pydantic BaseModel + 参数命名不一致
- 级别: 概念
- 维度: HITL 落地
- 位置: F002 lines 92-94（API 定义）和 lines 138-140（resume_gate 函数）
- 描述: (1) POST /resume 请求体用裸 dict `{ "gate": str, "decision": bool }` 表示而非命名 Pydantic BaseModel，违反 AGENTS.md 规则 #8（POST/PUT 请求体必须用 Pydantic BaseModel）；start 端点已用 TechStackSpec 命名模型，resume 端点不一致。(2) API 参数名 "decision" 与 Command key "gate_decision" 命名不一致。(3) API 的 "gate" 参数在 resume_gate 函数中未使用，其用途未说明
- 修法: 定义 `ResumeRequest(BaseModel)` 含 `gate: str` 和 `decision: bool` 字段；对齐 Command key 与 API 参数名或明确映射；说明 gate 参数用途（标识恢复哪个闸门）

#### 新缺陷 #5 — TechStackSpec 未覆盖 uv（后端包管理器）
- 级别: 概念
- 维度: 跨文档一致性（与 AGENTS.md 技术栈基线）
- 位置: F002 lines 43-48（TechStackSpec 定义）
- 描述: AGENTS.md 声明"包管理: 前端 pnpm，后端 uv"两个包管理器，但 TechStackSpec 仅有一个 `package_manager` 字段（示例 "pnpm"），uv 未被显式表示。initializer Node 的 `validate_tech_stack()` 无法完整校验与 AGENTS.md 双包管理器基线的一致性
- 修法: 拆分为 `frontend_package_manager: str` 和 `backend_package_manager: str`，或改为 `package_managers: dict[str, str]`

#### 新缺陷 #6 — route_feedback_loop 绕过标志位机制
- 级别: 跨文档
- 维度: 跨文档一致性（与 F011 §6）
- 位置: F002 lines 166-170（route_feedback_loop 函数）
- 描述: F011 §6 规定超限时"设置 human_intervention = True"（rule 3）→"human_intervention = True 触发逃生口"（rule 4），为两步标志位机制。F002 的 route_feedback_loop 直接 `return "human_intervention"` 跳过标志位设置。route_review 函数（line 155-158）检查 `state["human_intervention"]` 标志位，若 route_feedback_loop 未设置标志位，后续 route_review 检查可能不一致
- 修法: route_feedback_loop 应先设置 `state["human_intervention"] = True`，再返回 "human_intervention" 节点名；或在设计中说明路由函数返回值与标志位的关系

## 最终结论

**结论: 需修订后重审**

Part A: 6 项致命缺陷中 5 项已修复，1 项部分修复（#6 TechStackSpec 未覆盖 uv）。
Part B: 7 维度检查发现 6 项新引入缺陷（概念 3 + 跨文档 3），无致命级别。

主要风险：
- 新缺陷 #1（DRR 长循环预算检查缺失）直接影响验收标准 line 179 的满足
- 新缺陷 #4（POST /resume 缺 Pydantic 模型）违反 AGENTS.md 硬性规则 #8
- 新缺陷 #5（uv 未覆盖）导致 TechStackSpec 与 AGENTS.md 基线对齐不完整
- 新缺陷 #2/#3（同步待办缺失）虽非设计缺陷但影响跨文档一致性追踪

修订建议优先级：#1 > #4 > #5 > #2 = #3 > #6

## 产出物
- `harness-journal/stage-02-feature-breakdown/18-f002-review.md`（本文件）

## 验证结果

| 检查项 | 结果 |
|---|---|
| Part A 6 项缺陷修复验证 | 5 已修复 + 1 部分修复 |
| Part B 7 维度全量检查 | 4 维度有缺陷（共 6 项新引入缺陷） |
| L3 未修改被审文档 | ✅ |
| L3 未调用 skill | ✅ |
| 未修改 sub_id | ✅ |

## 备注
- journal 编号使用 18（17 已被 f002-revision-r1 占用）
- F002 Status 仍为 Draft（待修订）
- 未修改任何被审文档或参考文档
- 未调用任何 skill
- 未修改 sub_id
