# F011 Controller Spec — 设计校验

> 由 L1 项目管控 Agent 产出，用于委派 L3 设计校验 Agent 独立审阅 F011 设计文档。

## Controller Spec

```
任务: 独立审阅 F011 Agent Runtime 设计文档，输出缺陷清单
角色: design-reviewer
前置条件: F011 设计文档 Draft 已完成，L1 验收通过
输入:
  - 待审文档: docs/design/feature-f011-agent-runtime.md
  - 参考文档（用于跨文档一致性校验）:
    - docs/architecture/state-design.md (HarnessState 定义)
    - docs/architecture/harness-flow.md (8 阶段流程 + 菱形门控)
    - docs/architecture/boundaries.md (前后端分层)
    - docs/handbook/orchestrator-prompt.md (L1 提示词)
    - docs/handbook/agent-registry.json (Agent 注册表)
    - docs/handbook/prompts/_bootstrap.md (标准引导模板)
    - AGENTS.md (硬性规则)
  - 校验维度:
    - 内部一致性：文档自身是否有矛盾
    - 跨文档一致性：与 state-design.md / harness-flow.md / agent-registry.json / orchestrator-prompt.md 是否对齐
    - HITL 落地：6 闸门是否有 interrupt 机制，不只是布尔值
    - 循环安全：反馈循环/长循环是否有 max_iterations 终止保护
    - Skill ≠ Agent 定义完整性：判定规则是否可执行
    - Agent Registry 结构契约与实际 agent-registry.json 是否一致
    - Controller Spec 格式与实际使用是否一致
    - 标准引导模板内容与 _bootstrap.md 实际内容是否一致
    - L1 工具白名单与 orchestrator-prompt.md 是否一致
    - 非目标边界是否清晰（不与 F002/F009 职责重叠）
输出: 缺陷清单（在对话中输出，不修改被审文档）
验收标准:
  1. 逐维度检查，每个维度给出通过/缺陷结论
  2. 缺陷按严重级（致命/跨文档/概念）分类
  3. 每个缺陷给出位置（文件:行号 或 章节）+ 描述 + 修法建议
  4. 最终结论：通过 / 需修订后重审 / 驳回
禁止:
  - 不得修改被审阅的设计文档
  - 不得自行调用 skill
  - 不得修改 sub_id
```
