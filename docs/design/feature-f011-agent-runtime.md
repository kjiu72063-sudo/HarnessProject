# Feature: F011 Agent Runtime 与编排治理

## Status: Approved

## 目标

定义 Agent 社会的运行时基础设施——角色注册表、任务委派格式、标准引导模板、skill≠agent 约束、闸门 actor 分配、循环预算——作为所有功能的架构底座。

## 非目标

- 不实现 Agent Runtime 的代码（F002 编码阶段）
- 不实现 Agent Registry 的持久化存储（F009）
- 不实现自动派生 Agent 会话的机制（runtime 层，后续迭代）
- 不实现具体 LangGraph Node 逻辑（F002 修订覆盖）

## 技术方案

### 涉及的模块

- `docs/handbook/agent-registry.json` — Agent 角色注册表（已创建，本文档定义其结构契约）
- `docs/handbook/orchestrator-prompt.md` — L1 提示词（已升级，本文档定义其工具白名单与约束契约）
- `docs/handbook/prompts/_bootstrap.md` — 标准引导模板（已创建，本文档定义其内容契约）
- `server/graph/` — LangGraph State 新增循环预算字段（F002 编码实现）
- `server/nodes/` — Node 委派桩定义落地（F002 编码实现）

### 数据模型变更

HarnessState（`docs/architecture/state-design.md`）新增字段：

```python
class HarnessState(TypedDict):
    # ... 现有字段保持不变 ...

    # [NEW] 循环预算 — F011 定义，F002 编码实现
    max_iterations: int        # 默认 5，反馈循环最大次数
    current_iteration: int     # 初始 0，每次进入反馈循环 +1
```

与 `state-design.md` 的对齐：现有 `human_intervention: bool` 字段已存在，循环预算超限时设置 `human_intervention = True`，复用现有逃生口机制，无需新增布尔字段。

### API 变更

无。F011 是架构治理设计，不引入新 API 端点。

---

### 1. Agent Registry 数据结构

Agent Registry 是持久化的角色注册表，L1 查此表找到目标角色的 Prompt 模板路径和工具白名单。

**文件**：`docs/handbook/agent-registry.json`

**结构定义**：

```json
{
  "version": "string",
  "updated": "string (date)",
  "description": "string",
  "standard_bootstrap": {
    "description": "string",
    "template_path": "docs/handbook/prompts/_bootstrap.md"
  },
  "agents": [
    {
      "role": "string (唯一标识)",
      "level": "L1 | L3",
      "description": "string (职责一句话)",
      "tools": ["tool_name", ...],
      "prompt_template": "docs/handbook/prompts/{role}.md",
      "prohibitions": ["string", ...]
    }
  ]
}
```

> `prompt_template` 路径遵循 `docs/handbook/prompts/{role}.md` 模式。L1 角色 project-controller 为例外，使用 `docs/handbook/orchestrator-prompt.md`（历史命名，已在 `agent-registry.json` 中正确配置）。

**当前注册角色**（与 `agent-registry.json` 对齐）：

| role | level | tools 数量 | 核心职责 |
|---|---|---|---|
| project-controller | L1 | 6 | 拆解/路由/验收/更新记忆，不干活 |
| design-writer | L3 | 5 | 按 Controller Spec 编写设计文档 |
| design-reviewer | L3 | 4 | 独立审阅设计文档，输出缺陷清单 |
| coder | L3 | 6 | 按设计文档实现代码，跑 verify.sh |
| test-reviewer | L3 | 5 | 审查测试覆盖率和质量 |

**维护规则**：新增角色时在 `agents` 数组追加条目，`role` 不可重复，`tools` 必须是白名单子集。

### 2. Controller Spec 格式

Controller Spec 是 L1 → L3 的任务卡标准格式。L1 产出后交由 L2 注入引导模板和任务上下文，生成完整 L3 启动提示词。

```
[Controller Spec]
任务: [一句话描述]
角色: [Agent Registry 中的 role 名]
前置条件: [哪些功能必须先完成]
输入:
  - 功能 ID: [F0xx]
  - 参考文档: [路径列表，必须全部读取]
  - 模板: [路径]
  - 约束: [AGENTS.md 硬性规则, conventions 等]
输出: [产出文件路径 + 期望状态]
验收标准:
  - [具体可检查的条件，逐条列出]
禁止:
  - 不得自行调用 skill 产出内容
  - 不得跳过 harness-journal 记录
  - 不得修改 sub_id
```

**L2 处理流程**：查 Agent Registry 找到 `role` 对应的 `prompt_template` → 注入 `_bootstrap.md` 标准引导模板 → 填充 Controller Spec 任务上下文 → 产出完整 system prompt 交 L0(K总) 粘贴。

### 3. 标准引导模板

L2 自动注入每份 L3 提示词的模板内容（文件：`docs/handbook/prompts/_bootstrap.md`）。

**冷启动 5 步**（必须首先执行，按顺序读取）：

1. `AGENTS.md` — 项目全貌、硬性规则、技术栈、当前阶段与下一步
2. `progress.txt` — 所有历史进度记录（按时间顺序）
3. `feature_list.json` — 功能状态（passing/todo）
4. `docs/plans/current-sprint.md` — 当前 Sprint 范围与功能依赖
5. `harness-journal/README.md` — 开发日志索引（必读）→ 深入读最近 3 条 journal

**硬约束 8 条**：

1. 角色边界：只做本角色职责，不越界，超出范围报告 L1
2. 禁止自执行 skill 产出内容（skill ≠ agent，详见第 4 节）
3. 每完成一个 Task 必须写 harness-journal
4. 完成后更新 progress.txt
5. 不修改 sub_id
6. 不跳过 verify.sh（涉及代码时，14 项必须全通过）
7. 遵守三大失败模式：不 One-shot，不过早宣布胜利，不过早标记功能完成
8. 产出会被独立 L3 校验 Agent 审阅——L1 只做流程检查不做内容质量判定，修订后必须重新校验。你需要对自己的产出质量负责。

**完成标志**：产出文件已写入指定路径 / progress.txt 已追加 / harness-journal 已记录 / 向 L1 报告（做了什么、产出在哪、验收标准是否全过）。

### 4. Skill ≠ Agent 约束

这是 F011 要解决的核心问题：区分"自己干"和"真委派"。

| 维度 | Skill | Agent |
|---|---|---|
| 运行方式 | 在当前 Agent 上下文加载指令 | 派生新 runtime 实例 |
| context window | 共享当前窗口（会污染） | 独立窗口（隔离） |
| 工具集 | 继承当前 Agent 全部工具 | 白名单受限 |
| 生命周期 | 随当前会话结束 | 独立启停 |
| **本质** | **自己干** | **真委派** |

**判定规则**：产出内容（设计文档/代码/原型）必须通过 Agent 委派——L1 产出 Controller Spec → L2 生成提示词 → L0 开新会话 → L3 独立产出。不得通过 skill 在当前上下文自行产出。

**反模式示例**：L1 调 design-canvas skill 产出原型 HTML = 形式上委派，本质自己干（共享 context window + 继承全部工具 + 无独立启停）。

### 5. 6 闸门 actor 分配表

与 `docs/architecture/harness-flow.md` 的菱形门控对齐：

| 闸门 | 所在阶段 | actor | 机制 |
|---|---|---|---|
| 原型确认 | 阶段1 信息层 | 人类(K总) | interrupt + 等待人工确认 |
| 设计审批 | 阶段2 功能拆分 | 人类(K总) | interrupt + 等待人工确认 |
| 测试结果 | 阶段5 自校验 | 自动 | conditional edge，无需人工 |
| 解决成功 | 阶段5 反馈循环 | Agent | conditional edge，自动判断 |
| 审查通过 | 阶段6 合并部署 | Agent 或人类 | 默认 Agent，可疑时升级人类 |
| 验收通过 | 阶段7 可观测性 | 人类(K总) | interrupt + 等待人工确认 |

**实现机制**：采用多节点 interrupt_before 拓扑——每个人类闸门节点独立设置 `interrupt_before` + `Command(resume=...)` 实现暂停/恢复，闸门位置明确、调试方便。自动闸门用 conditional edge 路由函数判断，无需 interrupt。

> 跨文档同步待办：`state-design.md` 第 54 行 `interrupt_before=["human_interrupt"]` 为单一节点设计，需在跨文档同步阶段更新为多节点拓扑，与 F011 §5 对齐。

审查通过闸门的"可疑升级"触发维度：覆盖率下降幅度、失败测试比例、新增代码与测试比例失衡等。具体阈值由 F002 编码实现时定义（如覆盖率下降 > 10%、失败测试比例 > 30%）。F011 仅定义升级机制和触发维度，不固定阈值。Agent 审查发现异常模式时设置 `human_intervention = True` 转入逃生口。

### 6. 循环预算机制

防止反馈循环和 DRR 长循环无限旋转消耗资源。

**State 字段**（与 `state-design.md` HarnessState 对齐，标注 [NEW]）：

```python
max_iterations: int       # [NEW] 默认 5，可按功能复杂度调整
current_iteration: int    # [NEW] 初始 0
```

**设计决策**：反馈循环（阶段5）和 DRR 长循环（阶段7）共用同一循环预算（`max_iterations` / `current_iteration`）。理由：(1) 简化状态管理，无需区分循环类型的独立计数器；(2) 总预算可控——无论哪种循环消耗，总迭代次数有上限；(3) 两种循环不会同时运行（流程是线性的）。

**运行规则**：

1. 每次进入反馈循环（阶段5 失败→修复→回到写代码）时 `current_iteration += 1`
2. 每次进入 DRR 长循环（阶段7 验收失败→修正环境→回到写代码）时 `current_iteration += 1`
3. 当 `current_iteration > max_iterations` 时，设置 `human_intervention = True`
4. `human_intervention = True` 触发逃生口：流程暂停，等待人工介入决策（继续/放弃/调整预算）
5. 人工介入后将 `current_iteration` 重置为 0，可调整 `max_iterations`
6. 当 `issue_resolved=True` 或循环正常退出（如测试通过不再需要反馈循环）时，`current_iteration` 重置为 0。循环预算是 per-loop 的，不跨循环累积。

**与现有字段的关系**：复用 `state-design.md` 已有的 `human_intervention: bool` 和 `feedback_log: list[dict]`，不新增布尔字段。`feedback_log` 记录每次循环的迭代上下文。

### 7. L1 工具白名单

与 `docs/handbook/orchestrator-prompt.md` 一致，L1 只能使用以下 6 个工具：

| 工具 | 用途限制 |
|---|---|
| `read_file` | 读取项目文件（无限制） |
| `write_file` | 仅写入持久化记忆文件（progress.txt / feature_list.json / AGENTS.md / harness-journal/） |
| `edit_file` | 仅编辑持久化记忆文件 |
| `exec_shell` | 仅运行验证命令（verify.sh / ts-check / pytest 等） |
| `grep_file` | 搜索文件内容 |
| `glob_file` | 搜索文件名 |

**禁止**：自行调用 design-canvas / llm / image-generation 等 skill 产出内容。L1 的职责是拆解、路由、验收、更新记忆，不直接产出业务内容。

### 8. 子管控者 vs 同级管控者

**子管控者**（sub-controller）：
- L1 之下的管控层，只管特定 Task 的子流程
- 超出授权范围必须上报 L1，不能自行扩权
- 产出回 L1 验收，不直接更新持久化记忆
- 场景：复杂功能拆分为多个子任务时，L1 委派子管控者管理子任务序列

**同级管控者**（peer controller）：
- 与 L1 平级，各管一域（如前端管控者、后端管控者）
- 通过 L1 协调跨域协作
- 当前项目无同级管控者

**当前状态**：项目只有 L1（project-controller），子管控者和同级管控者均为未来扩展预留。F011 定义概念和约束，不实现代码。

### 9. meta 层 vs runtime 层

**meta 层**（造平台自己）：
- 新会话由 L0(K总) 手动开：L1 产出提示词 → K总粘贴到新对话窗口 → L3 Agent 独立产出
- L0 是人类会话创建者，承担"派生 Agent 实例"的角色
- 当前阶段处于 meta 层

**runtime 层**（平台跑起来后）：
- 由 F011 定义的 Agent Runtime 自动派生 L3 Agent 实例
- 无需人工干预：L1 产出 Controller Spec → Agent Runtime 自动创建 L3 会话 → L3 产出 → L1 验收
- 这是未来迭代目标，当前不实现

**过渡策略**：meta 层验证 Agent 社会架构可行性，积累角色定义和协作模式；runtime 层在 F002 编码实现 LangGraph 编排引擎后逐步落地，最终替代手动会话创建。

## 验收标准

1. Agent Registry 数据结构定义完整（第 1 节）— 结构契约 + 5 角色对齐表 + 维护规则
2. Controller Spec 格式定义（第 2 节）— 7 字段标准格式 + L2 处理流程
3. 标准引导模板定义（第 3 节）— 冷启动 5 步 + 硬约束 8 条 + 完成标志
4. Skill ≠ Agent 约束正式定义（第 4 节）— 5 维度对比表 + 判定规则 + 反模式示例
5. 6 闸门 actor 分配表（第 5 节）— 与 harness-flow.md 菱形门控对齐 + 实现机制
6. 循环预算机制（第 6 节）— State 新增字段标注 [NEW] + 运行规则 + 与现有字段关系
7. L1 工具白名单（第 7 节）— 6 工具 + 用途限制 + 与 orchestrator-prompt.md 一致
8. 子管控者 vs 同级管控者（第 8 节）— 概念定义 + 当前状态 + 未来扩展预留
9. meta 层 vs runtime 层（第 9 节）— 两层定义 + 当前阶段 + 过渡策略
10. 单文件 ≤ 300 行

## 依赖

- F001 项目初始化与骨架搭建（已 passing）— 提供项目骨架和持久化记忆基础设施
- Agent 社会架构方案已审批（`harness-journal/stage-02-feature-breakdown/02-agent-society-and-revision-plan.md`）
- `docs/handbook/agent-registry.json` 已创建（5 角色定义）
- `docs/handbook/orchestrator-prompt.md` 已升级（冷启动 5 步 + 硬约束 + 工具白名单）
- `docs/handbook/prompts/_bootstrap.md` 已创建（标准引导模板）
- 跨文档同步待办：`boundaries.md` 第 15 行 server/nodes/ 描述需从"纯函数"更新为"委派桩/状态转换器"，与 AGENTS.md 规则 #5 和 F011 §4 对齐。此修复在跨文档同步阶段执行，不在 F011 文档内修改 boundaries.md。

---

## 修订记录

- Round 1（2026-08-18）：修复 L3 校验 Agent 发现的 6 项缺陷（致命1 + 跨文档2 + 概念3），详见 06-f011-review.md。
- Round 2（2026-08-18）：修复补审发现的 1 项跨文档缺陷（#7: §3 硬约束计数 7→8，补列 L3 校验独立性约束），详见 12-f011-re-review.md。
