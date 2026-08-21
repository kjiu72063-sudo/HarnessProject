# F013 Coder Controller Spec — API 会话列表端点

> 委派链: journal 80（设计Draft验收）→ journal 81（审批落地+本委派）→ **journal 82 = coder 执行记录** → journal 83 = test-reviewer 审查记录（预留禁占）
> 设计文档（已 Approved）: `docs/design/feature-f013-session-list-api.md`（217 行 + 裁决注记）——唯一实现依据，冲突时以设计文档为准

## 任务

按已 Approved 的设计文档实现会话列表端点：GET /api/harness/sessions + _session_meta 存储层 + agent_sessions.py stub 删除 + 前端 localStorage 切换 + 跨文档同步。

## 硬性约束（违反即 FAIL）

1. **【裁决①stub 删除】**：删除 `server/routes/agent_sessions.py` + main.py 注册行；api-spec.md 该端点历史注记按设计 §3 方案更新；禁止保留死代码
2. **【裁决②localStorage 完全移除】**：删除 `src/utils/recentSessions.ts`（及其测试）、移除所有 addRecentSession 调用；最近会话数据源唯一化为新端点；禁止双源并存
3. **【裁决③首版无分页】**：端点无 limit/offset/cursor 参数；返回全量列表由前端截取（设计 §5 四条理由）
4. **【裁决④+⑤α=方案 A】**：`_session_meta` 为**独立 dict**（key=session_id, value 含 requirement+started_at）；现有 4 端点（start/state/stream/resume）零改动；不引入持久化、不改 _sessions 结构
5. **POST 请求体规范**：若涉及 POST/PUT 一律 Pydantic BaseModel [P003]；本 feature 预期为纯 GET，如实现偏离须自报
6. **单文件 ≤300 行 / 单函数 ≤50 行**；TS 严格类型禁 `as any`；Pydantic schema + TS 类型镜像 [规则4]
7. **禁改清单**：`.coze`、`docs/design/feature-f013-session-list-api.md`、journal 78/79/80/83、本 Spec 与 launch prompt、`progress.txt` 既有行（只可追加）
8. **提交规范**：commit message 用 `feat(F013): ...` 前缀；提交前 `git status --short` + `git diff --cached --stat` 双向核对（P011）；全程 `UV_FROZEN=1` + uv.lock 零漂移

## 验收标准（12 项）

| # | 标准 | 验证方式 |
|---|---|---|
| 1 | GET /api/harness/sessions 实现：6 字段（session_id/status/project_id/current_stage/requirement_summary/started_at）+ started_at 倒序 | 代码+运行检查 |
| 2 | 【裁决④】_session_meta 独立 dict：start 时写入 requirement+started_at；start/state/stream/resume 4 端点 diff=0 | git diff 验证 |
| 3 | 【裁决①】agent_sessions.py 及 main.py L41 注册行删除；api-spec.md 历史注记按设计 §3 更新；全仓无残留引用 | grep 零命中 |
| 4 | 【裁决②】recentSessions.ts 及测试删除；addRecentSession 调用全移除；RequirementPage 最近会话区改从 API 加载（错误态处理：API 失败显示空态非崩溃） | 文件+运行检查 |
| 5 | 【裁决③】端点无分页参数；前端取 6 条逻辑保持 | 代码检查 |
| 6 | SessionListItem/SessionListResponse Pydantic + TS 镜像字段级一致（设计 §6） | 双文件比对 |
| 7 | api-spec.md 回写新端点（F004 裁决①先例：同提交原子落地）；含响应示例 | 文件 diff |
| 8 | 后端测试：设计 §7 五场景（空列表/多会话倒序/含 state 会话/stub 删除后路由 404/元数据隔离） | pytest 运行 |
| 9 | 前端测试：mock fetch 断言 API 消费 + 加载/空/错误三态 | vitest 运行 |
| 10 | F012 E2E R 场景（最近会话）随 localStorage 移除同步修正且真实执行通过（浏览器不可用则按 P009 降级 skip+WARN 如实报告） | E2E 运行证据 |
| 11 | verify.sh 复跑 15 项全 PASS（第 15 项按环境如实执行或降级）+ uv.lock 零漂移 | 独立复跑 |
| 12 | 跨文档同步：boundaries.md（若涉及）+ convention-to-rule-mapping.md 新行 + AGENTS.md（若技术栈/规则零变动则不动） | 文件 diff |

## 开放问题处理

无未决项——4 项开放问题 + 歧义 α 已全部裁决（journal 81），按"硬性约束"执行。

## 产出物

1. 代码：server/routes/harness.py（列表端点）+ server/schemas/（Pydantic）+ src/types/（TS 镜像）+ 前端消费改造
2. 文档：api-spec.md + convention-to-rule-mapping.md
3. journal 82（`harness-journal/stage-04-coding/82-f013-coder-execution.md`）
4. progress.txt 追加 1 行（coding-done）

## 自报义务

journal 82 必须含：环境表、P 编号命中（预期 P009/P010/P011）、自报歧义清单（无则声明无）、E2E 真实执行或降级证据、4 端点 diff=0 的 git 证据。
