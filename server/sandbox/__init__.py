"""F005 代码执行沙箱 — 包出口。

导出 get_executor 工厂 + 白名单校验 + 镜像映射表。
对齐 F003 Provider 注册先例。
"""

import logging
import re
from typing import Any, Literal

from server.sandbox.base import ExecutionRequest, ExecutionResult, Executor, SandboxError

__all__ = [
    "get_executor",
    "validate_command",
    "select_image",
    "Executor",
    "ExecutionRequest",
    "ExecutionResult",
    "SandboxError",
]

logger = logging.getLogger(__name__)

# ── 命令白名单（设计文档 §安全隔离边界） ──

ALLOWED_COMMANDS: list[re.Pattern[str]] = [
    re.compile(r"^python(\s|$)"),
    re.compile(r"^pytest(\s|$)"),
    re.compile(r"^uv(\s|$)"),
    re.compile(r"^pnpm(\s|$)"),
    re.compile(r"^node(\s|$)"),
    re.compile(r"^npx(\s|$)"),
    re.compile(r"^git(\s|$)"),
    re.compile(r"^echo(\s|$)"),
    # 裁决①：mvn 预留匹配位但不启用（排期 F010 协同交付）
    # re.compile(r"^mvn(\s|$)"),
]

DANGEROUS_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"rm\s+-rf\s+/"),
    re.compile(r"curl.*\|\s*sh"),
    re.compile(r"wget.*\|\s*sh"),
    re.compile(r"^npm(\s|$)"),  # 歧义β：有意保留，平台用 pnpm
]


def validate_command(command: str) -> str:
    """校验单条命令：白名单匹配 AND 不命中危险模式。

    返回通过的原命令；拒绝时抛 SandboxError。
    """
    if not command.strip():
        raise SandboxError("Empty command rejected", command=command)

    allowed = any(p.match(command) for p in ALLOWED_COMMANDS)
    if not allowed:
        raise SandboxError(f"Command not in whitelist: {command}", command=command)

    dangerous = any(p.search(command) for p in DANGEROUS_PATTERNS)
    if dangerous:
        raise SandboxError(f"Dangerous pattern detected: {command}", command=command)

    return command


# ── 镜像映射表（裁决②：按 TechStackSpec 动态选择，内置 2 条） ──

IMAGE_MAP: dict[str, str] = {
    "python": "python:3.12-slim",
    "node": "node:20-slim",
}

# 前端框架 → node 栈映射（react/vue/svelte/angular 等均用 node 镜像）
_FRONTEND_NODE_INDICATORS = {"react", "vue", "svelte", "angular", "next", "nuxt"}


def select_image(backend: str, frontend: str) -> str:
    """按 TechStackSpec 选择沙箱镜像。

    backend/frontend 为 TechStackSpec 的原始字段值（如 "python-3.12", "react-19"）。
    优先匹配 backend，再检测前端框架是否需要 node，最终 fallback python:3.12-slim。
    """
    for key, image in IMAGE_MAP.items():
        if key in backend.lower():
            return image
    for indicator in _FRONTEND_NODE_INDICATORS:
        if indicator in frontend.lower():
            return IMAGE_MAP["node"]
    return IMAGE_MAP["python"]  # fallback


# ── 执行器类型与工厂 ──

_executor_type: str = "disabled"  # 启动探测后由 lifespan 写入


def configure_executor(tier: str) -> None:
    """lifespan 调用：设置执行器级别。tier ∈ {docker, local, disabled}。"""
    global _executor_type
    _executor_type = tier
    logger.info("sandbox executor configured: %s", tier)


def get_executor_type() -> Literal["docker", "local", "disabled"]:
    """返回当前执行器类型（供 API 端点消费）。"""
    return _executor_type  # type: ignore[return-value]


def get_executor() -> Executor:
    """工厂函数：启动探测 → 选择实现（对齐 F003 get_llm_provider 先例）。"""
    match _executor_type:
        case "docker":
            return _DockerExecutorAdapter()
        case "local":
            return _LocalExecutorAdapter()
        case "disabled":
            raise SandboxError("Sandbox disabled: Docker unavailable")
        case _:
            raise SandboxError(f"Unknown executor type: {_executor_type}")


class _LocalExecutorAdapter:
    """LocalExecutor 适配器（将模块函数适配为 Executor Protocol）。"""

    async def execute(self, request: ExecutionRequest) -> ExecutionResult:
        for cmd in request.commands:
            validate_command(cmd)
        from server.sandbox import local_executor as _local_mod
        return await _local_mod.execute(request)

    async def cancel(self, execution_id: str) -> bool:
        from server.sandbox import local_executor as _local_mod
        return await _local_mod.cancel(execution_id)

    async def cleanup(self, execution_id: str) -> None:
        from server.sandbox import local_executor as _local_mod
        await _local_mod.cleanup(execution_id)


class _DockerExecutorAdapter:
    """DockerExecutor 适配器（需要 docker_client 注入，生产环境用 aiodocker）。"""

    def __init__(self) -> None:
        self._client: Any = None

    async def _get_client(self) -> Any:
        if self._client is None:
            from server.sandbox._docker_client import get_docker_client
            self._client = get_docker_client()
        return self._client

    async def execute(self, request: ExecutionRequest) -> ExecutionResult:
        for cmd in request.commands:
            validate_command(cmd)
        client = await self._get_client()
        from server.sandbox import docker_executor as _docker_mod
        image = select_image(request.env.get("SANDBOX_BACKEND", ""), request.env.get("SANDBOX_FRONTEND", ""))
        return await _docker_mod.execute(request, image, docker_client=client)

    async def cancel(self, execution_id: str) -> bool:
        client = await self._get_client()
        from server.sandbox import docker_executor as _docker_mod
        return await _docker_mod.cancel(execution_id, docker_client=client)

    async def cleanup(self, execution_id: str) -> None:
        client = await self._get_client()
        from server.sandbox import docker_executor as _docker_mod
        await _docker_mod.cleanup(execution_id, docker_client=client)
