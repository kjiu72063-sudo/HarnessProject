# F004 Coder Controller Spec — 约束管理层实现

- 版本: 1.0
- 委派者: L1 管控 Agent
- 执行者: F004 Coder Agent（角色模板: docs/handbook/role-templates/coder.md）
- journal 预留: 39 = coder 执行记录（自写），40 = test-reviewer 审查记录（禁占）
- 设计权威: `docs/design/feature-f004-constraint-management.md`（Status: Approved，含 K总三条裁决注记）——设计文档与本 Spec 为唯一实现依据；L1 无先在内容结论，执行中一切内容判断以设计文档为准，发现 Spec 与设计冲突时以设计文档为准并在报告与 journal 39 中记录歧义事实（不裁定）

## 一、任务

按 Approved 设计文档实现约束管理层（AGENTS.md 解析器 + 规则注册表 + in-memory store + /api/constraints 三端点 + 阶段 4 注入 + 阶段 5 gates 扩展 + 前端 ConstraintsPage 数据接线 + 四层测试 + 四份跨文档同步），Sprint2 第一个正式 feature。

## 二、输入（冷启动序列）

1. AGENTS.md（全文——既是解析目标又是硬规则来源）
2. docs/design/feature-f004-constraint-management.md（Approved 设计，282+ 行）
3. docs/architecture/harness-flow.md / boundaries.md / state-design.md
4. docs/reference/api-spec.md / docs/conventions/convention-to-rule-mapping.md / coding.md / pitfalls.md（P001-P012）
5. 现有代码定位: server/graph/definition.py（coding_agent/validation 委派桩注入点）、src/pages/ConstraintsPage.tsx、src/api/、src/types/harness.ts
6. harness-journal/stage-04-coding/README.md（最近 3 条 journal）
7. docs/handbook/prompts/_bootstrap.md → role-templates/coder.md → scripts/coding-agent-start.sh

## 三、产出布局（设计文档既定，不自行增删模块）

```
server/constraints/parser.py      # AGENTS.md 解析器（纯文本抽取 13 条）
server/constraints/registry.py    # 规则↔执行器↔闸门映射注册表
server/constraints/store.py       # in-memory 存储（目标表结构为契约，ORM 留 F009）
server/routes/constraints.py      # GET/POST/PUT /api/constraints
server/schemas/constraint.py      # 三 Pydantic schema
src/api/client.ts                 # apiFetch 共享 client
src/api/constraints.ts            # 约束 API 客户端
src/hooks/useConstraints.ts       # 前端 hook
src/pages/ConstraintsPage.tsx     # 数据接线（改造既有静态原型）
src/data/constraintsData.ts       # 类型补齐（保留 mock 兜底语义）
src/types/harness.ts              # verify_result gates 类型扩展
pyproject.toml                    # import-linter 新合约（server/constraints 反向依赖）
server/tests/test_constraints_parser.py / test_constraints_registry.py / test_constraints_api.py
src/hooks/useConstraints.test.ts / src/pages/ConstraintsPage.test.tsx
```

## 四、验收标准（12 项，逐条自报证据）

| # | 标准 | 证据要求 |
|---|---|---|
| 1 | GET /api/constraints 返回 ≥13 条系统规则，字段完整（id/type/source/enabled/content/gate_ids/enforcement） | curl 实际响应摘录 |
| 2 | parser 纯文本抽取 ≥8/13 条；enforcement/gate_ids 由 registry 按 source_key 附加；跨文档约定（规则#13）等 5 条标 manual_review | parser 单测通过数 + registry 映射表摘录 |
| 3 | POST 创建 manual 条目（项目隔离语义）；PUT 更新 enabled；agents_md 条目文本修改 → 403 | API 集成测试三场景 |
| 4 | coding_agent 委派桩注入约束至 state["rules"]（manual enabled 全量 + agents_md 全量），非空 | 注入路径单测/集成测试 |
| 5 | validation 委派桩 verify_result 含 14 项 gates（id/label/passed） | gates 结构测试 + 实际摘录 |
| 6 | ConstraintsPage 三接线：无会话时系统规则渲染 / 启用开关（PUT）/ 新增自定义规则表单（POST）；统一 /api/ 相对路径经 apiFetch | 前端测试通过 + 手动预览路径说明 |
| 7 | import-linter 新合约通过 + boundaries.md 目录结构表新增 server/constraints/ 行 | verify.sh 第 5 项 PASS + boundaries.md diff |
| 8 | 测试覆盖率 ≥80%（server 与 src 分册），verify.sh 14/14 | 覆盖率数字 + verify.sh 输出 |
| 9 | 单文件 ≤300 行，单函数 ≤50 行 | wc -l 清单 |
| 10 | **【裁决①】api-spec.md 三端点请求/响应体细化 + project_id 可选语义（省略→仅返回系统规则）回写，与实现同一提交落地** | api-spec.md diff 摘录 |
| 11 | **【裁决③】convention-to-rule-mapping.md 增补 F004 相关条目，含 agents_md 条目 enabled=false 语义（仅影响阶段 4 注入，不影响 verify.sh 实际执行）** | mapping 文档 diff 摘录 |
| 12 | state-design.md 补 rules/verify_result(gates) 注记（设计文档跨文档同步待办表第 2/3 项） | state-design.md diff 摘录 |

## 五、约束（硬性，verify.sh 与审查会核）

1. **单执行器原则**：规则引擎不执行任何检查，只做注册/注入/结果消费；verify.sh 及工具链保持唯一执行器——不得新增任何 linter/检查器实现
2. **Node 委派桩原则**：不新增 LangGraph Node，不改 F002 拓扑；复用 rules 字段不新增 State 字段（verify_result 内部 gates 结构扩展为设计显式决策）
3. AGENTS.md 为解析目标**只读**，代码不得写入/改写它
4. 禁改: 设计文档（已 Approved）、.coze、journal 40、F002/F003 既有测试语义（扩展允许，语义破坏禁止）
5. 全部 13 条硬规则 + P009（uv sync 卡死替代法）/P010（UV_FROZEN=1）/P011（提交前 git diff --cached --stat 核对，含 untracked 自动 stage 检查）/P012（不转述未核实结论）
6. 提交锚点: 55f281e..HEAD 区间内自报最终 commit 哈希 + 文件清单（验收以 diff 范围为准）

## 六、报告格式

按 role-templates/coder.md：①验收标准逐条对照（表）②提交哈希与 diff 锚点 ③环境表 ④踩坑与 P 编号命中 ⑤产出物清单 ⑥自报歧义/存疑项（标注"备审查"，L1 不裁定）。

## 七、完成定义

验收标准 12 项全过 + verify.sh 14/14 + journal 39 自写 + progress.txt 追加一行（格式 `[时间] stage-04 | F004 | coding-done | 摘要`）+ 恰当文件数提交（P011 防护通过）→ L1 流程验收 → test-reviewer 独立审查（journal 40，无豁免）。
