# Controller Spec — F003 LLM 提供商层编码（首个实现 OpenAI）

> 委派时间: 2026-08-20T04:10Z（UTC）| 委派者: L1 | 目标角色: coder
> 关联: F002 已 passing（commit 1d54504），本任务是编码阶段第 2 个功能

## 任务

按已 Approved 的 F003 设计文档实现可插拔 LLM 提供商层：LLMProvider 抽象 + OpenAI 首个实现 + 工厂函数 + 配置项 + 测试。

## 前置条件

- F002 LangGraph 编排引擎 status=passing（HarnessState / TokenUsage / Node 委派桩 / runtime delegate stub 已就位）
- `token_usage_total` 字段 F002 已定义于 `server/schemas/harness_state.py`，本任务消费该定义，不重复定义

## 输入

- 功能 ID: F003
- 参考文档:
  - docs/design/feature-f003-llm-provider.md（唯一权威依据，含全部接口签名/代码骨架/配置项/集成模式）
  - docs/design/feature-f011-agent-runtime.md §9（meta 层 vs runtime 层）
  - server/schemas/harness_state.py（HarnessState/TokenUsage 现状）
  - server/nodes/runtime.py（delegate stub 现状）
  - server/config/（settings.py 现状）
  - docs/conventions/coding.md + testing.md + pitfalls.md（P009/P010/P011）
- 约束: AGENTS.md 硬性规则 14 条（重点 #2 禁裸 print / #4 Pydantic schema / #5 Node 委派桩 / #10 verify.sh 全闸门 / #11 行数限制 / #12 基线一致）

## 输出

| 产出 | 路径 | 期望状态 |
|---|---|---|
| Provider 层 | server/llm/（或设计文档指定布局）: 抽象 LLMProvider(Protocol) / OpenAIProvider / get_llm_provider / LLMError / Message / LLMConfig / LLMResponse | 按设计文档签名实现，mypy 通过 |
| 配置 | server/config/settings.py 新增 5 项（LLM_PROVIDER/LLM_MODEL/LLM_TEMPERATURE/LLM_MAX_TOKENS/LLM_TIMEOUT） | 与设计文档默认值一致 |
| 测试 | server/tests/（按现有 5 文件布局新增） | mock 为主全绿 + 覆盖率 ≥80% 维持 |
| 依赖 | pyproject.toml 若需新增 openai 显式声明 | openai 3.2.0 已在 lock；如新增须声明版本区间且自洽（F002 #1 教训） |
| journal | harness-journal/stage-04-coding/15-f003-coding.md | 自写执行记录（编号已预留） |
| progress | progress.txt 追加 | 末行 |

## 验收标准

1. LLMProvider Protocol 含 complete + complete_with_state 两方法，签名与设计文档逐字一致
2. OpenAIProvider 实现两方法：async openai SDK client、API Key 从 OPENAI_API_KEY 读取、超时 30s 可配置覆盖、一切失败路径统一 raise LLMError
3. get_llm_provider 工厂：默认读 settings.LLM_PROVIDER，"openai"→OpenAIProvider，未知名 raise LLMError
4. complete_with_state 累加逻辑与设计文档 §complete_with_state 实现要点一致（token_usage_total 三字段累加，prev 缺省零值）
5. settings.py 5 个配置项默认值与设计文档一致
6. 与 F002 集成模式：Node 保持委派桩（不内联 LLM 业务逻辑）；LLM 调用链路在 runtime 层由 Agent Runtime 消费（本任务可提供集成测试验证 delegate 链路拿到 provider 的可行性，具体按设计文档 §与 F002 Node 的集成 说明执行）
7. 测试策略：单元测试以 mock/stub 为主（pytest 环境无真实 key）；如写真实调用用例须 skip 条件保护（无 OPENAI_API_KEY 时 skip），确保 verify.sh 在无 key 环境全绿
8. verify.sh 14/14 通过；单文件 ≤300 行；函数 ≤50 行；无裸 print；openai 若新增声明则版本区间自洽且 uv.lock 变更遵守 P010（UV_FROZEN=1，提交前 grep 镜像 URL 计数为 0，uv lock --check 通过）

## 禁止

- 不得自行调用 skill 产出内容
- 不得跳过 harness-journal 记录
- 不得修改 sub_id / AGENTS.md 硬性规则 / verify.sh / 设计文档 / 跨文档（state-design.md 的 token_usage_total 同步由 L1 统一处理，不在本任务范围）
- 不得修改 F002 已 passing 的代码语义（Node/graph/edges 零改动；如确需触碰 server/nodes/ 仅限新增集成点且 journal 说明理由）
- 不得占用 journal 编号 16（预留给重审）
- 遵守 P011：提交前 git diff --cached --stat 核对暂存清单与本 Spec 范围一致

## 完成标志

verify.sh 14/14 + journal 15 + progress 末行 + 完成报告（含验证环境、验收标准逐条核对、技术决策备注）带回给 K总 → L1 流程验收 → 委派 test-reviewer 审查（journal 16）
