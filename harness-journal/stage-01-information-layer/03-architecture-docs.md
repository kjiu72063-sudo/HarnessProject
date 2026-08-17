# 03 - 编写架构文档

## 步骤名称
基于技术方案，落地为版本控制的文档

## 执行时间
2026-08-17

## 前置条件
- docs/ 目录结构已创建
- 阶段0的架构设计已确认

## 执行内容

将阶段0（需求与可行性）中讨论的技术方案落地为 3 个架构文档：

### 1. harness-flow.md
记录 Harness 8 阶段完整流程：
- 阶段0: 初始化 Agent — 建立项目环境
- 阶段1: 需求与架构规划 — 信息层
- 阶段2: 功能拆分与设计
- 阶段3: 编码 Agent 启动（Anthropic 两阶段模型）
- 阶段4: 编码实现（约束层接入）
- 阶段5: 自校验与反馈循环
- 阶段6: 合并与部署
- 阶段7: 可观测性验证
- 阶段8: 熵管理（穿插在闭环中）

包含每个阶段的 Node 列表和 6 个决策菱形。

### 2. boundaries.md
定义分层边界和依赖方向：
- 前端 (src/): 只通过 /api/... 调用后端
- 后端 (server/): routes → schemas → models → config
- graph → nodes → schemas → models
- nodes 之间只通过 State 传递数据
- 禁止项：routes 直接操作数据库、nodes 直接操作 HTTP 响应、前端 import 后端代码

### 3. state-design.md
LangGraph State 设计：
- 核心 State 字段（6 组）
- Graph 拓扑描述
- Conditional Edges（6 个决策菱形）
- Cycles（反馈循环 + DRR 长循环）
- Checkpointer: PostgreSQL 持久化
- Human-in-the-loop: interrupt_before=["human_interrupt"]

## 产出物
- `docs/architecture/harness-flow.md` — 8 阶段流程
- `docs/architecture/boundaries.md` — 分层边界
- `docs/architecture/state-design.md` — State 设计

## 验证结果
- 文档内容与阶段0的架构设计一致
- 文档路径与 AGENTS.md 导航表匹配

## 备注
这些文档是"活文档"——后续开发过程中发现新的约束或边界，需要更新这些文档。对应 Harness 的"文档必须是活的反馈循环"原则。
