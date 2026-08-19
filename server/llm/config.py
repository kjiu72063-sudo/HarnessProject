"""LLM 提供商层配置 — F003 设计文档 §配置项的调用侧桥接。"""

from server.config.settings import settings
from server.schemas.llm_schemas import LLMConfig


def default_llm_config() -> LLMConfig:
    """以 settings 的 LLM_* 配置构造默认 LLMConfig。"""
    return LLMConfig(
        model=settings.LLM_MODEL,
        temperature=settings.LLM_TEMPERATURE,
        max_tokens=settings.LLM_MAX_TOKENS,
    )
