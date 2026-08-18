# Controller Spec: F002 R3 聚焦校验

## 角色
L3 设计校验 Agent（design-reviewer）

## 被审文档
docs/design/feature-f002-langgraph.md（225 行，Status: Draft）

## 审阅性质
Round 3 修订聚焦校验（非全量重审）

## 校验范围

### Part A: 缺陷修复验证
验证 R2 校验发现的 1 项缺陷是否真正修复：

**缺陷 #1（跨文档）**：route_loop_budget 比较运算符 `>=` 与 F011 §6 规则 3 的 `>` 不一致
- 验证点 1: line 182 是否已改为 `current_iteration > max_iterations`（严格大于）
- 验证点 2: 全文代码中无 `>=` 残留（修订记录中的描述性文本除外）
- 验证点 3: 与 F011 §6 规则 3 的运算符一致（同为 `>`）

### Part B: 修订影响检查
- B1: 内部一致性 — 修订未引入新的不一致
- B2: 修订记录完整 — Round 3 条目存在且格式一致
- B3: 行数 ≤ 300 — 225 行
- B4: 跨文档快速复核 — route_loop_budget 运算符与 F011 §6 对齐确认

### Part C: 修订范围确认
- C1: 修改点清单 — 仅触及 route_loop_budget 函数体 + 修订记录
- C2: R1+R2 修复完整性 — 12 项修复（R1 原始 6 项 + R2 新 6 项）全部保持完整
- C3: 无意外修改 — 未触及不应修改的章节，未修改跨文档

## 输出格式
```
=== Part A: 缺陷修复验证 ===
  #1 运算符 >= → >: 已修复/未修复/部分修复
     [验证细节]

=== Part B: 修订影响检查 ===
  B1-B4 逐项: 通过/[缺陷描述]

=== Part C: 修订范围确认 ===
  C1-C3 逐项: 通过/[缺陷描述]

=== 新引入缺陷 ===
  [如有，编号从 #1 开始]

=== 最终结论 ===
结论: 通过 / 需修订后重审
理由: [简要说明]
journal: [写入路径]
progress: [写入内容]
```

## 约束
- 只读不写被审文档
- 必须写 harness-journal（编号 25）和 progress.txt
- 禁止自行调用 skill
- 禁止修改 sub_id
- journal 路径: harness-journal/stage-02-feature-breakdown/25-f002-r3-review.md
