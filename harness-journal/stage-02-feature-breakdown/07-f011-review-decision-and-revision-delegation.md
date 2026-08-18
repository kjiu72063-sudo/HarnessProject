# F011 L3 校验结果 + L1 决策 + 修订委派

## 步骤名称
F011 设计校验 Agent 审阅结果 → L1 决策 → 委派 L3 修订

## 执行时间
2026-08-18T00:30Z

## 前置条件
- L3 设计校验 Agent 已完成 F011 独立审阅（06-f011-review.md）
- 校验结论：需修订后重审

## 执行内容

### L3 校验结果摘要

| 维度 | 结果 |
|---|---|
| 维度1 内部一致性 | 2 个缺陷 |
| 维度2 跨文档一致性 | 3 个缺陷 |
| 维度3 HITL 落地 | 1 个缺陷 |
| 维度4 循环安全 | 2 个缺陷 |
| 维度5 Skill≠Agent 完整性 | 通过 |
| 维度6 非目标边界 | 通过 |
| 维度7 遗漏检查 | 通过 |

缺陷总计 6 项：致命 1 + 跨文档 2 + 概念 3

### L1 决策

全部 6 项缺陷在本次修订中解决：

| # | 级别 | L1 决策 | 修复位置 |
|---|---|---|---|
| #1 | 致命 | 必须修复 — 增加 current_iteration 成功重置规则 | F011 §6 |
| #2 | 跨文档 | 必须修复 — F011 明确 interrupt 拓扑选择 + 标注 state-design.md 需同步 | F011 §5 |
| #3 | 跨文档 | 必须修复 — 标注 boundaries.md 需纳入同步计划 | F011 依赖段 |
| #4 | 概念 | 修复 — 与 #1 相关，显式声明共享预算设计决策 | F011 §6 |
| #5 | 概念 | 修复 — 标注阈值由 F002 定义 | F011 §5 |
| #6 | 概念 | 修复 — 注明 L1 路径例外 | F011 §1 |

### L1 产出修订 Controller Spec

- docs/handbook/controller-specs/f011-design-writer-revision-r1.md
- 8 条验收标准（6 项缺陷修复 + 行数限制 + 不扩范围）
- 明确禁止修改 state-design.md / boundaries.md（跨文档同步由 L1 统一执行）

### L2 生成 L3 修订启动提示词

- docs/handbook/launch-prompts/f011-revision-r1-launch.md
- 每项缺陷给出：位置 + 问题 + 修法（具体到文字建议）
- 注入标准引导模板 + 修订规范

## 产出物
1. docs/handbook/controller-specs/f011-design-writer-revision-r1.md
2. docs/handbook/launch-prompts/f011-revision-r1-launch.md

## 验证结果
- L3 校验 Agent journal 已写入（06-f011-review.md）✓
- progress.txt 已追加 ✓
- L1 决策覆盖全部 6 项缺陷 ✓
- 修订 Controller Spec 8 条验收标准 ✓
- 跨文档同步边界清晰（F011 只标注，不修改其他文档）✓

## 下一步
- K总使用 f011-revision-r1-launch.md 开新对话窗口
- L3 设计编写 Agent 修订 F011
- L3 产出回 L1 验收
- 验收通过后再次委派 L3 校验 Agent 重审（或 L1 直接判定通过）
- F011 Approved 后进入 F002 修订
