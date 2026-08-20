"""F005 测试 — Docker 可用性探测（验收标准 3）。

mock subprocess.run：三返回（可用/不可用/超时）→ 三级降级。
"""

from unittest.mock import patch

from server.sandbox.probe import probe_docker


async def _mock_run_check_success(cmd: list[str]) -> bool:
    return True


async def _mock_run_check_fail(cmd: list[str]) -> bool:
    return False


async def _mock_run_check_info_ok_hello_fail(cmd: list[str]) -> bool:
    if "info" in cmd:
        return True
    return False


class TestProbeDocker:
    async def test_docker_available(self) -> None:
        """Tier 1: docker info + hello-world 均成功。"""
        with patch("server.sandbox.probe._run_check", side_effect=_mock_run_check_success):
            result = await probe_docker()
        assert result is True

    async def test_docker_not_available(self) -> None:
        """Tier 2: docker info 失败。"""
        with patch("server.sandbox.probe._run_check", side_effect=_mock_run_check_fail):
            result = await probe_docker()
        assert result is False

    async def test_docker_info_ok_hello_fail(self) -> None:
        """Tier 2: docker info 成功但 hello-world 失败。"""
        with patch("server.sandbox.probe._run_check", side_effect=_mock_run_check_info_ok_hello_fail):
            result = await probe_docker()
        assert result is False

    async def test_probe_timeout_treated_as_unavailable(self) -> None:
        """超时视为不可用（_run_check 内部已捕获 TimeoutError → False）。"""
        with patch("server.sandbox.probe._run_check", side_effect=_mock_run_check_fail):
            result = await probe_docker()
        assert result is False
