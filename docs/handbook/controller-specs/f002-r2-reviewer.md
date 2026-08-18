# Controller Spec: F002 设计校验 Agent — Round 2 修订校验

## 角色
L3 设计校验 Agent

## 任务
聚焦校验 F002 LangGraph 编排引擎设计文档 Round 2 修订版（非全量重审）。

## 被审文档
`docs/design/feature-f002-langgraph.md`（224 行，Status: Draft）

## 审阅性质
Round 2 修订校验（聚焦校验）。Part A 验证 R1 校验发现的 6 项缺陷修复，Part B 检查修订影响，Part C 确认修订范围。

## 审阅分三部分

### Part A: 6 项缺陷修复验证

逐条验证以下 6 项缺陷是否真正修复：

| # | 缺陷 | 验证点 |
|---|---|---|
| R1-#1 | DRR 长循环预算检查缺失 | route_feedback_loop 已重命名为 route_loop_budget；docstring 说明两循环共用；函数体先设 human_intervention=True 再返回节点名；两个循环均有终止保护 |
| R1-#2 | state-design.md 同步待办缺失 | 依赖段有同步待办标注，列出 3 项变更（tech_stack dict→TechStackSpec / max_iterations+current_iteration / interrupt_before 单→多节点） |
| R1-#3 | boundaries.md 同步待办缺失 | 依赖段有同步待办标注，引用 F011 line 264 已有标注 |
| R1-#4 | POST /resume 缺 Pydantic BaseModel | ResumeRequest(BaseModel) 已定义含 gate: str + decision: bool；API 端点 Request 从裸 dict 改为 ResumeRequest；resume_gate 参数改为 request: ResumeRequest；Command key gate_decision 映射自 request.decision；gate 参数用途有注释说明 |
| R1-#5 | TechStackSpec 未覆盖 uv | package_manager 拆分为 frontend_package_manager + backend_package_manager；验收标准更新为"覆盖前后端双包管理器"；无单字段 package_manager 残留 |
| R1-#6 | route_feedback_loop 绕过标志位 | route_loop_budget 先设 state["human_intervention"] = True 再返回 "human_intervention"；与 route_review 检查标志位机制一致 |

每条给出：已修复 / 未修复 / 部分修复，附验证证据（行号 + 内容摘要）。

### Part B: 修订影响检查

1. 内部一致性：全文无单字段 package_manager 残留引用；ResumeRequest 使用一致；route_loop_budget 引用一致
2. 修订记录完整：末尾有 Round 2 条目，格式与 Round 1 一致
3. 行数 ≤ 300：确认当前行数
4. 跨文档快速复核：
   - TechStackSpec 双包管理器与 AGENTS.md 技术栈基线对齐（前端 pnpm + 后端 uv）
   - route_loop_budget 与 F011 §6 共享预算设计决策对齐
   - ResumeRequest 与 AGENTS.md 规则 #8（Pydantic BaseModel）对齐
   - interrupt_before 多节点拓扑与 F011 §5 对齐

### Part C: 修订范围确认

1. 修改点清单：确认 Round 2 仅触及循环预算段 + API 段 + TechStackSpec 定义 + resume_gate 函数 + 依赖段 + 验收标准 + 修订记录
2. Round 1 修复完整性：确认 R1 的 6 项原始致命缺陷修复保持完整（纯函数→委派桩 / interrupt 机制 / 循环预算字段 / 熵管理横切 / 阶段 0-7 / TechStackSpec 定义）
3. 无意外修改：未触及不应修改的章节

## 输出要求

```
=== Part A: 缺陷修复验证 ===
（逐条：#编号 + 状态 + 证据）

=== Part B: 修订影响检查 ===
（4 项逐条结果）

=== Part C: 修订范围确认 ===
（3 项逐条结果）

=== 新引入缺陷 ===
（如有，按级别+维度+位置+描述+修法）

=== 最终结论 ===
通过 / 需修订后重审
```

## 约束
- 只读不写（除 journal + progress）
- 不修改被审文档
- 不调用 skill
- 不修改 sub_id
- 产出写入 harness-journal/stage-02-feature-breakdown/21-f002-r2-review.md
- progress 追加格式：[timestamp] stage-02 | F002-r2-review | done | <摘要>
