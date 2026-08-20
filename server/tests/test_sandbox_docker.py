"""F005 测试 — DockerExecutor（Tier 1，mock client）。

不依赖真实 Docker daemon（P009 防护）。
验证 run/stop/wait 参数与安全策略。
"""

from unittest.mock import AsyncMock

from server.sandbox import docker_executor
from server.sandbox.base import ExecutionRequest, ExecutionResult


def _make_mock_client() -> AsyncMock:
    """构造 mock DockerClient。"""
    client = AsyncMock()
    client.run.return_value = "container-abc123"
    client.wait.return_value = 0
    client.logs.return_value = b"test output\n"
    client.stop.return_value = None
    client.remove.return_value = None
    client.list_containers.return_value = []
    return client


class TestDockerExecutor:
    async def test_execute_success(self) -> None:
        """mock client 执行成功，验证结果结构。"""
        client = _make_mock_client()
        request = ExecutionRequest(
            execution_id="test-docker",
            project_path="/tmp/project",
            commands=["echo hello"],
            timeout=30,
        )
        result = await docker_executor.execute(request, "python:3.12-slim", docker_client=client)
        assert isinstance(result, ExecutionResult)
        assert result.execution_id == "test-docker"
        assert result.exit_code == 0
        assert result.status == "completed"
        assert "test output" in result.stdout

    async def test_execute_calls_run_with_security(self) -> None:
        """验证 docker run 参数包含安全策略。"""
        client = _make_mock_client()
        request = ExecutionRequest(
            execution_id="test-sec",
            project_path="/tmp/project",
            commands=["pytest"],
            timeout=60,
        )
        await docker_executor.execute(request, "python:3.12-slim", docker_client=client)
        call_kwargs = client.run.call_args[1]
        assert call_kwargs["network_mode"] == "none"
        assert "managed-by" in call_kwargs.get("labels", {})

    async def test_execute_timeout(self) -> None:
        """超时触发 cancel + stop。"""
        client = _make_mock_client()
        client.wait.side_effect = TimeoutError()
        request = ExecutionRequest(
            execution_id="test-timeout",
            project_path="/tmp/project",
            commands=["sleep 100"],
            timeout=1,
        )
        result = await docker_executor.execute(request, "python:3.12-slim", docker_client=client)
        assert result.status == "timeout"
        assert result.exit_code == -1
        client.stop.assert_called()

    async def test_cleanup_removes_container(self) -> None:
        """cleanup 调用 docker remove。"""
        client = _make_mock_client()
        docker_executor._running_containers["test-cleanup"] = "container-xyz"
        await docker_executor.cleanup("test-cleanup", docker_client=client)
        client.remove.assert_called_once_with("container-xyz", force=True)

    async def test_cancel_stops_container(self) -> None:
        """cancel 调用 docker stop。"""
        client = _make_mock_client()
        docker_executor._running_containers["test-cancel"] = "container-stop"
        result = await docker_executor.cancel("test-cancel", docker_client=client)
        assert result is True
        client.stop.assert_called_once_with("container-stop", timeout=5)

    async def test_cancel_nonexistent(self) -> None:
        """取消不存在的容器返回 False。"""
        client = _make_mock_client()
        result = await docker_executor.cancel("nonexistent", docker_client=client)
        assert result is False

    async def test_cleanup_orphans(self) -> None:
        """批量清理残留容器。"""
        client = _make_mock_client()
        client.list_containers.return_value = ["c1", "c2"]
        removed = await docker_executor.cleanup_orphans(docker_client=client)
        assert removed == ["c1", "c2"]
        assert client.remove.call_count == 2
