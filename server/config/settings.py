from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "harness-platform"
    api_prefix: str = "/api"
    database_url: str = "postgresql://localhost:5432/harness_platform"
    backend_port: int = 8000

    # F003 LLM 提供商层（字段名对齐设计文档 §配置项）
    LLM_PROVIDER: str = "openai"
    LLM_MODEL: str = "gpt-4o"
    LLM_TEMPERATURE: float = 0.2
    LLM_MAX_TOKENS: int = 4096
    LLM_TIMEOUT: int = 30

    model_config = {"env_file": ".env", "env_prefix": "HARNESS_"}


settings = Settings()
