# Journal 78 — F013 设计委派（L1）

日期: 2026-08-21
角色: L1 项目管控
提交: 本批次（Spec + launch prompt + journal 78 + 状态同步）

## 一、委派决策

K总指示"指定下一委派"，L1 按 Sprint2 收官优先级指定 F013（API 会话列表端点）设计委派；N 池 15 条为非阻塞建议改进，留 Sprint2 收官后独立统筹批次（已呈报 K总）。

## 二、设计输入核实（L1 流程取证，非内容判定）

| 事实 | 锚点 |
|---|---|
| 会话存储 in-memory | harness.py L47 `_sessions: dict[str, Any]`（F002 先例） |
| 现有 5 端点无列表 | start / state / stream(F007) / resume |
| agent_sessions.py stub 残留 | main.py L41 注册 `/api/agent-sessions`；api-spec.md L41 注记已取代但未删 |
| 前端 localStorage 消费 | recentSessions.ts（隐私模式降级先例）+ RequirementPage RecentProjects |
| F012 E2E 关联 | requirement.spec.ts R 场景覆盖最近会话区域 |

## 三、产出

- ControllerSpec: docs/handbook/controller-specs/f013-design-writer.md（8 项标准）
- launch prompt: docs/handbook/launch-prompts/f013-design-writer-launch.md
- journal 编号: **79 = design-writer 预留（禁占）**

## 四、预置开放问题（Spec 详述）

agent_sessions stub 处置 / localStorage 兜底取舍 / 首版分页范围 / 时间戳字段存储层增量。
