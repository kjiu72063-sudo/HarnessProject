"""F005 代码执行沙箱 — Executor Protocol + 数据模型。

对齐设计文档 §总体架构：Executor(Protocol) 三方法 + 工厂函数先例对齐 F003 LLMProvider。
"""

from typing import Literal, Protocol, runtime_checkable

from pydantic import BaseModel, Field

from server.sandbox.exceptions import SandboxError

__all__ = [
    "Executor",
    "ExecutionRequest",
    "ExecutionResult",
    "ResourceLimits",
    "ResourceUsage",
    "SandboxError",
]

# stdout/stderr 截断上限（64KB）
MAX_OUTPUT_BYTES = 64 * 1024


class ResourceLimits(BaseModel):
    """容器资源限制（DockerExecutor 消费，LocalExecutor 忽略）。"""

    cpu_quota: float = Field(default=1.0, description="CPU 核数")
    memory_mb: int = Field(default=512, description="内存上限 MB")
    disk_mb: int = Field(default=100, description="磁盘上限 MB（tmpfs size）")
    pids_limit: int = Field(default=100, description="PID 上限")


class ResourceUsage(BaseModel):
    """执行后资源使用统计。"""

    cpu_seconds: float = 0.0
    memory_peak_mb: float = 0.0
    disk_used_mb: float = 0.0


class ExecutionRequest(BaseModel):
    """沙箱执行请求。"""

    execution_id: str
    project_path: str = Field(description="产物项目路径（挂载源）")
    commands: list[str] = Field(description="顺序执行的命令序列")
    env: dict[str, str] = Field(default_factory=dict, description="环境变量（不传敏感凭据）")
    timeout: int = Field(default=300, description="超时秒数，默认 5 分钟")
    resource_limits: ResourceLimits = Field(default_factory=ResourceLimits)


class ExecutionResult(BaseModel):
    """沙箱执行结果。"""

    execution_id: str
    exit_code: int
    stdout: str
    stderr: str
    duration_ms: int
    resource_usage: ResourceUsage = Field(default_factory=ResourceUsage)
    status: Literal["completed", "timeout", "cancelled", "error", "disabled"]


@runtime_checkable
class Executor(Protocol):
    """可插拔执行器协议（F003 Provider 先例）。"""

    async def execute(self, request: ExecutionRequest) -> ExecutionResult: ...

    async def cancel(self, execution_id: str) -> bool: ...

    async def cleanup(self, execution_id: str) -> None: ...
