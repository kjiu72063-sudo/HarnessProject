# AGENTS.md

## 项目简介

面向"一键开发应用"的元应用平台，基于 Harness Engineering 方法论 + LangGraph 编排引擎，用户输入需求 → Agent 按 8 阶段 Harness 流程生成可部署应用。

## 当前阶段与下一步

- **已完成**: 阶段0初始化 + 阶段1信息层(含原型确认通过) + 阶段2约束层(12轮审计收敛，verify.sh 14项全通过) + Sprint1设计文档全部Approved(F011+F002+F003+F006) + 跨文档同步(state-design.md/boundaries.md/harness-flow.md/convention-to-rule-mapping.md, L3校验通过) + 设计审批HITL闸门通过(2026-08-19, K总批准)
- **当前**: **Sprint1最终验收通过(2026-08-20, K总, journal 27/28), 跨文档同步批次(a)-(f)已执行完毕**(journal 28); **F014 settings死配置清理已闭环**(2026-08-20: coder提交5e736d2/journal 29 → L1流程验收journal 32(33更正) → L3审查通过journal 30(8标准全过/0必须修复) → 闭环journal 34; feature_list.json中Settings死配置清理条目→passing, 委派链口径记F014)。**功能编号映射已裁决对齐**(2026-08-20 K总确认以委派链口径为准, feature_list.json/current-sprint.md已修正, journal 35): **F012=Playwright / F013=API会话列表端点 / F014=Settings死配置清理**, 后续所有委派链统一此口径。**F004约束管理层已闭环passing**(2026-08-20: 设计Approved journal 38 → coder 35f09dc/journal 39 → L3审查10/12+M1/M2修复(journal 40/43) → 复审8项全PASS+歧义α/β接受(journal 44) → 闭环journal 46; 设计三条裁决: ①api-spec回写 ②建议产品化记F015 backlog ③enabled=false仅影响阶段4注入)。原批次(a)-(f)明细:原批次(a)-(f)明细: (a)api-spec.md对齐/api/harness/*; (b)F002设计"mypy strict"表述修正; (c)state-design.md回写resume {status}契约; (d)token_usage_total已存在确认; (e)settings命名规范裁决落coding.md+死配置清理微任务(F014)委派产出; (f)journal 15口径更正段。Sprint2规划已产出(current-sprint.md重写+feature_list.json新增F012/F013/F014)。
- **下一步**: 1) Sprint2后续按current-sprint.md排序: F005优先, L1产出F005设计Agent委派三件套后K总派生(设计→K总Approve→编码, Sprint1/2先例); 2) journal 40记档的5条建议改进+coding规范5轮修订差异(journal 39 §7)留后续批次统筹, 不混批; 3) F015留backlog(触发条件见feature_list.json)。环境事实: L1会话亦命中P009环境漂移(uv缺失致verify.sh四项FAIL, journal 46 §5), 替代构建法实测有效; 其余环境事实见pitfalls.md。环境事实: 各会话沙箱环境漂移, uv sync网络受限时卡死(根因与替代构建法见pitfalls.md P009); UV_DEFAULT_INDEX残留时uv run会重写已提交lock(P010, 防护UV_FROZEN=1); 平台hookspath自动stage含untracked文件(P011, 实证4-6: 提交前git diff --cached核对+验收锚定diff范围而非HEAD, F014批次三条新实证已沉淀)环境事实: 各会话沙箱环境漂移, uv sync网络受限时卡死(根因与替代构建法见pitfalls.md P009); UV_DEFAULT_INDEX残留时uv run会重写已提交lock(P010, 防护UV_FROZEN=1); 平台hookspath自动stage(P011, 提交前git diff --cached核对, F003审查产出a577463重复提交实证)
- **原型确认**: 4页面(需求输入/流程监控/约束配置/产物管理)已通过，K总认为可先走通第一版再迭代。后续功能需求记入feature_list.json排期
- **WorkBuddy评审**: 发现单体Agent反模式(L1自己调skill产出=自己干非委派) + 设计文档16项缺陷。K总确认: 回退点=设计闸门不回退代码, "skill≠agent"作为F011基础约束, 人类介入粒度=默认通过仅可疑拦截
- **L1职责边界**: L1只做流程检查(产出存在/journal写入/约束遵守/复跑verify.sh仅记录PASS与FAIL), 不做内容质量判定。内容质量校验必须委派L3校验Agent。**复现缺陷/根因分析/缺陷定级/修复方向裁定=内容测验, 一律委派L3, L1不得以"取证""验收需要"为由自行深入**(2026-08-19 F002验收时L1越界自测被K总纠正, 见journal 04, 修订R1因此作废)。verify.sh失败时的正确动作: 记录流程事实→委派L3校验→基于校验结论出修订ControllerSpec。修订后必须重新校验, 不得以任何理由跳过。

**复发警示与黑名单(2026-08-20 journal 33, P012)**: 换任L1在F014验收时再次越界被K总纠正——①自行grep源码复核验收标准 ②向K总呈报内容结论且转述coder自报证据冒充已核实 ③对Spec口径歧义作出"接受"合规裁定。**边界判定测试**: 问"产出存在吗/数量对吗/journal写了吗/闸门PASS还是FAIL"=流程可做; 问"内容正确吗/达标吗/某字段变没变/该解释可接受吗"=测验禁止, 一律移交L3。**黑名单**: 逐条自测ControllerSpec内容标准(哪怕只grep一条)/把grep或diff比对源码结果作验收结论/对coder标注"备L1裁定"的内容歧义署名裁定(L1只记录歧义事实, 转交L3或K总)/把自报证据转述为已核实。唯一例外: 复跑verify.sh仅记录PASS/FAIL。git取证仅限提交范围/暂存区/工作区状态等流程事实。L1验收表只允许四类行: 产出存在/journal与progress写入/约束遵守/verify.sh复跑PASS-FAIL。
- **方案文档**: harness-journal/stage-02-feature-breakdown/02-agent-society-and-revision-plan.md
- **新会话**: 先读本文件→progress.txt→feature_list.json→docs/plans/current-sprint.md→harness-journal/README.md(必读!最近3条journal)→**harness-journal/stage-04-coding/31-l1-handoff.md(前任L1交接journal, 2026-08-19换任, 含任期决策链全景+教训强化+待办, 新任L1必读)**→**harness-journal/stage-04-coding/33-l1-boundary-violation-correction.md(L1边界越界复发事故+边界判定测试黑名单+对journal 32的更正段, 新任L1必读!)**
- **L1换任**: 2026-08-19 前任L1上下文将满, K总决策换任。交接已完备: journal 31(交接全景) + 本文件状态段已更新。新任L1已冷启动并完成F014流程验收+test-reviewer委派(journal 32), 现等待审查报告。2026-08-20该L1在验收时越界自测被K总纠正(journal 33), 内容结论作废, 委派产物已修订去锚定, 边界规则已黑名单化(见L1职责边界段)

## 技术栈基线（不允许擅自升级）- 前端: React 19 + TypeScript + Vite 7（不迁 Next.js）
- 后端: Python 3.12 + FastAPI + LangGraph
- 数据库: PostgreSQL
- LLM: OpenAI ChatGPT（可插拔，首个实现）
- 包管理: 前端 pnpm，后端 uv
- UI: Tailwind CSS

## 快速导航

| 你想做什么 | 去哪里看 |
|---|---|
| 了解 Harness 8 阶段流程 | docs/architecture/harness-flow.md |
| 了解前后端分层边界 | docs/architecture/boundaries.md |
| 了解 LangGraph State 设计 | docs/architecture/state-design.md |
| 了解 API 接口规范 | docs/reference/api-spec.md |
| 了解编码规范 | docs/conventions/coding.md |
| 了解约定→机械规则对照表 | docs/conventions/convention-to-rule-mapping.md |
| 了解环境审查实践 | docs/conventions/env-review.md |
| 了解踩坑记录与排查 | docs/conventions/pitfalls.md |
| 了解测试规范 | docs/conventions/testing.md |
| 了解设计文档模板 | docs/design/_template.md |
| 了解当前迭代任务 | docs/plans/current-sprint.md |
| 了解功能列表 | feature_list.json |
| 了解最近进展 | progress.txt |
| 了解开发日志与阶段产出 | harness-journal/README.md |

## 硬性规则（CI 会验证）

1. 前端调用后端 API 统一走相对路径 `/api/...`，禁止硬编码域名/IP/localhost
2. 后端 Python 代码禁止裸 `print()`，统一用 `logging`
3. 前端禁止 `as any` 和隐式 `any`
4. 新增 API 必须有对应类型定义（Pydantic schema + TS 类型）
5. LangGraph Node 是委派桩/状态转换器：接收 State → 委派 Agent Runtime 执行 → 返回更新后的 State。Node 本身不含业务逻辑。（F011/F002 已 Approved，正式生效）
6. 端口: 前端 Vite 固定 5000，后端 FastAPI 固定 8000
7. 不修改 .coze 中的 sub_id
8. POST/PUT 路由请求体必须用 Pydantic BaseModel，禁止裸参数 [P003]
9. `progress.txt` 和 `feature_list.json` 必须纳入 Git，不可被 .gitignore 排除 [P004]
10. 所有代码变更必须通过 `scripts/verify.sh` 全闸门（14项: 类型检查+Lint+CSS Lint+前端测试+分层依赖+覆盖率≥80%+文件大小+文档新鲜度+技术栈基线一致性+Git追踪+端口一致性）
11. 单文件 ≤ 300 行；单函数/方法 ≤ 50 行（ESLint + verify.sh 强制）
12. AGENTS.md 技术栈基线必须与 `package.json`/`pyproject.toml` 实际安装版本一致，初始化后及每次审计时交叉验证 [P008]
13. 审计时必须执行「规则→执行」闭合校验：AGENTS.md 每条规则须在 `convention-to-rule-mapping.md` 有对应行且状态为「✅ 已机械化」或「⚠️ 人工审查」，详见该文档"审计闭环校验"段

## 常见问题和预防

遇到报错先查 `docs/conventions/pitfalls.md`，按错误关键词搜索。已知踩坑索引：

| 编号 | 错误关键词 | 一句话 |
|---|---|---|
| P001 | `ERR_PACKAGE_PATH_NOT_EXPORTED` | Vite 7 不兼容 plugin-react 6.x，锁定 4.3.4 |
| P002 | `no-undef` 指向 `.venv/` | ESLint globalIgnores 必须排除 .venv 和 server |
| P003 | POST 返回 `422` | 路由参数必须用 Pydantic Body 模型 |
| P004 | `progress.txt` 无法提交 | 检查 .gitignore 通配规则误匹配 |
| P005 | dependency-cruiser `must NOT have additional properties` | v18 的 `message` 改为 `comment` |
| P006 | `no-undef` 指向 `.dependency-cruiser.cjs` | ESLint globalIgnores 需排除配置文件 |
| P007 | `Could not find .importlinter.toml` | import-linter 配置必须放 pyproject.toml |
| P008 | AGENTS.md 声明版本与实际安装不一致 | 技术栈基线必须与 package.json/pyproject.toml 交叉验证 |

新增踩坑时按 `docs/conventions/coding.md` 的「踩坑记录规则」执行。

## 目录结构

```
├── src/                # 前端源码 (React + Vite)
├── server/             # 后端源码 (Python + FastAPI + LangGraph)
│   ├── graph/          # LangGraph 状态图定义
│   ├── nodes/          # Harness 各阶段 Node 实现
│   ├── models/         # 数据库模型
│   ├── routes/         # API 路由
│   ├── config/         # 配置
│   └── schemas/        # Pydantic schema
├── docs/               # 结构化知识库
├── scripts/            # 构建与启动脚本
│   ├── dev.sh          # 双栈开发启动
│   ├── verify.sh       # 全链路闸门（等价 mvn verify）
│   ├── coding-agent-start.sh  # 编码 Agent 会话启动（5步标准流程）
│   └── ...
├── progress.txt        # 持久化进度记忆
├── feature_list.json   # 功能列表与状态
├── harness-journal/    # 开发日志（记录真实开发顺序与产出，与项目运行无关）
├── .coze               # 平台配置
└── .preview            # 预览端口声明
```

## 提交规范

feat / fix / refactor / docs / test / chore
