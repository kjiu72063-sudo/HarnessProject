"""F005 代码执行沙箱 — 自定义异常。"""


class SandboxError(Exception):
    """沙箱操作异常基类。

    用途：
    - 命令白名单拒绝时抛出（含被拒命令原文）
    - Tier 3 禁用状态时抛出
    - Docker/本地执行器运行时异常
    """

    def __init__(self, message: str, *, command: str | None = None) -> None:
        self.command = command
        super().__init__(message)
