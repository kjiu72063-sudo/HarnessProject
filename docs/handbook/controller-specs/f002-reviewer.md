# F002 Controller Spec — 修订校验

> 由 L1 产出，委派 L3 设计校验 Agent 校验 F002 修订版。

## Controller Spec

```
任务: 校验 F002 LangGraph 编排引擎设计文档修订版，验证 6 项缺陷修复 + 全维度检查
角色: design-reviewer
前置条件: F002 修订 Round 1 已完成（17-f002-revision-r1.md），L1 流程验收通过
输入:
  - 待审文档: docs/design/feature-f002-langgraph.md（199 行，Status: Draft）
  - 修订依据: harness-journal/stage-02-feature-breakdown/02-agent-society-and-revision-plan.md §3.2（6 项致命缺陷）
  - 核心参考: docs/design/feature-f011-agent-runtime.md（已 Approved，F002 必须与之对齐）
  - 参考文档:
    - docs/architecture/state-design.md
    - docs/architecture/harness-flow.md
    - docs/architecture/boundaries.md
    - docs/handbook/orchestrator-prompt.md
    - AGENTS.md（规则 #5 委派桩）
  - 校验维度:
    A. 6 项缺陷修复验证（逐条对照 §3.2 的缺陷描述 + 修法，验证是否真正修复）
    B. 全维度检查:
       - 内部一致性：文档自身有无矛盾
       - 跨文档一致性：与 F011 / state-design.md / harness-flow.md / AGENTS.md #5 对齐
       - HITL 落地：6 闸门 interrupt 机制是否完整可实现
       - 循环安全：max_iterations 终止保护 + 成功重置
       - Node 定义：委派桩/状态转换器，不含业务逻辑
       - 非目标边界：与 F003/F009 职责清晰
       - 遗漏检查：方案中提到但 F002 未覆盖的内容
输出: 缺陷清单（在对话中输出，不修改被审文档）
验收标准:
  1. 逐条验证 6 项缺陷修复（#1-#6），每条给出"已修复/未修复/部分修复"结论
  2. 全维度检查，每个维度给出通过/缺陷结论
  3. 新引入的缺陷（如有）单独列出
  4. 最终结论：通过（可推进 Approved）/ 需修订后重审 / 驳回
禁止:
  - 不得修改被审阅的设计文档
  - 不得自行调用 skill
  - 不得修改 sub_id
```
