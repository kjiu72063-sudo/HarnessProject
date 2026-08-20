"""F005 测试 — API 端点（GET /api/sandbox/status）。

httpx AsyncClient 往返验证。
"""

from httpx import ASGITransport, AsyncClient

from server.main import app


class TestSandboxAPI:
    async def test_sandbox_status_endpoint(self) -> None:
        """GET /api/sandbox/status 返回执行器类型与 Docker 可用性。"""
        from server.sandbox import configure_executor
        configure_executor("local")
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/sandbox/status")
        assert response.status_code == 200
        data = response.json()
        assert "executor_type" in data
        assert "docker_available" in data
        assert data["executor_type"] in ("docker", "local", "disabled")

    async def test_sandbox_status_type_local(self) -> None:
        """配置为 local 时返回 executor_type=local, docker_available=false。"""
        from server.sandbox import configure_executor
        configure_executor("local")
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/sandbox/status")
        data = response.json()
        assert data["executor_type"] == "local"
        assert data["docker_available"] is False

    async def test_sandbox_status_type_docker(self) -> None:
        """配置为 docker 时返回 executor_type=docker, docker_available=true。"""
        from server.sandbox import configure_executor
        configure_executor("docker")
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/sandbox/status")
        data = response.json()
        assert data["executor_type"] == "docker"
        assert data["docker_available"] is True
