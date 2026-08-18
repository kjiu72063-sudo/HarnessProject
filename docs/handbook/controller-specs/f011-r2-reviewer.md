# F011 Controller Spec — Round 2 校验

> 由 L1 产出，委派 L3 设计校验 Agent 校验 F011 Round 2 修订。

## Controller Spec

```
任务: 校验 F011 Round 2 修订（缺陷 #7 修复），验证修复正确性 + 确认未引入新问题
角色: design-reviewer
前置条件: F011 Round 2 修订完成（14-f011-revision-r2.md），L1 流程验收通过
输入:
  - 待审文档: docs/design/feature-f011-agent-runtime.md（271 行，Status: Draft）
  - 上次补审报告: harness-journal/stage-02-feature-breakdown/12-f011-re-review.md
  - 参考文档:
    - docs/handbook/prompts/_bootstrap.md（含硬约束 8 条）
    - docs/handbook/orchestrator-prompt.md
    - docs/handbook/agent-registry.json
    - AGENTS.md
  - 校验范围（聚焦校验，非全量重审）:
    A. #7 修复验证: §3 硬约束计数是否更新为 8 条，第 8 条内容是否与 _bootstrap.md 对齐
    B. 修订影响检查: §3 和修订记录段的修改是否影响了文档其他部分的一致性
    C. 快速确认: 其他维度（维度1-7）因本次修订仅触及 §3 和修订记录，确认未受影响
输出: 校验结论（通过/需修订后重审/驳回）
验收标准:
  1. #7 修复验证：§3 计数更新为 8 条，第 8 条内容与 _bootstrap.md 语义一致
  2. 修订记录段含 Round 2 记录
  3. §3 修改未破坏与 _bootstrap.md / agent-registry.json / orchestrator-prompt.md 的跨文档一致性
  4. 修订未触及 §3 和修订记录以外的章节（确认无意外修改）
  5. 最终结论：通过（F011 可推进 Approved）/ 需修订后重审 / 驳回
禁止:
  - 不得修改被审阅的设计文档
  - 不得自行调用 skill
  - 不得修改 sub_id
```
