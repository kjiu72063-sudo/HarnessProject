# F003 LLM 提供商层设计文档 — L3 全量校验

## 步骤名称
F003 可插拔 LLM 提供商层 — 修订版全量校验（Part A + Part B）

## 执行时间
2026-08-18

## 前置条件
- F011 Agent Runtime 已 Approved（271 行，缺陷链闭合）
- F002 LangGraph 编排引擎 已 Approved（225 行，缺陷链闭合）
- F003 修订 Round 1 完成（182 行，Status: Draft，3 项缺陷已修）
- L1 流程验收通过，委派 L3 校验 Agent 做全量校验（journal 29）

## 执行内容

### 1. 冷启动
按标准引导模板执行冷启动 5 步：
1. AGENTS.md — 项目全貌、硬性规则 13 条、L1 职责边界、踩坑索引
2. progress.txt — 101 条历史进度，关注 F003-revision-r1（line 99）和 F003-review-delegation（line 100）
3. feature_list.json — F001 passing, F011/F002 approved, F003-F010 todo
4. docs/plans/current-sprint.md — Sprint 1 范围（F002/F003/F006）
5. harness-journal/README.md — 开发日志索引 + 最近 3 条 journal（27/28/29）

### 2. 读取校验输入
- Controller Spec: docs/handbook/controller-specs/f003-reviewer.md
- 被审文档: docs/design/feature-f003-llm-provider.md（182 行，Status: Draft）
- 参考文档: F011（Approved, 271 行）/ F002（Approved, 225 行）/ state-design.md / boundaries.md / AGENTS.md / agent-registry.json / _bootstrap.md

### 3. Part A: 3 项缺陷修复验证

| # | 原缺陷 | 结论 | 证据 |
|---|---|---|---|
| 1 | "零改动扩展"夸大 | 已修复 | line 10: "接口层零改动，实现层需新增 Provider 子类并注册到工厂函数（DeepSeek、Kimi 等）"——绝对表述"零改动扩展"已消除，改为接口层零改动+实现层需新增子类+注册工厂 |
| 2 | Token 用量未落 State | 已修复 | line 82: `token_usage_total: TokenUsage` [NEW] + F002 引用; line 85: state-design.md 跨文档同步待办; lines 106-125: complete_with_state 累加逻辑; lines 143-149: Node 集成示例通过 complete_with_state 返回 new_state 含 token_usage_total |
| 3 | 错误处理不一致 | 已修复 | lines 29-36: LLMError(Exception) 类定义; line 97: 工厂函数 `raise LLMError`; line 104: OpenAIProvider "API 调用失败 → raise LLMError"; lines 142-154: Node try/except LLMError → human_intervention=True; line 165: 验收标准"raise LLMError，Node 捕获后设 human_intervention" |

### 4. Part B: 7 维度全量检查

#### 维度1 内部一致性: 通过
- LLMProvider Protocol 定义 complete + complete_with_state，与 OpenAI 实现要点、验收标准、Node 集成示例一致
- LLMError 在异常定义(line 33)、工厂(line 97)、OpenAI(line 104)、Node(line 153)、验收标准(line 164-165) 五处引用一致
- TokenUsage 在定义(line 68)、LLMResponse(line 65)、HarnessState(line 82)、complete_with_state(line 114-122) 四处引用一致
- 模块列表(7 个)与代码示例引用的模块一致
- 文件 182 行 ≤ 300 行

#### 维度2 跨文档一致性: 2 项缺陷

**缺陷 #1 [中等] Node 集成示例与 F002 委派桩规范不一致**
- 位置: lines 136-155
- F002 §Node 委派桩规范(line 106-123): "每个 Node 是委派桩/状态转换器，不含业务逻辑"，示例通过 `agent_runtime.delegate()` 委派 L3 Agent
- AGENTS.md 规则 #5: "LangGraph Node 是委派桩/状态转换器：接收 State → 委派 Agent Runtime 执行 → 返回更新后的 State。Node 本身不含业务逻辑。"
- F003 Node 示例(line 140-155)展示 Node 直接调用 `get_llm_provider()` + `complete_with_state()`，并设置 `design_docs`——这是业务逻辑，与委派桩规范不一致
- F003 全文未提及"委派"、"Agent Runtime"、"L3 Agent"，Node 集成示例未考虑委派模式
- complete_with_state 方法(R1 新增)接收 HarnessState 参数，专为 Node 级调用设计，进一步强化了直接调用模式
- 修法: 修改集成示例展示 L3 Agent 调用 LLM Provider + Node 通过 Agent Runtime 委派；或添加注释标注"meta 层简化示例，runtime 层 LLM 调用应在 L3 Agent 内执行"

**缺陷 #2 [轻微] boundaries.md 缺 server/llm/ 跨文档同步待办**
- 位置: 模块列表 lines 21-27
- F003 新增 `server/llm/` 目录（7 个模块文件），但未添加 boundaries.md 跨文档同步待办
- boundaries.md 当前目录结构和依赖方向(lines 12-23)不包含 server/llm/
- F002、F011 均有 boundaries.md 同步待办（更新"纯函数"→"委派桩"），F003 应遵循相同模式
- 修法: 添加跨文档同步待办，标注 boundaries.md 需新增 server/llm/ 目录及依赖方向

#### 维度3 HITL 落地: 通过
- LLMError → Node try/except 捕获 → 返回 `{**state, "human_intervention": True}` 路径完整
- human_intervention 字段为 state-design.md 既有字段(line 45)，F011 §6 rule 4 定义其触发逃生口
- Node 捕获 LLMError 时不更新 current_stage，仅设 human_intervention——下一闸门(原型确认 interrupt_before)暂停时人类可见该标志位
- 设置路径从 F003 视角完整可实现；路由处理属 F002 职责

#### 维度4 循环安全: 不适用
- F003 不涉及循环预算、反馈循环、DRR 长循环

#### 维度5 Skill ≠ Agent 完整性: 通过
- F003 为 LLM 提供商层设计，不涉及 skill 调用
- F003 全文无 skill 引用，无违反 F011 §4 Skill ≠ Agent 约束

#### 维度6 非目标边界: 通过
- 非目标(4 项)清晰: 不实现第二个提供商/缓存限流重试/流式回调/prompt 模板管理
- 设计内容(LLMProvider/OpenAIProvider/工厂/异常/State 集成)均在 LLM 提供商层范围内
- 无 API 端点新增（LLM 层为内部服务）
- 无越界定义 Node 行为或 Agent 行为

#### 维度7 遗漏检查: 通过
- WorkBuddy 原始评审 F003 专项 3 项缺陷均已覆盖并修复
- 验收标准 12 项覆盖: Protocol/实现/工厂/异常/HITL/State/Pydantic/print/覆盖率/verify.sh/依赖
- 无遗漏的 WorkBuddy 评审问题

### 5. 约束遵守
- ✅ 仅做设计文档审阅，不写设计文档、不写代码
- ✅ 未调用任何 skill
- ✅ 未修改被审文档
- ✅ 未修改 sub_id
- ✅ 产出可被独立审查

## 产出物
- 校验报告（纯文本，输出给 L1）
- harness-journal: 30-f003-review.md
- progress.txt: 追加 F003-review 记录

## 验证结果

### Part A: 3/3 已修复
### Part B: 2 项跨文档一致性缺陷（1 中等 + 1 轻微）
### 新引入缺陷: 2 项（complete_with_state 强化 Node 直接调用模式 + boundaries.md 同步待办遗漏）
### 最终结论: 需修订后重审

## 备注
- 缺陷 #1（Node 集成示例与委派桩规范不一致）为跨文档设计一致性问题，非逻辑错误。L1 可决策: (a) 要求修改示例为委派模式, 或 (b) 接受添加注释标注 meta 层简化。两种修法均不需大范围重构。
- 缺陷 #2（boundaries.md 同步待办）为轻微遗漏，添加一行待办标注即可。
- 3 项原缺陷修复质量良好，修订未引入逻辑错误或内部不一致。
