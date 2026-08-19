"""LLM 统一异常 — F003 设计文档 §自定义异常。"""


class LLMError(Exception):
    """LLM 调用统一异常：未知提供商、API 调用失败、配置缺失等"""
