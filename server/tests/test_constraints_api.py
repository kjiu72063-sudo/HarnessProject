"""约束管理 API 三端点测试（F004 设计 §5.1：GET 合并列表 / POST manual / PUT 受限更新）。"""

from pathlib import Path

from fastapi.testclient import TestClient

from server.constraints import registry
from server.main import app

client = TestClient(app)

AGENTS_MD = Path("AGENTS.md").read_text(encoding="utf-8")


def setup_module() -> None:
    registry.initialize(AGENTS_MD)


def teardown_module() -> None:
    registry.initialize(AGENTS_MD)


def test_get_constraints_returns_system_entries_by_default():
    data = client.get("/api/constraints").json()
    assert data
    assert all(entry["project_id"] == "" for entry in data)
    sources = {entry["source"] for entry in data}
    assert "agents_md" in sources


def test_get_constraints_merges_project_manual_entries():
    created = client.post(
        "/api/constraints",
        json={
            "project_id": "p-api",
            "title": "项目规则",
            "detail": "接口层测试",
            "rule_type": "process_convention",
        },
    ).json()
    merged = client.get("/api/constraints", params={"project_id": "p-api"}).json()
    ids = {entry["id"] for entry in merged}
    assert created["id"] in ids
    other = client.get("/api/constraints", params={"project_id": "p-none"}).json()
    assert created["id"] not in {entry["id"] for entry in other}


def test_post_constraint_creates_manual_entry_with_defaults():
    data = client.post(
        "/api/constraints",
        json={
            "project_id": "p-create",
            "title": "手工约束",
            "rule_type": "static_text",
            "enforcer": "人工",
        },
    )
    assert data.status_code == 201
    body = data.json()
    assert body["source"] == "manual"
    assert body["source_key"].startswith("manual-")
    assert body["rule_no"] == 0
    assert body["enforcement"] == "manual_review"
    assert body["enabled"] is True


def test_post_constraint_without_project_id_returns_422():
    response = client.post(
        "/api/constraints",
        json={"title": "缺项目归属", "rule_type": "static_text"},
    )
    assert response.status_code == 422


def test_post_constraint_with_invalid_rule_type_returns_422():
    response = client.post(
        "/api/constraints",
        json={"project_id": "p-api", "title": "x", "rule_type": "not_a_type"},
    )
    assert response.status_code == 422


def test_put_constraint_toggles_enabled_on_agents_md_entry():
    entry = next(
        entry for entry in client.get("/api/constraints").json()
        if entry["source"] == "agents_md"
    )
    response = client.put(f"/api/constraints/{entry['id']}", json={"enabled": False})
    assert response.status_code == 200
    assert response.json()["enabled"] is False
    client.put(f"/api/constraints/{entry['id']}", json={"enabled": True})


def test_put_constraint_rejects_title_edit_on_agents_md_entry():
    entry = next(
        entry for entry in client.get("/api/constraints").json()
        if entry["source"] == "agents_md"
    )
    response = client.put(f"/api/constraints/{entry['id']}", json={"title": "篡改"})
    assert response.status_code == 403


def test_put_constraint_updates_manual_entry_fields():
    created = client.post(
        "/api/constraints",
        json={"project_id": "p-put", "title": "原标题", "rule_type": "static_text"},
    ).json()
    response = client.put(
        f"/api/constraints/{created['id']}",
        json={"title": "新标题", "detail": "新描述", "enabled": False},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "新标题"
    assert body["detail"] == "新描述"
    assert body["enabled"] is False


def test_put_constraint_unknown_id_returns_404():
    response = client.put("/api/constraints/999999", json={"enabled": False})
    assert response.status_code == 404


def test_disabled_entry_excluded_from_active_constraints_injection():
    entry = next(
        entry for entry in registry.active_constraints("p-api")
        if entry["source"] == "agents_md"
    )
    client.put(f"/api/constraints/{entry['id']}", json={"enabled": False})
    active_ids = {item["id"] for item in registry.active_constraints("p-api")}
    assert entry["id"] not in active_ids
    client.put(f"/api/constraints/{entry['id']}", json={"enabled": True})
