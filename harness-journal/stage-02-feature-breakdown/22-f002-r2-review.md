# F002 Round 2 修订校验

## 步骤名称
F002 LangGraph 编排引擎设计文档 — Round 2 修订聚焦校验（Part A 6 项缺陷修复验证 + Part B 修订影响检查 + Part C 修订范围确认）

## 执行时间
2026-08-18

## 前置条件
- F002 修订 Round 2 已完成（20-f002-revision-r2.md 记录）
- L1 已流程验收 Round 2 通过并委派 L3 聚焦校验（21-f002-r2-review-delegation.md）
- 待审文档：docs/design/feature-f002-langgraph.md（224 行，Status: Draft）

## 执行内容

### 1. 冷启动
按标准引导模板执行冷启动 5 步：
1. AGENTS.md — 项目全貌、硬性规则 13 条、L1 职责边界
2. progress.txt — 91 条历史进度，特别关注 F002-revision-r2（line 90）和 F002-r2-review-delegation（line 91）
3. feature_list.json — F001 passing, F011 approved, F002-F010 todo
4. docs/plans/current-sprint.md — Sprint 1 范围
5. harness-journal/README.md — 开发日志索引 + 最近 3 条 journal（19-review-result-and-r2-delegation / 20-revision-r2 / 21-r2-review-delegation）

### 2. 读取待审文档和参考文档
- 待审：docs/design/feature-f002-langgraph.md（224 行，Status: Draft）
- R1 校验报告：18-f002-review.md（6 项缺陷基准）
- R2 修订记录：20-f002-revision-r2.md
- F011（已 Approved）：docs/design/feature-f011-agent-runtime.md — §5 闸门 actor 分配+多节点 interrupt_before、§6 循环预算运行规则（含规则 3 比较运算符、规则 6 成功重置）
- state-design.md / boundaries.md / AGENTS.md — 跨文档一致性校验

### 3. Part A: 6 项缺陷修复验证

#### R1-#1: DRR 长循环预算检查缺失 → 已修复
- route_feedback_loop 已重命名为 route_loop_budget（line 176）✅
- docstring 说明两循环共用："反馈循环和 DRR 长循环共用的预算检查路由函数。两种循环共用同一 current_iteration 计数器（详见 F011 §6 共享预算设计决策）"（lines 177-181）✅
- 函数体先设 human_intervention=True 再返回节点名（lines 183-184）✅
- 两个循环均有终止保护（共用函数覆盖两种循环）✅

#### R1-#2: state-design.md 同步待办缺失 → 已修复
- 依赖段有同步待办标注（lines 211-214）✅
- 列出 3 项变更：(1) tech_stack: dict → TechStackSpec (2) 新增 max_iterations + current_iteration (3) interrupt_before 单节点→多节点 ✅

#### R1-#3: boundaries.md 同步待办缺失 → 已修复
- 依赖段有同步待办标注（lines 216-217）✅
- 引用 F011 line 264 已有标注："（F011 line 264 已有相同标注）" ✅

#### R1-#4: POST /resume 缺 Pydantic BaseModel → 已修复
- ResumeRequest(BaseModel) 已定义，含 gate: str + decision: bool（lines 101-104）✅
- API 端点 Request 从裸 dict 改为 ResumeRequest（line 94）✅
- resume_gate 参数改为 request: ResumeRequest（line 147）✅
- Command key gate_decision 映射自 request.decision（line 149）✅
- gate 参数用途有注释说明："gate 标识恢复哪个闸门（多节点 interrupt_before 场景），decision 为人类决策"（line 148）✅

#### R1-#5: TechStackSpec 未覆盖 uv → 已修复
- package_manager 拆分为 frontend_package_manager: str（line 48）+ backend_package_manager: str（line 49）✅
- 验收标准更新为"TechStackSpec 覆盖前后端双包管理器"（line 196）✅
- 无单字段 package_manager 残留（grep 确认：仅 frontend_package_manager 和 backend_package_manager）✅

#### R1-#6: route_feedback_loop 绕过标志位 → 已修复
- route_loop_budget 先设 state["human_intervention"] = True 再返回 "human_intervention"（lines 183-184）✅
- 与 route_review 检查标志位机制一致（route_review line 166 检查 state["human_intervention"]）✅

### 4. Part B: 修订影响检查

#### B1. 内部一致性
- 全文无单字段 package_manager 残留引用 ✅（grep 确认）
- ResumeRequest 使用一致：定义（lines 101-104）→ API 端点（line 94）→ resume_gate 函数（line 147）✅
- route_loop_budget 引用一致：定义（line 176），无 route_feedback_loop 残留 ✅（grep 确认）
- ⚠️ route_loop_budget 返回值 "next_stage"（line 185）非 Graph 拓扑中的实际节点名（实际节点为 coding_agent），但作为设计文档的抽象表示可接受

#### B2. 修订记录完整
- 末尾有 Round 2 条目（line 224），格式与 Round 1 一致（时间 + 修复内容 + 参考文件）✅

#### B3. 行数 ≤ 300
- 文档共 224 行 ✅

#### B4. 跨文档快速复核
- TechStackSpec 双包管理器与 AGENTS.md 技术栈基线对齐：AGENTS.md "包管理: 前端 pnpm，后端 uv" ↔ TechStackSpec frontend_package_manager（"pnpm"）+ backend_package_manager（"uv"）✅
- route_loop_budget 与 F011 §6 共享预算设计决策对齐：docstring 引用 F011 §6 ✅，但比较运算符不一致（见新缺陷 #1）⚠️
- ResumeRequest 与 AGENTS.md 规则 #8 对齐：POST /resume 使用 Pydantic BaseModel ✅
- interrupt_before 多节点拓扑与 F011 §5 对齐：["prototype_confirmation", "design_approval", "acceptance_check"] 与 F011 §5 三个人类闸门一致 ✅

### 5. Part C: 修订范围确认

#### C1. 修改点清单
Round 2 仅触及以下段落：
- TechStackSpec 定义（数据模型变更段）— #5 ✅
- API 变更段（POST /resume + ResumeRequest 定义）— #4 ✅
- HITL 闸门机制段（resume_gate 函数）— #4 ✅
- 循环预算段（route_loop_budget）— #1 + #6 ✅
- 依赖段（跨文档同步待办标注）— #2 + #3 ✅
- 验收标准（tech_stack 描述更新）— #5 ✅
- 修订记录（Round 2 追加）✅

未触及：目标段/非目标段/涉及模块段/Graph 拓扑段/Node 委派桩规范段/initializer 示例段/自动闸门段/审查通过闸门段 ✅

#### C2. Round 1 修复完整性
- R1 原始 #1 纯函数→委派桩：Node 委派桩规范段 + async 代码 + agent_runtime.delegate() 保持完整（lines 106-131）✅
- R1 原始 #2 布尔路由→interrupt：HITL 闸门机制段保持完整（lines 133-169）✅
- R1 原始 #3 循环无终止→预算：max_iterations + current_iteration 字段保持完整（lines 55-57）✅
- R1 原始 #4 熵管理矛盾→横切：横切标注 + 说明段 + Graph 拓扑保持完整（lines 31, 35, 77）✅
- R1 原始 #5 阶段编号→0-7："8 阶段（阶段 0-7）"保持完整（line 10）✅
- R1 原始 #6 tech_stack→TechStackSpec：TechStackSpec 定义 + HarnessState 变更 + API 变更 + initializer 校验保持完整（lines 43-58, 84, 128-131）✅
- 全文"纯函数"仅出现在 boundaries.md 同步待办引用（line 216）和修订记录（line 223），无定义残留 ✅
- 全文无"阶段8"残留（grep 确认零命中）✅

#### C3. 无意外修改
- 未触及不应修改的章节 ✅
- F011 引用段保持完整（line 209）✅
- 未修改跨文档（state-design.md / boundaries.md / AGENTS.md / F011）✅

### 6. 新引入缺陷

#### 新缺陷 #1 — 循环预算比较运算符与 F011 §6 不一致
- 级别: 跨文档
- 维度: 跨文档一致性（与 F011 §6）
- 位置: F002 line 182（route_loop_budget 函数体）
- 描述: F011 §6 规则 3（line 193）使用 `current_iteration > max_iterations`（严格大于），F002 R2 使用 `current_iteration >= max_iterations`（大于等于）。以 max_iterations=5 为例：F011 允许 5 次迭代（第 6 次触发干预），F002 允许 4 次迭代（第 5 次触发干预），实际循环预算减少 20%。R1 代码使用 `>` 与 F011 一致，R2 修订时改为 `>=` 引入了不一致。route_loop_budget docstring 声称"详见 F011 §6 共享预算设计决策"暗示对齐，但运算符实际不一致
- 修法: 将 `>=` 改回 `>` 与 F011 §6 规则 3 对齐；或在 F002 中明确标注有意偏离并同步更新 F011

## 最终结论

**结论: 需修订后重审**

Part A: 6 项 R1 缺陷全部修复 ✅
Part B: 4 项修订影响检查中 3 项通过，1 项（跨文档快速复核）发现比较运算符不一致
Part C: 3 项修订范围确认全部通过 ✅

新引入缺陷 1 项（跨文档级别）：route_loop_budget 比较运算符 `>=` 与 F011 §6 的 `>` 不一致，导致循环预算语义差异。修复仅需改一个运算符，但属于跨文档一致性问题，需修订后重审以确认修复。

## 产出物
- `harness-journal/stage-02-feature-breakdown/22-f002-r2-review.md`（本文件）

## 验证结果

| 检查项 | 结果 |
|---|---|
| Part A 6 项 R1 缺陷修复验证 | 6/6 已修复 |
| Part B 修订影响检查 | 3/4 通过，1 项发现新缺陷 |
| Part C 修订范围确认 | 3/3 通过 |
| 新引入缺陷 | 1 项（跨文档：比较运算符不一致） |
| L3 未修改被审文档 | ✅ |
| L3 未调用 skill | ✅ |
| 未修改 sub_id | ✅ |

## 备注
- journal 编号使用 22（21 已被 f002-r2-review-delegation 占用，提示词中写 21 为编号偏差）
- F002 Status 仍为 Draft（待修订）
- 未修改任何被审文档或参考文档
- 未调用任何 skill
- 未修改 sub_id
- 缺陷 #1 非致命，修复仅需将 `>=` 改为 `>`，但跨文档一致性要求修订后重审
