last_updated: 2026-08-18
status: Approved
owner: @K总

# Feature: 可插拔 LLM 提供商层 (F003)

## Status: Draft

## 目标
为 Harness 各阶段 Node 提供 LLM 调用的统一抽象接口，首个实现 OpenAI ChatGPT。支持运行时切换提供商，接口层零改动，实现层需新增 Provider 子类并注册到工厂函数（DeepSeek、Kimi 等）。

## 非目标
- 不实现第二个 LLM 提供商（F010 范围）
- 不实现 LLM 调用的缓存/限流/重试策略（后续优化）
- 不实现流式 token 级回调（本次返回完整响应，F007 SSE 推送 Node 级状态）
- 不实现 prompt 模板管理（本次硬编码在各 Node 内，后续可抽到配置层）

## 技术方案

### 涉及的模块
- `server/llm/__init__.py` — 包出口，导出 get_llm_provider 工厂函数
- `server/llm/base.py` — LLMProvider 抽象基类（Protocol 或 ABC）
- `server/llm/openai_provider.py` — OpenAI ChatGPT 实现
- `server/llm/exceptions.py` — LLMError 自定义异常 [NEW]
- `server/llm/config.py` — LLM 配置（provider 名称、model、temperature 等）
- `server/schemas/llm_schemas.py` — LLM 请求/响应 Pydantic 模型
- `server/config/settings.py` — 新增 LLM 相关配置项

### 自定义异常 [NEW]
统一 LLM 调用错误类型，替代原 ValueError + 含 error 的 LLMResponse 两种不一致策略：

```python
class LLMError(Exception):
    """LLM 调用统一异常：未知提供商、API 调用失败、配置缺失等"""
    pass
```

### 抽象接口

```python
class LLMProvider(Protocol):
    async def complete(self, messages: list[Message], config: LLMConfig) -> LLMResponse:
        """调用 LLM，返回完整响应"""
        ...

    async def complete_with_state(
        self, messages: list[Message], config: LLMConfig, state: HarnessState
    ) -> tuple[LLMResponse, HarnessState]:
        """调用 LLM 并更新 State（用于 Node 内调用）"""
        ...
```

```python
class Message(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str

class LLMConfig(BaseModel):
    model: str = "gpt-4o"
    temperature: float = 0.2
    max_tokens: int = 4096

class LLMResponse(BaseModel):
    content: str
    usage: TokenUsage
    model: str

class TokenUsage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
```

### HarnessState 变更 [NEW]
F002 HarnessState 新增 token 用量字段（供前端监控页展示和成本追踪）：

```python
class HarnessState(TypedDict):
    # ... F002 已定义字段保持不变 ...

    # [NEW] Token 用量累计 — 引用 F002 HarnessState
    token_usage_total: TokenUsage
```

> **跨文档同步待办**: state-design.md 需在跨文档同步阶段新增 `token_usage_total: TokenUsage` 字段，与 F002 HarnessState 对齐。

### 工厂函数

```python
def get_llm_provider(provider_name: str | None = None) -> LLMProvider:
    """根据配置返回 LLM 提供商实例，默认从 settings 读取"""
    name = provider_name or settings.LLM_PROVIDER
    match name:
        case "openai":
            return OpenAIProvider()
        case _:
            raise LLMError(f"Unsupported LLM provider: {name}")
```

### OpenAI 实现要点
- 使用 `openai` Python SDK（async client）
- API Key 从环境变量 `OPENAI_API_KEY` 读取
- 超时设置：30s（默认），可通过配置覆盖
- 错误处理：API 调用失败 → raise LLMError（统一异常类型）

### complete_with_state 实现要点
complete_with_state 调用 complete 获取 LLMResponse 后，将 token 用量累加到 state：

```python
async def complete_with_state(
    self, messages: list[Message], config: LLMConfig, state: HarnessState
) -> tuple[LLMResponse, HarnessState]:
    response = await self.complete(messages, config)
    prev = state.get("token_usage_total", TokenUsage(
        prompt_tokens=0, completion_tokens=0, total_tokens=0))
    new_state = {
        **state,
        "token_usage_total": TokenUsage(
            prompt_tokens=prev.prompt_tokens + response.usage.prompt_tokens,
            completion_tokens=prev.completion_tokens + response.usage.completion_tokens,
            total_tokens=prev.total_tokens + response.usage.total_tokens,
        ),
    }
    return response, new_state
```

### 配置项（settings.py 新增）
```python
LLM_PROVIDER: str = "openai"       # 提供商名称
LLM_MODEL: str = "gpt-4o"          # 默认模型
LLM_TEMPERATURE: float = 0.2       # 默认温度
LLM_MAX_TOKENS: int = 4096         # 默认最大 token
LLM_TIMEOUT: int = 30              # 超时秒数
```

### 与 F002 Node 的集成
Node 通过 `get_llm_provider()` 获取实例并调用，使用 try/except LLMError 捕获后设 human_intervention：

> **meta 层 vs runtime 层说明**: 本示例为 **meta 层简化展示**，仅展示 LLM Provider 的调用接口和 state 写入方式。**runtime 层**（F011 §9 meta 层 vs runtime 层）Agent Runtime 就绪后，LLM 调用应在 L3 Agent 内执行，Node 仅做委派（通过 `agent_runtime.delegate()` 构造 Controller Spec 调用 L3 Agent）和状态更新（F002 Node 委派桩规范，AGENTS.md 规则 #5）。`complete_with_state` 方法在 runtime 层由 L3 Agent 内部调用，非 Node 直接调用。

```python
async def information_layer(state: HarnessState) -> dict:
    llm = get_llm_provider()
    try:
        response, new_state = await llm.complete_with_state(
            messages=[Message(role="user", content=state["requirement"])],
            config=LLMConfig(),
            state=state
        )
        return {
            **new_state,
            "design_docs": [...],
            "current_stage": "feature_breakdown",
        }
    except LLMError:
        return {**state, "human_intervention": True}
```

### API 变更
无新增 API 端点。LLM 层为内部服务，不直接暴露给前端。

## 验收标准
- LLMProvider Protocol 定义完整，含 complete + complete_with_state 两个方法
- OpenAIProvider 实现两个方法，可成功调用 OpenAI API（需 OPENAI_API_KEY）
- get_llm_provider 工厂函数正确返回对应实例
- LLMError 自定义异常类已定义，工厂函数和 OpenAIProvider 统一使用 LLMError
- 未配置 API Key 或 API 调用失败时 raise LLMError，Node 捕获后设 human_intervention
- complete_with_state 返回的 new_state 累加 token_usage_total
- HarnessState 新增 token_usage_total 字段（标注 [NEW]，引用 F002 HarnessState）
- 所有 LLM 相关 schema 为 Pydantic BaseModel
- 不允许裸 print()（ruff T201 强制）
- 测试覆盖率 ≥ 80%（OpenAI 调用用 mock）
- verify.sh 14 项全通过
- 依赖 F002（已定义 HarnessState）

## 依赖
- F002 LangGraph 编排引擎（提供 HarnessState 和 Node 框架）
- openai Python SDK
- OPENAI_API_KEY 环境变量

> **跨文档同步待办**: boundaries.md 需在跨文档同步阶段新增 `server/llm/` 目录及依赖方向（`nodes → llm → schemas, config`），参照 F002/F011 的 boundaries.md 同步待办格式。

---

## 修订记录
- Round 1（2026-08-18）：修复 3 项缺陷（#1 "零改动扩展"措辞修正为接口层零改动+实现层需新增子类/#2 Token 用量落 State: HarnessState 新增 token_usage_total + complete_with_state 累加 + Node 集成示例展示写入/#3 错误处理统一: 新增 LLMError 自定义异常 + 工厂函数/OpenAIProvider 统一 raise LLMError + Node try/except 捕获后设 human_intervention），详见 28-f003-revision-r1.md。
- Round 2（2026-08-18）：修复 L3 校验发现的 2 项跨文档缺陷（#1 Node 集成示例添加 meta 层 vs runtime 层说明注释，引用 F011 §9 和 F002 委派桩规范/#2 依赖段添加 boundaries.md 跨文档同步待办: server/llm/ 目录+依赖方向），详见 31-f003-revision-r2.md。
