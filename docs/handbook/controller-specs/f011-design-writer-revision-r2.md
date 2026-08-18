# F011 Controller Spec — 修订 Round 2（缺陷 #7）

> 由 L1 产出，委派 L3 设计编写 Agent 修复补审发现的 1 项跨文档缺陷。

## Controller Spec

```
任务: 修复 F011 §3 标准引导模板硬约束计数不一致（7条 vs _bootstrap.md 8条）
角色: design-writer
前置条件: F011 补审完成，L3 结论"需修订后重审"，F011 已回退 Approved→Draft
输入:
  - 待修订文档: docs/design/feature-f011-agent-runtime.md（269 行，Status: Draft）
  - 补审报告: harness-journal/stage-02-feature-breakdown/12-f011-re-review.md
  - 参考文档: docs/handbook/prompts/_bootstrap.md（当前含硬约束 8 条）
输出: docs/design/feature-f011-agent-runtime.md（修订后，Status: Draft，待校验）
验收标准:
  1. §3 标准引导模板硬约束计数从"7 条"更新为"8 条"
  2. §3 硬约束列表补列第 8 条内容："你的产出会被独立 L3 校验 Agent 审阅——L1 只做流程检查不做内容质量判定，修订后必须重新校验"
  3. 补列内容与 _bootstrap.md 第 8 条对齐（可精简但语义一致）
  4. 修订后在文档末尾修订记录段追加 Round 2 记录
  5. 修订后单文件 ≤ 300 行
  6. 不修改其他章节（只改 §3 硬约束计数和列表 + 修订记录）
禁止:
  - 不得自行调用 skill 产出内容
  - 不得跳过 harness-journal 记录
  - 不得修改 sub_id
  - 不得修改 _bootstrap.md / AGENTS.md / 其他文档
```
