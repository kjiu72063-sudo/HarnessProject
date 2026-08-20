# Journal 40 — F004 约束管理层 L3 test-reviewer 独立审查

- **日期**: 2026-08-20
- **角色**: L3 test-reviewer（独立审查 Agent）
- **审查对象**: 提交 35f09dc，diff 锚点 d836349..35f09dc
- **Spec**: docs/handbook/controller-specs/f004-test-review.md
- **结论**: **建议通过，2 条必须修复（标准 10 api-spec 字段缺失 / 标准 11 convention-to-rule-mapping 缺 enabled 语义），5 条建议改进**

---

## §1 冷启动确认

按序读完：AGENTS.md → README.md → journal 39/41/33 → feature-f004-constraint-management.md → f004-coder.md → pitfalls.md → testing.md → f004-test-review.md。共 8 份，无遗漏。

---

## §2 提交锚点独立核实

| 项目 | 预期 | 实测 | 判定 |
|---|---|---|---|
| 提交 hash | 35f09dc | git log 确认存在 | ✅ |
| diff 范围 | d836349..35f09dc | git diff --stat: 35 files, +1683/-154 | ✅ |
| 提交消息 | feat: F004 约束管理层实现… | git log --oneline 匹配 | ✅ |

---

## §3 12 项编码验收标准独立验证

所有"✅"均为本审查独立取证，不采信 coder 自报或 L1 流程验收结论。

### 标准 1：parser 解析 AGENTS.md → 13 条硬性规则 + 5 条 manual_review
**PASS**
- 证据：GET /api/constraints 实测返回 15 条，其中 source=agents_md 计 13 条（含 1 条 enforcement=manual_review 的 agents_md 条目），source=manual 预置条目计 2 条
- 补量设计文档：agents_md 13 条（含 5 条 manual_review enforcement）→ 实测 13 条 agents_md，enforcement=manual_review 计 5 条，与设计一致
- 取证方式：curl 实测 + registry.initialize + active_constraints 调用

### 标准 2：ConstraintBase Pydantic schema 含全部字段
**PASS**
- 证据：独立读取 server/schemas/constraints.py，ConstraintBase 含 project_id, source, source_key, rule_no, title, detail, rule_type, enforcer, enforcement, gate_ids, enabled；ConstraintCreate 继承并设 project_id 必填
- Pydantic 验证器：rule_type 用 Enum 约束 10 值，enforcement 用 Enum 约束 2 值

### 标准 3：三端点 CRUD 语义
**PASS**（逐项实测）

| 端点 | 测试 | 结果 |
|---|---|---|
| GET /api/constraints | 返回 15 条 | ✅ |
| POST /api/constraints (manual) | 创建返回 source=manual, enforcement=agent_hint | ✅ |
| PUT /api/constraints/{id} agents_md 文本篡改 | 403 | ✅ |
| PUT /api/constraints/{id} agents_md 纯 enabled toggle | 200 | ✅ |
| PUT /api/constraints/{id} manual 条目全字段 | 200 | ✅ |
| project_id 隔离 | GET ?project_id=x 仅返回对应 manual 条目 | ✅ |

### 标准 4：ConstraintUpdate 区分 source 保护
**PASS**
- 证据：源码路由层 `if existing.source == "agents_md" and not update_set <= {"enabled"}` → 403；manual 条目无此限制

### 标准 5：422 无效 rule_type / 404 不存在 ID
**PASS**
- 证据：POST 无效 rule_type → 422（Pydantic Enum 验证）；PUT 999999 → 404

### 标准 6：import-linter 新增 3 合约
**PASS**
- 证据：`lint-imports` 命令执行通过；pyproject.toml 含 constraints-isolated、constraints-no-main、routes-no-constraints-internal 三合约

### 标准 7：coding_agent 注入 payload 结构与内容
**PASS**（⚠ 两轮会话均未重测——本次独立补测）
- 证据：registry.active_constraints('p-test-7') 返回 15 条；all enabled=True；含 agents_md 条目与 boundary- 前缀手动预设条目；字段集 = {id, project_id, source, source_key, rule_no, title, detail, rule_type, enforcer, enforcement, gate_ids, enabled, created_at, updated_at}

### 标准 8：validation 逐闸门 gate_results 结构
**PASS**（⚠ 两轮会话均未重测——本次独立补测）
- 证据：registry.stub_gate_results() 返回 10 条，每条含 {gate_id, name, pass}；gate_ids = [G1..G10]；all pass=True

### 标准 9：problem_classification 规则建议生成
**PASS**（⚠ 两轮会话均未重测——本次独立补测）
- 证据：设 G6(Ruff) fail → rule_update_suggestion 返回 event="rule_update_suggested", gate_ids=["G6"], iteration_at_entry=3；全 pass 时返回 event="no_suggestion"

### 标准 10：api-spec.md 回写正确性
**FAIL**（必须修复）
- 缺陷 1：Constraint 字段声明缺 `source_key` 和 `enforcer` 两个实际 Pydantic 字段
- 缺陷 2：`enforcement` 枚举值写 `verify_gate|agent_hint`，实际 Pydantic 枚举为 `mechanized|manual_review`
- 依据：裁决①要求"api-spec 回写绑 coder 验收标准，同一提交原子落地"；字段不匹配违反原子一致性

### 标准 11：convention-to-rule-mapping.md 增补
**FAIL**（必须修复）
- 缺陷：裁决③要求"增补 F004 相关条目，含 agents_md 条目 enabled=false 语义（仅影响阶段 4 注入，不影响 verify.sh 实际执行）"；实际 diff 仅新增 1 行（单执行器原则），未含 enabled=false 语义描述
- coder journal 39 §2 自报"13 条 F004 机械化约束行"，实际 diff 仅 1 行新增，自报与实际不符
- 取证：git diff d836349..35f09dc -- docs/conventions/convention-to-rule-mapping.md 仅有 +1 行

### 标准 12：前端 ConstraintsPage 真实接线
**PASS**
- 证据：ConstraintsPage.tsx 使用 useConstraints() hook → api/constraints.ts → client.ts（相对路径 /api/constraints）；ConstraintRulesSection.tsx 使用真实数据渲染，无 HARNESS_RULES 死数据残留

---

## §4 设计符合性抽检

| 裁决 | 要求 | 实测 | 判定 |
|---|---|---|---|
| A: 单执行器原则 | constraints/ 不执行检查 | grep 无 subprocess/exec/verify/lint 调用 | ✅ |
| B: 不新增 Node | graph/definition.py 无变更 | git diff 确认零变更 | ✅ |
| C: 不新增 State 字段 | harness_state.py 无变更 | git diff 确认零变更 | ✅ |
| D: in-memory store | 无 ORM | 无 sqlalchemy/Session/engine 导入 | ✅ |
| ③ enabled=false 语义 | 仅影响阶段 4 注入 | coding_agent 注入时 filter enabled=True；validation gates 不过滤 enabled | ✅ |

---

## §5 7 项歧义裁定 / 事实核查

### A: ConstraintUpdate.source 保护 vs 裁决③
**裁定：可接受**。当前实现 agents_md 仅允许 enabled toggle（PUT 403 文本篡改），manual 条目全字段可修改。裁决③原文"enabled=false 仅影响阶段 4 注入"——实现正确：coding_agent 注入时过滤 enabled=True，不影响 verify.sh。

### B: project_id 必填 vs 可选语义
**裁定：可接受**。ConstraintCreate 设 project_id 必填（min_length=1），ConstraintUpdate 不含 project_id（不可修改归属）。GET 端点 project_id 参数可选（不过滤时返回全部）。与设计文档一致。

### C: 10 个 RuleType 枚举完备性
**裁定：可接受**。10 个值与 AGENTS.md 硬性规则 1:1 映射，Pydantic Enum + TS 联合类型完全镜像。

### D: enforcement 两值语义正确性
**裁定：可接受**。mechanized = verify.sh 闸门自动执行，manual_review = 人工审查。api-spec.md 写法有误（verify_gate|agent_hint），但代码实现正确。

### E: 重复派生成因
**事实核查：coder 报告未送达 K 总导致重复派生**。journal 41 已定性，c670ec3 为平台自动提交（P011），对被审代码零改动。35f09dc 是唯一编码提交。

### F: coder 自报"13 行 convention-mapping"真实性
**事实核查：自报与实际不符**。实际 diff 仅 +1 行，非 13 行。coder 似将 registry.py 中 RULE_METADATA 的 13 条映射行误报为 convention-to-rule-mapping.md 行数。**属于自报失实**。

### G: 35f09dc 在 HEAD 历史中
**事实核查：确认**。git merge-base --is-ancestor 35f09dc HEAD 返回成功。

---

## §6 测试质量审查

### 后端测试（4 文件）
| 文件 | 行数 | 覆盖范围 | 内容级断言 | 判定 |
|---|---|---|---|---|
| test_constraints_parser.py | 55 | parse_agents_md 全路径 | 字段值/枚举/边界 | ✅ |
| test_constraints_registry.py | 95 | 初始化/active/gates/suggestion | 内容值匹配 | ✅ |
| test_constraints_api.py | 139 | GET/POST/PUT/403/404/422 | 状态码+响应体字段 | ✅ |
| test_constraints_nodes.py | 67 | 注入 payload/gates/suggestion | 结构+字段验证 | ✅ |

### 前端测试（3 文件）
| 文件 | 行数 | 覆盖范围 | 内容级断言 | 判定 |
|---|---|---|---|---|
| constraints.test.ts | 85 | API 函数调用 | mock 响应体字段 | ✅ |
| useConstraints.test.tsx | 80 | hook 状态转换 | data/error/loading | ✅ |
| ConstraintsPage.test.tsx | 175 | 渲染+交互 | title/rule_type/enabled/source | ✅ |

### 覆盖率
verify.sh 独立复跑：后端 98.57%（110 passed + 1 skipped），前端 93 passed。均 ≥80% 闸门。

### 测试质量总结
- 标准 7/8/9 两轮会话未做内容级断言实测——本次审查已独立补测，结果均 PASS
- 前端测试有良好内容级断言（非仅 status 200）
- 建议改进 N1：test_constraints_api.py 中 POST 创建后未断言 source_key 自动生成格式

---

## §7 行数与结构约束

| 检查 | 上限 | 实测 | 判定 |
|---|---|---|---|
| 单文件 ≤ 300 行 | 300 | 最大 ConstraintRulesSection.tsx=270 | ✅ |
| 新增文件 35 个 | — | git diff --stat 确认 | ✅ |
| 全部 Pydantic↔TS 类型镜像 | — | 10 字段 + 10 RuleType + 2 Enforcement 完全对齐 | ✅ |

---

## §8 verify.sh 独立复跑

- 命令：`UV_FROZEN=1 bash scripts/verify.sh`
- 结果：**14/14 PASS**
- 后端：110 passed + 1 skipped，覆盖率 98.57%
- 前端：93 passed
- 覆盖率闸门 ≥80%：PASS

---

## §9 总体结论

### 12 项标准汇总

| 标准 | 判定 | 证据来源 |
|---|---|---|
| 1 | PASS | curl 实测 |
| 2 | PASS | 源码审查 |
| 3 | PASS | curl 六项实测 |
| 4 | PASS | 源码审查 |
| 5 | PASS | curl 实测 |
| 6 | PASS | lint-imports 执行 |
| 7 | PASS | Python 调用实测 |
| 8 | PASS | Python 调用实测 |
| 9 | PASS | Python 调用实测 |
| 10 | **FAIL** | 源码↔api-spec 对照 |
| 11 | **FAIL** | git diff 取证 |
| 12 | PASS | 源码审查 |

### 必须修复（2 条）

1. **M1（标准 10）**：api-spec.md Constraint 字段声明缺 `source_key`/`enforcer`；`enforcement` 枚举值应为 `mechanized|manual_review` 非 `verify_gate|agent_hint`
2. **M2（标准 11）**：convention-to-rule-mapping.md 未含 agents_md 条目 `enabled=false` 语义描述（裁决③要求）

### 建议改进（5 条）

1. S1：coder journal 39 §2 自报"13 行 convention-mapping"与实际 diff 1 行不符，建议更正
2. S2：api-spec.md 可补充 `project_id` 在 GET 请求中的可选语义说明
3. S3：test_constraints_api.py POST 创建后可增断言 source_key 自动生成格式
4. S4：ConstraintRulesSection.tsx 270 行接近 300 行上限，后续迭代注意拆分
5. S5：前端测试可增加 PUT toggle enabled 的端到端场景

### 结论

**必须修复 2 条后可推进 passing**。核心逻辑（parser/registry/store/三端点/Node 注入/gates/suggestion）独立验证全 PASS，设计符合性全 PASS，verify.sh 14/14 PASS。两处缺陷均为文档同步问题，不影响运行时行为，但违反裁决①③的原子一致性要求，必须在推进前修复。
