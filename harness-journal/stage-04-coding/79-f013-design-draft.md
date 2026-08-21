# Journal 79 — F013 设计初稿

日期: 2026-08-21
角色: design-writer
feature: F013 (API 会话列表端点)
提交: (待提交)

## 任务

产出 `docs/design/feature-f013-session-list-api.md`（Status: Draft），覆盖 Controller Spec 8 项验收标准。

## 冷启动

1. AGENTS.md — 项目状态确认（F013 为 Sprint2 收官 feature，F012 已闭环）
2. Controller Spec — 8 项验收标准 + 4 开放问题 + 硬性约束
3. 设计模板 + F007 结构参照
4. 锚点复核:
   - `harness.py` L47 `_sessions: dict[str, Any] = {}` ✓（value 为 CompiledGraph app 对象）
   - `recentSessions.ts` ✓（localStorage key=harness_recent_sessions, MAX_ENTRIES=6, L36 隐私模式静默降级）
   - `api-spec.md` L41 ✓（agent_sessions 已被 /api/harness/* 取代的历史注记）
   - 补充复核: `agent_sessions.py` stub 确认返回硬编码空列表, `main.py` L41 确认注册路由, `RecentSession` 类型含 3 字段, `RecentProjects` 组件渲染逻辑

## 设计决策

| # | 决策点 | 选定方案 | 理由 |
|---|---|---|---|
| 1 | 列表端点字段集 | 6 字段轻量（不含全量 state） | 列表只需摘要，完整状态走 GET /state |
| 2 | 存储层增量 | `_session_meta` 并行 dict | 不改变 `_sessions` value 类型，现有端点零改动 |
| 3 | stub 处置 | 推荐方案 A（删除） | 死代码无消费方，F013 完成后完全无意义 |
| 4 | 前端切换 | localStorage → API，完全移除 localStorage | API 不依赖 localStorage，隐私模式不再是问题 |
| 5 | 分页/过滤 | 首版不实现 | 会话数 < 50，前端侧栏仅取 6 条，客户端截取即足 |
| 6 | 排序 | started_at 倒序 | 最近启动排最前，符合用户直觉 |

## 开放问题（4 项，提交 K总裁决）

1. agent_sessions.py 删除 vs 保留
2. localStorage 兜底保留 vs 完全移除
3. 首版分页/过滤范围
4. 时间戳字段 vs 不增存储层

## 歧义

α _session_meta 独立 dict vs 包装 _sessions value — 取方案 A（独立 dict），现有端点零改动

## 产出物

1. `docs/design/feature-f013-session-list-api.md`（217 行，Status: Draft）
2. 本 journal
3. progress.txt 追加

## 8 项验收标准对照

| # | 标准 | 状态 | 覆盖节 |
|---|---|---|---|
| 1 | 列表端点数据源设计 | ✅ | §1 |
| 2 | 存储层增量设计 | ✅ | §2 |
| 3 | agent_sessions.py stub 处置 | ✅ | §3 |
| 4 | 前端切换设计 | ✅ | §4 |
| 5 | 分页/过滤范围界定 | ✅ | §5 |
| 6 | 数据契约 | ✅ | §6 |
| 7 | 测试策略 | ✅ | §7 |
| 8 | 文档自身 | ✅ | §8（217 行 ≤ 300） |
