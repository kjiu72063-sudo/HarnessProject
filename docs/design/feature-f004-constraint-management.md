# Feature: F004 约束管理层（AGENTS.md 解析 + Linter 规则引擎 + 架构约束）

## Status: Draft

## 目标

把 AGENTS.md 硬性规则、Linter 规则、架构约束从「散落在文档里的约定」升级为**结构化、可查询、可注入、可反馈的约束规则库**：AGENTS.md 解析为结构化条目，约束条目经 API 管理，阶段 4 注入编码 Agent（事前背压），阶段 5 消费 verify.sh 结果驱动反馈循环（事后校验），前端约束配置页从静态原型接真实 API。

## 非目标

- 不实现第二个检查执行引擎——verify.sh 及其工具链（ESLint/ruff/mypy/stylelint/dependency-cruiser/import-linter/pytest）保持唯一执行器（见「总体架构」裁决 A）
- 不自动改写 AGENTS.md——它是人类裁决的权威文档，反馈循环止于「规则更新建议」（见 §反馈循环）
- 不做 PostgreSQL 持久化——对齐 F002 先例（in-memory 存储），表结构落地属 F009
- 不改变 F002 已 Approved 的 StateGraph 拓扑（不新增 Node、不新增闸门）
- 不新增 settings 配置项（F014 裁决：禁止无消费方占位配置）

## 技术方案

### 总体架构与核心裁决

新增横切服务层 `server/constraints/`，三模块分工：

```
server/constraints/
├── parser.py    # AGENTS.md 硬性规则段 → 结构化条目（纯文本抽取）
├── registry.py  # 规则注册表：条目 ↔ 执行器 ↔ verify.sh 闸门映射 + 注入/结果消费
└── store.py     # in-memory 规则库（F002 先例，F009 换 PostgreSQL）
```

**裁决 A（单执行器原则，回应 Controller Spec 重点难点）**：Linter 规则引擎**不执行任何检查**。verify.sh 已实现 14 项机械检查，若引擎独立重实现将形成双轨：同一规则两处实现、结果可能漂移、维护成本翻倍。本设计中「规则引擎」= 规则管理层（registry + injection + result-consumption），三职责：

1. **注册**：每条规则条目登记 `rule_type` / `enforcer` / `enforcement` / `gate_ids`（verify.sh 闸门编号），元数据与 convention-to-rule-mapping.md 对齐
2. **注入**（阶段 4，事前）：激活的约束条目注入 Controller Spec 与 `state["rules"]`，编码 Agent 写码前感知全部约束——此时规则「下发」不「执行」
3. **结果消费**（阶段 5，事后）：validation 委派 Agent 跑 verify.sh 产出逐闸门 `verify_result`，registry 按 `gate_ids` 把闸门结果关联回规则条目，驱动反馈循环

**裁决 B（不新增 Node）**：约束注入内嵌于 `coding_agent` 委派桩（构造 Controller Spec 时调用 registry），结果消费内嵌于 `validation` / `problem_classification` 委派桩。约束管理层是服务层不是流程阶段，新增 Node 会改变 F002 已 Approved 拓扑。

**裁决 C（不新增 State 字段）**：复用 state-design.md 已定义的 `rules: list[dict]`（当前恒空）承载注入的约束条目序列化。新增 `constraints` 字段会与 `rules` 语义重叠。`verify_result: dict` 字段类型不变，**内部结构**扩展为逐闸门明细（显式标注：这是 dict 值结构扩展，非 State 字段变更）。

### 涉及的模块

| 模块 | 变更 |
|---|---|
| `server/constraints/` | 新增：parser / registry / store |
| `server/routes/constraints.py` | 新增：三端点路由 |
| `server/schemas/constraints.py` | 新增：Pydantic 模型 |
| `server/nodes/coding_agent.py` | 修改：Controller Spec 注入约束条目 |
| `server/nodes/validation.py` | 修改：verify_result 逐闸门结构 + 规则更新建议落 feedback_log |
| `server/app.py` | 修改：lifespan 启动时解析 AGENTS.md + 挂载新路由 |
| `src/types/constraints.ts` `src/api/constraints.ts` `src/api/client.ts` | 新增：TS 类型 / API 客户端 / 共享请求封装 |
| `src/pages/ConstraintsPage.tsx` | 修改：规则段接 API + 启用开关 + 新增规则表单 |
| `pyproject.toml` | 修改：import-linter 新增 constraints 反向依赖合约 |

### AGENTS.md 解析器设计（验收标准 1）

**解析范围与产物**：parser 只做**结构化文本抽取**，不做语义理解。定位 `## 硬性规则（CI 会验证）` 标题下的有序列表，逐条抽取编号 + 文本，产出 `source=agents_md` 的规则条目（`source_key = "agents-md-rule-{n}"`）。执行元数据（rule_type / enforcer / enforcement / gate_ids）不由解析器推断，而由 registry 内置映射表按 `source_key` 附加——**文本与元数据分离**是本设计关键判断：解析器保持极简（正则 + 切分），规则语义分类集中在一处映射表，与 convention-to-rule-mapping.md 逐条对齐，漂移时人工更新映射表即可。

**解析时机（裁决 D）**：FastAPI lifespan 启动时解析一次，进程内缓存。理由：AGENTS.md 变更低频；规则库生命周期 = 进程生命周期（与 F002 in-memory 会话表一致）；反馈循环的人工裁决更新天然发生在会话之间，重启感知可接受。代价（改 AGENTS.md 需重启才生效）明确接受，不做热刷新（YAGNI，且避免刷新端点扩 API 面）。

**13 条规则解析边界**（可机械执行性对齐 convention-to-rule-mapping.md 现状）：

| # | 规则 | enforcement | enforcer | gate_ids |
|---|---|---|---|---|
| 1 | API 相对路径 | mechanized | eslint no-restricted-syntax | [2] |
| 2 | 禁裸 print | mechanized | ruff T20 + mypy | [6, 7] |
| 3 | 禁 as any | mechanized | eslint no-explicit-any | [1, 2] |
| 4 | API 类型定义 | manual_review | 人工审查（schema+TS 成对） | [] |
| 5 | Node 委派桩 | manual_review | 人工审查（分层由 #8 闸门部分保障） | [8] |
| 6 | 端口固定 | mechanized | check_port_consistency | [14] |
| 7 | sub_id 不可变 | manual_review | git-level 约束（变更走 K 总裁决） | [] |
| 8 | Pydantic Body 模型 | manual_review | 人工审查（P003） | [] |
| 9 | Git 追踪 | mechanized | check_git_tracking | [13] |
| 10 | 全闸门通过 | mechanized | scripts/verify.sh | [1–14] |
| 11 | 文件/函数行数 | mechanized | eslint max-lines + 闸门 11 | [2, 11] |
| 12 | 技术栈基线一致 | mechanized | check_tech_stack_alignment | [12] |
| 13 | 规则→执行闭合 | manual_review | 跨文档约定，审计时人工校验 | [] |

含「须在 X 文档有对应行」的跨文档约定（#13）及语义性约束（#4/#5/#8）标注 `manual_review`、`gate_ids=[]`，不机械解析执行——这是解析范围边界：**条目全部可解析（13/13 抽取为结构化条目），但只有 mechanized 条目参与闸门结果关联**。

**与手工录入规则的关系（裁决 E）**：规则库两类条目共存——`source=agents_md`（系统规则，进程级共享，文本只读、`enabled` 可切换）与 `source=manual`（用户自定义，`project_id` 隔离，全字段可管理）。GET 按项目返回合并列表；同 `source_key` 不可能冲突（两类 ID 序列独立）。agents_md 条目文本只读的理由：文本必须与源文件一致，否则下次解析刷新即被覆盖，产生「保存了却丢失」的假象。

### 数据模型变更（验收标准 2）

**Pydantic schema**（`server/schemas/constraints.py`）：

```python
class RuleType(str, Enum):
    static_text = "static_text"          # 静态文本检查（eslint/ruff 规则族）
    file_size = "file_size"              # 文件/函数行数
    dependency_direction = "dependency_direction"  # 分层/依赖方向
    port_consistency = "port_consistency"
    tech_stack_alignment = "tech_stack_alignment"
    git_tracking = "git_tracking"
    doc_freshness = "doc_freshness"
    type_check = "type_check"
    test_coverage = "test_coverage"
    process_convention = "process_convention"      # 流程性约定（人工审查）

class Enforcement(str, Enum):
    mechanized = "mechanized"
    manual_review = "manual_review"

class ConstraintBase(BaseModel):
    project_id: str = ""            # agents_md 条目为空串（进程级共享）
    source: Literal["agents_md", "manual"]
    source_key: str                 # agents-md-rule-{n} / manual-{auto}
    rule_no: int                    # AGENTS.md 编号；manual 条目为 0
    title: str = Field(min_length=1, max_length=50)
    detail: str = ""
    rule_type: RuleType
    enforcer: str                   # 执行器标识（"ruff T20" 等）
    enforcement: Enforcement
    gate_ids: list[int] = []        # verify.sh 闸门编号关联
    enabled: bool = True

class Constraint(ConstraintBase):
    id: int
    created_at: str
    updated_at: str

class ConstraintCreate(BaseModel):   # POST 请求体（硬性规则 8）
    project_id: str = Field(min_length=1)   # manual 条目必须归属项目
    title: str
    detail: str = ""
    rule_type: RuleType
    enforcer: str = "manual"

class ConstraintUpdate(BaseModel):   # PUT 请求体
    title: str | None = None         # 仅 manual 条目可改
    detail: str | None = None
    enabled: bool | None = None      # 所有条目可改
```

**TS 类型**（`src/types/constraints.ts`，硬性规则 4）：`Constraint` / `ConstraintCreateRequest` / `ConstraintUpdateRequest` 与上逐一镜像，枚举用联合字面量类型。

**存储（裁决 F）**：`store.py` in-memory（`dict[int, Constraint]` + 自增 ID，对齐 F002 会话表先例）。**不引入 ORM 模型代码**——F014 裁决禁止无消费方占位，SQLAlchemy 模型待 F009 接线 PostgreSQL 时再落。目标表结构定义为设计契约：表 `constraints`，字段同 `Constraint`，唯一索引 `(source, source_key)`，普通索引 `project_id`；F009 迁移时按此契约建表，Alembic 脚本路径由 F009 设计文档定。

### Linter 规则引擎设计（验收标准 3）

规则类型分类见上 `RuleType` 十类，蓝本即 convention-to-rule-mapping.md 的「实现方式」列与 verify.sh 14 项闸门的现实分类。

**规则条目 ↔ 执行器 ↔ 闸门映射**是 registry 的核心数据：`gate_ids` 把规则条目挂到 verify.sh 闸门编号（见上表；多条规则可共享闸门，一条规则可关联多闸门，如 #10 → [1–14]）。闸门编号以 verify.sh 实际输出顺序为准（TS Check=1 … Port Consistency=14），registry 内置 `GATE_NAMES` 常量表与 verify.sh 对齐。

**执行时机**：

- 阶段 4（约束注入，事前）：`coding_agent` 委派桩调 `registry.active_constraints(project_id)` → 注入 Controller Spec `inputs.constraints` 并同步写 `state["rules"]` 快照。规则只「下发」不「执行」
- 阶段 5（结果消费，事后）：`validation` 委派 Agent 跑 verify.sh → `verify_result` 逐闸门结构（见下）→ registry 按 `gate_ids` 关联失败闸门到规则条目 → `problem_classification` 委派桩产出「规则更新建议」落 `feedback_log`（是否新增规则 / 现有规则是否失效）

### 架构约束设计（验收标准 4）

boundaries.md 的分层依赖约束**已由 import-linter（后端 2 合约）与 dependency-cruiser（前端规则）机械化**，本设计不重新实现，只登记：架构约束在规则库中以 `rule_type=dependency_direction` 条目存在（enforcer = import-linter / dependency-cruiser，gate_ids = [5, 8]），解析自 AGENTS.md #5 与 boundaries.md 约定（后两条以 manual 条目形态内置 registry 初始库，标注 `source=manual`、`source_key=boundary-{name}`，系统预置）。

F004 新增 `server/constraints/` 模块本身引入新分层边界，需补 import-linter 合约（pyproject.toml）：

```toml
[[tool.importlinter.contracts]]
name = "Constraints cannot import routes or nodes"   # 防反向依赖：服务层不碰 HTTP 与图
type = "forbidden"
source_modules = ["server.constraints"]
forbidden_modules = ["server.routes", "server.nodes"]
```

合法调用方向：`routes → constraints`（API 转发到服务）、`nodes → constraints`（委派桩取规则）、`constraints → schemas`。boundaries.md 需同步补 `server/constraints/` 一行（见跨文档同步待办）。

### LangGraph Node 形态与 State 对齐（验收标准 5）

硬性规则 5 的委派桩形态逐 Node 说明（Node 本身不含业务逻辑，约束逻辑全部在服务层）：

**`coding_agent`（阶段 4）**——修改 `build_controller_spec` 调用处，task 增补「遵守注入约束」：

```python
constraints = registry.active_constraints(state["project_id"])
controller_spec = build_controller_spec(state, task=..., role="coder", outputs=[...])
controller_spec["inputs"]["constraints"] = constraints   # 注入，仍是委派桩
return {"rules": constraints, ...}                       # State 快照（裁决 C）
```

**`validation`（阶段 5）**——委派桩产出从 `{"pass": bool, "summary": str}` 扩展为：

```python
verify_result = {
    "pass": result.pass_,            # 整体
    "summary": result.summary,
    "gates": [                       # 逐闸门（执行方：委派的 validation Agent 跑 verify.sh）
        {"gate_id": 1, "name": "TypeScript Check", "pass": True},
        ...  # 14 项
    ],
}
```

State 字段 `verify_result: dict` 类型不变（**显式标注：内部结构扩展**）；前端 `VerifyResult` TS 类型（`src/types/harness.ts`）补 `gates?: GateResult[]` 字段（可选，向后兼容旧快照）。

**`problem_classification`（阶段 5）**——规则更新建议作为 `feedback_log` 新条目类型：`{"event": "rule_update_suggestion", "gate_ids": [...], "suggestion": "...", "iteration_at_entry": n}`，由委派桩从委派结果透传。

### API 变更（验收标准 2/6）

对齐 api-spec.md 已预定义三端点，路径不变（本设计不改 api-spec.md，schema 细化建议见开放问题）：

```
GET /api/constraints?project_id={id}
  → 200 Constraint[]      # 系统规则(agents_md, 全局) + 项目手工规则(manual) 合并，rule_no 升序
  project_id 省略时仅返回系统规则（前端无会话态可用）
POST /api/constraints
  Request:  ConstraintCreate        # 仅创建 manual 条目；source/source_key 服务端生成
  → 201 Constraint；project_id 不存在 → 422
PUT /api/constraints/{id}
  Request:  ConstraintUpdate
  → 200 Constraint
  enabled 可更新（两类条目）；title/detail 仅 manual 条目可更新，
  agents_md 条目改文本 → 403（文本与 AGENTS.md 源一致，见裁决 E）
  id 不存在 → 404
```

### 前端接线设计（验收标准 6）

- **`src/api/client.ts`（新增）**：从 `harness.ts` 提取 `apiFetch` / `extractErrorMessage` 共享（消除双份封装）；`harness.ts` 改为引用，行为不变
- **`src/api/constraints.ts`（新增）**：`listConstraints(projectId?)` / `createConstraint(req)` / `updateConstraint(id, req)`，统一走 `/api/...` 相对路径（硬性规则 1）
- **`src/hooks/useConstraints.ts`（新增）**：对齐 `useSessionState` 模式；PUT/POST 成功后重拉列表
- **`ConstraintsPage.tsx` 修改**：
  - `RulesSection`：数据源 `HARNESS_RULES` 静态 → `useConstraints(projectId)`（projectId 取 `useSessionState` 快照的 `state.project_id`；无会话 → 不传参，仍展示系统规则）；状态列改 `enabled` 开关（PUT）；表头操作列支持删除？——不，非目标：本迭代仅「查看 + 启用切换 + 新增」，不做删除（PUT 语义与端点对齐）
  - 新增「添加自定义规则」折叠表单（POST，字段 title/detail/rule_type/enforcer）
  - `LinterSection`：保留 `LINTER_ENGINES` 静态（工具清单是环境事实非规则数据，无 API 源）
  - `GateResultsSection`：`verifyResult.gates` 存在时逐闸门渲染真实 PASS/FAIL（替换现状整体状态复制）；缺省回退 `--`；`VERIFY_GATES` 保留为闸门清单骨架
- **`constraintsData.ts`**：删除 `HARNESS_RULES`（被 API 替代），保留 `LINTER_ENGINES` / `VERIFY_GATES`

### 文档反馈循环闭环（验收标准 7）

对齐 harness-flow.md 阶段 5 虚线回路（更新 AGENTS.md + Linter 规则）：

```
validation 跑 verify.sh → verify_result.gates（逐闸门）
  → 失败闸门经 registry gate_ids 反查命中规则条目
  → problem_classification 产出规则更新建议 → feedback_log
  → K 总人工裁决 → 更新 AGENTS.md / convention-to-rule-mapping.md / verify.sh（文档与闸门同步演进）
  → 服务重启 → parser 重新解析 / registry 映射表同步更新
  → 下一轮 coding_agent 注入最新规则库                    ← 回路闭合
```

**裁决 G**：规则更新建议止于 feedback_log + journal（人类可读），不自动改写 AGENTS.md。理由：AGENTS.md 是「人类裁决的权威信息源」（WorkBuddy 评审结论：人类介入粒度 = 默认通过仅可疑拦截），自动改写会破坏权威性；建议→裁决→手工更新→重启再解析的链路已满足回路闭合。建议的产品化（独立 API）列开放问题。

### 测试策略（验收标准 8）

对齐 docs/conventions/testing.md，三层：

- **parser 单测**（`server/tests/test_constraints_parser.py`）：真实 AGENTS.md fixture → 13 条、编号/文本断言；缺「硬性规则」段的 fixture → 空列表不抛错；条目字段与 registry 映射表 join 后元数据完整（enforcement/gate_ids 非空校验仅对 mechanized）
- **registry/store 单测**（`server/tests/test_constraints_registry.py`）：系统+项目合并查询、enabled 过滤、PUT 边界（agents_md 改文本拒 403、改 enabled 放行）、POST 仅 manual、gate_ids 反查
- **API 集成测试**（`server/tests/test_constraints_api.py`，httpx AsyncClient，对齐 test_harness_api.py 先例）：三端点往返、422/403/404 错误路径、lifespan 启动后系统规则已加载
- **前端**：`src/api/constraints.test.ts`（请求路径/方法/序列化，对齐 harness.test.ts）；ConstraintsPage 渲染测试（列表/开关/表单）
- 覆盖率 ≥ 80%（闸门 9）；ESLint / ruff / mypy / import-linter 全过（闸门 1–8）

## 验收标准

1. `GET /api/constraints` 返回 ≥ 13 条系统规则条目，字段完整（source/source_key/rule_type/enforcement/gate_ids/enabled）
2. AGENTS.md 硬性规则段解析为结构化条目；解析器不依赖规则语义（纯文本抽取 + 映射表附加元数据）
3. POST 创建 manual 条目成功；PUT 切换 enabled 成功；PUT 修改 agents_md 条目文本返回 403
4. `coding_agent` 委派桩的 Controller Spec 含注入约束，且 `state["rules"]` 非空（stub 委派下）
5. `verify_result` 含 14 项 `gates` 逐闸门结构（stub 委派下由桩产出结构化占位）
6. ConstraintsPage 规则段展示 API 数据；无会话时显示系统规则；启用开关与新增表单可用
7. import-linter 新合约（constraints 不 import routes/nodes）通过；boundaries.md 补行
8. 测试覆盖率 ≥ 80%；verify.sh 14 项闸门全 PASS
9. 单文件 ≤ 300 行 / 单函数 ≤ 50 行

## 依赖

- F002 编排引擎（passing）：StateGraph 拓扑、委派桩、Controller Spec 机制
- F011 Agent Runtime（Approved）：delegate 接口（当前 stub，F004 注入语义在 stub 下即成立）
- 原型确认通过（约束配置页面）

## 跨文档同步待办（编码阶段执行，本设计不改这些文档）

| 文档 | 待办 |
|---|---|
| state-design.md | `rules` 字段补注「F004 起由约束注入填充（Constraint 条目序列化）」；`verify_result` 补注内部 gates 结构 |
| boundaries.md | 后端目录补 `server/constraints/`（约束服务层）一行及依赖方向 |
| api-spec.md | 三端点请求/响应体按本设计 §API 变更细化（是否采纳见开放问题 1） |
| convention-to-rule-mapping.md | F004 落地后规则条目状态复核（enforcement 快照一致性） |

## 开放问题（K 总裁决）

1. **api-spec.md 细化**：本设计给出三端点请求/响应体细节与 `project_id` 可选语义（省略 → 仅系统规则），与 api-spec.md 预定义形态（`GET ?project_id=`）存在小幅细化。是否按本设计回写 api-spec.md？回写动作属编码阶段跨文档同步，需 K 总确认口径。
2. **规则更新建议产品化**：建议当前落 feedback_log + journal（人类裁决链路）。若需在约束页可视化「待裁决建议」（如 `GET /api/constraints/suggestions` 新端点），涉及 api-spec.md 新增端点，超出 F004 范围，是否排期到后续 feature？
3. **agents_md 条目 enabled=false 的运行时效力**：禁用仅影响阶段 4 注入（不下发给编码 Agent），不影响 verify.sh 实际执行（闸门照跑）。此语义是否满足「约束配置」预期，或需要更强语义（禁用即跳过闸门）？后者需改 verify.sh 机制，超出 F004 范围。
