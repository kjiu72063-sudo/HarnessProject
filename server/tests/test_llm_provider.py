"""F003 LLM 提供商层单元测试 — mock 为主，无 OPENAI_API_KEY 环境全绿。"""

from types import SimpleNamespace

import pytest

from server.config.settings import Settings
from server.llm import LLMError, OpenAIProvider, get_llm_provider
from server.llm import openai_provider as provider_module
from server.llm.config import default_llm_config
from server.nodes.initializer import BASELINE_TECH_STACK
from server.schemas.harness_state import TokenUsage, build_initial_state
from server.schemas.llm_schemas import LLMConfig, LLMResponse, Message


def baseline_spec():
    return BASELINE_TECH_STACK.model_copy()


def fake_chat_completion(content="ok", prompt=10, completion=20, model="gpt-4o"):
    return SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=content))],
        usage=SimpleNamespace(
            prompt_tokens=prompt,
            completion_tokens=completion,
            total_tokens=prompt + completion,
        ),
        model=model,
    )


def install_fake_openai(monkeypatch, result=None, error=None):
    """替换 openai_provider.AsyncOpenAI 为假工厂，返回 (调用记录, 构造参数记录)。"""
    calls: list[dict] = []

    async def fake_create(**kwargs):
        calls.append(kwargs)
        if error is not None:
            raise error
        return result

    client = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create)))
    init_kwargs: dict = {}

    def factory(**kwargs):
        init_kwargs.update(kwargs)
        return client

    monkeypatch.setattr(provider_module, "AsyncOpenAI", factory)
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    return calls, init_kwargs


# ---------- 异常与 schema ----------


def test_llm_error_is_exception():
    assert issubclass(LLMError, Exception)


def test_message_accepts_valid_roles():
    for role in ("system", "user", "assistant"):
        assert Message(role=role, content="hi").role == role


def test_message_rejects_invalid_role():
    with pytest.raises(ValueError):
        Message(role="tool", content="hi")


def test_llm_config_defaults_match_design():
    config = LLMConfig()
    assert config.model == "gpt-4o"
    assert config.temperature == 0.2
    assert config.max_tokens == 4096


def test_settings_llm_defaults_match_design():
    s = Settings()
    assert s.LLM_PROVIDER == "openai"
    assert s.LLM_MODEL == "gpt-4o"
    assert s.LLM_TEMPERATURE == 0.2
    assert s.LLM_MAX_TOKENS == 4096
    assert s.LLM_TIMEOUT == 30


def test_default_llm_config_from_settings():
    config = default_llm_config()
    assert config.model == Settings().LLM_MODEL
    assert config.temperature == Settings().LLM_TEMPERATURE
    assert config.max_tokens == Settings().LLM_MAX_TOKENS


# ---------- 工厂函数 ----------


def test_factory_returns_openai_by_default():
    assert isinstance(get_llm_provider(), OpenAIProvider)


def test_factory_explicit_name():
    assert isinstance(get_llm_provider("openai"), OpenAIProvider)


def test_factory_unknown_name_raises_llm_error():
    with pytest.raises(LLMError, match="Unsupported LLM provider: deepseek"):
        get_llm_provider("deepseek")


# ---------- OpenAIProvider.complete ----------


async def test_complete_success_returns_response(monkeypatch):
    raw = fake_chat_completion(content="hello", prompt=11, completion=22, model="gpt-4o-mini")
    calls, init_kwargs = install_fake_openai(monkeypatch, result=raw)

    provider = OpenAIProvider()
    response = await provider.complete([Message(role="user", content="hi")], LLMConfig())

    assert isinstance(response, LLMResponse)
    assert response.content == "hello"
    assert response.usage == TokenUsage(prompt_tokens=11, completion_tokens=22, total_tokens=33)
    assert response.model == "gpt-4o-mini"
    assert calls[0]["model"] == "gpt-4o"
    assert calls[0]["messages"] == [{"role": "user", "content": "hi"}]
    assert calls[0]["temperature"] == 0.2
    assert calls[0]["max_tokens"] == 4096
    assert init_kwargs["api_key"] == "test-key"
    assert init_kwargs["timeout"] == float(Settings().LLM_TIMEOUT)


async def test_complete_missing_api_key_raises(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    provider = OpenAIProvider()
    with pytest.raises(LLMError, match="OPENAI_API_KEY is not configured"):
        await provider.complete([Message(role="user", content="hi")], LLMConfig())


async def test_complete_api_failure_wrapped_as_llm_error(monkeypatch):
    install_fake_openai(monkeypatch, error=RuntimeError("boom"))
    provider = OpenAIProvider()
    with pytest.raises(LLMError, match="OpenAI API call failed: boom"):
        await provider.complete([Message(role="user", content="hi")], LLMConfig())


async def test_complete_missing_usage_raises(monkeypatch):
    raw = fake_chat_completion()
    raw.usage = None
    install_fake_openai(monkeypatch, result=raw)
    provider = OpenAIProvider()
    with pytest.raises(LLMError, match="missing usage"):
        await provider.complete([Message(role="user", content="hi")], LLMConfig())


async def test_complete_none_content_becomes_empty_string(monkeypatch):
    raw = fake_chat_completion(content=None)
    install_fake_openai(monkeypatch, result=raw)
    provider = OpenAIProvider()
    response = await provider.complete([Message(role="user", content="hi")], LLMConfig())
    assert response.content == ""


# ---------- OpenAIProvider.complete_with_state ----------


async def test_complete_with_state_accumulates_usage(monkeypatch):
    install_fake_openai(monkeypatch, result=fake_chat_completion(prompt=10, completion=20))
    state = build_initial_state("p1", baseline_spec())
    state["token_usage_total"] = TokenUsage(prompt_tokens=5, completion_tokens=5, total_tokens=10)

    provider = OpenAIProvider()
    response, new_state = await provider.complete_with_state(
        [Message(role="user", content="hi")], LLMConfig(), state
    )

    assert new_state["token_usage_total"] == TokenUsage(
        prompt_tokens=15, completion_tokens=25, total_tokens=40
    )
    assert response.usage == TokenUsage(prompt_tokens=10, completion_tokens=20, total_tokens=30)


async def test_complete_with_state_prev_missing_starts_from_zero(monkeypatch):
    install_fake_openai(monkeypatch, result=fake_chat_completion(prompt=3, completion=4))
    state = dict(build_initial_state("p1", baseline_spec()))
    del state["token_usage_total"]

    provider = OpenAIProvider()
    _, new_state = await provider.complete_with_state(
        [Message(role="user", content="hi")], LLMConfig(), state
    )

    assert new_state["token_usage_total"] == TokenUsage(
        prompt_tokens=3, completion_tokens=4, total_tokens=7
    )


async def test_complete_with_state_preserves_other_fields(monkeypatch):
    install_fake_openai(monkeypatch, result=fake_chat_completion())
    state = build_initial_state("p1", baseline_spec(), project_name="demo")

    provider = OpenAIProvider()
    _, new_state = await provider.complete_with_state(
        [Message(role="user", content="hi")], LLMConfig(), state
    )

    assert new_state["project_id"] == "p1"
    assert new_state["project_name"] == "demo"
    assert new_state["current_stage"] == "initializer"


async def test_complete_with_state_returns_same_response_object(monkeypatch):
    raw = fake_chat_completion(content="answer")
    install_fake_openai(monkeypatch, result=raw)
    state = build_initial_state("p1", baseline_spec())

    provider = OpenAIProvider()
    direct = await provider.complete([Message(role="user", content="hi")], LLMConfig())
    _, new_state = await provider.complete_with_state(
        [Message(role="user", content="hi")], LLMConfig(), state
    )

    assert direct.content == "answer"
    assert new_state["token_usage_total"].total_tokens > 0
