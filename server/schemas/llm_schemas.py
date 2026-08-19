"""LLM 请求/响应 Pydantic 模型 — F003 设计文档 §抽象接口。

TokenUsage 消费 server/schemas/harness_state.py 的既有定义（F002 已定义，
Controller Spec 前置条件：不重复定义）。
"""

from typing import Literal

from pydantic import BaseModel

from server.schemas.harness_state import TokenUsage


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
