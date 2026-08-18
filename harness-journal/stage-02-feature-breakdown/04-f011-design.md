# F011 设计文档编写

## 步骤名称
F011 Agent Runtime 与编排治理设计文档编写

## 执行时间
2026-08-17

## 前置条件
- F001 passing
- 原型确认通过
- Agent 社会架构方案已审批（02-agent-society-and-revision-plan.md）
- F011 Controller Spec 已产出（03-f011-delegation.md 记录委派过程）
- L3 设计编写 Agent 启动提示词已就绪（launch-prompts/f011-design-writer-launch.md）

## 执行内容

### 1. 冷启动
按标准引导模板执行冷启动 5 步：
1. AGENTS.md — 项目全貌、硬性规则、技术栈基线、当前阶段
2. progress.txt — 71 条历史进度记录
3. feature_list.json — F001 passing, F002-F011 todo
4. docs/plans/current-sprint.md — Sprint 1 范围（F002/F003/F006）
5. harness-journal/README.md — 开发日志索引 + 最近 3 条 journal（01-design-docs / 02-agent-society / 03-f011-delegation）

### 2. 读取参考文档
读取 Controller Spec 指定的全部参考文档：
- docs/architecture/state-design.md — HarnessState 定义（20 字段）
- docs/architecture/harness-flow.md — 8 阶段流程 + 6 菱形门控
- docs/architecture/boundaries.md — 前后端分层边界
- docs/handbook/orchestrator-prompt.md — L1 提示词（已升级）
- docs/handbook/agent-registry.json — 5 角色 Agent 注册表
- 02-agent-society-and-revision-plan.md — Agent 社会架构方案全文（核心参考）
- docs/design/_template.md — 设计文档模板
- docs/conventions/coding.md — 编码规范与三大失败模式
- 补充读取：_bootstrap.md（标准引导模板）、design-writer.md（L3 角色模板）

### 3. 编写设计文档
按 _template.md 模板结构编写 docs/design/feature-f011-agent-runtime.md：

- Status: Draft
- 目标：定义 Agent 社会运行时基础设施
- 非目标：不实现 Runtime 代码 / 不实现 Registry 持久化 / 不实现自动派生 / 不实现 Node 逻辑
- 技术方案 9 节：
  1. Agent Registry 数据结构（JSON 结构契约 + 5 角色对齐表 + 维护规则）
  2. Controller Spec 格式（7 字段 + L2 处理流程）
  3. 标准引导模板（冷启动 5 步 + 硬约束 7 条 + 完成标志）
  4. Skill ≠ Agent 约束（5 维度对比 + 判定规则 + 反模式）
  5. 6 闸门 actor 分配表（与 harness-flow.md 菱形对齐 + 实现机制）
  6. 循环预算机制（[NEW] State 字段 + 运行规则 + 现有字段复用）
  7. L1 工具白名单（6 工具 + 用途限制 + 与 orchestrator-prompt.md 一致）
  8. 子管控者 vs 同级管控者（概念 + 当前状态 + 未来扩展）
  9. meta 层 vs runtime 层（两层定义 + 当前阶段 + 过渡策略）
- 数据模型变更：HarnessState 新增 max_iterations + current_iteration（标注 [NEW]）
- 验收标准：10 条逐条列出
- 依赖：F001 + 方案审批 + 3 份已创建的 handbook 文件

### 4. 自检验收标准
逐条对照 Controller Spec 10 条验收标准，全部通过（详见验证结果段）。

## 产出物
- `docs/design/feature-f011-agent-runtime.md`（253 行，Status: Draft）

## 验证结果

| # | 验收标准 | 结果 | 说明 |
|---|---|---|---|
| 1 | Agent Registry 数据结构定义完整 | ✅ | JSON 结构契约含全部 6 字段 + 5 角色对齐表 + 维护规则 |
| 2 | Controller Spec 格式定义 | ✅ | 7 字段标准格式 + L2 处理流程 |
| 3 | 标准引导模板定义 | ✅ | 冷启动 5 步 + 硬约束 7 条 + 完成标志 |
| 4 | Skill ≠ Agent 约束正式定义 | ✅ | 5 维度对比表 + 判定规则 + 反模式示例 |
| 5 | 6 闸门 actor 分配表 | ✅ | 6 闸门 + 阶段映射 + actor + 机制，与 harness-flow.md 对齐 |
| 6 | 循环预算机制 | ✅ | [NEW] 字段标注 + 5 运行规则 + 复用 human_intervention |
| 7 | L1 工具白名单 | ✅ | 6 工具 + 用途限制，与 orchestrator-prompt.md 一致 |
| 8 | 子管控者 vs 同级管控者 | ✅ | 概念定义 + 当前状态 + 未来扩展预留 |
| 9 | meta 层 vs runtime 层 | ✅ | 两层定义 + 当前 meta 层 + 过渡策略 |
| 10 | 单文件 ≤ 300 行 | ✅ | 253 行 |

## 备注
- journal 文件命名为 `04-f011-design.md`（03 已被 f011-delegation 占用）
- 文档中 State 新增字段标注 [NEW]，与 state-design.md 对齐
- 循环预算复用现有 human_intervention 字段，无需新增布尔字段
- F011 是架构治理设计，不涉及代码变更，无需跑 verify.sh
- 文档 Status: Draft，待 L1 验收 → L3 设计校验 Agent 审阅 → 修订 → Approved
