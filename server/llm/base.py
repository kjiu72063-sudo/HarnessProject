"""LLMProvider 抽象接口 — F003 设计文档 §抽象接口（Protocol，结构性子类型）。"""

from typing import Protocol

from server.schemas.harness_state import HarnessState
from server.schemas.llm_schemas import LLMConfig, LLMResponse, Message


class LLMProvider(Protocol):
    async def complete(self, messages: list[Message], config: LLMConfig) -> LLMResponse:
        """调用 LLM，返回完整响应"""
        ...  # pragma: no cover

    async def complete_with_state(
        self, messages: list[Message], config: LLMConfig, state: HarnessState
    ) -> tuple[LLMResponse, HarnessState]:
        """调用 LLM 并更新 State（用于 Node 内调用）"""
        ...  # pragma: no cover
