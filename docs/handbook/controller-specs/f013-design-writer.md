# F013 设计 Controller Spec — design-writer

任务: 产出 `docs/design/feature-f013-session-list-api.md`（Status: Draft）
背景: GET /api/harness/sessions 列表端点，消除前端 localStorage 最近会话限制（Task5 审查建议 + K总最终验收指示）。依赖 F002（已完成）。

## 已核实的设计输入（免重复调研，可复核）

| 事实 | 位置 |
|---|---|
| 会话存储为 in-memory dict | server/routes/harness.py L47 `_sessions: dict[str, Any]`（F002 先例，无持久化） |
| 现有 5 端点 | POST /start、GET /{id}/state、GET /{id}/stream（F007）、POST /{id}/resume；均无列表端点 |
| agent_sessions.py 占位 stub | 返回空列表，main.py L41 仍注册路由 `/api/agent-sessions`；api-spec.md L41 明确已被 /api/harness/* 取代但文件未删 |
| 前端 localStorage 消费 | src/lib/recentSessions.ts（key=harness_recent_sessions，隐私模式静默降级先例 L36）；RequirementPage 消费渲染 RecentProjects 组件 |
| F012 E2E 关联 | tests/e2e/requirement.spec.ts 的 R 场景覆盖最近会话区域，前端切换后测试可能需同步 |
| api-spec.md 现状 | 5 端点已登记，sessions 列表端点未预定义——回写属编码阶段（F004 裁决①先例） |

## 8 项验收标准

1. **列表端点数据源设计**：基于 `_sessions` 遍历的响应构造方案；字段集逐一定义（session_id / status / requirement 摘要 / tech_stack / 时间戳等），说明全量 state 是否包含及理由；排序规则明确（如按启动时间倒序）
2. **存储层增量设计**：`_sessions` 当前 value 结构是否满足列表字段需求；不满足时的最小增量（如记录启动时间戳）；禁止引入持久化（F009 范围）
3. **agent_sessions.py stub 处置**：明确删除（含 main.py 路由注册行同步移除）或保留两个选项的比较与推荐——api-spec.md L41 历史注记的对应更新方案
4. **前端切换设计**：RequirementPage 最近会话数据源 localStorage → API 的切换方案；localStorage 是否保留为兜底（隐私模式降级先例）或完全移除（含 recentSessions.ts 文件处置与 F012 E2E R 场景影响评估）
5. **分页/过滤范围界定**：首版是否需要（project_id 过滤 / limit / offset），无则显式声明非目标与理由
6. **数据契约**：Pydantic 响应模型字段 + TS 类型镜像；api-spec.md 回写口径（编码阶段，F004 裁决①先例）
7. **测试策略**：后端列表端点测试（空列表/多会话排序/字段完整性）+ 前端 mock 测试；E2E 是否扩场景
8. **文档自身**：遵循 docs/design/_template.md 骨架（目标/非目标/技术方案/验收标准/依赖 + 扩展节），≤300 行，开放问题显式列出

## 硬性约束

- 纯文档产出零代码；不修改任何 server/ src/ 文件
- LangGraph 拓扑零改动（Node 委派桩原则，F002/F011 约束）
- 单执行器原则不变（F004）：不引入 verify.sh 之外的执行机制
- 遵循既有分层（docs/architecture/boundaries.md）与命名规范（coding.md）
- F007 单订阅语义不受影响（列表端点只读，不触碰 _event_queues）

## 产出物

1. docs/design/feature-f013-sse-…（命名 feature-f013-session-list-api.md）
2. harness-journal/stage-04-coding/79-f013-design-draft.md（设计决策 + 开放问题）
3. progress.txt 追加 1 行（design-draft）

## 开放问题（预计提交 K总裁决，如实列出勿自行裁定）

- agent_sessions.py stub 处置（删除 vs 保留）
- localStorage 兜底保留 vs 完全移除
- 首版分页/过滤范围
- 时间戳字段依赖存储层增量的取舍
