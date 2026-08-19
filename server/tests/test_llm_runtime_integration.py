"""F003 与 F002 集成测试 — 验证 delegate 链路拿到 provider 的可行性。

设计文档 §与 F002 Node 的集成（meta vs runtime 层说明）：Node 保持委派桩，
LLM 调用链路在 runtime 层由 L3 Agent 内部执行 complete_with_state。
真实调用用例受 OPENAI_API_KEY skip 保护（验收标准 #7 分层策略）。
"""

import os
from types import SimpleNamespace

import pytest

from server.llm import Message, get_llm_provider
from server.llm import openai_provider as provider_module
from server.llm.config import default_llm_config
from server.nodes.initializer import BASELINE_TECH_STACK
from server.nodes.runtime import (
    AgentRuntime,
    agent_runtime,
    build_controller_spec,
)
from server.schemas.harness_state import TokenUsage, build_initial_state
from server.schemas.llm_schemas import LLMConfig


def initial_state():
    return build_initial_state("p1", BASELINE_TECH_STACK.model_copy())


def install_fake_openai(monkeypatch, content="stub-answer", prompt=10, completion=20):
    async def fake_create(**kwargs):
        return SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content=content))],
            usage=SimpleNamespace(
                prompt_tokens=prompt,
                completion_tokens=completion,
                total_tokens=prompt + completion,
            ),
            model="gpt-4o",
        )

    client = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create)))

    def factory(**kwargs):
        return client

    monkeypatch.setattr(provider_module, "AsyncOpenAI", factory)
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")


async def test_runtime_stub_contract_unchanged():
    """F002 语义零改动证据：AgentRuntime 仍为 stub 委派桩。"""
    spec = build_controller_spec(initial_state(), "demo task", "coder", ["summary"])
    result = await agent_runtime.delegate("coder", spec)
    assert result.status == "stub_completed"
    assert result.role == "coder"
    assert "demo task" in result.summary


async def test_delegate_chain_reaches_provider(monkeypatch):
    """runtime 层可行性：L3 Agent 在 delegate 内拿到 provider 并完成 complete_with_state。"""
    state = initial_state()
    observed: dict = {}

    async def l3_agent_delegate(self, role, controller_spec):
        provider = get_llm_provider("openai")
        messages = [Message(role="user", content=controller_spec["task"])]
        response, new_state = await provider.complete_with_state(
            messages, default_llm_config(), state
        )
        observed["usage"] = new_state["token_usage_total"]
        observed["content"] = response.content
        return SimpleNamespace(
            role=role, status="completed", artifacts=[], summary=response.content
        )

    install_fake_openai(monkeypatch, content="design doc ready", prompt=10, completion=20)
    monkeypatch.setattr(AgentRuntime, "delegate", l3_agent_delegate)

    spec = build_controller_spec(state, "produce design docs", "coder", ["design_docs"])
    result = await agent_runtime.delegate("coder", spec)

    assert result.status == "completed"
    assert result.summary == "design doc ready"
    assert observed["content"] == "design doc ready"
    assert observed["usage"] == TokenUsage(prompt_tokens=10, completion_tokens=20, total_tokens=30)


@pytest.mark.skipif(
    not os.environ.get("OPENAI_API_KEY"),
    reason="OPENAI_API_KEY not set; real-call layer skipped",
)
async def test_real_openai_complete():
    provider = get_llm_provider()
    response = await provider.complete(
        [Message(role="user", content="Reply with exactly: pong")], LLMConfig()
    )
    assert response.content != ""
    assert response.usage.total_tokens > 0
    assert response.model.startswith("gpt")
