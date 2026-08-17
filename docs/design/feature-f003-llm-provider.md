last_updated: 2026-08-17
status: Draft
owner: @K总

# Feature: 可插拔 LLM 提供商层 (F003)

## Status: Draft

## 目标
为 Harness 各阶段 Node 提供 LLM 调用的统一抽象接口，首个实现 OpenAI ChatGPT。支持运行时切换提供商，后续可零改动扩展其他模型（DeepSeek、Kimi 等）。

## 非目标
- 不实现第二个 LLM 提供商（F010 范围）
- 不实现 LLM 调用的缓存/限流/重试策略（后续优化）
- 不实现流式 token 级回调（本次返回完整响应，F007 SSE 推送 Node 级状态）
- 不实现 prompt 模板管理（本次硬编码在各 Node 内，后续可抽到配置层）

## 技术方案

### 涉及的模块
- `server/llm/__init__.py` — 包入口，导出 get_llm_provider 工厂函数
- `server/llm/base.py` — LLMProvider 抽象基类（Protocol 或 ABC）
- `server/llm/openai_provider.py` — OpenAI ChatGPT 实现
- `server/llm/config.py` — LLM 配置（provider 名称、model、temperature 等）
- `server/schemas/llm_schemas.py` — LLM 请求/响应 Pydantic 模型
- `server/config/settings.py` — 新增 LLM 相关配置项

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

### 工厂函数

```python
def get_llm_provider(provider_name: str | None = None) -> LLMProvider:
    """根据配置返回 LLM 提供商实例，默认从 settings 读取"""
    name = provider_name or settings.LLM_PROVIDER
    match name:
        case "openai":
            return OpenAIProvider()
        case _:
            raise ValueError(f"Unsupported LLM provider: {name}")
```

### OpenAI 实现要点
- 使用 `openai` Python SDK（async client）
- API Key 从环境变量 `OPENAI_API_KEY` 读取
- 超时设置：30s（默认），可通过配置覆盖
- 错误处理：APIError → 返回 LLMResponse 含 error 信息 + state 标记 `human_intervention=True`

### 配置项（settings.py 新增）
```python
LLM_PROVIDER: str = "openai"       # 提供商名称
LLM_MODEL: str = "gpt-4o"          # 默认模型
LLM_TEMPERATURE: float = 0.2       # 默认温度
LLM_MAX_TOKENS: int = 4096         # 默认最大 token
LLM_TIMEOUT: int = 30              # 超时秒数
```

### 与 F002 Node 的集成
Node 通过 `get_llm_provider()` 获取实例并调用：
```python
async def information_layer(state: HarnessState) -> HarnessState:
    llm = get_llm_provider()
    response, new_state = await llm.complete_with_state(
        messages=[Message(role="user", content=state["requirement"])],
        config=LLMConfig(),
        state=state
    )
    return { **new_state, "design_docs": [...], "current_stage": "feature_breakdown" }
```

### API 变更
无新增 API 端点。LLM 层为内部服务，不直接暴露给前端。

## 验收标准
- LLMProvider Protocol 定义完整，含 complete + complete_with_state 两个方法
- OpenAIProvider 实现两个方法，可成功调用 OpenAI API（需 OPENAI_API_KEY）
- get_llm_provider 工厂函数正确返回对应实例
- 未配置 API Key 时 graceful 降级（返回错误响应 + state 标记 human_intervention）
- 所有 LLM 相关 schema 为 Pydantic BaseModel
- 不允许裸 print()（ruff T201 强制）
- 测试覆盖率 ≥ 80%（OpenAI 调用用 mock）
- verify.sh 14 项全通过
- 依赖 F002（已定义 HarnessState）

## 依赖
- F002 LangGraph 编排引擎（提供 HarnessState 和 Node 框架）
- openai Python SDK
- OPENAI_API_KEY 环境变量
