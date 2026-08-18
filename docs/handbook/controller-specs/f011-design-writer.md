# F011 Controller Spec

> 由 L1 项目管控 Agent 产出，用于委派 L3 设计编写 Agent 编写 F011 设计文档。

## Controller Spec

```
任务: 编写 F011 Agent Runtime 与编排治理设计文档
角色: design-writer
前置条件: F001 passing, 原型确认通过, Agent 社会架构方案已审批
输入:
  - 功能 ID: F011
  - 参考文档:
    - docs/architecture/state-design.md (HarnessState 定义)
    - docs/architecture/harness-flow.md (8 阶段流程)
    - docs/architecture/boundaries.md (前后端分层)
    - docs/handbook/orchestrator-prompt.md (L1 提示词，已升级)
    - docs/handbook/agent-registry.json (Agent 注册表)
    - harness-journal/stage-02-feature-breakdown/02-agent-society-and-revision-plan.md (方案全文)
  - 模板: docs/design/_template.md
  - 约束: AGENTS.md 硬性规则, docs/conventions/coding.md
输出: docs/design/feature-f011-agent-runtime.md (Status: Draft)
验收标准:
  1. Agent Registry 数据结构定义完整（role/level/tools/prompt_template/prohibitions）
  2. Controller Spec 格式定义（任务/角色/前置/输入/输出/验收/禁止）
  3. 标准引导模板定义（冷启动5步 + 硬约束7条 + 完成标志）
  4. Skill ≠ Agent 约束的正式定义和判定规则
  5. 6 闸门 actor 分配表（闸门名/actor/机制），与 harness-flow.md 的菱形门控对齐
  6. 循环预算机制（state 新增 max_iterations + current_iteration，超限转 human_intervention）
  7. L1 工具白名单定义（6 个工具，与 orchestrator-prompt.md 一致）
  8. 子管控者 vs 同级管控者定义（授权范围/上报机制/产出验收路径）
  9. meta 层 vs runtime 层区分（meta: 造平台自己, L0 手动开; runtime: 平台跑起来后, F011 自动派生）
  10. 单文件 ≤ 300 行
禁止:
  - 不得自行调用 skill 产出内容
  - 不得跳过 harness-journal 记录
  - 不得修改 sub_id
  - 不得修改 AGENTS.md 硬性规则
  - 不得在设计中引入 AGENTS.md 技术栈基线以外的框架
```
