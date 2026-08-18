# Agent 社会架构方案与设计文档修订计划

> 日期: 2026-08-17
> 阶段: stage-02 约束层 → 功能拆分
> 触发: K总提供 WorkBuddy 评审记录，揭示单体 Agent 反模式 + 设计文档 16 项缺陷
> 状态: 方案待 K总审批

---

## 一、问题诊断：我就是单体 Agent 反模式的活体样本

### 1.1 事实陈述

| 行为 | 应有的角色 | 实际行为 | 问题 |
|---|---|---|---|
| 生成原型 HTML | L3 设计编写 Agent | 我自己调 design-canvas skill 产出 | skill 在当前上下文加载=自己干，不是委派 |
| 编写 F002/F003/F006 设计文档 | L3 设计编写 Agent | 我自己写了三份文档 | 管控者兼开发者，违反专业化 |
| 审阅设计文档一致性 | L3 设计校验 Agent | 我自己做了交叉检查 | 自己写自己审，没有独立校验 |
| 被提醒才写 journal | 不需要提醒 | K总纠正后才补 | journal 不在冷启动序列里 |

### 1.2 根因

`orchestrator-prompt.md` 的冷启动序列读 AGENTS.md → progress.txt → feature_list.json → current-sprint.md，**不含 harness-journal**。harness-journal 只在"按需深入"表中，导致新 Agent 不知道要沉淀交互记录。

更深层：当前没有"Agent 社会"概念——只有一个 Agent（我）包揽一切，没有角色分离、没有独立校验、没有标准引导模板。

### 1.3 已确认的三项掌舵决策（K总在 WorkBuddy 对话中拍板）

1. **回退点 = 设计闸门**，不回退任何代码（server/ 仅 146 行 stub，零回退成本）
2. **人类介入粒度 = 默认通过，仅可疑角色拦截**
3. **"skill ≠ agent" 作为 F011 基础架构约束**

---

## 二、解决方案：Agent 社会分层架构

### 2.1 L0-L3 分层定义

```
L0  人类（K总）
    ├─ 在闸门和关键决策拍板
    ├─ 充当 Agent 会话创建者（开新对话窗口 = 派生 L3 Agent 实例）
    └─ 把 L1 给的提示词粘贴到新会话即可

L1  项目管控 Agent（我，当前角色）
    ├─ 读取持久化记忆 → 确认当前状态
    ├─ 拆解工作 → 产出 Controller Spec（任务卡）
    ├─ 路由到正确的 L3 角色
    ├─ 验收 L3 产出 → 更新持久化记忆
    ├─ 自己不干活（不写代码、不写设计文档、不调 skill 产出内容）
    └─ 工具白名单：read_file / write_file(仅持久化记忆) / exec_shell(仅验证)

L2  提示词工程师（由 L1 内置逻辑执行，不需要独立会话）
    ├─ 接收 L1 的 Controller Spec
    ├─ 查 Agent Registry 找到目标角色的 Prompt 模板
    ├─ 注入标准引导模板（冷启动序列 + 禁止自执行 + journal 强制）
    ├─ 填充任务上下文（功能 ID、设计文档路径、验收标准）
    └─ 产出完整 system prompt 交给 L0 粘贴

L3  工作 Agents（各自独立会话，独立 context window）
    ├─ 设计编写 Agent：按 Controller Spec 编写设计文档
    ├─ 设计校验 Agent：独立审阅设计文档，输出缺陷清单
    ├─ 编码 Agent：按设计文档实现代码，跑 verify.sh
    ├─ 测试审查 Agent：审查测试覆盖率和质量
    └─ 每个角色只干一件事，完成后产出回 L1
```

### 2.2 关键区分：Skill ≠ Agent

| 维度 | Skill | Agent |
|---|---|---|
| 运行方式 | 在当前 Agent 上下文加载指令 | 派生新 runtime 实例 |
| context window | 共享当前窗口（会污染） | 独立窗口（隔离） |
| 工具集 | 继承当前 Agent 全部工具 | 白名单受限 |
| 生命周期 | 随当前会话结束 | 独立启停 |
| 本质 | **自己干** | **真委派** |

结论：我调 design-canvas skill 产出原型 = 形式上委派，本质自己干。正确做法是 L1 产出 Controller Spec → L2 生成提示词 → L0 开新会话 → L3 设计 Agent 独立产出。

### 2.3 工作流程（落地方案）

```
┌─────┐    1. Controller Spec     ┌─────┐
│ L1  │ ─────────────────────────→ │ L2  │
│(我) │                            │(内置)│
│     │ ←─────────────────────────  │     │
│     │    2. 完整 system prompt     │     │
└──┬──┘                            └─────┘
   │
   │ 3. 把 prompt 交给 K总
   ▼
┌─────┐    4. K总开新对话，粘贴 prompt   ┌─────┐
│ L0  │ ─────────────────────────────→ │ L3  │
│(K总)│                                 │(工作)│
│     │ ←─────────────────────────────  │     │
│     │ 5. L3 产出（设计文档/代码/审查）  │     │
└─────┘                                 └─────┘
   │
   │ 6. K总把产出带回给 L1
   ▼
┌─────┐
│ L1  │ 7. 验收 → 更新持久化记忆 → 下一个任务
│(我) │
└─────┘
```

### 2.4 Controller Spec 格式（L1 产出）

```
[Controller Spec]
任务: 编写 F002 LangGraph 编排引擎设计文档
角色: design-writer
前置条件: F001 passing, 原型确认通过
输入:
  - 功能 ID: F002
  - 参考文档: docs/architecture/state-design.md, docs/architecture/harness-flow.md
  - 模板: docs/design/_template.md
  - 约束: AGENTS.md 硬性规则, docs/conventions/coding.md
输出: docs/design/feature-f002-langgraph.md (Status: Draft)
验收标准:
  - state-design.md 中的 HarnessState 字段全部覆盖
  - 6 个 HITL 闸门有 interrupt 机制设计
  - 循环有 max_iterations 终止保护
  - Node 定义为"委派桩/状态转换器"而非"纯函数"
  - 单文件 ≤ 300 行
禁止:
  - 不得自行调用 skill 产出内容
  - 不得跳过 harness-journal 记录
  - 不得修改 sub_id
```

### 2.5 标准引导模板（L2 自动注入每份提示词）

```
[标准引导模板 - 必须注入每份 L3 提示词]

## 冷启动（必须首先执行）
1. AGENTS.md — 项目全貌、硬性规则、技术栈
2. progress.txt — 所有历史进度
3. feature_list.json — 功能状态
4. docs/plans/current-sprint.md — 当前 Sprint
5. harness-journal/README.md — 开发日志索引（必读！）
   → 深入读最近 3 条 journal 了解上下文

## 硬约束
- 你是 [角色名]，只做 [角色职责]，不越界
- 禁止自行调用 skill 产出内容（skill ≠ agent，详见 F011）
- 每完成一个 Task 必须写 harness-journal（不可遗漏）
- 完成后更新 progress.txt
- 不修改 sub_id
- 不跳过 verify.sh（涉及代码时）

## 完成标志
- 产出文件已写入指定路径
- progress.txt 已追加记录
- harness-journal 已记录
- 向 L1 报告：做了什么、产出在哪、验收标准是否全过
```

---

## 三、设计文档修订计划

### 3.0 修订顺序（严格依赖）

```
F011 新增（Agent Runtime）  ← 先定义 Agent 社会架构
  ↓
F002 修订（LangGraph 编排）  ← 6 项致命缺陷
  ↓
F003 修订（LLM 提供商层）    ← 3 项缺陷
  ↓
F006 修订（前端 UI）         ← 3 项缺陷
  ↓
跨文档同步（AGENTS.md / state-design.md / convention-mapping.md）
```

### 3.1 F011 新增：Agent Runtime 与编排治理

**目的**: 定义 Agent 社会的运行时基础设施，作为所有功能的架构底座。

**核心内容**:
- Agent Registry：持久化的角色注册表（角色名、职责、工具白名单、Prompt 模板路径）
- Controller Spec 格式：L1 → L3 的任务卡标准格式
- 标准引导模板：自动注入冷启动序列（含 harness-journal）+ 禁止自执行 + journal 强制
- Skill ≠ Agent 约束：skill 在当前上下文加载=自己干；agent 派生新实例=真委派
- 6 闸门 actor 分配表：

| 闸门 | actor | 机制 |
|---|---|---|
| 原型确认 | 人类(K总) | interrupt + 等待人工确认 |
| 设计审批 | 人类(K总) | interrupt + 等待人工确认 |
| 测试结果 | 自动 | conditional edge, 无需人工 |
| 解决成功 | Agent | conditional edge, 自动判断 |
| 审查通过 | Agent或人类 | 默认 Agent，可疑时升级人类 |
| 验收通过 | 人类(K总) | interrupt + 等待人工确认 |

- 循环预算：state 新增 `max_iterations: int` + `current_iteration: int`，超限 → `human_intervention = True`（逃生口）
- L1 工具白名单：`read_file`, `write_file`(仅持久化记忆), `exec_shell`(仅验证), `grep_file`, `glob_file`
- 子管控者 vs 同级管控者：子管控者只管特定 Task，超出范围必须上报 L1，不能自己扩权
- meta 层 vs runtime 层：meta 层（造平台自己）新会话由 L0 手动开；runtime 层（平台跑起来后）由 F011 自动派生

### 3.2 F002 修订：6 项致命缺陷

| # | 缺陷 | 修法 |
|---|---|---|
| 1 | HITL 没落地：6 闸门布尔值无 interrupt 机制 | 每个闸门用 `interrupt_before` + `Command(resume=...)` 实现，非布尔值判断 |
| 2 | 循环无终止保护：反馈循环和 DRR 长循环无 max_iterations | state 加 `max_iterations` + `current_iteration`，超限转 `human_intervention` |
| 3 | 纯函数自相矛盾：F002 说 Node 是纯函数，但 F003 的 Node 要调 LLM | Node 定义改为"委派桩/状态转换器"：接收 State → 向 Agent Runtime 请求执行 → 等回产物 → 返回更新后的 State |
| 4 | 熵管理矛盾：正文说"横切"，阶段8说"独立阶段" | 统一为"横切关注点"：不是线性阶段，是 verify 通过后触发的事件驱动任务 |
| 5 | 阶段编号不自洽：称"8 阶段"但有 0-8 共 9 个节点 | 统一为"阶段 0-7（8 个阶段）"，阶段 8 熵管理改为横切 |
| 6 | tech_stack 契约缺校验 | state 的 `tech_stack` 字段加 Pydantic 验证，Node 入口校验一致性 |

AGENTS.md 规则 #5 同步修改：
- 旧: "LangGraph Node 必须是纯函数，接收 State 返回 State"
- 新: "LangGraph Node 是委派桩/状态转换器：接收 State → 委派 Agent Runtime 执行 → 返回更新后的 State。Node 本身不含业务逻辑。"

### 3.3 F003 修订：3 项缺陷

| # | 缺陷 | 修法 |
|---|---|---|
| 1 | "零改动扩展"夸大 | 改为"接口层零改动，实现层需新增 Provider 子类 + 注册表登记" |
| 2 | Token 用量未落 state | `complete_with_state` 返回时更新 `state["token_usage"]`，含 prompt_tokens/completion_tokens/total |
| 3 | 错误处理不一致 + async/def 矛盾 | 统一为 `async def`（LangGraph 支持 async）；统一用自定义异常 `LLMProviderError`，禁止裸 ValueError |

### 3.4 F006 修订：3 项缺陷

| # | 缺陷 | 修法 |
|---|---|---|
| 1 | 缺 DAG 视图（Type 1，回环边画不出） | 用 `@xyflow/react` 的 `ReactFlow` 组件渲染只读 DAG，支持回环边和反馈循环 |
| 2 | TS HarnessState 缺 6 个闸门布尔 | 补齐 `prototype_confirmed` / `design_approved` / `test_passed` / `issue_resolved` / `review_passed` / `acceptance_passed`，与后端 state-design.md 对齐 |
| 3 | 实时机制矛盾（SSE vs 轮询）+ StatusBadge 三色 vs 4 状态 | 统一为 SSE（F007 实现）；StatusBadge 改为 4 状态：pending / running / passed / failed |

### 3.5 跨文档同步

| 文档 | 修改内容 |
|---|---|
| AGENTS.md | 规则 #5 改为"委派桩"；"当前阶段"更新；新增 F011 到功能列表引用 |
| state-design.md | HarnessState 加 `max_iterations` / `current_iteration` / `token_usage`；6 闸门布尔字段补齐；标注 Node 为委派桩 |
| convention-to-rule-mapping.md | 规则 #5 状态更新；新增 F011 相关规则行 |
| harness-flow.md | 阶段编号统一 0-7（8 阶段）；阶段 8 熵管理改为横切关注点 |
| orchestrator-prompt.md | 冷启动加 harness-journal；加"禁止自执行 skill"；加子管控者授权约束 |

---

## 四、orchestrator-prompt.md 升级方案

### 4.1 冷启动序列修改

```
旧:
1. AGENTS.md
2. progress.txt
3. feature_list.json
4. docs/plans/current-sprint.md

新:
1. AGENTS.md
2. progress.txt
3. feature_list.json
4. docs/plans/current-sprint.md
5. harness-journal/README.md → 深入读最近 3 条 journal
```

### 4.2 新增硬约束段

```
## 硬约束（违反即事故）

1. 禁止自执行 skill 产出内容
   - skill 在当前上下文加载 = 自己干，不是委派
   - 需要产出设计文档/代码/原型时，产出 Controller Spec → L2 生成 prompt → L0 开会话
   - 你（L1）只做：拆解、路由、验收、更新记忆

2. 每次交互和任务必须沉淀 harness-journal
   - 委派任务前：写 journal（记录 Controller Spec）
   - 验收产出后：写 journal（记录验收结果）
   - K总决策后：写 journal（记录决策内容）
   - 不依赖对话记忆，只依赖持久化文件

3. 子管控者授权约束
   - 你是 L1 项目管控 Agent，管全局
   - 如需子管控者（管特定 Task），子管控者只管授权范围内的事
   - 超出范围必须上报 L1，不能自己扩权
   - 子管控者产出回 L1 验收，不直接更新持久化记忆
```

### 4.3 Task 3 修改

```
旧:
  关键约束: Node必须是纯函数(State→State)

新:
  关键约束: Node是委派桩/状态转换器(State→AgentRuntime→State), 不含业务逻辑
```

---

## 五、以后不再出现这种情况的结构性保障

### 5.1 三层保障

| 层 | 保障措施 | 机制 |
|---|---|---|
| **预防层** | 标准引导模板自动注入每份 L3 提示词 | 冷启动含 journal + 禁止自执行 + 角色边界 |
| **检测层** | L1 验收时检查 journal 是否写入 | L3 产出回 L1 时，L1 先查 journal 是否存在 |
| **纠正层** | convention-mapping.md 新增规则行 | "harness-journal 沉淀" → 状态 ✅ 已机械化（L1 验收时检查） |

### 5.2 Agent Registry（F011 产物）

```json
{
  "agents": [
    {
      "role": "project-controller",
      "level": "L1",
      "description": "项目管控，拆解/路由/验收",
      "tools": ["read_file", "write_file", "exec_shell", "grep_file", "glob_file"],
      "prompt_template": "docs/handbook/orchestrator-prompt.md",
      "prohibitions": ["不得自执行skill产出内容", "不得直接编写业务代码"]
    },
    {
      "role": "design-writer",
      "level": "L3",
      "description": "按 Controller Spec 编写设计文档",
      "tools": ["read_file", "write_file", "grep_file", "glob_file"],
      "prompt_template": "docs/handbook/prompts/design-writer.md",
      "prohibitions": ["不得自行调用skill", "不得修改sub_id"]
    },
    {
      "role": "design-reviewer",
      "level": "L3",
      "description": "独立审阅设计文档，输出缺陷清单",
      "tools": ["read_file", "grep_file", "glob_file"],
      "prompt_template": "docs/handbook/prompts/design-reviewer.md",
      "prohibitions": ["不得修改文件", "不得自行调用skill"]
    },
    {
      "role": "coder",
      "level": "L3",
      "description": "按设计文档实现代码",
      "tools": ["read_file", "write_file", "edit_file", "exec_shell", "grep_file", "glob_file"],
      "prompt_template": "docs/handbook/prompts/coder.md",
      "prohibitions": ["不得自行调用skill", "不得跳过verify.sh", "不得修改sub_id"]
    }
  ]
}
```

### 5.3 验收检查清单（L1 每次验收必跑）

```
□ 产出文件存在于指定路径
□ 产出内容符合 Controller Spec 的验收标准
□ harness-journal 已记录（L3 自己写的）
□ progress.txt 已追加（L3 自己写的）
□ 涉及代码时 verify.sh 14 项全通过
□ 没有违反"禁止自执行 skill"约束
```

---

## 六、立即行动项

### 第一步：K总审批本方案

本方案需要 K总确认以下决策点：
1. L0-L3 分层架构是否认可
2. "我出 prompt → K总开会话" 的协作模式是否认可
3. F011 新增 + F002/F003/F006 修订顺序是否认可
4. orchestrator-prompt.md 升级内容是否认可

### 第二步：方案通过后的执行序列

```
1. 升级 orchestrator-prompt.md（冷启动加 journal + 禁止自执行 + 委派桩）
2. 同步 AGENTS.md 规则 #5
3. 新增 F011 到 feature_list.json
4. L1 产出 F011 Controller Spec → L2 生成 prompt → K总开会话 → L3 编写 F011 设计文档
5. L1 产出"设计校验"Controller Spec → K总开会话 → L3 校验 Agent 审 F011
6. L1 验收 → 修订 → F011 Approved
7. 同理推进 F002 修订 → F003 修订 → F006 修订
8. 跨文档同步
9. 设计闸门通过 → 进入编码阶段
```

### 第三步：编码阶段每个功能的工作流

```
F002 编码:
  L1 产出 Controller Spec → L2 生成 coder prompt → K总开会话 → L3 编码 Agent 实现
  L3 跑 verify.sh → 通过 → 产出回 L1
  L1 验收（检查 journal + progress + verify.sh）→ 更新 feature_list.json

F003 编码: 同上
F006 编码: 同上
```

---

## 附录：16 项设计缺陷完整索引

### 致命级（3 项）
1. HITL 没落地：6 闸门布尔值无 interrupt 机制
2. 循环无终止保护：无 max_iterations
3. 纯函数自相矛盾：F002 说纯函数，F003 调 LLM

### 跨文档级（4 项）
4. 实时机制矛盾：F002 写 SSE，F006 写轮询
5. HarnessState 前后端漂移：TS 缺 6 个闸门布尔
6. Node 同步/异步不统一：F002 用 def，F003 用 async def
7. tech_stack 契约缺校验

### 概念级（3 项）
8. 熵管理矛盾：正文"横切" vs 阶段8"独立阶段"
9. 阶段编号不自洽：称"8 阶段"但有 0-8 共 9 节点
10. 需求页 toggle 与约束页功能重叠

### F006 专项（3 项）
11. 缺 DAG 视图（Type 1，回环边画不出）
12. Trace 不完整（缺 Node 入参/出参/耗时）
13. StatusBadge 三色 vs 4 状态

### F003 专项（3 项）
14. "零改动扩展"夸大
15. Token 用量未落 state
16. 错误处理不一致（ValueError vs graceful）
