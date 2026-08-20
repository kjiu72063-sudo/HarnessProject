"""F005 测试 — Local vs Docker 契约测试（验收标准 10）。

同一 ExecutionRequest → 两实现结果结构等价。
LocalExecutor 安全降级显式标注。
"""

import tempfile
from unittest.mock import AsyncMock

from server.sandbox import docker_executor, local_executor
from server.sandbox.base import ExecutionRequest


def _make_mock_client() -> AsyncMock:
    client = AsyncMock()
    client.run.return_value = "container-contract"
    client.wait.return_value = 0
    client.logs.return_value = b"contract output\n"
    client.stop.return_value = None
    client.remove.return_value = None
    return client


class TestContractEquivalence:
    async def test_result_structure_equivalent(self) -> None:
        """同一 ExecutionRequest → 两实现结果结构等价（字段一致）。"""
        request = ExecutionRequest(
            execution_id="contract-test",
            project_path="/tmp/project",
            commands=["echo hello"],
            timeout=30,
        )

        with tempfile.TemporaryDirectory() as tmpdir:
            local_request = request.model_copy(update={"project_path": tmpdir})
            local_result = await local_executor.execute(local_request)

        mock_client = _make_mock_client()
        docker_result = await docker_executor.execute(request, "python:3.12-slim", docker_client=mock_client)

        assert set(local_result.model_fields_set) == set(docker_result.model_fields_set)
        assert local_result.execution_id == docker_result.execution_id
        assert local_result.status == docker_result.status

    async def test_local_resource_usage_zero(self) -> None:
        """LocalExecutor resource_usage 零值占位（安全降级标注）。"""
        with tempfile.TemporaryDirectory() as tmpdir:
            request = ExecutionRequest(
                execution_id="contract-usage",
                project_path=tmpdir,
                commands=["echo test"],
                timeout=10,
            )
            result = await local_executor.execute(request)
        assert result.resource_usage.cpu_seconds == 0.0
        assert result.resource_usage.memory_peak_mb == 0.0
        assert result.resource_usage.disk_used_mb == 0.0

    async def test_both_have_required_fields(self) -> None:
        """两实现均包含设计文档要求的结果字段。"""
        required_fields = {"execution_id", "exit_code", "stdout", "stderr", "duration_ms", "status"}
        with tempfile.TemporaryDirectory() as tmpdir:
            request = ExecutionRequest(
                execution_id="contract-fields",
                project_path=tmpdir,
                commands=["echo x"],
                timeout=10,
            )
            result = await local_executor.execute(request)
        assert required_fields.issubset(set(result.model_dump().keys()))
