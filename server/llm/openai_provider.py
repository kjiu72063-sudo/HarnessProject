"""OpenAI ChatGPT 实现 — F003 设计文档 §OpenAI 实现要点。

API Key 从环境变量 OPENAI_API_KEY 读取；超时 30s 由 settings.LLM_TIMEOUT
覆盖；一切失败路径统一 raise LLMError。
"""

import os
from typing import cast

from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionMessageParam

from server.config.settings import settings
from server.llm.exceptions import LLMError
from server.schemas.harness_state import HarnessState, TokenUsage
from server.schemas.llm_schemas import LLMConfig, LLMResponse, Message


class OpenAIProvider:
    """LLMProvider Protocol 的 OpenAI ChatGPT 实现（async SDK）。"""

    def _build_client(self) -> AsyncOpenAI:
        api_key = os.environ.get("OPENAI_API_KEY", "")
        if not api_key:
            raise LLMError("OPENAI_API_KEY is not configured")
        return AsyncOpenAI(api_key=api_key, timeout=float(settings.LLM_TIMEOUT))

    async def complete(self, messages: list[Message], config: LLMConfig) -> LLMResponse:
        client = self._build_client()
        payload = cast(list[ChatCompletionMessageParam], [m.model_dump() for m in messages])
        try:
            response = await client.chat.completions.create(
                model=config.model,
                messages=payload,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
            )
        except Exception as exc:
            raise LLMError(f"OpenAI API call failed: {exc}") from exc
        usage = response.usage
        if usage is None:
            raise LLMError("OpenAI API response missing usage data")
        return LLMResponse(
            content=response.choices[0].message.content or "",
            usage=TokenUsage(
                prompt_tokens=usage.prompt_tokens,
                completion_tokens=usage.completion_tokens,
                total_tokens=usage.total_tokens,
            ),
            model=response.model,
        )

    async def complete_with_state(
        self, messages: list[Message], config: LLMConfig, state: HarnessState
    ) -> tuple[LLMResponse, HarnessState]:
        response = await self.complete(messages, config)
        prev = state.get(
            "token_usage_total",
            TokenUsage(prompt_tokens=0, completion_tokens=0, total_tokens=0),
        )
        new_state: HarnessState = {
            **state,
            "token_usage_total": TokenUsage(
                prompt_tokens=prev.prompt_tokens + response.usage.prompt_tokens,
                completion_tokens=prev.completion_tokens + response.usage.completion_tokens,
                total_tokens=prev.total_tokens + response.usage.total_tokens,
            ),
        }
        return response, new_state
