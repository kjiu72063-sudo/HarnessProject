# F004 M1/M2 修复复审 Controller Spec（test-reviewer）

## 任务性质
F004 约束管理层 L3 审查（journal 40）判定 2 条必须修复：M1（标准 10 api-spec.md 回写不达标）+ M2（标准 11 convention-to-rule-mapping.md 同步不达标）。修复 coder 已交付提交 **02830d1**（恰 4 文件：两目标文件 + journal 43 + progress 1 行）。你复审的唯一对象：**02830d1**（单看该提交，勿混入 2608d93 及之前的委派链 docs）。

修复 Controller Spec：docs/handbook/controller-specs/f004-fix-m1-m2.md
修复 coder 记录：harness-journal/stage-04-coding/43-f004-fix-m1-m2.md
原审查结论（M1/M2 原文与依据）：harness-journal/stage-04-coding/40-f004-test-review.md

## 审查原则
1. **独立验证**：不得引用 coder 自报、L1 journal 45 的任何内容性结论作为你的证据；全部亲测。
2. **修订后必须重新校验**（AGENTS.md L1 职责边界）：本次复审无豁免、不抽样放过。
3. 范围外不裁：5 条建议改进已在 journal 42 记档留后续，不属本次复审对象。

## 复审标准（每项独立取证）

| # | 标准 | 验证方法（建议） |
|---|---|---|
| 1 | M1-a：api-spec.md Constraint 字段声明含 `source_key` 与 `enforcer`，字段名、语义注释与 server/schemas 中 Pydantic ConstraintBase 实际声明逐一对齐（含 min_length=1、enforcer 默认值） | 读 api-spec.md L32 区域 + 读 Pydantic schema 源文件比对 |
| 2 | M1-b：api-spec.md 全文件 `verify_gate`/`agent_hint` 零残留；enforcement 枚举恰为 `mechanized\|manual_review`，与 schema Literal/enum 定义一致 | grep + 对照 schema |
| 3 | M2-a：convention-to-rule-mapping.md 新增行含裁决③三要素语义——「仅影响阶段 4 注入」「不影响 verify.sh 实际执行」「禁用即跳过闸门方向性拒绝」，与 journal 38 裁决③、设计文档 Approved 注记逐句对齐 | 读 mapping 新增行 + journal 38 §裁决③原文比对 |
| 4 | M2-b：该行落在 AGENTS.md 规则 #10 对应行或相邻位置，符合 convention-to-rule-mapping.md 自身的行结构约定（规则→执行映射表格式不破坏） | 读 mapping 表结构完整性 |
| 5 | 改动恰 4 文件（git show --stat 02830d1），server/ 与 src/ 零触碰 | git 取证 |
| 6 | verify.sh 14/14 + uv.lock 零漂移（UV_FROZEN=1） | 独立复跑 |
| 7 | journal 43（74 行）真实完整 + progress fix-done 行恰 1 行 | 读文件 |
| 8 | 两目标文件 ≤300 行（api-spec.md 40 / convention-to-rule-mapping.md 72，L1 流程记录值，请复核） | wc -l |

## 两项 coder 自报歧义（备你裁定，L1 不裁定）
- **歧义 α（字段排序）**：修复后 api-spec.md 字段顺序按 Pydantic ConstraintBase 声明序重排，而非原序仅插入。裁定：接受重排 / 要求恢复原序仅插入。
- **歧义 β（AGENTS.md 列值）**：mapping 新增行的 AGENTS.md 列填 `#10, 裁决③`——#10 为规则编号，裁决③为语义来源（非规则编号），混合引用是否合规。裁定：接受 / 要求改写为规范格式（如"#10（语义来源: journal 38 裁决③）"）。

## 验证环境指引
本会话沙箱可能无 uv / .venv（P009 环境漂移）。替代构建法（journal 39 §9 已实证）：`pip install uv`（aliyun 镜像）→ `UV_DEFAULT_INDEX` 指镜像 + `UV_FROZEN=1` → `uv venv` + 按锁钉版安装 → 复跑。镜像变量用后 unset（P010）。

## 结论格式
- 每项标准：PASS/FAIL + 独立证据摘录（命令 + 输出关键行）
- 歧义 α/β：各自裁定 + 理由
- 总结论：8 项全 PASS 且歧义裁定无必须修复项 → **建议 F004 推进 passing**；任一必须修复 → 列明修复项（F004 维持 review-pending）
- 产出：journal 44（编号已预留，勿改）+ progress.txt 追加 1 行 + harness-journal/README.md 索引更新
- 提交：单提交，恰 3 文件；P011 防护（提交前 `git status --short` + `git diff --cached --stat` 双向核对，40 秒后复查无平台自动提交混入）
- 报告 K 总：8 项对照表 + 歧义裁定 + 总结论
