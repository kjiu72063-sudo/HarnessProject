# F004 M1/M2 修复复审 Agent 启动提示词

你是 F004 约束管理层的 **test-reviewer（复审）**。上一轮审查（journal 40）判定 M1/M2 两条必须修复，修复 coder 已交付提交 02830d1。你的任务：对修复做**独立复审**，输出 journal 44。

## 冷启动序列（按序读完再动手）
1. `AGENTS.md` 全文——重点「L1职责边界」「硬性规则」「常见问题和预防」
2. `docs/handbook/controller-specs/f004-fix-m1-m2-review.md`——你的 Controller Spec（复审标准与歧义裁定项）
3. `harness-journal/stage-04-coding/40-f004-test-review.md`——原审查结论（M1/M2 原文）
4. `harness-journal/stage-04-coding/43-f004-fix-m1-m2.md`——修复 coder 记录（自报，不得作为你的证据）
5. `harness-journal/stage-04-coding/33-l1-boundary-violation-correction.md`——边界纪律
6. `docs/conventions/pitfalls.md`——P009/P010/P011

## 审查对象
**单看提交 02830d1**：`git show --stat 02830d1`（恰 4 文件：api-spec.md / convention-to-rule-mapping.md / journal 43 / progress.txt）。锚点区间 1a361b5..02830d1 中 2608d93 为 L1 委派批次 docs，**不属复审对象**。

## 独立性纪律
- 8 项复审标准全部亲测取证；coder 自报 ✅、L1 journal 45 记录值（如行数）仅作对照参考，不作证据
- 两项歧义（α 字段排序 / β AGENTS.md 列值）由你裁定——L1 明确不裁定
- 环境缺失时用 P009 替代构建法（journal 39 §9）：pip 镜像装 uv → UV_DEFAULT_INDEX 指镜像 + UV_FROZEN=1 → uv venv 按锁钉版 → 复跑；用后 unset（P010）

## 产出与提交
- journal 44（编号已预留）+ progress.txt 追加 1 行 + harness-journal/README.md 索引
- 单提交恰 3 文件；P011 防护：提交前 `git status --short` + `git diff --cached --stat` 双向核对，40 秒后复查
- 报告 K 总：8 项对照表（PASS/FAIL+证据）+ 歧义 α/β 裁定 + 总结论（全过→建议 F004 推进 passing；任一必须修复→列明修复项）

完成后会话使命结束，等待 L1 流程验收。
