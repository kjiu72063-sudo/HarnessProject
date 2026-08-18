# Controller Spec: F003 设计文档修订

## 基本信息
- **角色**: design-writer (L3)
- **任务类型**: 修订（Round 1）
- **目标文件**: docs/design/feature-f003-llm-provider.md（123 行 → 修订后 ≤ 300 行）
- **前置条件**: F002 已 Approved

## 背景
F003 初版设计文档存在 3 项缺陷，需修订后经 L3 校验 Agent 审阅。

## 缺陷清单

### #1 [概念] "零改动扩展"夸大
- **位置**: line 10 目标段
- **问题**: 声称"后续可零改动扩展其他模型"，实际新增提供商需新增子类 + 注册到工厂函数 match case，不是零改动
- **修法**: 改为"接口层零改动，实现层需新增 Provider 子类并注册到工厂函数"

### #2 [跨文档] Token 用量未落 State
- **位置**: line 55-61 TokenUsage + line 81 错误处理
- **问题**: LLMResponse 含 TokenUsage 但 Node 集成示例（line 97-102）未将 token 用量写入 HarnessState。F002 已定义 max_iterations/current_iteration 等 state 字段，token 用量也应落 state 以供前端监控页展示和成本追踪
- **修法**: 
  1. HarnessState 新增 token_usage_total: TokenUsage（标注 [NEW]，引用 F002 HarnessState）
  2. complete_with_state 返回的 new_state 中累加 token_usage_total
  3. Node 集成示例展示 token 用量写入 state

### #3 [跨文档] 错误处理不一致 + async/def 矛盾
- **位置**: line 81 错误处理 / line 95 Node 集成示例
- **问题**: 
  1. 工厂函数 line 74 raise ValueError，但 line 81 错误处理说"返回含 error 的 LLMResponse"——两种错误处理策略不一致
  2. F002 R1 已将 Node 改为 async def（委派桩），F003 line 95 已用 async def（一致），但 line 81 说"返回 LLMResponse 含 error 信息"——这与 raise ValueError 矛盾，应统一为自定义异常 + Node 捕获后设 human_intervention
- **修法**:
  1. 新增 LLMError 自定义异常类
  2. 工厂函数未知 provider → raise LLMError（统一异常类型）
  3. OpenAIProvider API 调用失败 → raise LLMError
  4. Node 集成示例用 try/except LLMError 捕获后设 state["human_intervention"] = True
  5. 验收标准"graceful 降级"改为"raise LLMError，Node 捕获后设 human_intervention"

## 验收标准（8 条）
1. "零改动扩展"措辞修正为接口层零改动 + 实现层需新增子类
2. HarnessState 新增 token_usage_total 字段，标注 [NEW] 和 F002 引用
3. complete_with_state 返回的 new_state 累加 token_usage_total
4. Node 集成示例展示 token 用量写入 state
5. 新增 LLMError 自定义异常类
6. 工厂函数和 OpenAIProvider 统一使用 LLMError
7. Node 集成示例用 try/except LLMError 捕获后设 human_intervention
8. 验收标准"graceful 降级"改为"raise LLMError，Node 捕获后设 human_intervention"
9. 修订后单文件 ≤ 300 行
10. 添加修订记录段（Round 1，记录 3 项缺陷修复摘要 + 参考 journal 路径）

## 约束
- 不修改 F002 / F011 / state-design.md / boundaries.md / AGENTS.md
- 不引入新架构概念
- 不调用任何 skill
- 不修改 sub_id
- 保留原有正确内容，仅修订缺陷相关部分
- 修订后在文件末尾添加修订记录段
