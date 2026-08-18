# F002 Controller Spec — 修订

> 由 L1 项目管控 Agent 产出，用于委派 L3 设计编写 Agent 修订 F002 设计文档中的 6 项致命缺陷。

## Controller Spec

```
任务: 修订 F002 LangGraph 编排引擎设计文档，修复 WorkBuddy 评审发现的 6 项致命缺陷
角色: design-writer
前置条件: F011 已 Approved（Agent Runtime 架构底座已定义）
输入:
  - 待修订文档: docs/design/feature-f002-langgraph.md（当前 103 行，Status: Draft）
  - 核心参考: docs/design/feature-f011-agent-runtime.md（已 Approved，F002 必须与之对齐）
  - 参考文档:
    - docs/architecture/state-design.md (HarnessState 定义)
    - docs/architecture/harness-flow.md (8 阶段流程)
    - AGENTS.md (规则 #5: Node 是委派桩/状态转换器)
  - 校验依据: harness-journal/stage-02-feature-breakdown/02-agent-society-and-revision-plan.md §3.2
输出: docs/design/feature-f002-langgraph.md（修订后，Status: Draft，待校验）
验收标准:
  1. [缺陷 #1 纯函数自相矛盾] Node 接口规范从"纯函数"改为"委派桩/状态转换器"：接收 State → 委派 Agent Runtime 请求某角色 Agent 执行 → 等回产物 → 返回更新后的 State。Node 本身不含业务逻辑。删除"所有 Node 为纯函数，无副作用"的验收标准，改为"所有 Node 为委派桩，不含业务逻辑"。
  2. [缺陷 #2 HITL 没落地] 6 个闸门从布尔值路由改为 interrupt 机制：人类闸门（原型确认/设计审批/验收通过）用 interrupt_before + Command(resume=...)；自动闸门（测试结果/解决成功）用 conditional edge；审查通过默认 Agent 可疑升级人类。与 F011 §5 的多节点 interrupt_before 拓扑对齐。
  3. [缺陷 #3 循环无终止保护] HarnessState 新增 max_iterations + current_iteration 字段（与 F011 §6 和 state-design.md 对齐）。反馈循环和 DRR 长循环的 routing 函数中检查 current_iteration > max_iterations → human_intervention = True。
  4. [缺陷 #4 熵管理矛盾] 统一为"横切关注点"：server/nodes/entropy.py 描述从"阶段8: 熵管理"改为"横切: 熵管理（事件驱动，非线性阶段）"。Graph 拓扑中 entropy 不是线性节点，而是 verify 通过/文档反馈/功能完成后触发的事件驱动任务。
  5. [缺陷 #5 阶段编号不自洽] 统一为"阶段 0-7（8 个阶段）"：文档中所有"8 阶段"表述改为"8 阶段（阶段 0-7）"；entropy 不计入阶段编号。
  6. [缺陷 #6 tech_stack 契约缺校验] HarnessState 的 tech_stack 字段加 Pydantic 验证：定义 TechStackSpec BaseModel，校验 frontend/backend/database/llm/package_manager 字段存在且值在允许范围内。Node 入口校验 tech_stack 一致性。
  7. Conditional Edge 函数示例更新为 interrupt 机制（不再是布尔值 return 下一节点名）
  8. 新增 F011 引用段：标注 F002 Node 实现依赖 F011 定义的 Agent Runtime（Controller Spec → Agent Runtime → L3 Agent → 产出回 Node）
  9. 修订后单文件 ≤ 300 行
  10. 添加修订记录段
禁止:
  - 不得自行调用 skill 产出内容
  - 不得跳过 harness-journal 记录
  - 不得修改 sub_id
  - 不得修改 AGENTS.md / state-design.md / harness-flow.md（跨文档同步由 L1 统一执行）
  - 不得修改 F011 设计文档
  - 不得在 F002 中实现代码（只做设计修订）
```
