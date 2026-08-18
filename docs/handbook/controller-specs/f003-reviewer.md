# Controller Spec: F003 LLM 提供商层 — 设计校验

## 角色ID
design-reviewer

## 任务ID
F003-review-r1

## 输入
- 被审文档: docs/design/feature-f003-llm-provider.md（182 行，Status: Draft）
- 审阅性质: 修订版全量校验
- 参考文档:
  - docs/design/feature-f011-agent-runtime.md（Approved, 271 行）
  - docs/design/feature-f002-langgraph.md（Approved, 225 行）
  - docs/architecture/state-design.md
  - docs/architecture/boundaries.md
  - AGENTS.md
  - docs/handbook/agent-registry.json
  - docs/handbook/orchestrator-prompt.md
  - docs/handbook/prompts/_bootstrap.md

## 输出
校验报告（纯文本），L1 决策依据。不修改设计文档本身。

## 校验范围

### Part A: 3 项缺陷修复验证
逐条验证以下 3 项缺陷是否真正修复:

| # | 原缺陷 | 修法 | 验证点 |
|---|---|---|---|
| 1 | "零改动扩展"夸大 | 措辞改为"接口层零改动，实现层需新增 Provider 子类并注册到工厂函数" | §目标段措辞已修正；不再有"零改动扩展"绝对表述 |
| 2 | Token 用量未落 State | HarnessState 新增 token_usage_total [NEW] + complete_with_state 累加 | HarnessState 定义含 token_usage_total；complete_with_state 累加逻辑展示；跨文档同步待办标注（state-design.md 需同步）；Node 集成示例展示 token 用量写入 state |
| 3 | 错误处理不一致（ValueError vs graceful） | 新增 LLMError 自定义异常 + 工厂/OpenAIProvider 统一 raise + Node try/except 捕获设 human_intervention | LLMError 类定义存在；工厂函数 raise LLMError；OpenAIProvider 统一 LLMError；Node 集成示例含 try/except LLMError → human_intervention=True；"graceful 降级"措辞已修正 |

每条给出: 已修复 / 部分修复 / 未修复 + 证据（行号 + 内容摘要）

### Part B: 7 维度全量检查

1. **内部一致性**: 文档内定义、引用、计数、命名是否自洽
2. **跨文档一致性**:
   - 与 F002 对齐: Node async def 返回 dict 模式、HarnessState 字段、human_intervention 机制
   - 与 F011 对齐: Node 委派桩定义、human_intervention 逃生口、Controller Spec 引用
   - 与 state-design.md: tech_stack 字段、token_usage_total 新增待办
   - 与 AGENTS.md: 技术栈基线、规则 #8（POST/PUT Pydantic BaseModel）、规则 #2（logging）
   - 与 _bootstrap.md: 硬约束 8 条
3. **HITL 落地**: human_intervention 设置路径是否完整可实现
4. **循环安全**: N/A（F003 不涉及循环预算）→ 标注"不适用"即可
5. **Skill ≠ Agent 完整性**: F003 是否涉及 skill 调用，如有是否正确标注"Agent 委派非 skill 调用"
6. **非目标边界**: F003 是否越界定义了不属于 LLM 提供商层的职责
7. **遗漏检查**: 是否有 WorkBuddy 原始评审指出但未覆盖的问题

### 新引入缺陷
若 Part B 发现修订引入的新问题，按 [级别] + [维度] + [位置] + [描述] + [修法] 格式列出。

## 验收标准
1. Part A 每条缺陷给出明确结论（已修复/部分修复/未修复）
2. Part B 每个维度给出通过/缺陷数
3. 最终结论: 通过 / 需修订后重审
4. 完成后写 harness-journal（编号取 stage-02-feature-breakdown/ 下最大编号 +1）
5. 完成后更新 progress.txt
6. 不修改被审文档
7. 不调用 skill
8. 不修改 sub_id
