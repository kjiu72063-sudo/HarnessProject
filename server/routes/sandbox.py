"""F005 代码执行沙箱 — GET /api/sandbox/status 路由。

只读状态查询（执行由委派桩内部调用，不经 API）。
"""

from fastapi import APIRouter

from server.sandbox import get_executor_type
from server.schemas.sandbox import SandboxStatusResponse

__all__ = ["router"]

router = APIRouter(prefix="/sandbox", tags=["sandbox"])

_executor_type = get_executor_type()


@router.get("/status", response_model=SandboxStatusResponse)
async def sandbox_status() -> SandboxStatusResponse:
    """返回沙箱执行器类型与 Docker 可用性。"""
    current_type = get_executor_type()
    docker_available = current_type == "docker"
    return SandboxStatusResponse(executor_type=current_type, docker_available=docker_available)
