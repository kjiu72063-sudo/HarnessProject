# F003 LLM 提供商层设计文档修订 Round 1

## 步骤名称
F003 可插拔 LLM 提供商层设计文档 — Round 1 修订（3 项缺陷修复）

## 执行时间
2026-08-18

## 前置条件
- F002 LangGraph 编排引擎已 Approved（225 行，缺陷链闭合）
- F011 Agent Runtime 已 Approved（271 行，缺陷链闭合）
- F003 初版设计文档存在 3 项缺陷（Controller Spec: docs/handbook/controller-specs/f003-design-writer-revision.md）
- L1 已委派 L3 设计编写 Agent 修订（journal 27 记录）

## 执行内容

### 1. 冷启动
按标准引导模板执行冷启动 5 步：
1. AGENTS.md — 项目全貌、硬性规则 13 条、L1 职责边界、L3 硬约束
2. progress.txt — 99 条历史进度，关注 F002-approved（line 96）和 F003-revision-delegation（line 97）
3. feature_list.json — F001 passing, F011 approved, F002 approved, F003-F010 todo
4. docs/plans/current-sprint.md — Sprint 1 范围（F002/F003/F006）
5. harness-journal/README.md — 开发日志索引 + 最近 3 条 journal（25-r3-review-delegation / 26-r3-review / 27-f002-approved-and-f003-delegation）

### 2. 读取待修订文档和参考文档
- 待修订：docs/design/feature-f003-llm-provider.md（123 行，Status: Draft）
- 参考 F002（Approved）：docs/design/feature-f002-langgraph.md（225 行）— HarnessState 定义、Node 委派桩规范、async def 模式
- 参考 F011（Approved）：docs/design/feature-f011-agent-runtime.md（271 行）— human_intervention 机制、循环预算

### 3. 逐项修订

#### 缺陷 #1 [概念] "零改动扩展"夸大
- **位置**: line 10 目标段
- **原内容**: "后续可零改动扩展其他模型（DeepSeek、Kimi 等）"
- **修订**: "接口层零改动，实现层需新增 Provider 子类并注册到工厂函数（DeepSeek、Kimi 等）"
- **依据**: 新增提供商需新增子类 + 注册到工厂函数 match case，非零改动

#### 缺陷 #2 [跨文档] Token 用量未落 State
- **位置**: 原 line 55-61 TokenUsage + line 81 错误处理 + line 97-102 Node 集成示例
- **修订**:
  1. 新增"HarnessState 变更 [NEW]"段：`token_usage_total: TokenUsage`，标注 [NEW] 和 F002 引用
  2. 新增"complete_with_state 实现要点"段：展示 token 用量累加到 new_state
  3. Node 集成示例通过 complete_with_state 返回的 new_state（含 token_usage_total）写入 state
  4. 新增跨文档同步待办：state-design.md 需新增 token_usage_total 字段
- **依据**: F002 已定义 max_iterations/current_iteration 等 state 字段，token 用量也应落 state

#### 缺陷 #3 [跨文档] 错误处理不一致 + async/def 矛盾
- **位置**: 原 line 74 工厂函数 raise ValueError / line 81 错误处理"返回含 error 的 LLMResponse" / line 95 Node 集成示例
- **修订**:
  1. 新增"自定义异常 [NEW]"段：LLMError(Exception) 类
  2. 工厂函数未知 provider: `raise ValueError` → `raise LLMError`
  3. OpenAI 实现要点: "APIError → 返回 LLMResponse 含 error" → "API 调用失败 → raise LLMError"
  4. Node 集成示例: 新增 try/except LLMError 捕获后设 `human_intervention: True`
  5. 验收标准: "graceful 降级（返回错误响应 + state 标记 human_intervention）" → "raise LLMError，Node 捕获后设 human_intervention"
  6. 新增验收标准: "LLMError 自定义异常类已定义，工厂函数和 OpenAIProvider 统一使用 LLMError"
- **依据**: F002 R1 已将 Node 改为 async def（委派桩），F003 原 line 95 已用 async def（一致），但错误处理策略 raise ValueError vs 返回含 error 的 LLMResponse 矛盾，需统一为 LLMError + Node 捕获后设 human_intervention

### 4. 约束遵守
- ✅ 未修改 F002 / F011 / state-design.md / boundaries.md / AGENTS.md
- ✅ 未引入新架构概念（LLMError、token_usage_total 均为既有模式的延伸）
- ✅ 未调用任何 skill
- ✅ 未修改 sub_id
- ✅ 保留原有正确内容，仅修订缺陷相关部分
- ✅ 修订后在文件末尾添加修订记录段

### 5. Journal 编号说明
Controller Spec 指定 journal 编号 26，但 harness-journal/README.md 显示编号 26 已被 `26-f002-r3-review.md` 占用，27 已被 `27-f002-approved-and-f003-delegation.md` 占用。L3 使用正确的下一个编号 28，并在完成报告中向 L1 说明此差异。

## 产出物
- docs/design/feature-f003-llm-provider.md（修订后，182 行，Status: Draft）

## 验证结果

### 验收标准 10 条逐项自检

| # | 验收标准 | 结果 | 证据 |
|---|---|---|---|
| 1 | "零改动扩展"措辞修正为接口层零改动 + 实现层需新增子类 | ✅ 通过 | line 10 |
| 2 | HarnessState 新增 token_usage_total 字段，标注 [NEW] 和 F002 引用 | ✅ 通过 | lines 74-82 |
| 3 | complete_with_state 返回的 new_state 累加 token_usage_total | ✅ 通过 | lines 106-125 |
| 4 | Node 集成示例展示 token 用量写入 state | ✅ 通过 | lines 139-155 |
| 5 | 新增 LLMError 自定义异常类 | ✅ 通过 | lines 29-36 |
| 6 | 工厂函数和 OpenAIProvider 统一使用 LLMError | ✅ 通过 | line 97 + line 104 |
| 7 | Node 集成示例用 try/except LLMError 捕获后设 human_intervention | ✅ 通过 | lines 142-154 |
| 8 | 验收标准"graceful 降级"改为"raise LLMError，Node 捕获后设 human_intervention" | ✅ 通过 | line 165 |
| 9 | 修订后单文件 ≤ 300 行 | ✅ 通过 | 182 行 |
| 10 | 添加修订记录段（Round 1，记录 3 项缺陷修复摘要 + 参考 journal 路径） | ✅ 通过 | lines 181-182 |

### 跨文档一致性
- F002 Node 使用 `async def` 返回 `dict` → F003 Node 集成示例对齐 ✅
- F002 HarnessState 有 max_iterations/current_iteration → F003 新增 token_usage_total 不冲突 ✅
- F011 human_intervention 机制 → F003 Node 捕获 LLMError 后设 human_intervention 对齐 ✅
- F002 跨文档同步待办模式 → F003 遵循相同模式（state-design.md 待办） ✅

## 备注
- L3 仅做设计文档修订，不做编码、不做校验、不做测试
- 产出将提交独立 L3 设计校验 Agent 审阅
- Journal 编号从 Controller Spec 的 26 调整为 28（26/27 已被占用），已向 L1 报告
