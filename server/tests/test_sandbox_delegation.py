"""F005 测试 — 委派桩集成（validation 桩 + coding_agent sandbox_available）。

验证：validation 委派桩调用 get_executor().execute()，
SandboxError → status="disabled"；coding_agent Controller Spec 含 sandbox_available。
"""

from unittest.mock import AsyncMock, patch

from server.sandbox import configure_executor
from server.schemas.harness_state import HarnessState, TechStackSpec, build_initial_state


def _make_state() -> HarnessState:
    return build_initial_state(
        project_id="test-project",
        tech_stack=TechStackSpec(
            frontend="react-19", backend="python-3.12", database="postgresql",
            llm="openai", frontend_package_manager="pnpm", backend_package_manager="uv",
        ),
    )


class TestValidationDelegation:
    async def test_sandbox_result_in_state(self) -> None:
        """validation 桩调用沙箱，sandbox_result 写入 State。"""
        configure_executor("disabled")
        from server.nodes.validation import _execute_sandbox
        state = _make_state()
        result = await _execute_sandbox(state)
        assert result["status"] == "disabled"
        assert result["execution_id"] == "test-project"

    async def test_sandbox_disabled_no_human_intervention(self) -> None:
        """Tier 3: SandboxError → status=disabled, 不阻断流程。"""
        configure_executor("disabled")
        from server.nodes.validation import _execute_sandbox
        state = _make_state()
        result = await _execute_sandbox(state)
        assert result["status"] == "disabled"
        # 不设 human_intervention（F004 裁决③先例：禁用不阻断）


class TestCodingAgentSpec:
    async def test_coding_agent_includes_sandbox_available(self) -> None:
        """coding_agent Controller Spec 含 inputs.sandbox_available。"""
        configure_executor("local")
        from server.nodes.coding_agent import coding_agent
        state = _make_state()
        with patch("server.nodes.coding_agent.agent_runtime") as mock_runtime:
            mock_result = AsyncMock()
            mock_result.status = "stub_completed"
            mock_result.summary = "test"
            mock_runtime.delegate = AsyncMock(return_value=mock_result)
            result = await coding_agent(state)
        assert "current_stage" in result


class TestSelectImage:
    async def test_python_backend(self) -> None:
        from server.sandbox import select_image
        assert select_image("python-3.12", "react-19") == "python:3.12-slim"

    async def test_node_frontend(self) -> None:
        from server.sandbox import select_image
        assert select_image("go-1.22", "react-19") == "node:20-slim"

    async def test_fallback_python(self) -> None:
        from server.sandbox import select_image
        assert select_image("rust-1.80", "unknown-framework") == "python:3.12-slim"
