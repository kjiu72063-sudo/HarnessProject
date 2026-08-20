# Journal 44 — F004 M1/M2 修复复审（test-reviewer 独立验证）

- **日期**: 2026-08-20
- **角色**: L3 test-reviewer（复审 Agent）
- **审查对象**: 提交 02830d1（恰 4 文件：api-spec.md / convention-to-rule-mapping.md / journal 43 / progress.txt）
- **Spec**: docs/handbook/controller-specs/f004-fix-m1-m2-review.md
- **结论**: **8 项全 PASS，两项歧义均裁定接受 → 建议 F004 推进 passing**

---

## §1 冷启动确认

按序读完：AGENTS.md → f004-fix-m1-m2-review.md（Controller Spec） → journal 40（原审查 M1/M2） → journal 43（coder 修复记录，仅对照参考不作证据） → journal 33（边界纪律） → pitfalls.md（P009/P010/P011）。共 6 份，无遗漏。

独立性纪律：8 项标准全部亲测取证；coder 自报 ✅ 与 L1 journal 45 记录值仅作对照参考，不作为证据。

---

## §2 提交锚点独立核实

| 项目 | 预期 | 实测 | 判定 |
|---|---|---|---|
| 提交 hash | 02830d1 | `git show --stat 02830d1` 确认存在 | ✅ |
| 文件数 | 恰 4 | 4 files changed, 77 insertions(+), 1 deletion(-) | ✅ |
| 文件清单 | api-spec.md / convention-to-rule-mapping.md / journal 43 / progress.txt | 实测匹配 | ✅ |
| server/ 与 src/ 零触碰 | 无 | `git diff --name-only | grep -E '^(server|src)/'` EXIT:1（零命中） | ✅ |

---

## §3 8 项复审标准独立验证

### 标准 1：M1-a — api-spec.md Constraint 字段声明含 source_key 与 enforcer，与 Pydantic ConstraintBase 对齐

**PASS**

独立取证：
- 读 api-spec.md L32：`{ id, project_id, source(agents_md|manual), source_key, rule_no, title, detail, rule_type, enforcer, enforcement(mechanized|manual_review), gate_ids, enabled, created_at, updated_at }`
- source_key 存在 ✓，enforcer 存在 ✓
- 读 server/schemas/constraints.py L32-43 ConstraintBase 实际声明：
  - `source_key: str = Field(min_length=1, max_length=100)` → api-spec 注释"条目唯一标识键（agents-md-rule-{n} / manual-{auto}）"，非空约束隐含于格式 ✓
  - `enforcer: str = "manual"` → api-spec 注释"执行器标识（"ruff T20" 等）"，语义一致 ✓
- 字段名完全匹配 Pydantic 声明 ✓

注：api-spec 未显式标注 min_length=1 与 default="manual"，但语义注释与格式示例已隐含对应约束，对 API 消费者可辨。

### 标准 2：M1-b — api-spec.md 全文件 verify_gate/agent_hint 零残留；enforcement 枚举与 Pydantic 一致

**PASS**

独立取证：
- `grep -n 'verify_gate\|agent_hint' docs/reference/api-spec.md` → EXIT:1（零命中）✓
- api-spec L32 enforcement 声明为 `mechanized|manual_review` ✓
- Pydantic Enforcement 枚举（constraints.py L27-29）：MECHANIZED = "mechanized", MANUAL_REVIEW = "manual_review" ✓
- 枚举值完全一致 ✓

### 标准 3：M2-a — convention-to-rule-mapping.md 新增行含裁决③三要素语义

**PASS**

独立取证：
- 读 convention-to-rule-mapping.md L41（新增行）："enabled=false 仅影响阶段 4 注入（不下发编码 Agent），不影响 verify.sh 实际执行；「禁用即跳过闸门」方向性拒绝"
- 读 journal 38 §二裁决③原文："采纳现设计（仅影响阶段 4 注入，不影响 verify.sh 实际执行）；「禁用即跳过闸门」方向性拒绝，不进 backlog"
- 三要素逐句对齐：
  1. "仅影响阶段 4 注入" — 与裁决③一致 ✓（"不下发编码 Agent"为合理补充说明）
  2. "不影响 verify.sh 实际执行" — 与裁决③一致 ✓
  3. "「禁用即跳过闸门」方向性拒绝" — 与裁决③一致 ✓
- 实现方式列："coding_agent 注入时 filter enabled=True；validation gates 不过滤 enabled" — 描述实际实现 ✓
- 状态列："⚠️ 人工审查" — 语义约束非机械闸门，合规 ✓

### 标准 4：M2-b — 新增行落在 AGENTS.md 规则 #10 对应行或相邻位置，表结构不破坏

**PASS**

独立取证：
- 新增行 L41 紧接 F004 设计裁决行（L40），位于 mapping 表末尾 ✓
- 表结构完整性：5 列（团队口头约定 / 机械化规则 / 实现方式 / 状态 / AGENTS.md）均存在，管道分隔符完整 ✓
- AGENTS.md 列填 "#10, 裁决③"：#10 对应"所有代码变更必须通过 verify.sh 全闸门"规则 ✓（enabled=false 不影响 verify.sh 执行，映射到 #10 语义正确）

### 标准 5：改动恰 4 文件，server/ 与 src/ 零触碰

**PASS**（§2 已取证）

### 标准 6：verify.sh 14/14 + uv.lock 零漂移

**PASS**

独立取证：
- 命令：`UV_FROZEN=1 bash scripts/verify.sh`
- 结果：**14 passed, 0 failed**
- 后端：110 passed + 1 skipped，覆盖率 98.57%（≥80% 闸门 PASS）
- 前端：93 passed
- `git diff -- uv.lock`：空输出（零漂移）✓

### 标准 7：journal 43 真实完整 + progress fix-done 行恰 1 行

**PASS**

独立取证：
- journal 43 存在，wc -l = 74 行 ✓
- 内容覆盖：验证环境表 / 执行内容 / 修复对照表 / 验收标准 / 自报歧义 / P 编号命中 ✓
- progress.txt 末行 fix-done："M1(api-spec字段补齐+枚举更正)+M2(convention-mapping补enabled语义)纯文档修复完成" — 恰 1 行 ✓

### 标准 8：两目标文件 ≤300 行

**PASS**

独立取证：
- `wc -l docs/reference/api-spec.md` = 40 ✓（≤300）
- `wc -l docs/conventions/convention-to-rule-mapping.md` = 72 ✓（≤300）

---

## §4 两项歧义裁定

### 歧义 α：字段排序 — 接受重排 vs 要求恢复原序仅插入

**裁定：接受重排**

理由：
1. api-spec.md 原字段顺序无文档规范约束，不存在"原序为标准"的依据
2. 重排后字段顺序与 Pydantic ConstraintBase 声明序一致（id → project_id → source → source_key → rule_no → title → detail → rule_type → enforcer → enforcement → gate_ids → enabled → created_at → updated_at），减少 spec↔实现漂移风险
3. 字段集完全相同，仅序不同，语义等价
4. 重排后逻辑分组更清晰：source/source_key 同组、rule_type/enforcer/enforcement 同组

### 歧义 β：AGENTS.md 列值 "#10, 裁决③" — 接受 vs 要求改写

**裁定：接受**

理由：
1. 该列已有"F004设计裁决"非规则编号先例（L40），列语义非严格限于纯规则编号
2. "#10, 裁决③"对熟悉 journal 上下文的读者语义可辨——#10 为规则编号，裁决③为语义来源
3. 语义正确性无争议：#10 映射准确（verify.sh 全闸门 = enabled=false 不影响的执行器），裁决③来源准确（journal 38 裁决③）
4. 改写为括号格式（如"#10（裁决③: journal 38）"）虽更清晰，但属建议改进非必须修复——不影响正确性，可记入后续统一格式优化批次

---

## §5 8 项对照表汇总

| # | 标准 | 判定 | 独立证据 |
|---|---|---|---|
| 1 | M1-a: api-spec.md source_key/enforcer 字段与 Pydantic 对齐 | PASS | 读 api-spec.md L32 + constraints.py L32-43 逐字段比对 |
| 2 | M1-b: enforcement 枚举 mechanized/manual_review + 零残留 | PASS | grep 零命中 + 枚举值与 Pydantic Enforcement 完全一致 |
| 3 | M2-a: mapping 新增行含裁决③三要素语义 | PASS | L41 新增行与 journal 38 裁决③原文逐句对齐 |
| 4 | M2-b: 新增行位置合规 + 表结构不破坏 | PASS | L41 紧接 F004 行 + 5 列管道完整 |
| 5 | 改动恰 4 文件 + server/src 零触碰 | PASS | git show --stat 确认 + grep 零命中 |
| 6 | verify.sh 14/14 + uv.lock 零漂移 | PASS | 独立复跑 14/14 PASS + git diff uv.lock 空 |
| 7 | journal 43 真实完整 + progress 恰 1 行 | PASS | wc -l=74 + progress fix-done 末行确认 |
| 8 | 两目标文件 ≤300 行 | PASS | api-spec=40 / mapping=72 |

---

## §6 总结论

- 8 项复审标准：**全部 PASS**
- 歧义 α（字段排序）：**裁定接受重排**
- 歧义 β（AGENTS.md 列值）：**裁定接受**（建议后续统一格式，非必须修复）
- **建议 F004 推进 passing**

---

## §7 环境记录

| 项 | 值 |
|---|---|
| Python | 3.12.3 |
| uv | 0.12.5 |
| verify.sh | 14/14 PASS（UV_FROZEN=1） |
| uv.lock | 零漂移 |
| P009 | 未触发（纯文档复审 + verify.sh 复跑，uv 可用） |
| P010 | UV_FROZEN=1 前置全命令，用后无残留 |
