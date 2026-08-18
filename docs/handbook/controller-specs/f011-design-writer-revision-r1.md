# F011 Controller Spec — 修订（Round 1）

> 由 L1 项目管控 Agent 产出，用于委派 L3 设计编写 Agent 修订 F011 设计文档中的 6 项缺陷。

## Controller Spec

```
任务: 修订 F011 Agent Runtime 设计文档，修复 L3 校验 Agent 发现的 6 项缺陷
角色: design-writer
前置条件: F011 Draft 已完成，L3 校验 Agent 已审阅，L1 已做缺陷分类决策
输入:
  - 待修订文档: docs/design/feature-f011-agent-runtime.md
  - 校验报告: harness-journal/stage-02-feature-breakdown/06-f011-review.md
  - 参考文档（跨文档一致性校验用）:
    - docs/architecture/state-design.md (第 54 行: interrupt_before=["human_interrupt"])
    - docs/architecture/boundaries.md (第 15 行: server/nodes/ 标注"纯函数")
    - docs/handbook/agent-registry.json (L1 路径: orchestrator-prompt.md)
  - L1 决策: 全部 6 项缺陷在本次修订中解决
输出: docs/design/feature-f011-agent-runtime.md（修订后，Status 仍为 Draft，待重审）
验收标准:
  1. [致命 #1] §6 循环预算增加重置规则：当 issue_resolved=True 或循环正常退出时，current_iteration 重置为 0。明确预算是 per-loop 而非 cumulative。
  2. [跨文档 #2] §5 HITL 实现机制明确 interrupt 拓扑选择：选择"多节点 interrupt_before"还是"单一 human_interrupt 节点路由"，并说明理由。标注 state-design.md 第 54 行需在跨文档同步阶段更新。
  3. [跨文档 #3] 在 F011 文档中标注 boundaries.md 需纳入跨文档同步计划（"纯函数"→"委派桩"），并将 boundaries.md 添加到 §跨文档同步引用（如有）或在依赖段注明。
  4. [概念 #4] §6 显式声明"反馈循环和 DRR 长循环共用同一循环预算"作为设计决策，说明理由（如简化状态管理、总预算可控）。
  5. [概念 #5] §5 "审查通过"闸门的"可疑升级"：标注"具体阈值由 F002 编码实现时定义，F011 仅定义升级机制和触发维度"。
  6. [概念 #6] §1 Agent Registry 结构契约中 prompt_template 路径：注明"L1 角色 project-controller 为例外，使用 docs/handbook/orchestrator-prompt.md"。
  7. 修订后单文件 ≤ 300 行
  8. 不引入新的架构概念或模块（只修缺陷，不扩范围）
禁止:
  - 不得自行调用 skill 产出内容
  - 不得跳过 harness-journal 记录
  - 不得修改 sub_id
  - 不得修改 AGENTS.md 硬性规则
  - 不得修改 state-design.md 或 boundaries.md（跨文档同步由 L1 统一执行）
  - 不得在 F011 中实现 boundaries.md 的修复（只标注需同步）
```
