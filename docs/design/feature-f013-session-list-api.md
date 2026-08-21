last_updated: 2026-08-21
status: draft
owner: @K总

# Feature: F013 API 会话列表端点

## Status: Draft

## 目标

提供 `GET /api/harness/sessions` 列表端点，使前端从 localStorage 读取最近会话切换为服务端 API 消费，消除隐私模式降级、多标签页不同步等 localStorage 固有问题（Task5 审查建议 + K总最终验收指示）。

## 非目标

- 不引入持久化——会话仍为 in-memory（F009 范围）
- 不改动 LangGraph 拓扑或 Node 委派桩（F002/F011 约束）
- 不触碰 F007 `_event_queues`——列表端点只读 `_sessions`
- 不实现 WebSocket 或 SSE 列表推送——列表为一次性 GET 请求
- 不支持分页/过滤（首版，见开放问题③）
- 不改动 `verify.sh`——新增端点测试走既有 pytest + vitest 框架

## 技术方案

### 1. 列表端点数据源设计（验收标准 1）

**端点**: `GET /api/harness/sessions`

**数据源**: 遍历 `_sessions` dict，对每个 session_id 取 LangGraph 快照提取轻量字段。

**响应字段集**:

| 字段 | 类型 | 来源 | 说明 |
|---|---|---|---|
| session_id | str | dict key | 会话唯一标识 |
| status | str | `_session_status()` | running / interrupted / completed / ended |
| project_id | str | `state.project_id` | 项目标识 |
| current_stage | str | `state.current_stage` | 当前 Harness 阶段 |
| requirement_summary | str | `_session_meta[session_id].requirement` | 需求摘要，截取前 80 字符 |
| started_at | float | `_session_meta[session_id].started_at` | 启动时间戳（epoch 秒） |

**不包含全量 state 的理由**: 列表场景只需摘要信息；全量 state 含 24 字段（含 design_docs / code_artifacts 等大对象），列表传输开销过大。需要完整状态时走 `GET /{session_id}/state`。

**排序规则**: 按 `started_at` 倒序（最近启动的排最前）。

**空会话场景**: `_sessions` 为空时返回 `{ sessions: [], total: 0 }`，HTTP 200。

### 2. 存储层增量设计（验收标准 2）

**现状**: `_sessions` value 为 CompiledGraph app 对象，无元数据。`HarnessStartRequest` 含 `requirement` 但未存储；无启动时间戳。

**最小增量**: 新增并行元数据 dict `_session_meta`，在 `POST /start` 时写入，不改变 `_sessions` 结构。

```python
# server/routes/harness.py 新增
_session_meta: dict[str, SessionMeta] = {}

class SessionMeta:
    requirement: str    # 原始需求文本（POST /start request.requirement）
    started_at: float   # time.time() 启动时间戳
```

**写入时机**: `start_harness()` 中 `_sessions[session_id] = app` 之后追加 `_session_meta[session_id] = SessionMeta(...)`。

**清理时机**: `start_harness()` 失败时（ValueError 分支）同步 `del _session_meta[session_id]`。会话无主动删除机制（in-memory，服务重启全清）。

**不引入持久化**: `_session_meta` 与 `_sessions` 同为 in-memory，生命周期一致，F009 范围外。

### 3. agent_sessions.py stub 处置（验收标准 3）

| 选项 | 操作 | 优点 | 缺点 |
|---|---|---|---|
| A. 删除 | 删 `server/routes/agent_sessions.py` + 移除 `main.py` L41 import/registration + api-spec.md L41 历史注记改为"已删除" | 消除死代码，API 表面干净 | 变更范围跨 3 文件 |
| B. 保留 | 维持现状，仅文档注记"勿使用" | 零代码变动 | 死代码持续存在，新贡献者可能误用 |

**推荐方案 A（删除）**。理由：
1. api-spec.md 已明确 `/api/agent-sessions` 被 `/api/harness/*` 取代
2. 该 stub 返回硬编码空列表，无任何消费方
3. F013 列表端点完成后，`/api/agent-sessions` 完全无存在意义
4. 删除属编码阶段执行，设计阶段仅声明意图

**api-spec.md L41 对应更新**: 将"原规划的 `/api/agent-sessions` 路由（阶段1骨架草案）已被 F002 的 `/api/harness/*` 取代；server/routes/agent_sessions.py 为占位 stub"改为"原 `/api/agent-sessions` 路由已在 F013 编码阶段删除（被 `/api/harness/sessions` 取代）"。

### 4. 前端切换设计（验收标准 4）

**切换方案**: RequirementPage 最近会话数据源从 localStorage 切换为 `GET /api/harness/sessions`。

**具体变更**:

1. **RequirementPage**: `useEffect` 中 `getRecentSessions()` → `fetch('/api/harness/sessions')`，响应映射为 `RecentSession[]`
2. **RecentProjects 组件**: 无变更——仍接收 `RecentSession[]` props，渲染逻辑不变
3. **addRecentSession 调用移除**: `startHarness` 成功后不再写 localStorage（服务端 `_session_meta` 已记录）
4. **recentSessions.ts 文件处置**: 删除（见开放问题②）
5. **App.tsx L14**: `getRecentSessions()[0]?.session_id` → API fetch 获取首个会话

**RecentSession 类型增量**: 当前 `{ project_id, session_id, started_at }` 需扩展以匹配 API 响应：

```typescript
export interface RecentSession {
  session_id: string
  status: string           // [NEW] 会话状态
  project_id: string
  current_stage: string    // [NEW] 当前阶段
  requirement_summary: string  // [NEW] 需求摘要
  started_at: number
}
```

**F012 E2E R 场景影响**: `tests/e2e/requirement.spec.ts` R 场景覆盖最近会话区域。切换后：
- 渲染数据来源变更（localStorage → API mock），需调整 test fixture
- 组件接口（RecentSession props）不变，选择器无需变更
- 影响评估：低风险，仅 mock 数据源切换

### 5. 分页/过滤范围界定（验收标准 5）

**首版不实现分页/过滤**。

理由：
1. `_sessions` 为 in-memory dict，典型并发会话数 < 50，全量列表传输开销可忽略
2. 前端 `RecentProjects` 侧栏展示最近 6 条（`MAX_ENTRIES = 6`），客户端截取即足
3. 无 `project_id` 过滤需求——首页展示跨项目最近会话是当前产品意图
4. 分页/过滤引入 query 参数 + Pydantic 模型 + 测试，首版 ROI 不合算

**非目标显式声明**: `limit` / `offset` / `project_id` 过滤、`sort` 参数均非首版目标。

### 6. 数据契约（验收标准 6）

**Pydantic 响应模型**（`server/schemas/harness.py` 新增）:

```python
class SessionListItem(BaseModel):
    session_id: str
    status: str
    project_id: str
    current_stage: str
    requirement_summary: str = Field(max_length=80)
    started_at: float

class SessionListResponse(BaseModel):
    sessions: list[SessionListItem]
    total: int
```

**TS 类型镜像**（`src/types/harness.ts` 扩展）:

```typescript
export interface SessionListItem {
  session_id: string
  status: string
  project_id: string
  current_stage: string
  requirement_summary: string
  started_at: number
}

export interface SessionListResponse {
  sessions: SessionListItem[]
  total: number
}
```

**api-spec.md 回写口径**: 编码阶段回写（F004 裁决①先例——api-spec 回写绑编码阶段而非设计阶段）。回写内容：
- 新增 `GET /api/harness/sessions` 条目：响应结构、排序规则、无分页声明
- 标注 `(F013)` 归属
- 更新 L41 agent_sessions 历史注记（删除声明）

### 7. 测试策略（验收标准 7）

**后端列表端点测试**（`server/tests/test_harness_list.py`）:

| 场景 | 断言 |
|---|---|
| 空会话列表 | `sessions=[]`, `total=0`, HTTP 200 |
| 多会话排序 | 先 start 两个会话 → 列表按 `started_at` 倒序 |
| 字段完整性 | 每个 item 含 6 字段，`requirement_summary` ≤ 80 字符 |
| started_at 单调递增 | 连续 start 两个会话，后者 `started_at` > 前者 |
| 会话状态映射 | 启动后 status ∈ {running, interrupted, completed, ended} |

**前端 mock 测试**（`src/pages/__tests__/RequirementPage.test.tsx` 扩展）:
- Mock `fetch('/api/harness/sessions')` 返回 `SessionListResponse`
- 断言 `RecentProjects` 渲染 `sessions.length` 条
- 断言 `addRecentSession` 不再被调用（localStorage 写入移除）

**E2E 场景**: F012 R 场景需同步 mock 数据源（localStorage → API），不新增独立 E2E 用例。`requirement.spec.ts` 的 R 场景 fixture 从 localStorage mock 切换为 API intercept。

**覆盖率**: ≥80%，由 verify.sh 第 5 项强制度量。

### 8. 文档自身（验收标准 8）

本文件 ≤300 行，遵循 `_template.md` 骨架（Status / 目标 / 非目标 / 技术方案 / 验收标准 / 依赖 + 扩展节）。

## 验收标准（8 项，对齐 Controller Spec）

1. 列表端点数据源：基于 `_sessions` 遍历，6 字段定义，排序规则 started_at 倒序，不含全量 state
2. 存储层增量：`_session_meta` 并行 dict 最小增量，含 requirement + started_at，不引入持久化
3. agent_sessions.py 处置：推荐删除（3 文件变更），api-spec.md 历史注记更新方案
4. 前端切换：RequirementPage 数据源 localStorage → API，RecentSession 类型扩展 3 字段，addRecentSession 移除
5. 分页/过滤：首版非目标，显式声明理由
6. 数据契约：SessionListItem/SessionListResponse Pydantic + TS 镜像，api-spec.md 编码阶段回写
7. 测试策略：后端 5 场景 + 前端 mock 3 断言 + E2E fixture 同步，覆盖率 ≥80%
8. 文档规范：≤300 行、_template.md 骨架、开放问题显式列出

## 依赖

- F002（LangGraph 编排引擎，已 passing）—— `_sessions` dict + `_snapshot()` + `_session_status()`
- F007（SSE 推送，已 passing）—— `_event_queues` 零触碰，列表端点只读
- F012（Playwright E2E，已 passing）—— R 场景 fixture 同步，非阻塞

## 开放问题（提交 K总裁决）

1. **agent_sessions.py stub 处置**：本设计推荐方案 A（删除），理由见 §3。若 K总倾向保留（零代码变动优先），请裁决。
2. **localStorage 兜底保留 vs 完全移除**：本设计推荐完全移除（删除 `recentSessions.ts`，移除所有 `addRecentSession` 调用），理由：API 消费后 localStorage 无存在意义，隐私模式不再是问题（API 不依赖 localStorage）。若 K总倾向保留为离线兜底（极端场景 API 不可用时），请裁决。
3. **首版分页/过滤范围**：本设计首版不实现（理由见 §5）。若 K总要求首版即含 `limit` 参数（前端 RecentProjects 仅取前 6 条，服务端截取可减少传输），请裁决。
4. **时间戳字段依赖存储层增量**：`started_at` 需新增 `_session_meta` dict。若 K总倾向不增加存储层（列表端点返回无时间戳，前端按返回顺序渲染），请裁决——但此时排序规则无法保证（dict 遍历顺序为插入序但非契约），且前端 `formatTime()` 依赖 `started_at`。

## 自报歧义

α **_session_meta 独立 dict vs 包装 _sessions value**：方案 A（独立 `_session_meta`）不改变 `_sessions` value 类型，所有现有端点零改动；方案 B（包装为 `{ "app": app, "meta": SessionMeta }`）需改 `_get_session()` 返回值解包。本设计取方案 A，若 K总倾向方案 B（统一入口），请裁决。
