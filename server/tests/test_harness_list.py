"""Harness 会话列表端点测试（F013 设计 §7 五场景）。"""

import pytest
from fastapi.testclient import TestClient

from server.main import app
from server.nodes.initializer import BASELINE_TECH_STACK
from server.routes.harness import _session_meta, _sessions

client = TestClient(app)

TECH_STACK = BASELINE_TECH_STACK.model_dump()


@pytest.fixture(autouse=True)
def _clear_sessions():
    _sessions.clear()
    _session_meta.clear()
    yield
    _sessions.clear()
    _session_meta.clear()


def _start(project_id: str, requirement: str = "build a todo app") -> str:
    response = client.post(
        "/api/harness/start",
        json={
            "project_id": project_id,
            "requirement": requirement,
            "tech_stack": TECH_STACK,
        },
    )
    assert response.status_code == 200
    return response.json()["session_id"]


def test_empty_session_list():
    """场景1: 空会话列表 → sessions=[], total=0, HTTP 200。"""
    response = client.get("/api/harness/sessions")
    assert response.status_code == 200
    data = response.json()
    assert data["sessions"] == []
    assert data["total"] == 0


def test_multi_session_sorted_by_started_at_desc():
    """场景2: 多会话按 started_at 倒序排列。"""
    sid1 = _start("p-sort-1")
    sid2 = _start("p-sort-2")
    data = client.get("/api/harness/sessions").json()
    ids = [item["session_id"] for item in data["sessions"]]
    assert ids.index(sid2) < ids.index(sid1)


def test_field_completeness_and_requirement_truncation():
    """场景3: 每个 item 含 6 字段，requirement_summary ≤ 80 字符。"""
    long_req = "x" * 120
    _start("p-fields", long_req)
    data = client.get("/api/harness/sessions").json()
    assert data["total"] >= 1
    item = data["sessions"][0]
    assert set(item.keys()) == {
        "session_id", "status", "project_id",
        "current_stage", "requirement_summary", "started_at",
    }
    assert len(item["requirement_summary"]) <= 80


def test_started_at_monotonic_increase():
    """场景4: 连续 start 两个会话，后者 started_at > 前者。"""
    _start("p-mono-1")
    _start("p-mono-2")
    data = client.get("/api/harness/sessions").json()
    p1 = [item for item in data["sessions"] if item["project_id"] == "p-mono-1"][0]
    p2 = [item for item in data["sessions"] if item["project_id"] == "p-mono-2"][0]
    assert p2["started_at"] > p1["started_at"]


def test_session_status_mapping():
    """场景5: 启动后 status ∈ {running, interrupted, completed, ended}。"""
    _start("p-status")
    data = client.get("/api/harness/sessions").json()
    assert data["total"] >= 1
    item = next(i for i in data["sessions"] if i["project_id"] == "p-status")
    assert item["status"] in {"running", "interrupted", "completed", "ended"}
