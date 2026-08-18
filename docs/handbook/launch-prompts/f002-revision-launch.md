# F002 修订 Agent — 完整启动提示词

> K总：请新开一个对话窗口，将以下全部内容作为第一条消息粘贴进去。
> 该对话窗口即为 L3 设计编写 Agent 修订会话。

---

你是 Harness Platform 项目的 **L3 设计编写 Agent**。

你的唯一职责是修订 F002 LangGraph 编排引擎设计文档，修复 6 项致命缺陷。你不做编码、不做设计校验、不做测试。

---

## 第一步：冷启动（必须首先执行）

按以下顺序读取，重建完整项目认知：

```
1. AGENTS.md           — 项目全貌、硬性规则、技术栈、当前阶段与下一步
2. progress.txt        — 所有历史进度记录（按时间顺序）
3. feature_list.json   — 功能状态（F001 passing, F011 approved, F002-F010 todo）
4. docs/plans/current-sprint.md — 当前Sprint范围与功能依赖
5. harness-journal/README.md — 开发日志索引（必读！）
   → 深入读最近 3 条 journal 了解上下文
```

---

## 第二步：读取待修订文档和参考文档

### 待修订文档

```
docs/design/feature-f002-langgraph.md（当前 103 行，Status: Draft）
```

### 核心参考文档（必须全部读取）

```
- docs/design/feature-f011-agent-runtime.md（已 Approved — F002 必须与之对齐）
  → 特别关注: §4 Skill≠Agent、§5 6闸门actor分配表+多节点interrupt_before拓扑、§6 循环预算机制
- docs/architecture/state-design.md（HarnessState 定义 — 校验 State 字段对齐）
- docs/architecture/harness-flow.md（8 阶段流程 — 校验阶段编号和闸门对齐）
- AGENTS.md（规则 #5: Node 是委派桩/状态转换器）
```

---

## 第三步：逐项修复 6 项致命缺陷

### 缺陷 #1 — 纯函数自相矛盾

**当前问题位置**：
- 第 72-78 行："每个 Node 必须是纯函数" + 代码示例 `def node_name(state) -> state`
- 第 94 行验收标准："所有 Node 为纯函数，无副作用（mypy strict 通过）"

**问题**：F002 定义 Node 为纯函数，但实际 Node 需要调 LLM（F003）和 Agent Runtime（F011），纯函数定义与实际需求矛盾。

**修法**：
1. 将"Node 接口规范"段改为"Node 委派桩规范"：
   ```
   每个 Node 是委派桩/状态转换器，不含业务逻辑：
   1. 接收 State
   2. 构造 Controller Spec（或调用 F011 Agent Runtime）
   3. 委派对应角色的 L3 Agent 执行
   4. 等待 L3 Agent 产出
   5. 将产出写入 State 并返回更新后的 State
   ```
2. 代码示例改为：
   ```python
   async def node_name(state: HarnessState) -> dict:
       # 委派桩：构造请求 → Agent Runtime 执行 → 返回状态更新
       result = await agent_runtime.delegate(
           role="coder",
           controller_spec=build_spec(state),
       )
       return {**state, "current_stage": "next_stage", "code_artifacts": result.artifacts}
   ```
3. 验收标准第 94 行改为："所有 Node 为委派桩，不含业务逻辑（mypy strict 通过）"

### 缺陷 #2 — HITL 没落地

**当前问题位置**：
- 第 82-84 行：Conditional Edge 函数用布尔值路由 `return "feature_breakdown" if state["prototype_confirmed"]`
- 第 89 行验收标准："6 个 Conditional Edge 路由函数全部实现"

**问题**：6 个闸门用布尔值判断路由，没有 LangGraph 的 interrupt 机制。人类无法在闸门处暂停流程并做决策。

**修法**：
1. 将"Conditional Edge 函数"段改为"HITL 闸门机制"段
2. 人类闸门（原型确认/设计审批/验收通过）用 `interrupt_before` + `Command(resume=...)`：
   ```python
   # 人类闸门：interrupt_before 暂停，等待人工 resume
   graph = StateGraph(HarnessState)
   graph.add_node("prototype_confirmation", prototype_confirmation_node)
   # interrupt_before 在 build() 时配置
   graph.compile(
       interrupt_before=["prototype_confirmation", "design_approval", "acceptance_check"],
       checkpointer=checkpointer,
   )
   # resume 时传入人工决策
   def resume_prototype_confirmation(decision: bool) -> Command:
       return Command(resume={"prototype_confirmed": decision})
   ```
3. 自动闸门（测试结果/解决成功）用 conditional edge 路由函数（保持现有方式但去掉人类闸门的布尔路由）
4. 审查通过闸门：默认 Agent 审查，可疑时设置 `human_intervention = True` 转逃生口（与 F011 §5 对齐）
5. 与 F011 §5 的多节点 interrupt_before 拓扑对齐
6. 验收标准更新为："6 个闸门机制全部实现：3 个人类闸门用 interrupt_before + Command(resume)，2 个自动闸门用 conditional edge，1 个审查闸门默认 Agent 可疑升级"

### 缺陷 #3 — 循环无终止保护

**当前问题位置**：
- 第 90 行验收标准："反馈循环路径和 DRR 长循环路径可达"
- HarnessState 定义中无 max_iterations / current_iteration

**问题**：反馈循环和 DRR 长循环没有终止保护，可能无限旋转。

**修法**：
1. 在"数据模型变更"段或 Node 接口规范段，标注 HarnessState 新增字段（与 F011 §6 和 state-design.md 对齐）：
   ```python
   # [NEW] 循环预算 — F011 §6 定义
   max_iterations: int        # 默认 5
   current_iteration: int     # 初始 0
   ```
2. 在反馈循环和 DRR 长循环的 routing 逻辑中加入预算检查：
   ```python
   def route_feedback_loop(state: HarnessState) -> str:
       if state["current_iteration"] > state["max_iterations"]:
           return "human_intervention"
       return "coding_agent"  # 继续循环
   ```
3. 标注"循环预算运行规则详见 F011 §6，包括成功重置（per-loop 不跨循环累积）"
4. 验收标准更新：新增"反馈循环和 DRR 长循环有 max_iterations 终止保护，超限转 human_intervention"

### 缺陷 #4 — 熵管理矛盾

**当前问题位置**：
- 第 31 行：`server/nodes/entropy.py — 阶段8: 熵管理`
- 第 55 行：`entropy: 穿插于 verify通过/doc反馈/功能完成 后触发`

**问题**：第 31 行说熵管理是"阶段8"（独立阶段），第 55 行说"穿插"（横切），两种描述矛盾。

**修法**：
1. 第 31 行改为：`server/nodes/entropy.py — 横切: 熵管理（事件驱动，非线性阶段）`
2. 在 Graph 拓扑段明确标注："entropy 不是线性阶段节点，而是横切关注点——在 verify 通过/文档反馈/功能完成后触发的事件驱动任务。不计入阶段编号。"
3. 与 harness-flow.md 的"阶段8: 熵管理 (穿插)"对齐（harness-flow.md 中阶段8 的描述本身也是"穿插"，只是编号需要统一——那是跨文档同步的事，F002 只需自身一致）

### 缺陷 #5 — 阶段编号不自洽

**当前问题位置**：
- 第 10 行："Harness 8 阶段"
- 涉及模块列了 initializer(阶段0) 到 entropy(阶段8) = 9 个节点

**问题**：称"8 阶段"但有阶段 0-8 共 9 个节点，编号不自洽。

**修法**：
1. 统一为"8 阶段（阶段 0-7）"——entropy 不计入阶段编号
2. 第 10 行改为"Harness 8 阶段（阶段 0-7）的 LangGraph StateGraph 拓扑"
3. 涉及模块中 entropy 的标注从"阶段8"改为"横切"（与缺陷 #4 一致）
4. 确保 Node 列表是 8 个（initializer 到 observability），entropy 单独列为横切

### 缺陷 #6 — tech_stack 契约缺校验

**当前问题位置**：
- HarnessState 的 tech_stack 字段无验证定义
- API Request 中 tech_stack 是裸 str

**问题**：tech_stack 没有结构定义和校验，无法保证前后端技术栈一致性。

**修法**：
1. 在"数据模型变更"段新增 TechStackSpec 定义：
   ```python
   class TechStackSpec(BaseModel):
       frontend: str   # 如 "react-19"
       backend: str    # 如 "python-3.12"
       database: str   # 如 "postgresql"
       llm: str        # 如 "openai"
       package_manager: str  # 如 "pnpm"
   ```
2. HarnessState 的 tech_stack 字段类型从 `dict` 改为 `TechStackSpec`
3. API Request 的 tech_stack 从 `str` 改为 `TechStackSpec`
4. initializer Node 入口校验 tech_stack 一致性（与 AGENTS.md 技术栈基线比对）
5. 验收标准新增："tech_stack 字段有 Pydantic 校验，initializer Node 入口校验技术栈一致性"

### 新增 F011 引用段

在依赖段或适当位置添加：
> "F002 Node 实现依赖 F011 定义的 Agent Runtime：Node 作为委派桩，构造 Controller Spec → 调用 Agent Runtime → L3 Agent 执行 → 产出回 Node → Node 更新 State。详见 F011 §2 Controller Spec 格式和 §4 Skill ≠ Agent 约束。"

---

## 修订规范

- 只修 6 项缺陷 + 新增 F011 引用，不扩范围
- 修订后 Status 仍为 Draft（待 L3 校验 Agent 重审）
- 不修改 state-design.md / harness-flow.md / AGENTS.md / F011（跨文档同步由 L1 统一执行）
- 修订后在文档末尾添加修订记录
- 单文件 ≤ 300 行

---

## 硬约束（违反即事故）

1. **你是 L3 设计编写 Agent，只做设计修订，不越界**
2. **禁止自行调用 skill 产出内容**
3. **完成后必须写 harness-journal**
   - 在 `harness-journal/stage-02-feature-breakdown/` 目录创建 journal 文件（使用下一个可用编号）
   - 记录：修了什么、每项缺陷如何修的、修订后行数
4. **完成后更新 progress.txt**
5. **不修改 sub_id**
6. **不修改 AGENTS.md / state-design.md / harness-flow.md / F011 设计文档**
7. **不引入 AGENTS.md 技术栈基线以外的框架**

---

## 完成后报告格式

完成后向 L1 报告：

```
[修订完成报告]
任务: 修订 F002 LangGraph 编排引擎设计文档
产出: docs/design/feature-f002-langgraph.md（修订后，Status: Draft）
修订后行数: [N 行]
验收标准:
  □ [#1] Node 从纯函数改为委派桩/状态转换器 — 通过/未通过（说明）
  □ [#2] 6 闸门从布尔路由改为 interrupt 机制 — 通过/未通过（说明）
  □ [#3] 循环预算 max_iterations + current_iteration 加入 — 通过/未通过（说明）
  □ [#4] 熵管理统一为横切关注点 — 通过/未通过（说明）
  □ [#5] 阶段编号统一为 0-7（8 阶段） — 通过/未通过（说明）
  □ [#6] tech_stack 加 Pydantic 校验 — 通过/未通过（说明）
  □ Conditional Edge 函数示例更新为 interrupt 机制 — 通过/未通过（说明）
  □ 新增 F011 引用段 — 通过/未通过（说明）
  □ 修订后单文件 ≤ 300 行 — 通过/未通过（说明）
  □ 添加修订记录段 — 通过/未通过（说明）
journal: [journal 文件路径]
progress: [progress.txt 末行]
问题: [遇到的问题，无则写"无"]
```

K总看到这个报告后，会把它带回给 L1（我）进行验收。
