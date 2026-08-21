"""Harness API 4 端点测试（F002「API 变更」段）。"""

from fastapi.testclient import TestClient

from server.main import app
from server.nodes.initializer import BASELINE_TECH_STACK

client = TestClient(app)

TECH_STACK = BASELINE_TECH_STACK.model_dump()


def start_session(project_id="p-api") -> str:
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


def test_start_returns_session_id_and_running_status():
    data = client.post(
        "/api/harness/start",
        json={
            "project_id": "p-start",
            "requirement": "build a todo app",
            "tech_stack": TECH_STACK,
        },
    ).json()
    assert data["session_id"]
    assert data["status"] == "running"


def test_start_with_baseline_mismatch_returns_422():
    bad_stack = {**TECH_STACK, "frontend": "vue-3"}
    response = client.post(
        "/api/harness/start",
        json={
            "project_id": "p-bad",
            "requirement": "build a todo app",
            "tech_stack": bad_stack,
        },
    )
    assert response.status_code == 422
    assert "tech_stack mismatch" in response.json()["detail"]


def test_state_returns_full_harness_state_snapshot():
    session_id = start_session("p-state")
    response = client.get(f"/api/harness/{session_id}/state")
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == session_id
    assert data["status"] == "interrupted"
    assert data["next"] == ["prototype_confirmation"]
    assert data["state"]["project_id"] == "p-state"
    assert data["state"]["tech_stack"]["frontend"] == "react-19"
    assert data["state"]["max_iterations"] == 5
    assert data["state"]["current_iteration"] == 0


def test_state_unknown_session_returns_404():
    assert client.get("/api/harness/nope/state").status_code == 404


def test_stream_pushes_sse_events():
    session_id = start_session("p-sse")
    for gate in ["prototype_confirmation", "design_approval", "acceptance_check"]:
        client.post(
            f"/api/harness/{session_id}/resume",
            json={"gate": gate, "decision": True},
        )
    with client.stream("GET", f"/api/harness/{session_id}/stream") as response:
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")
        body = "".join(response.iter_text())
    assert "event: snapshot" in body
    assert "event: done" in body


def test_stream_unknown_session_returns_404():
    with client.stream("GET", "/api/harness/nope/stream") as response:
        assert response.status_code == 404


def test_resume_walks_all_gates_to_completion():
    session_id = start_session("p-walk")

    response = client.post(
        f"/api/harness/{session_id}/resume", json={"gate": "prototype_confirmation", "decision": True}
    )
    assert response.status_code == 200
    assert response.json()["next"] == ["design_approval"]

    response = client.post(
        f"/api/harness/{session_id}/resume", json={"gate": "design_approval", "decision": True}
    )
    assert response.json()["next"] == ["acceptance_check"]

    response = client.post(
        f"/api/harness/{session_id}/resume", json={"gate": "acceptance_check", "decision": True}
    )
    data = response.json()
    assert data["status"] == "completed"
    assert data["next"] == []
    assert data["state"]["current_stage"] == "completed"


def test_resume_rejected_gate_increments_iteration_and_returns_to_acceptance():
    """验收驳回 → DRR 长循环：回到 coding_agent 再走到验收门，iteration 递增。"""
    session_id = start_session("p-loop")

    response = client.post(
        f"/api/harness/{session_id}/resume", json={"gate": "prototype_confirmation", "decision": False}
    )
    assert response.json()["next"] == ["prototype_confirmation"]

    client.post(
        f"/api/harness/{session_id}/resume", json={"gate": "prototype_confirmation", "decision": True}
    )
    client.post(
        f"/api/harness/{session_id}/resume", json={"gate": "design_approval", "decision": True}
    )
    before = client.get(f"/api/harness/{session_id}/state").json()["state"]["current_iteration"]
    response = client.post(
        f"/api/harness/{session_id}/resume", json={"gate": "acceptance_check", "decision": False}
    )
    data = response.json()
    assert data["next"] == ["acceptance_check"]
    assert data["state"]["current_iteration"] == before + 1


def test_resume_unknown_gate_returns_422():
    session_id = start_session("p-422")
    response = client.post(
        f"/api/harness/{session_id}/resume", json={"gate": "not_a_gate", "decision": True}
    )
    assert response.status_code == 422


def test_resume_wrong_gate_returns_409():
    session_id = start_session("p-409")
    response = client.post(
        f"/api/harness/{session_id}/resume", json={"gate": "design_approval", "decision": True}
    )
    assert response.status_code == 409


def test_resume_unknown_session_returns_404():
    response = client.post(
        "/api/harness/nope/resume", json={"gate": "design_approval", "decision": True}
    )
    assert response.status_code == 404


def drive_to_escape_hatch(session_id: str) -> None:
    """驱动会话到逃生口：通过双闸门后连续驳回验收 6 次（iteration 6 > max 5）。"""
    client.post(
        f"/api/harness/{session_id}/resume", json={"gate": "prototype_confirmation", "decision": True}
    )
    client.post(
        f"/api/harness/{session_id}/resume", json={"gate": "design_approval", "decision": True}
    )
    for _ in range(6):
        client.post(
            f"/api/harness/{session_id}/resume", json={"gate": "acceptance_check", "decision": False}
        )
    snapshot = client.get(f"/api/harness/{session_id}/state").json()
    assert snapshot["next"] == ["human_intervention"], snapshot["next"]
    assert snapshot["state"]["current_iteration"] == 6
    assert snapshot["state"]["human_intervention"] is True


def test_resume_human_intervention_continue_resets_budget_and_loops():
    """逃生口「继续」：human_intervention 复位 + iteration 归零，回到编码循环再抵验收门。"""
    session_id = start_session("p-continue")
    drive_to_escape_hatch(session_id)

    response = client.post(
        f"/api/harness/{session_id}/resume", json={"gate": "human_intervention", "decision": True}
    )
    data = response.json()
    assert data["next"] == ["acceptance_check"]
    assert data["state"]["human_intervention"] is False
    assert data["state"]["current_iteration"] == 0
    assert data["status"] == "interrupted"


def test_resume_human_intervention_abort_ends_session():
    """逃生口「放弃」：流程终止，status=ended（区别于验收通过的 completed）。"""
    session_id = start_session("p-abort")
    drive_to_escape_hatch(session_id)

    response = client.post(
        f"/api/harness/{session_id}/resume", json={"gate": "human_intervention", "decision": False}
    )
    data = response.json()
    assert data["status"] == "ended"
    assert data["next"] == []
    assert data["state"]["current_stage"] != "completed"


def test_resume_missing_body_returns_422():
    session_id = start_session("p-body")
    response = client.post(f"/api/harness/{session_id}/resume", json={})
    assert response.status_code == 422


def test_start_missing_body_returns_422():
    assert client.post("/api/harness/start", json={}).status_code == 422
