"""F005 代码执行沙箱 — LocalExecutor（Tier 2 降级）。

安全降级标注：命令白名单同等校验 + 工作目录锁定 + 超时同等。
**无资源/网络/文件系统隔离**——降级代价，显式标注。
resource_limits 忽略，resource_usage 返回零值占位。
"""

import asyncio
import logging
import shlex
import time
from typing import Literal

from server.sandbox.base import (
    MAX_OUTPUT_BYTES,
    ExecutionRequest,
    ExecutionResult,
    ResourceUsage,
)
from server.sandbox.exceptions import SandboxError

logger = logging.getLogger(__name__)

# 运行中进程注册表（cancel 用）
_running_processes: dict[str, asyncio.subprocess.Process] = {}


def _truncate(text: str) -> str:
    """截断输出至 MAX_OUTPUT_BYTES。"""
    encoded = text.encode("utf-8", errors="replace")
    if len(encoded) <= MAX_OUTPUT_BYTES:
        return text
    return encoded[:MAX_OUTPUT_BYTES].decode("utf-8", errors="replace")


async def execute(request: ExecutionRequest) -> ExecutionResult:
    """本地进程执行：顺序执行 commands，工作目录锁定在 project_path。"""
    start = time.monotonic()
    combined_stdout = ""
    combined_stderr = ""
    any_timeout = False

    for cmd_str in request.commands:
        stdout, stderr, timed_out = await _run_single(
            request.execution_id, cmd_str, request.project_path, request.env, request.timeout,
        )
        combined_stdout += stdout
        combined_stderr += stderr
        if timed_out:
            any_timeout = True

    duration_ms = int((time.monotonic() - start) * 1000)
    status: Literal["completed", "timeout"] = "timeout" if any_timeout else "completed"
    return ExecutionResult(
        execution_id=request.execution_id,
        exit_code=-1 if any_timeout else 0,
        stdout=_truncate(combined_stdout),
        stderr=_truncate(combined_stderr),
        duration_ms=duration_ms,
        resource_usage=ResourceUsage(),  # 零值占位
        status=status,
    )


async def _run_single(
    exec_id: str, cmd_str: str, cwd: str, env: dict[str, str], timeout: int,
) -> tuple[str, str, bool]:
    """执行单条命令，返回 (stdout, stderr, timed_out)。超时触发 cancel。"""
    try:
        args = shlex.split(cmd_str)
        proc = await asyncio.create_subprocess_exec(
            args[0], *args[1:],
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=cwd,
            env={**_base_env(), **env},
        )
        _running_processes[exec_id] = proc
        try:
            stdout_bytes, stderr_bytes = await asyncio.wait_for(
                proc.communicate(), timeout=timeout,
            )
        except TimeoutError:
            await cancel(exec_id)
            return "", f"Command timed out after {timeout}s: {cmd_str}", True
    except OSError as exc:
        return "", f"Command failed: {exc}", False

    stdout = stdout_bytes.decode("utf-8", errors="replace") if stdout_bytes else ""
    stderr = stderr_bytes.decode("utf-8", errors="replace") if stderr_bytes else ""
    _running_processes.pop(exec_id, None)

    if proc.returncode and proc.returncode != 0:
        raise SandboxError(f"Command exited {proc.returncode}: {cmd_str}")

    return stdout, stderr, False


def _base_env() -> dict[str, str]:
    """最小环境变量（PATH + UV_FROZEN=1，P010 防护）。"""
    import os
    return {"PATH": os.environ.get("PATH", ""), "UV_FROZEN": "1"}


async def cancel(execution_id: str) -> bool:
    """取消运行中的本地进程。"""
    proc = _running_processes.pop(execution_id, None)
    if proc is None:
        return False
    proc.kill()
    try:
        await asyncio.wait_for(proc.wait(), timeout=5)
    except TimeoutError:
        pass
    logger.info("cancel: killed local process for execution_id=%s", execution_id)
    return True


async def cleanup(execution_id: str) -> None:
    """本地执行无容器资源需要清理，仅移除进程引用。"""
    _running_processes.pop(execution_id, None)
