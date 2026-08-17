# 02 - 创建 docs/ 目录结构

## 步骤名称
docs/ 结构化知识库目录

## 执行时间
2026-08-17

## 前置条件
- AGENTS.md 已编写
- 快速导航表引用的文档路径已规划

## 执行内容

创建 docs/ 目录结构，每个文档头部包含元信息：

```
last_updated: 2026-08-17
status: active | draft
```

### 目录结构

```
docs/
├── architecture/
│   ├── harness-flow.md       ← Harness 8 阶段流程详解
│   ├── boundaries.md         ← 分层边界（依赖方向）
│   └── state-design.md       ← LangGraph State 设计
├── conventions/
│   └── coding.md             ← 编码规范（前后端）
├── design/                    ← 功能设计文档（待填充）
├── plans/
│   └── current-sprint.md     ← 当前迭代计划（4个Sprint）
└── reference/
    └── api-spec.md           ← API 接口规范
```

### 各文档内容摘要

**harness-flow.md**：8 阶段流程详解，从阶段0（初始化）到阶段8（熵管理），包含每个阶段的 Node 列表和决策菱形。

**boundaries.md**：前后端分层边界：
- 前端：只通过 /api/... 调用后端，禁止直接访问数据库
- 后端依赖方向：routes → schemas → models → config
- graph → nodes → schemas → models
- nodes 之间不直接调用，只通过 State 传递

**state-design.md**：HarnessState TypedDict 设计，包含 6 组字段和 Graph 拓扑描述。

**coding.md**：前端 TypeScript（strict、禁 any）+ 后端 Python（type hints、禁 print、Pydantic）规范。

**current-sprint.md**：4 个 Sprint 计划，Sprint 1 为最小闭环（F001-F004+F006）。

**api-spec.md**：API 接口清单，5 组接口（项目管理/Agent会话/约束管理/产物管理/健康）。

## 产出物
- `docs/architecture/harness-flow.md`
- `docs/architecture/boundaries.md`
- `docs/architecture/state-design.md`
- `docs/conventions/coding.md`
- `docs/plans/current-sprint.md`
- `docs/reference/api-spec.md`

## 验证结果
- 所有文档路径与 AGENTS.md 快速导航表一致
- 每个文档头部有元信息

## 备注
docs/design/ 目录暂为空，后续每个功能开发前会在此创建设计文档（对应 Harness 阶段2）。文档需要定期由 Doc-Gardening Agent 扫描过时内容。
