from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "harness-platform"
    api_prefix: str = "/api"
    database_url: str = "postgresql://localhost:5432/harness_platform"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    backend_port: int = 8000

    model_config = {"env_file": ".env", "env_prefix": "HARNESS_"}


settings = Settings()
