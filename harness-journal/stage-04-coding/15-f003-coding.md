# 15 · F003 可插拔 LLM 提供商层编码实现

- **步骤名称**: F003 — LLMProvider 抽象 + OpenAI 首个实现 + 工厂 + 配置 + 测试
- **执行时间**: 2026-08-19 11:29（UTC）
- **执行角色**: L3 编码 Agent (coder)
- **前置条件**:
  - F002 LangGraph 编排引擎 = passing（commit 1d54504；HarnessState/TokenUsage/Node 委派桩/runtime delegate stub 已就位）
  - F003 设计文档 = Approved；Controller Spec: docs/handbook/controller-specs/f003-coder.md
  - 启动提示词: docs/handbook/launch-prompts/f003-coding-launch.md

## 执行内容

按 Approved 的 F003 设计文档实现可插拔 LLM 提供商层，接口签名/默认值/行为语义逐字对齐设计文档；不越界（第二个提供商/F010、缓存限流重试、流式 token 回调、prompt 模板管理全不做）。

1. **LLMError 统一异常**（`server/llm/exceptions.py`）：设计文档 §自定义异常逐字实现，替代"ValueError + 含 error 的 LLMResponse"两种不一致策略。
2. **LLM schema**（`server/schemas/llm_schemas.py`）：`Message`（role 为 `Literal["system","user","assistant"]`）、`LLMConfig`（gpt-4o / 0.2 / 4096 默认值逐字对齐）、`LLMResponse`（content + usage + model）。`usage: TokenUsage` 复用 `server/schemas/harness_state.py` 既有定义，不重复定义（Controller Spec 前置条件）。
3. **LLMProvider 抽象**（`server/llm/base.py`）：Protocol（结构性子类型，Provider 子类无需继承），`complete` + `complete_with_state` 两方法签名与设计文档 §抽象接口逐字一致。
4. **配置桥接**（`server/llm/config.py`）：`default_llm_config()` 从 settings 的 LLM_MODEL/LLM_TEMPERATURE/LLM_MAX_TOKENS 构造默认 LLMConfig。
5. **OpenAIProvider**（`server/llm/openai_provider.py`）：async SDK（`AsyncOpenAI`）；API Key 从环境变量 `OPENAI_API_KEY` 读取，缺失 raise LLMError；超时 `settings.LLM_TIMEOUT`（默认 30s 可配置覆盖）；`complete` 内一切失败路径（API 异常/usage 缺失）统一 raise LLMError（`from exc` 保留因果链）；`complete_with_state` 按设计文档 §实现要点逐字实现 token_usage_total 三字段累加、prev 缺省零值、`{**state, ...}` 不变异原 state。
6. **工厂函数**（`server/llm/__init__.py`）：`get_llm_provider(provider_name | None)` 默认读 `settings.LLM_PROVIDER`，match "openai"→OpenAIProvider，未知名 raise LLMError。
7. **settings 5 配置项**（`server/config/settings.py`）：LLM_PROVIDER="openai" / LLM_MODEL="gpt-4o" / LLM_TEMPERATURE=0.2 / LLM_MAX_TOKENS=4096 / LLM_TIMEOUT=30，默认值与设计文档 §配置项逐字一致；F001 既有字段零改动。
8. **测试**（`server/tests/`）：`test_llm_provider.py`（18 用例：schema 校验/工厂 3 路径/complete 成功+3 失败路径+None content 边界/累加+prev 缺省+字段保留）+ `test_llm_runtime_integration.py`（3 用例：runtime stub 契约不变证据 / delegate 链路拿到 provider 可行性 / 真实调用 skip 保护）。

## 产出物

- server/llm/：`__init__.py`（27 行，含工厂）、`base.py`、`config.py`、`exceptions.py`、`openai_provider.py`
- server/schemas/llm_schemas.py
- server/config/settings.py（+7 行，仅新增 5 配置项）
- server/tests/：test_llm_provider.py、test_llm_runtime_integration.py（共 21 用例：20 mock/stub + 1 真实调用 skip）
- pyproject.toml（+1 行 openai 显式声明）、uv.lock（+2 行 root package 条目）
- harness-journal/README.md 索引 15 号条目、progress.txt 末行

## 验证结果

- 验证环境：本会话沙箱 python 3.12.3 / uv 0.12.5 / openai 3.2.0（.venv 实测）/ langgraph 1.2.11 / langgraph-checkpoint 4.2.0；pypi.org 直连可达（与 F002 会话网络环境不同）
- `bash scripts/verify.sh`：**14 passed / 0 failed**（UV_FROZEN=1 前置，P010 防护）
- pytest：**82 passed + 1 skipped**（62 存量 + 20 新增全绿 + 1 真实调用用例无 OPENAI_API_KEY 正确 skip）
- 覆盖率：总体 99%（446 语句 2 未覆盖，均为 F002 存量 gates.py:22 / validation.py:53，F003 新增模块 server/llm/* 与 llm_schemas.py 全部 **100%**；≥80% 维持）
- `uv lock --check` 通过；lock 镜像 URL grep 计数 **0**（官方源干净）
- 单文件最大 66 行 ≤ 300；单函数 ≤ 50 行；无裸 print（ruff T20 全过）
- 被修改文件清单与 Controller Spec 输出表逐项对应，`server/nodes/` 零改动（git diff 确认）

## 备注（技术决策，供重审聚焦）

1. **openai 显式声明决断**：pyproject 新增 `openai>=3.2.0,<4.0.0`。理由：F003 代码直接 `import openai`（`from openai import AsyncOpenAI` / `from openai.types.chat import ...`），此前 openai 3.2.0 仅作为 langchain-openai 的传递依赖存在于 lock——直接 import 的包不显式声明即隐式依赖（F002 #1 教训的镜像场景：传递依赖关系一旦变化，声明外代码必崩）。区间上界 <4.0.0 与既有 langgraph-checkpoint 声明风格一致；lock 内 3.2.0 已满足区间，81 包零变动。
2. **uv.lock 更新走路径 B（最小手动编辑）**：本会话 uv 0.12.5 直接 `uv lock` 会全量重写 lock（新版给所有 artifact 追加 size/upload-time 元数据，3094 行 diff，URL/hash 零变动但非最小变更）。参照 F002 R3 路径 B 先例，手动仅在 root package 的 `dependencies` 加 `{ name = "openai" }`、`requires-dist` 加 `{ name = "openai", specifier = ">=3.2.0,<4.0.0" }` 共 2 行；`uv lock --check`（非 frozen）通过，证明 resolution 与 pyproject 完全一致；官方源 URL grep 0 残留。
3. **settings 字段名大写对齐设计文档**：设计文档 §配置项逐字写 `LLM_PROVIDER: str = "openai"` 等（与 F001 既有小写风格 app_name 等并存）。按"签名逐字对齐设计文档"原则采用大写字段名；env 读取为 HARNESS_LLM_PROVIDER 等（沿用既有 env_prefix="HARNESS_"）。风格混搭是设计文档与现状的真实差异，未擅自统一，带回请 L1/设计侧裁决是否后续规范化。
4. **API Key 双通道现状说明**：设计文档与验收标准 #2 指定从环境变量 `OPENAI_API_KEY` 读取，OpenAIProvider 按此实现；settings 既有 `openai_api_key` 字段（env 为 HARNESS_OPENAI_API_KEY，F001 遗留）未删除未消费，属存量字段，带回备查。
5. **验收标准 #6 落地方式 = 集成测试验证可行性**：journal 14 委派记录提到"runtime delegate() 真实接入"，但 Controller Spec 验收标准 #6 的表述为"本任务可提供集成测试验证 delegate 链路拿到 provider 的可行性"且禁止条款要求 F002 Node/graph/edges 零改动、设计文档 §集成 明确"LLM 调用链路在 runtime 层由 L3 Agent 内部调用，Node 仅委派"。以 Controller Spec 为准（启动提示词明示"完整内容以 Controller Spec 为准"）：`server/nodes/` 零改动，`test_delegate_chain_reaches_provider` 用 monkeypatch 替换 `AgentRuntime.delegate` 模拟 runtime 层 L3 Agent 内部行为（get_llm_provider → complete_with_state → state 累加 → DelegateResult 返回），同时 `test_runtime_stub_contract_unchanged` 保留 stub 契约断言作为 F002 语义零改动证据。真实 delegate() 接入属 Agent Runtime 后续迭代（F011 §9"当前不实现"）。
6. **mypy 适配一处**：`[m.model_dump() for m in messages]` 推断为 `list[dict[str, Any]]`，与 openai SDK 严格消息参数类型不兼容，用 SDK 公开类型 `ChatCompletionMessageParam` + `cast` 修复（运行时行为不变，无类型逃逸）。
7. **base.py Protocol 桩 `...` 加 `# pragma: no cover`**：Protocol 方法体永不执行，coverage 会误报未覆盖；不改共享 coverage 配置，仅本文件 pragma 注释（不改变设计文档签名）。
8. **环境行为合规**：全程 UV_FROZEN=1 前置 uv 命令（P010，本会话无 UV_DEFAULT_INDEX 残留）；提交前已 `git diff --cached --stat` 核对暂存清单（P011，本会话同样出现自动 stage 行为，暂存区与 Spec 范围一致）；pypi 直连可达故未启用 P009 替代法。
9. **范围外观察（带回不处理）**：无——本次未发现设计矛盾或范围外问题；上送第 3/4 条为现状差异说明，非缺陷。
