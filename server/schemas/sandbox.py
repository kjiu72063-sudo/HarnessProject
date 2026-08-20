"""F005 代码执行沙箱 — Pydantic schema（GET /api/sandbox/status 响应）。"""

from typing import Literal

from pydantic import BaseModel

__all__ = ["SandboxStatusResponse"]


class SandboxStatusResponse(BaseModel):
    """沙箱状态查询响应（硬性规则 4：Pydantic schema + TS 类型镜像）。"""

    executor_type: Literal["docker", "local", "disabled"]
    docker_available: bool
