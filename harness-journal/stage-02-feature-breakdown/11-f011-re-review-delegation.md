# F011 修订版补审委派

## 步骤名称
F011 修订版补审 — 委派 L3 设计校验 Agent

## 执行时间
2026-08-18T02:15Z

## 前置条件
- K总指示"需要补审"
- F011 修订 Round 1 已完成但 L1 违规跳过 L3 校验直接 Approved
- L1 职责越权已纠正（10-l1-scope-violation-correction.md）

## 执行内容

### L1 产出补审 Controller Spec

- docs/handbook/controller-specs/f011-revision-reviewer.md
- 校验分两部分：
  - Part A: 6 项缺陷修复验证（逐条对照 06-f011-review.md，给出已修复/未修复/部分修复）
  - Part B: 全维度检查（7 个维度，确保修订未引入新问题）
- 特别注意：_bootstrap.md 新增了硬约束 #8、orchestrator-prompt.md 新增了硬约束 #6、agent-registry.json 新增了 2 条 prohibitions——跨文档一致性校验需对照最新版本

### L2 生成 L3 补审启动提示词

- docs/handbook/launch-prompts/f011-revision-re-review-launch.md
- 每项缺陷给出：原缺陷 + 上次修法建议 + 验证点
- 全维度检查特别标注了文档变更点（_bootstrap.md / orchestrator-prompt.md / agent-registry.json 的更新）
- 输出格式含 Part A + Part B + 新引入缺陷 + 最终结论

## 产出物
1. docs/handbook/controller-specs/f011-revision-reviewer.md
2. docs/handbook/launch-prompts/f011-revision-re-review-launch.md

## 验证结果
- Controller Spec 覆盖 6 项缺陷验证 + 7 维度全量检查 ✓
- L3 启动提示词含每项缺陷的验证点 ✓
- 标注了文档变更点供跨文档校验 ✓

## 下一步
- K总使用 f011-revision-re-review-launch.md 开新对话窗口
- L3 设计校验 Agent 补审 F011 修订版
- L3 结论带回 L1：
  - 通过 → F011 维持 Approved，继续 F002 修订
  - 需修订 → F011 回退 Approved→Draft，L1 产出修订 Controller Spec
