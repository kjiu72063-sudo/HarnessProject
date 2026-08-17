from server.config.settings import Settings, settings


def test_settings_defaults():
    s = Settings()
    assert s.app_name == "harness-platform"
    assert s.api_prefix == "/api"
    assert s.openai_model == "gpt-4o"
    assert s.backend_port == 8000


def test_settings_singleton():
    assert settings.app_name == "harness-platform"
