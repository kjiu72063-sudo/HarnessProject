# Controller Spec: F002 设计编写 Agent 修订 Round 3

## 角色
design-writer (L3)

## 任务
修复 F002 LangGraph 编排引擎设计文档 1 项跨文档缺陷（Round 3）

## 输入
- 被审文档: docs/design/feature-f002-langgraph.md（224 行，Status: Draft）
- 校验报告: harness-journal/stage-02-feature-breakdown/22-f002-r2-review.md
- 对齐基准: F011 §6 规则 3（line 193）使用 `current_iteration > max_iterations`（严格大于）

## 缺陷

### #1 [跨文档] route_loop_budget 比较运算符不一致
- 位置: F002 line 182（route_loop_budget 函数体）
- 问题: F011 §6 规则 3 使用 `current_iteration > max_iterations`（严格大于），F002 R2 使用 `current_iteration >= max_iterations`（大于等于）。以 max_iterations=5 为例：F011 允许 5 次迭代（第 6 次触发干预），F002 允许 4 次迭代（第 5 次触发干预），循环预算减少 20%。R1 代码使用 `>` 与 F011 一致，R2 修订时改为 `>=` 引入了不一致。
- 修法: 将 `>=` 改回 `>` 与 F011 §6 规则 3 对齐

## 验收标准
1. route_loop_budget 函数体比较运算符为 `>`（严格大于），与 F011 §6 规则 3 一致
2. 全文无 `>=` 与循环预算相关的残留
3. 修订记录追加 Round 3 条目
4. 修订后单文件 ≤ 300 行
5. 不修改其他章节（仅触及 route_loop_budget 函数体 + 修订记录段）
6. 不修改跨文档（state-design.md / boundaries.md / AGENTS.md / F011）

## 禁止项
- 禁止调用 skill 产出内容
- 禁止修改 sub_id
- 禁止修改跨文档
- 禁止引入新架构概念
- 完成后必须写入 harness-journal 和 progress.txt
