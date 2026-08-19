"""LLM 提供商层包出口 — F003 设计文档 §工厂函数与模块布局。"""

from server.config.settings import settings
from server.llm.base import LLMProvider
from server.llm.exceptions import LLMError
from server.llm.openai_provider import OpenAIProvider
from server.schemas.llm_schemas import LLMConfig, LLMResponse, Message

__all__ = [
    "LLMConfig",
    "LLMError",
    "LLMProvider",
    "LLMResponse",
    "Message",
    "OpenAIProvider",
    "get_llm_provider",
]


def get_llm_provider(provider_name: str | None = None) -> LLMProvider:
    """根据配置返回 LLM 提供商实例，默认从 settings 读取"""
    name = provider_name or settings.LLM_PROVIDER
    match name:
        case "openai":
            return OpenAIProvider()
        case _:
            raise LLMError(f"Unsupported LLM provider: {name}")
