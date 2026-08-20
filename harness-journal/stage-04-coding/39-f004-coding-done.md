# Journal 39 — F004 约束管理层 Coder 执行记录

- **日期**: 2026-08-20
- **角色**: F004 Coder Agent
- **委派来源**: journal 38 (K总 Approve + L1 委派)
- **设计权威**: docs/design/feature-f004-constraint-management.md (Approved, 282 行)
- **Spec**: docs/handbook/controller-specs/f004-coder.md (12 项验收标准)

## 1. 环境表

| 项 | 值 |
|---|---|
| 沙箱 | 独立会话, 冷启动 |
| uv | 0.12.5, UV_FROZEN=1 全程前置 (P010 防护) |
| Python | 3.12.3 (.venv 已就绪, 未触发 P009) |
| pnpm | 9.15.9 |
| 基线 | HEAD=d836349 (锚点 55f281e 上游) |
| env | 无 UV_DEFAULT_INDEX 残留 |

## 2. 产出布局 (与 Spec 第三节对齐)

**后端 (新增 8 文件 + 修改 4 文件)**

- `server/schemas/constraints.py`: Pydantic 契约 — `RuleType` (十类), `Constraint` (id/project_id/rule_no/source/enabled/rule_type/title/detail/enforcer/enforcement/gate_ids), `ConstraintCreate` (POST), `ConstraintUpdate` (PUT, enabled-only), `ConstraintListResponse`, `ConstraintRules` (系统规则注入 payload: agent_runtime/session_scope/rules/baseline_gates)
- `server/constraints/parser.py`: AGENTS.md → 系统规则解析器 (单执行器原则: 只抽取, 不执行)。硬性规则段定位 → 逐条解析 → 十类 rule_type 归类 → `RULE_TYPE_GATE_MAP` 闸门映射。无法归类条目落 `manual_review`, 不关联闸门。**AGENTS.md 全程只读**
- `server/constraints/registry.py`: 规则注册中心。`ConstraintRegistry` 类: `refresh_agents_md_rules`(lifespan 启动时全量重解析, 变更重启感知, 裁决D), `list_constraints`(系统+项目规则合并, 系统规则只读), `create_manual_rule`, `update_constraint`(enabled toggle, 仅项目规则可改), `as_agent_payload`(阶段4注入 payload)
- `server/constraints/store.py`: 内存存储 (对齐 F002 会话先例, ORM 留 F009)。`InMemoryConstraintStore` + `initialize_default_constraints`
- `server/routes/constraints.py`: 三端点 — `GET /api/constraints?project_id=` (列表), `POST /api/constraints` (新增 manual 规则), `PUT /api/constraints/{rule_id}` (enabled toggle)。全部走 Pydantic 模型 [P003]
- `server/main.py`: lifespan 装载 registry (启动时解析 AGENTS.md) + `app.state.constraint_registry` 挂载 + 路由注册
- `server/nodes/coding_agent.py`: 阶段4注入 — runtime 上下文携带 `constraint_registry.as_agent_payload(project_id)`, 注入 controller_spec inputs
- `server/nodes/validation.py`: 阶段7消费 — `verify_result.gates` (逐闸门 `gate_id/label/status`), 由 enabled 规则的 gate_ids 派生 `passing_gates/failing_gates` 并回写 State (复用既有字段, 不新增 State 字段, 裁决C)
- `server/nodes/problem_classification.py`: 阶段8建议 — feedback_log 增加规则更新建议 (新增 manual 规则建议), 不自动改写 AGENTS.md (裁决G)

**前端 (新增 7 文件 + 修改 5 文件)**

- `src/api/client.ts`: `apiFetch`/`extractErrorMessage` 从 harness.ts 抽取共享 (含 FastAPI 422 数组 detail 兼容)
- `src/types/constraints.ts`: Constraint TS 类型 (与后端 Pydantic 逐字段对齐)
- `src/api/constraints.ts`: `fetchConstraints`/`createConstraint`/`updateConstraintEnabled`
- `src/hooks/useConstraints.ts`: 规则列表/新增/toggle 状态管理 (对齐 useSessionState 模式)
- `src/components/ConstraintRulesSection.tsx`: 规则段组件 — 系统规则(只读标签)与项目规则(可 toggle/可删)分区渲染, rule_type 标签
- `src/pages/ConstraintsPage.tsx`: 硬性规则区接真实 API (GET 列表 + PUT toggle + POST 新增表单), 闸门区改逐闸门真实 PASS/FAIL 渲染
- `src/lib/constraintsData.ts`: 删除 `HARNESS_RULES` 静态死数据 (死配置清理), 保留 `LINTER_ENGINES`/`VERIFY_GATES`
- `src/types/harness.ts`: `GateResult {gate_id,label,status}` + `VerifyResult.gates`/`passing_gates`/`failing_gates`

**跨文档同步 (裁决①, 同一提交原子落地)**

- `docs/reference/api-spec.md`: 新增 `/api/constraints` 三端点契约 (GET/POST/PUT + Pydantic 模型 + 422 错误)
- `docs/conventions/convention-to-rule-mapping.md`: 新增 13 条 F004 机械化约束行 (约束模块 import-linter 合约 ×3, AGENTS.md 只读, Pydantic 强类型 API, 规则解析器单执行器, 无新增 Node/State 字段, 规则注入/消费链路)
- `docs/architecture/state-design.md`: verify_result.gates 结构扩展说明
- `docs/architecture/boundaries.md`: 约束模块分层 (schemas/constraints = server 内部层, 禁入 nodes/routes)

**import-linter (pyproject.toml)**

新增 3 条合约: `constraints-isolated` (constraints 包禁 import nodes/routes — 单执行器隔离), `constraints-schemas` (constraints 包禁 import routes), `routes-no-registry-direct` (routes 只经 app.state 访问 registry, 禁直接 import constraints.registry 实例化)。

## 3. 验收标准逐项对照 (12 项)

| # | 标准 | 结果 | 证据 |
|---|---|---|---|
| 1 | AGENTS.md 只读, 解析器只读不写 | ✅ | parser.py 仅 `read_text`, git status 无 AGENTS.md 变更 |
| 2 | 硬性规则 13 条全部条目化, 5 条 manual_review | ✅ | test_constraints_parser.py: 13 条全解析 + 5 条 manual_review 断言 |
| 3 | 十类 rule_type 覆盖 | ✅ | parser RULE_TYPE_RULES 十类 + 测试覆盖每类 |
| 4 | 系统规则只读, manual 规则可增改 | ✅ | registry: 系统规则 source=agents_md 无 update 路径; 测试断言 |
| 5 | 三端点实现 + Pydantic | ✅ | routes/constraints.py 三端点全 BaseModel [P003] |
| 6 | lifespan 解析 AGENTS.md | ✅ | main.py lifespan 调 registry.refresh_agents_md_rules |
| 7 | coding_agent 注入 payload | ✅ | nodes/coding_agent.py runtime inputs 携带 constraints payload |
| 8 | validation gates 结构 + passing/failing 派生 | ✅ | nodes/validation.py: gates 逐闸门 + 派生字段回写 |
| 9 | problem_classification 规则更新建议 | ✅ | feedback_log 建议条目 (不自动改写) |
| 10 | api-spec.md 回写 | ✅ | 新增 /api/constraints 段 (裁决①) |
| 11 | convention-to-rule-mapping 同步 | ✅ | 13 条新行 (裁决③口径: enabled=false 不影响闸门) |
| 12 | verify.sh 14 项全过 | ✅ | 本提交前复跑 14/14 PASS |

## 4. 决策记录

1. **PUT vs POST**: 设计文档 §5 指明 POST 创建 + PUT 更新。初次测试断言按 PATCH 写 (实现按设计), 修正测试断言 — 设计文档为准
2. **api_path 断言笔误**: 页面测试曾断言 `api_path` 字段, 权威契约 Constraint 无此字段, 改为断言 title — 已修正
3. **extractErrorMessage 422 兼容**: FastAPI 422 返回数组 detail, client.ts 增加数组分支 — 跨栈契约增强, 未改后端
4. **测试间状态污染**: registry/store 为模块级单例, API 测试需自装 fixture; 节点测试通过 fixture 初始化 — 已修复, 全量 110 后端测试通过
5. **长函数拆分**: 页面测试两函数 >50 行触发 Gate 12, 拆出 setup helper — 修复过程一次 sed 操作截断文件尾部, 已完整恢复
6. **App.test.tsx 断言更新**: 旧断言指向已删除的静态 HARNESS_RULES 区, 改为断言新「已解析系统规则」空态 — 属 F004 预期破坏性变更

## 5. 踩坑与 P 编号命中

| 命中 | 说明 |
|---|---|
| P003 | POST/PUT 全 Pydantic BaseModel, 测试含 422 断言 |
| P010 | 全程 UV_FROZEN=1 前置, uv.lock 零漂移 |
| P011 | 提交前 git status --short + git diff --cached --stat 双向核对 |
| P009 | 未触发 (venv 已就绪, 未执行 uv sync) |
| 新增 | vitest 单文件跑过、全量跑挂 = 测试间 mock/单例污染, 需 fixture 隔离 (候选 P013, 备审查) |

## 6. 产出物清单

- 后端: server/schemas/constraints.py, server/constraints/{__init__,parser,registry,store}.py, server/routes/constraints.py, server/main.py (lifespan), server/nodes/{coding_agent,validation,problem_classification}.py (接线)
- 后端测试: server/tests/test_constraints_{parser,registry,api,nodes}.py (28 测试)
- 前端: src/api/{client,constraints}.ts, src/types/constraints.ts, src/hooks/useConstraints.ts, src/components/ConstraintRulesSection.tsx, src/pages/ConstraintsPage.tsx, src/lib/constraintsData.ts, src/types/harness.ts
- 前端测试: src/api/constraints.test.ts, src/hooks/useConstraints.test.tsx, src/pages/ConstraintsPage.test.tsx, src/test/factories.ts (buildConstraint), src/App.test.tsx (断言更新)
- 文档: api-spec.md / convention-to-rule-mapping.md / state-design.md / boundaries.md
- 配置: pyproject.toml (import-linter 3 合约)

## 7. 自报歧义/存疑项 (备审查, 不裁定)

1. **verify_result.gates 顺序**: 设计文档未规定 gates 数组的排序口径, 实现按 verify.sh 闸门编号 1-14 自然序。若需按 pass/fail 分组排列, 需 test-reviewer 确认口径
2. **project 规则的删除入口**: 设计文档 §7 要求 manual 规则"可删"已在 API 层提供 (PUT enabled + store 删除语义由 enabled=false 承担), 前端只做了 toggle。存疑: 是否需要显式 DELETE 端点? 实现按"enabled=false 即等效删除"处理 (裁决③ enabled=false 仅影响阶段4注入)
3. **测试污染新增 P013 候选**: vitest 单跑过全量挂的 mock 泄漏模式, 建议记入 pitfalls.md。是否收录由 test-reviewer/L1 按踩坑记录规则裁定
4. **LINTER_ENGINES 数据去向**: constraintsData.ts 保留 LINTER_ENGINES/VERIFY_GATES (设计文档 §7 只要求删 HARNESS_RULES), 未做深改

## 8. 验证环境

| 项 | 结果 |
|---|---|
| verify.sh | 14/14 PASS |
| 后端 pytest | 110 通过 (82 既有 + 28 新增) |
| 前端 vitest | 93 通过 |
| ruff + mypy + import-linter (3 合约) | 全过 |
| tsc + eslint + stylelint + dependency-cruiser | 全过 |
| 覆盖率 | ≥80% (Gate 10) |

## 9. 会话复验附记（2026-08-20T03:20Z, 重复派生会话）

**场景**: K总按同一启动提示词再次派生 coder 会话（journal 38 委派源）。冷启动核实: 提交 35f09dc 已在仓库（HEAD）、journal 39 与 progress coding-done 行已写入、工作区干净 → **判定不重做**（P011 已有 a577463 重复提交实证教训）, 本会话使命转为现状核实 + 独立等效复跑。

**环境漂移**（P009 预防规则的会话探测场景命中）: 本会话沙箱无 uv、无 .venv, 仅系统 Python 3.12.3 + pip 24.0（aliyun 镜像已配置）。首轮 verify.sh 复跑 10/14——后端 4 项（Ruff/Mypy/import-linter/Tests）全部 `uv: command not found`, 前端 10 项全过。失败为环境缺失, 非代码缺陷。

**P009 替代法重建**（本会话实测路径, 供后续会话复用）: `pip install uv`（镜像源, 装得 uv 0.12.5 与前次会话同版）→ `export UV_DEFAULT_INDEX=https://mirrors.aliyun.com/pypi/simple/` → `UV_FROZEN=1 uv venv && UV_FROZEN=1 uv pip install -r <(UV_FROZEN=1 uv export --frozen)` → 用后即 unset UV_DEFAULT_INDEX（P010）。全程 UV_FROZEN=1 前置。

**等效复跑结果（HEAD=35f09dc, 2026-08-20T03:20Z）**:

| 项 | 结果 |
|---|---|
| verify.sh | **14/14 PASS** |
| 后端 pytest | 110 passed + 1 skipped, 覆盖率 98.57% (≥80%) |
| import-linter | 3 kept, 0 broken（含 F004 新增 3 合约） |
| 前端 vitest | 93 passed (17 文件) |
| uv.lock | 零漂移（git diff 无输出） |
| 工作区 | 干净（复跑后无任何变更） |

**progress.txt 未追加**: coding-done 状态未变化, 本附记为证据补强而非新状态; 避免重复状态行。journal 40 未占用。本会话唯一文件变更 = 本附记。
