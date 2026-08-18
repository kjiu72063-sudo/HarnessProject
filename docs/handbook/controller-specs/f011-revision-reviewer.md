# F011 Controller Spec — 修订版补审

> 由 L1 项目管控 Agent 产出，用于委派 L3 设计校验 Agent 补审 F011 修订后的设计文档。
> F011 修订 Round 1 完成后，L1 违规跳过 L3 校验直接 Approved。现补审。

## Controller Spec

```
任务: 补审 F011 Agent Runtime 设计文档（修订后），验证 6 项缺陷修复 + 全维度检查
角色: design-reviewer
前置条件: F011 修订 Round 1 已完成（08-f011-revision-r1.md），L1 流程验收已通过
输入:
  - 待审文档: docs/design/feature-f011-agent-runtime.md（269 行，Status: Approved，但修订后未经 L3 校验）
  - 上次校验报告: harness-journal/stage-02-feature-breakdown/06-f011-review.md（6 项缺陷清单）
  - 修订记录: harness-journal/stage-02-feature-breakdown/08-f011-revision-r1.md
  - 参考文档（跨文档一致性校验）:
    - docs/architecture/state-design.md
    - docs/architecture/harness-flow.md
    - docs/architecture/boundaries.md
    - docs/handbook/orchestrator-prompt.md
    - docs/handbook/agent-registry.json
    - docs/handbook/prompts/_bootstrap.md
    - AGENTS.md
  - 校验重点:
    A. 6 项缺陷修复验证（逐条对照 06-f011-review.md 的缺陷清单 + 修法建议，验证是否真正修复）
    B. 全维度检查（与上次相同的 7 个维度，确保修订未引入新问题）
    C. 修订记录完整性（文档末尾是否有修订记录段）
输出: 缺陷清单（在对话中输出，不修改被审文档）
验收标准:
  1. 逐条验证 6 项缺陷修复（#1-#6），每条给出"已修复/未修复/部分修复"结论
  2. 7 个维度全量检查，每个维度给出通过/缺陷结论
  3. 新引入的缺陷（如有）单独列出
  4. 最终结论：通过（维持 Approved）/ 需修订后重审 / 驳回（回退 Approved→Draft）
禁止:
  - 不得修改被审阅的设计文档
  - 不得自行调用 skill
  - 不得修改 sub_id
```
