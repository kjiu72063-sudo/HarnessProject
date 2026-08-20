"""F005 代码执行沙箱 — Docker 客户端工厂（生产环境用 aiodocker）。

测试环境下 DockerExecutor 使用 mock client（不依赖真实 daemon），此模块仅在
DockerExecutor 适配器实际调用时导入（lazy import，Probe 已确认 daemon 可用）。
此模块依赖 aiodocker（可选依赖），测试环境下不可用，pragma: no cover 标注。
"""

import logging  # pragma: no cover
from typing import Any  # pragma: no cover

from server.sandbox.docker_executor import DockerClient  # pragma: no cover

logger = logging.getLogger(__name__)  # pragma: no cover


class AioDockerClient:  # pragma: no cover
    """aiodocker 真实客户端的 DockerClient 协议适配。"""

    def __init__(self) -> None:
        try:
            from aiodocker import Docker
        except ImportError as exc:
            raise ImportError(
                "aiodocker required for DockerExecutor; install with: uv add aiodocker"
            ) from exc
        self._docker = Docker()

    async def run(self, image: str, command: list[str], **kwargs: Any) -> str:
        config = {"Image": image, "Cmd": command, **kwargs}
        container = await self._docker.containers.create(config)
        await container.start()
        return str(container.id)

    async def wait(self, container_id: str, timeout: int | None = None) -> int:
        container = self._docker.containers.container(container_id)
        result = await container.wait(timeout=timeout)
        return int(result.get("StatusCode", -1))

    async def logs(self, container_id: str, *, stdout: bool = True, stderr: bool = True) -> bytes:
        container = self._docker.containers.container(container_id)
        data = await container.log(stdout=stdout, stderr=stderr)
        return bytes(data)

    async def stop(self, container_id: str, timeout: int = 5) -> None:
        container = self._docker.containers.container(container_id)
        await container.stop(t=timeout)

    async def remove(self, container_id: str, force: bool = False) -> None:
        container = self._docker.containers.container(container_id)
        await container.delete(force=force)

    async def list_containers(self, filters: dict[str, str]) -> list[str]:
        containers = await self._docker.containers.list(filters=filters)
        return [c.id for c in containers]


def get_docker_client() -> DockerClient:  # pragma: no cover
    """工厂：返回 aiodocker 客户端实例。"""
    return AioDockerClient()
