# F002 设计文档修订 Round 2

## 步骤名称
F002 LangGraph 编排引擎设计文档 — 修复 L3 校验发现的 6 项缺陷

## 执行时间
2026-08-18

## 前置条件
- F002 修订 Round 1 已完成（17-f002-revision-r1.md）
- L3 校验已完成（18-f002-review.md），发现 6 项新引入缺陷
- L1 接受结论并产出 Round 2 ControllerSpec（19-f002-review-result-and-r2-delegation.md）
- 待修订文档：docs/design/feature-f002-langgraph.md（199 行，Status: Draft）

## 执行内容

### 1. 冷启动
按标准引导模板执行冷启动 5 步，读取 AGENTS.md / progress.txt / feature_list.json / current-sprint.md / harness-journal README + 最近 3 条 journal（17-revision-r1 / 18-review / 19-review-result-and-r2-delegation）。

### 2. 读取待修订文档和参考文档
- 待修订文档：docs/design/feature-f002-langgraph.md（199 行，Status: Draft）
- 校验报告：18-f002-review.md（6 项缺陷完整描述）
- F011（已 Approved）：docs/design/feature-f011-agent-runtime.md — 特别关注 §5 多节点 interrupt_before 拓扑 + 可疑升级机制、§6 循环预算运行规则（含规则6 成功重置 + 共享预算声明 + human_intervention 标志位）
- AGENTS.md 规则 #5（Node 委派桩）、规则 #8（POST/PUT 请求体必须用 Pydantic BaseModel）、技术栈基线（前端 pnpm，后端 uv）

### 3. 逐项修复 6 项缺陷

#### 缺陷 #1 — DRR 长循环预算检查缺失 [优先级1]
**问题**：声明"反馈循环和 DRR 长循环共用循环预算"但仅定义 route_feedback_loop，DRR 长循环的预算检查路由函数未展示。

**修复**：将 route_feedback_loop 重命名为 route_loop_budget，函数 docstring 说明两个循环共用此函数（引用 F011 §6 共享预算设计决策）。函数体中检查 `current_iteration >= max_iterations` 时先设置 `state["human_intervention"] = True`，再返回 "human_intervention" 节点名。

#### 缺陷 #2 — state-design.md 同步待办缺失 [优先级4]
**问题**：F002 声称与 state-design.md 对齐但未标注同步待办。

**修复**：在依赖段添加跨文档同步待办标注，列出 state-design.md 需同步的 3 项变更：(1) tech_stack: dict → TechStackSpec (2) 新增 max_iterations + current_iteration (3) interrupt_before 单节点→多节点。

#### 缺陷 #3 — boundaries.md 同步待办缺失 [优先级4]
**问题**：boundaries.md line 15 仍为"纯函数"，F002 未标注需同步。

**修复**：在依赖段添加跨文档同步待办标注，引用 F011 line 264 已有标注。

#### 缺陷 #4 — POST /resume 缺 Pydantic BaseModel + 命名不一致 [优先级2]
**问题**：(1) POST /resume 请求体用裸 dict 违反 AGENTS.md 规则 #8 (2) API 参数 "decision" 与 Command key "gate_decision" 命名不一致 (3) API 的 "gate" 参数在 resume_gate 函数中未使用。

**修复**：
- 定义 ResumeRequest(BaseModel) 含 gate: str 和 decision: bool 字段
- API 端点 Request 从裸 dict 改为 ResumeRequest
- resume_gate 函数参数从 `decision: bool` 改为 `request: ResumeRequest`，注释说明 gate 标识恢复哪个闸门（多节点 interrupt_before 场景），decision 为人类决策
- Command key "gate_decision" 映射自 request.decision，命名关系明确

#### 缺陷 #5 — TechStackSpec 未覆盖 uv [优先级3]
**问题**：AGENTS.md 声明"包管理: 前端 pnpm，后端 uv"，TechStackSpec 仅有一个 package_manager 字段，uv 未被显式表示。

**修复**：将 package_manager 拆分为 frontend_package_manager: str 和 backend_package_manager: str。验收标准更新为"TechStackSpec 覆盖前后端双包管理器"。

#### 缺陷 #6 — route_feedback_loop 绕过标志位 [优先级5]
**问题**：F011 §6 规定超限时先设置 human_intervention = True 再触发逃生口（两步机制），F002 直接 return "human_intervention" 跳过标志位设置，与 route_review 检查标志位不一致。

**修复**：与 #1 合并修复——重命名为 route_loop_budget 后，函数体先设置 `state["human_intervention"] = True` 再返回节点名。确保与 route_review 的机制一致（route_review 先检查 human_intervention 标志位，route_loop_budget 先设置标志位）。

### 4. 修订范围确认
仅触及以下段落：
- TechStackSpec 定义（数据模型变更段）— #5
- API 变更段（POST /resume + ResumeRequest 定义）— #4
- HITL 闸门机制段（resume_gate 函数）— #4
- 循环预算段（route_loop_budget）— #1 + #6
- 依赖段（跨文档同步待办标注）— #2 + #3
- 验收标准（tech_stack 描述更新）— #5
- 修订记录（Round 2 追加）— #8

未触及：目标段/非目标段/涉及模块段/Graph 拓扑段/Node 委派桩规范段/initializer 示例段/自动闸门段/审查通过闸门段。

## 产出物
- `docs/design/feature-f002-langgraph.md`（修订后 224 行，Status: Draft）
- `harness-journal/stage-02-feature-breakdown/20-f002-revision-r2.md`（本文件）

## 验证结果

| # | 验收标准 | 结果 | 说明 |
|---|---|---|---|
| 1 | #1 DRR长循环预算检查 | ✅ | route_loop_budget 含 docstring 说明双循环共用，函数体检查 >= max_iterations，DRR 长循环有终止保护 |
| 2 | #2 state-design.md同步待办 | ✅ | 依赖段有标注，列出 3 项变更（tech_stack/max_iterations+current_iteration/interrupt_before多节点） |
| 3 | #3 boundaries.md同步待办 | ✅ | 依赖段有标注，引用 F011 line 264 已有标注 |
| 4 | #4 ResumeRequest(BaseModel) | ✅ | ResumeRequest(BaseModel) 含 gate + decision 字段定义；API 端点改为 ResumeRequest；resume_gate 接收 ResumeRequest，注释说明 gate 用途；Command key gate_decision 映射自 request.decision |
| 5 | #5 TechStackSpec双包管理器 | ✅ | frontend_package_manager + backend_package_manager 拆分；验收标准更新"覆盖前后端双包管理器"；无单字段 package_manager 残留 |
| 6 | #6 标志位设置一致性 | ✅ | route_loop_budget 先设 state["human_intervention"] = True 再返回 "human_intervention"，与 route_review 检查标志位机制一致 |
| 7 | 修订后 ≤ 300 行 | ✅ | 224 行 |
| 8 | 修订记录追加 Round 2 | ✅ | 末尾 Round 2 条目 |
| 9 | 不修改其他章节 | ✅ | 仅触及循环预算段 + API 段 + TechStackSpec 定义 + HITL闸门resume_gate + 依赖段 + 验收标准 + 修订记录 |
| 10 | 不修改跨文档 | ✅ | 未修改 state-design.md / boundaries.md / AGENTS.md / F011 |

## 备注
- journal 编号使用 20（19 已被 f002-review-result-and-r2-delegation 占用）
- 未调用任何 skill
- 未修改 sub_id
- Status 仍为 Draft（待 L3 校验 Agent 重审）
- 未引入 AGENTS.md 技术栈基线以外的框架
- #1 与 #6 合并修复（route_loop_budget 同时解决 DRR 长循环预算检查缺失和标志位绕过问题）
