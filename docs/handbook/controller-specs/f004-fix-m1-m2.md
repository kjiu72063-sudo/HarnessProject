# Controller Spec — F004 修复微任务（M1+M2 文档级修复）

- 委派: L1 → L3 coder（修复会话）
- 前置: F004 编码 35f09dc 已落地; L3 测试审查 journal 40 结论 = **必须修复 2 条后可推进 passing**
- 依据: 本 Spec 全部修复内容转写自 journal 40 §M1/M2（L3 独立审查结论），L1 未做内容判定
- 验收 diff 锚点: 1a361b5..<你的提交>（1a361b5 为 L1 journal 41 批次; 60b18f6 为平台自动提交零内容差异，知悉即可）
- journal 编号: 42 = L1 验收+委派记录（本批占用）; 43 = 本微任务 coder 记录（预留）; 44 = 修复后复审预留

## 背景

F004 约束管理层编码（35f09dc）经 test-reviewer 独立审查（journal 40, 提交 6691a33）: 12 项标准 10 PASS + 2 FAIL。按 AGENTS.md 规定"基于校验结论出修订 ControllerSpec；修订后必须重新校验"，本微任务执行 2 条必须修复，完成后由 test-reviewer 复审（journal 44, 无豁免）。

两条修复均为**文档级修复，不触碰任何代码**。

## 任务一（M1, journal 40 标准 10）: api-spec.md 修复

L3 结论原文（journal 40 L201）: "api-spec.md Constraint 字段声明缺 `source_key`/`enforcer`；`enforcement` 枚举值应为 `mechanized|manual_review` 非 `verify_gate|agent_hint`"

修复动作（目标文件 `docs/reference/api-spec.md` 约束端点段）:
1. Constraint 字段声明补齐 `source_key` 与 `enforcer` 两个字段（字段语义以 `docs/design/feature-f004-constraint-management.md` 数据模型节与 `server/schemas/` 下 Constraint Pydantic schema 实现为准——文档与实现对齐是修复目标本身）
2. `enforcement` 枚举值更正为 `mechanized | manual_review`（当前错误的 `verify_gate | agent_hint` 全部替换）

## 任务二（M2, journal 40 标准 11）: convention-to-rule-mapping.md 修复

L3 结论原文（journal 40 L202）: "convention-to-rule-mapping.md 未含 agents_md 条目 `enabled=false` 语义描述（裁决③要求）"

修复动作（目标文件 `docs/conventions/convention-to-rule-mapping.md`, 在约束管理相关规则映射行或合适小节）:
3. 补 agents_md 条目 `enabled=false` 语义描述，口径必须与裁决③一致: **仅影响阶段 4 注入（不下发编码 Agent），不影响 verify.sh 实际执行；"禁用即跳过闸门"已方向性拒绝**（裁决出处: journal 38 裁决③ / 设计文档 Approved 注记）

## 验收标准（内容项均由 test-reviewer journal 44 独立验证）

#	标准	类型
1	api-spec.md Constraint 字段声明含 `source_key` 与 `enforcer`，字段语义与 Pydantic schema 实现一致	内容（44 复核）
2	api-spec.md `enforcement` 枚举值恰为 `mechanized | manual_review`，全文件无 `verify_gate`/`agent_hint` 残留	内容（44 复核）
3	convention-to-rule-mapping.md 含 agents_md `enabled=false` 语义描述，口径与裁决③一致	内容（44 复核）
4	改动范围恰 2 目标文件 + journal 43 + progress 追加行，diff 无范围外文件	流程
5	零代码触碰: server/ 与 src/ 零变动（纯文档修复）	流程
6	verify.sh 14/14 PASS + uv.lock 零漂移	流程
7	journal 43 写入（含修复对照 + 提交哈希 + diff 锚点）+ progress.txt 追加恰 1 行	流程
8	两目标文件修改后仍 ≤300 行	流程

## 范围外（明确不做）

- S1-S5 建议改进（journal 40 L206-210）: 不顺带执行，由 K总 另行裁决处置
- 前次 coder journal 39 §7 歧义已由 L3 裁定/核查（journal 40），无需再处理
- 任何代码、schema、测试文件的"顺手修复"

## 环境与防护

- 纯文档任务, 原则上不触发 uv/构建; 若需运行 verify.sh 按启动提示词 P009/P010 防护执行
- P011: 每次提交前 `git status --short` + `git diff --cached --stat` 双向核对; 提交后 40 秒复查有无平台自动提交混入; untracked 文件防钩子自动 stage
- 单次提交收敛; 如混入须 `mv 移出 → git rm --cached → amend → 核对 → 移回` 完整序列（P011 实证 5）

## 报告要求（回 L1, 转流程验收）

提交哈希 + diff 锚点 + 8 项标准逐条对照（证据标注来源）+ 环境表 + P 编号命中 + 自报歧义（不裁定）
