from fastapi.testclient import TestClient

from server.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "harness-platform"


def test_list_projects_empty():
    response = client.get("/api/projects")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["projects"] == []


def test_create_project():
    response = client.post(
        "/api/projects",
        json={"name": "test-app", "tech_stack": "react-vite"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "test-app"
    assert data["status"] == "init"
    assert data["tech_stack"] == "react-vite"


def test_create_project_default_tech_stack():
    response = client.post(
        "/api/projects",
        json={"name": "default-app"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["tech_stack"] == "java-springboot"


def test_list_agent_sessions():
    response = client.get("/api/agent-sessions?project_id=test")
    assert response.status_code == 200
    data = response.json()
    assert "sessions" in data
    assert data["total"] == 0
