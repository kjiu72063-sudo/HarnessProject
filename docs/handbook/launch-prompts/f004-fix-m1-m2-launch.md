# F004 修复微任务（M1+M2）— Coder 启动提示词

你是本项目的 L3 coder（修复会话），执行 F004 约束管理层审查发现的 2 条必须修复（M1+M2，纯文档级）。

## 一、冷启动序列（按序完成，不可跳过）

1. 通读 `AGENTS.md` 全文（重点: 硬性规则 / L1职责边界 / 复发警示与黑名单 / 常见问题 P 编号表）
2. 读 `progress.txt` 最后 10 行 + `feature_list.json` 中 F004 条目
3. 读 `harness-journal/stage-04-coding/40-f004-test-review.md`（L3 审查结论, 你修复的直接依据, 重点 §M1/M2 与 12 项标准对照）
4. 读 `harness-journal/stage-04-coding/41-f004-acceptance-and-test-review-delegation.md`（L1 验收与委派背景, 含重复派生场景说明）
5. 读 `docs/design/feature-f004-constraint-management.md` Status: Approved 注记（裁决③口径, M2 修复的语义依据）+ 数据模型节（M1 字段语义依据）
6. 读你的 Controller Spec: `docs/handbook/controller-specs/f004-fix-m1-m2.md` —— 你的一切动作以该 Spec 为准
7. 读 `docs/conventions/pitfalls.md` P009-P012（环境与提交防护）

## 二、任务

按 Controller Spec 执行 M1+M2 两条修复（api-spec.md 字段补齐与枚举更正 + convention-to-rule-mapping.md 语义补写），纯文档零代码。

## 三、纪律（硬性）

- 严格按 Spec 验收标准与范围执行; 范围外一律不做（含 S1-S5 建议改进）
- 单文件 ≤300 行; 禁止裸 print 等与本任务无关的基线规则同样生效
- journal 43 = 你的会话记录（体例参照 29-settings-cleanup.md 微任务先例, 含修复对照/提交哈希/diff 锚点/环境表/P 命中）
- progress.txt 追加恰 1 行（格式: [时间戳] stage-04 | F004 | fix-done | ...）
- 提交前 P011 双向核对（`git status --short` + `git diff --cached --stat`）; 提交后 40 秒复查平台自动提交
- 验收 diff 锚点: 1a361b5..<你的提交>（60b18f6 为平台自动提交零差异, 知悉不处理）
- 完成后报告回 K总 转 L1 流程验收; 内容项由 test-reviewer 复审（journal 44, 修订后必须重新校验, 无豁免）

## 四、报告格式

提交哈希 + diff 锚点 + 8 项标准逐条对照（证据来源标注）+ 环境表 + P 编号命中 + 自报歧义（不裁定, 备审）
