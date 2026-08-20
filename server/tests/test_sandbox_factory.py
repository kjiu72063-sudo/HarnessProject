"""F005 测试 — get_executor 工厂 + configure_executor + probe._run_check。"""


import pytest

from server.sandbox import (
    configure_executor,
    get_executor,
    get_executor_type,
)
from server.sandbox.base import ExecutionRequest
from server.sandbox.exceptions import SandboxError


class TestGetExecutor:
    async def test_get_executor_local(self) -> None:
        """Tier 2: get_executor 返回 LocalExecutor 适配器。"""
        configure_executor("local")
        executor = get_executor()
        assert hasattr(executor, "execute")
        assert hasattr(executor, "cancel")
        assert hasattr(executor, "cleanup")

    async def test_get_executor_disabled_raises(self) -> None:
        """Tier 3: get_executor 抛 SandboxError。"""
        configure_executor("disabled")
        with pytest.raises(SandboxError, match="Sandbox disabled"):
            get_executor()

    async def test_get_executor_unknown_raises(self) -> None:
        """未知类型抛 SandboxError。"""
        configure_executor("nonexistent")
        with pytest.raises(SandboxError, match="Unknown executor type"):
            get_executor()

    async def test_configure_executor_sets_type(self) -> None:
        """configure_executor 更新执行器类型。"""
        configure_executor("docker")
        assert get_executor_type() == "docker"
        configure_executor("local")
        assert get_executor_type() == "local"
        configure_executor("disabled")
        assert get_executor_type() == "disabled"


class TestLocalExecutorViaFactory:
    async def test_local_execute_via_factory(self) -> None:
        """通过工厂获取的 LocalExecutor 可执行命令。"""
        import tempfile
        configure_executor("local")
        executor = get_executor()
        with tempfile.TemporaryDirectory() as tmpdir:
            request = ExecutionRequest(
                execution_id="factory-test",
                project_path=tmpdir,
                commands=["echo factory"],
                timeout=10,
            )
            result = await executor.execute(request)
        assert result.execution_id == "factory-test"
        assert "factory" in result.stdout

    async def test_local_cancel_via_factory(self) -> None:
        """通过工厂获取的 LocalExecutor 可取消。"""
        configure_executor("local")
        executor = get_executor()
        result = await executor.cancel("nonexistent")
        assert result is False

    async def test_local_cleanup_via_factory(self) -> None:
        """通过工厂获取的 LocalExecutor 可清理。"""
        configure_executor("local")
        executor = get_executor()
        await executor.cleanup("nonexistent")


class TestRunCheck:
    async def test_run_check_success(self) -> None:
        """_run_check 对真实命令返回 True。"""
        from server.sandbox.probe import _run_check
        result = await _run_check(["echo", "hello"])
        assert result is True

    async def test_run_check_failure(self) -> None:
        """_run_check 对不存在的命令返回 False。"""
        from server.sandbox.probe import _run_check
        result = await _run_check(["nonexistent_command_12345"])
        assert result is False

    async def test_run_check_timeout(self) -> None:
        """_run_check 对长时间运行命令超时返回 False。"""
        from server.sandbox.probe import _run_check
        result = await _run_check(["sleep", "30"])
        assert result is False


class TestWhitelistInExecutor:
    async def test_dangerous_command_rejected_in_local_executor(self) -> None:
        """LocalExecutor 通过工厂执行时拒绝危险命令。"""
        import tempfile
        configure_executor("local")
        executor = get_executor()
        with tempfile.TemporaryDirectory() as tmpdir:
            request = ExecutionRequest(
                execution_id="whitelist-test",
                project_path=tmpdir,
                commands=["npm install"],
                timeout=10,
            )
            with pytest.raises(SandboxError, match="not in whitelist"):
                await executor.execute(request)
