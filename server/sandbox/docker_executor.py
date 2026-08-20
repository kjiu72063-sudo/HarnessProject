"""F005 代码执行沙箱 — DockerExecutor（Tier 1，首选）。

安全策略（设计文档 §安全隔离边界）：
- 资源: --cpus --memory --pids-limit + tmpfs size
- 网络: --network none
- 文件系统: 产物只读挂载 + 可写 tmpfs /workspace
- 超时: asyncio.wait_for + docker stop -t 5

测试策略：DockerExecutor 用 mock client（不依赖真实 Docker daemon，P009 防护）。
通过 docker_client 参数注入，生产环境传 None 使用 aiodocker。
"""

import asyncio
import logging
import time
from typing import Any, Literal, Protocol, runtime_checkable

from server.sandbox.base import (
    MAX_OUTPUT_BYTES,
    ExecutionRequest,
    ExecutionResult,
    ResourceUsage,
)
from server.sandbox.exceptions import SandboxError

logger = logging.getLogger(__name__)

SANDBOX_LABEL = "managed-by=harness-sandbox"


@runtime_checkable
class DockerClient(Protocol):
    """Docker 客户端协议（mock 注入点）。"""

    async def run(self, image: str, command: list[str], **kwargs: Any) -> str: ...
    async def wait(self, container_id: str, timeout: int | None = None) -> int: ...
    async def logs(self, container_id: str, *, stdout: bool = True, stderr: bool = True) -> bytes: ...
    async def stop(self, container_id: str, timeout: int = 5) -> None: ...
    async def remove(self, container_id: str, force: bool = False) -> None: ...
    async def list_containers(self, filters: dict[str, str]) -> list[str]: ...


def _truncate(text: str) -> str:
    """截断输出至 MAX_OUTPUT_BYTES。"""
    encoded = text.encode("utf-8", errors="replace")
    if len(encoded) <= MAX_OUTPUT_BYTES:
        return text
    return encoded[:MAX_OUTPUT_BYTES].decode("utf-8", errors="replace")


def _build_docker_kwargs(request: ExecutionRequest, image: str) -> dict[str, Any]:
    """构造 docker run 参数（安全策略落地）。"""
    limits = request.resource_limits
    return {
        "image": image,
        "command": ["/bin/sh", "-c", " && ".join(request.commands)],
        "volumes": {request.project_path: {"bind": "/project", "mode": "ro"}},
        "tmpfs": {"/workspace": f"size={limits.disk_mb}m"},
        "network_mode": "none",
        "cpu_quota": int(limits.cpu_quota * 100000),
        "mem_limit": f"{limits.memory_mb}m",
        "pids_limit": limits.pids_limit,
        "labels": {"managed-by": "harness-sandbox", "execution-id": request.execution_id},
        "environment": {**request.env, "UV_FROZEN": "1"},  # P010
        "working_dir": "/project",
    }


# 运行中容器注册表
_running_containers: dict[str, str] = {}


async def execute(request: ExecutionRequest, image: str, *, docker_client: DockerClient) -> ExecutionResult:
    """Docker 容器执行：创建 → 等待/超时 → 收集结果。"""
    start = time.monotonic()
    kwargs = _build_docker_kwargs(request, image)

    try:
        container_id = await docker_client.run(**kwargs)
    except Exception as exc:
        raise SandboxError(f"Docker run failed: {exc}") from exc

    _running_containers[request.execution_id] = container_id

    try:
        exit_code = await asyncio.wait_for(
            docker_client.wait(container_id), timeout=request.timeout,
        )
        status: Literal["completed", "timeout"] = "completed"
    except TimeoutError:
        await cancel(request.execution_id, docker_client=docker_client)
        exit_code = -1
        status = "timeout"

    logs_bytes = await docker_client.logs(container_id, stdout=True, stderr=True)
    logs_text = logs_bytes.decode("utf-8", errors="replace")
    stdout = _truncate(logs_text)
    duration_ms = int((time.monotonic() - start) * 1000)

    await cleanup(request.execution_id, docker_client=docker_client)

    return ExecutionResult(
        execution_id=request.execution_id,
        exit_code=exit_code,
        stdout=stdout,
        stderr="",
        duration_ms=duration_ms,
        resource_usage=ResourceUsage(),
        status=status,
    )


async def cancel(execution_id: str, *, docker_client: DockerClient) -> bool:
    """取消运行中的容器：docker stop -t 5。"""
    container_id = _running_containers.pop(execution_id, None)
    if container_id is None:
        return False
    try:
        await docker_client.stop(container_id, timeout=5)
    except Exception:
        pass
    logger.info("cancel: stopped container %s for execution_id=%s", container_id[:12], execution_id)
    return True


async def cleanup(execution_id: str, *, docker_client: DockerClient) -> None:
    """清理容器资源。"""
    container_id = _running_containers.pop(execution_id, None)
    if container_id is None:
        return
    try:
        await docker_client.remove(container_id, force=True)
    except Exception:
        pass


async def cleanup_orphans(*, docker_client: DockerClient) -> list[str]:
    """lifespan shutdown 批量清理残留容器（label 过滤）。"""
    container_ids = await docker_client.list_containers({"label": SANDBOX_LABEL})
    removed: list[str] = []
    for cid in container_ids:
        try:
            await docker_client.remove(cid, force=True)
            removed.append(cid)
        except Exception:
            pass
    if removed:
        logger.info("cleanup_orphans: removed %d residual containers", len(removed))
    return removed
