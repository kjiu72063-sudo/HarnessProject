"""F005 代码执行沙箱 — Docker 可用性探测（lifespan 调用）。

三级降级链：
  Tier 1: docker info + docker run hello-world 成功 → DockerExecutor
  Tier 2: Docker 不可用 → LocalExecutor
  Tier 3: 显式禁用 → disabled

测试不依赖 Docker daemon 真实可用（P009 同源环境漂移），probe 用 mock subprocess。
"""

import asyncio
import logging

logger = logging.getLogger(__name__)

_PROBE_TIMEOUT = 10  # 单步超时秒数


async def _run_check(cmd: list[str]) -> bool:
    """运行命令检查，成功返回 True，超时/非零返回 False。"""
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.DEVNULL,
        )
        await asyncio.wait_for(proc.wait(), timeout=_PROBE_TIMEOUT)
        return proc.returncode == 0
    except (TimeoutError, OSError):
        return False


async def probe_docker() -> bool:
    """探测 Docker daemon 是否可用（Tier 1 判定）。

    两步：docker info → docker run hello-world。
    任一失败均视为不可用，降级到 Tier 2。
    """
    if not await _run_check(["docker", "info"]):
        logger.info("probe: docker info failed → Tier 2 (local)")
        return False
    if not await _run_check(["docker", "run", "--rm", "hello-world"]):
        logger.info("probe: docker run hello-world failed → Tier 2 (local)")
        return False
    logger.info("probe: Docker available → Tier 1 (docker)")
    return True
