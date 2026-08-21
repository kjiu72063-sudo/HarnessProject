"""F007 SSE 推送测试 — 后端流式断言，对齐设计 §7。"""

import json

from fastapi.testclient import TestClient

from server.main import app
from server.nodes.initializer import BASELINE_TECH_STACK

client = TestClient(app)

TECH_STACK = BASELINE_TECH_STACK.model_dump()


def start_session(project_id="p-sse") -> str:
    response = client.post(
        "/api/harness/start",
        json={
            "project_id": project_id,
            "requirement": "build a todo app",
            "tech_stack": TECH_STACK,
        },
    )
    assert response.status_code == 200
    return response.json()["session_id"]


def walk_to_completion(session_id: str) -> None:
    """走完所有人类闸门让会话到达 completed，触发 done 事件入 queue。"""
    for gate in ["prototype_confirmation", "design_approval", "acceptance_check"]:
        resp = client.post(
            f"/api/harness/{session_id}/resume",
            json={"gate": gate, "decision": True},
        )
        assert resp.status_code == 200


def test_stream_returns_sse_content_type():
    session_id = start_session("p-ct")
    walk_to_completion(session_id)
    with client.stream("GET", f"/api/harness/{session_id}/stream") as response:
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]


def test_stream_first_event_is_snapshot():
    session_id = start_session("p-first")
    walk_to_completion(session_id)
    with client.stream("GET", f"/api/harness/{session_id}/stream") as response:
        lines = list(response.iter_lines())
    first_event = next(ln for ln in lines if ln.startswith("event:"))
    assert first_event == "event: snapshot"


def test_stream_snapshot_contains_session_state():
    session_id = start_session("p-snap")
    walk_to_completion(session_id)
    with client.stream("GET", f"/api/harness/{session_id}/stream") as response:
        body = "".join(response.iter_text())
    assert f'"session_id": "{session_id}"' in body
    assert '"status"' in body
    assert '"state"' in body


def test_stream_emits_done_event():
    session_id = start_session("p-done")
    walk_to_completion(session_id)
    with client.stream("GET", f"/api/harness/{session_id}/stream") as response:
        body = "".join(response.iter_text())
    assert "event: done" in body


def test_stream_404_for_unknown_session():
    with client.stream("GET", "/api/harness/noexist/stream") as response:
        assert response.status_code == 404


def test_stream_has_cache_control_headers():
    session_id = start_session("p-hdr")
    walk_to_completion(session_id)
    with client.stream("GET", f"/api/harness/{session_id}/stream") as response:
        assert "no-cache" in response.headers.get("cache-control", "")
        assert "no" in response.headers.get("x-accel-buffering", "")


def test_sse_event_format_standard():
    """SSE 事件格式: event: <type>\\ndata: <json>\\n\\n"""
    session_id = start_session("p-fmt")
    walk_to_completion(session_id)
    with client.stream("GET", f"/api/harness/{session_id}/stream") as response:
        lines = list(response.iter_lines())
    event_lines = [ln for ln in lines if ln.startswith("event:")]
    data_lines = [ln for ln in lines if ln.startswith("data:")]
    assert len(event_lines) > 0
    assert len(data_lines) > 0
    for dl in data_lines:
        payload_str = dl[len("data: "):]
        json.loads(payload_str)
