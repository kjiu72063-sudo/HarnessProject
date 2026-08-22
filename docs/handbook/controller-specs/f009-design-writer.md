# F009 设计 Controller Spec — design-writer

任务: 产出 `docs/design/feature-f009-persistence.md`（Status: Draft, ≤300 行）
背景: Sprint3 首个 feature——持久化记忆系统（PostgreSQL 持久化 + LangGraph Checkpointer）。K总裁决 2026-08-22 F009 先于 F008（journal 87）。依赖 F002（已完成）。

## 已核实的设计输入（免重复调研, 可复核）

| 事实 | 位置 |
|---|---|
| Checkpointer 现状为 in-memory | server/graph/definition.py L54 `_make_checkpointer() -> MemorySaver`（L142 注入 graph 编译） |
| 会话存储为 in-memory 并行双 dict | server/routes/harness.py: `_sessions`（F002 先例）+ `_session_meta`（F013 新增, 含 session_id/status/requirement 摘要/started_at, 支撑 GET /api/harness/sessions 倒序列表） |
| database_url 配置已存在但零消费方 | server/config/settings.py L7 默认值 `postgresql://localhost:5432/harness_platform`; 全仓无业务消费（F014 清理范围仅 openai 两字段, 此字段为 F001 存量）——F009 将首次赋予其语义, 处置归本设计 |
| 技术栈基线 | AGENTS.md: PostgreSQL + Python 3.12 + FastAPI + LangGraph（不允许擅自升级） |
| F007 对 F009 的显式界定 | docs/design/feature-f007-sse-push.md L19+L135: 首版事件仅存内存 asyncio.Queue, 断线重连仅获快照+后续事件, 历史不可回放; 「F009 实现后可扩展 Last-Event-ID + 事件持久化回放」——本设计需决定纳入或显式声明非目标 |
| API 契约现状 | api-spec.md: POST /start, GET /{id}/state, GET /{id}/stream（SSE）, POST /{id}/resume, GET /sessions 共 5 端点; resume 语义与进程重启后会话恢复强相关 |
| 测试与环境约束 | verify.sh 15 项闸门 + pytest 覆盖率 ≥80%; 各会话沙箱环境漂移（P009）, PG 服务可用性跨会话未知——测试对无 PG 环境的策略需显式设计 |
| 部署侧关联 | .coze [project].requires 现为 nodejs 运行时; 若 F009 引入 PG 运行时依赖, requires 与 [deploy] 是否需变化——超出设计文档范围的部分列入开放问题提交 K总 |

## 8 项验收标准

1. **持久化范围界定**: LangGraph State checkpoint（MemorySaver 替换）/ 会话元数据（_sessions/_session_meta 切换）/ 事件流（F007 Queue, Last-Event-ID 回放扩展）三个层面各自纳入或排除, 逐项显式声明与理由
2. **Checkpointer 技术选型**: LangGraph 官方 Postgres saver（版本兼容性须与本仓 langgraph 锁定版本核实）vs 自研方案比较与推荐; 连接管理（池化/生命周期/async 语义）设计
3. **数据模型**: 所需表 schema（字段/类型/索引）设计; 与 _session_meta 现有字段映射; 迁移策略（当前无存量生产数据, 但 in-memory 会话的兼容处置需声明）
4. **会话存储切换**: harness.py 内存 dict → 持久层的读取方案; GET /sessions 列表端点数据源是否随之切换; **进程重启后 resume 端点行为语义**（重启前会话可恢复/不可恢复的显式契约）
5. **配置与降级**: database_url 消费方式（Settings/环境变量优先级）; **无 PG 环境降级策略**（启动失败 vs 内存 fallback vs 条件功能关闭）显式设计——降级语义影响所有下游会话, 必须无歧义
6. **测试策略**: 单测/集成测试对 PG 依赖的处理（测试库/fake/内存替代）; 覆盖率 ≥80% 在无 PG 环境的保障路径; verify.sh 15 项闸门零新增前提下验证方式
7. **跨文档影响评估**: api-spec.md（端点行为变化）/ state-design.md / boundaries.md / AGENTS.md 技术栈基线（若 requires 变化）——列出编码阶段需回写清单（F004 裁决①先例: 设计列清单, 编码执行回写）
8. **文档自身**: 遵循 docs/design/_template.md 骨架（目标/非目标/技术方案/验收标准/依赖+扩展节）, ≤300 行, 开放问题显式列出提交 K总裁决

## 硬性约束

- 纯文档产出零代码; 不修改任何 server/ src/ tests/ 文件
- LangGraph Node 委派桩原则不变（F002/F011）: checkpointer 属 graph 基础设施, 不得引入 Node 业务逻辑
- F007 已裁决语义不推翻: 单订阅/无轮询回退/首事件 snapshot 兜底; 若 F009 扩展 Last-Event-ID 回放, 须评估对 F007 契约的影响并列为开放问题（不自行裁定扩展与否之外的技术细节）
- 遵循既有分层（docs/architecture/boundaries.md）与命名规范（coding.md）
- 技术栈基线锁死: PostgreSQL + LangGraph 现锁定版本, 不引入新数据库或更换编排引擎

## 产出物

1. docs/design/feature-f009-persistence.md（Status: Draft）
2. harness-journal/stage-04-coding/90-f009-design-draft.md（设计决策 + 开放问题）
3. progress.txt 追加 1 行（design-draft）

## 开放问题（预计提交 K总裁决, 如实列出勿自行裁定）

- PG 运行形态与部署关联（沙箱/容器/连接串; .coze requires 是否变化）
- 事件持久化与 Last-Event-ID 回放是否纳入 F009 范围（F007 界定的扩展项）
- 无 PG 环境降级策略选型（启动失败 vs 内存 fallback vs 条件关闭）
- 迁移工具/初始化脚本是否属首版范围
