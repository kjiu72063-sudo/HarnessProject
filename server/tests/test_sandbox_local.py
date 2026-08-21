"""F005 测试 — LocalExecutor（Tier 2 降级）。

真实执行 echo hello，验证结果结构。
"""

import tempfile

from server.sandbox import local_executor
from server.sandbox.base import ExecutionRequest, ExecutionResult


class TestLocalExecutor:
    async def test_execute_echo(self) -> None:
        """LocalExecutor 真实执行 echo hello，验证结果结构。"""
        with tempfile.TemporaryDirectory() as tmpdir:
            request = ExecutionRequest(
                execution_id="test-echo",
                project_path=tmpdir,
                commands=["echo hello"],
                timeout=10,
            )
            result = await local_executor.execute(request)
        assert isinstance(result, ExecutionResult)
        assert result.execution_id == "test-echo"
        assert result.exit_code == 0
        assert "hello" in result.stdout
        assert result.status == "completed"
        assert result.duration_ms >= 0

    async def test_execute_resource_usage_zero(self) -> None:
        """LocalExecutor resource_usage 零值占位（安全降级标注）。"""
        with tempfile.TemporaryDirectory() as tmpdir:
            request = ExecutionRequest(
                execution_id="test-usage",
                project_path=tmpdir,
                commands=["echo test"],
                timeout=10,
            )
            result = await local_executor.execute(request)
        assert result.resource_usage.cpu_seconds == 0.0
        assert result.resource_usage.memory_peak_mb == 0.0
        assert result.resource_usage.disk_used_mb == 0.0

    async def test_cancel_nonexistent(self) -> None:
        """取消不存在的进程返回 False。"""
        result = await local_executor.cancel("nonexistent-id")
        assert result is False

    async def test_cleanup_nonexistent(self) -> None:
        """清理不存在的进程不报错。"""
        await local_executor.cleanup("nonexistent-id")

    async def test_execute_multiple_commands(self) -> None:
        """顺序执行多条命令。"""
        with tempfile.TemporaryDirectory() as tmpdir:
            request = ExecutionRequest(
                execution_id="test-multi",
                project_path=tmpdir,
                commands=["echo first", "echo second"],
                timeout=10,
            )
            result = await local_executor.execute(request)
        assert "first" in result.stdout
        assert "second" in result.stdout

    async def test_execute_timeout(self) -> None:
        """超时命令触发 cancel，status="timeout" + exit_code=-1。"""
        with tempfile.TemporaryDirectory() as tmpdir:
            request = ExecutionRequest(
                execution_id="test-timeout",
                project_path=tmpdir,
                commands=["sleep 10"],
                timeout=1,
            )
            result = await local_executor.execute(request)
        assert result.status == "timeout"
        assert result.exit_code == -1
        assert "timed out" in result.stderr
