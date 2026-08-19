"""约束注入与消费的节点接线测试（F004 设计 §4：Node 是委派桩，只注册/注入/消费）。"""

from pathlib import Path

from server.constraints import registry
from server.nodes.coding_agent import coding_agent
from server.nodes.initializer import BASELINE_TECH_STACK
from server.nodes.validation import problem_classification, validation
from server.schemas.harness_state import build_initial_state

AGENTS_MD = Path("AGENTS.md").read_text(encoding="utf-8")


def setup_module() -> None:
    registry.initialize(AGENTS_MD)


def teardown_module() -> None:
    registry.initialize(AGENTS_MD)


def make_state(**overrides):
    state = build_initial_state(project_id="p1", tech_stack=BASELINE_TECH_STACK)
    for key, value in overrides.items():
        state[key] = value
    return state


async def test_coding_agent_node_injects_active_constraints():
    update = await coding_agent(make_state())
    constraints = update["rules"]
    assert constraints
    assert all(item["enabled"] for item in constraints)
    assert {"id", "rule_no", "title", "detail"} <= set(constraints[0])


async def test_coding_agent_injection_respects_disabled_rules():
    entry = next(
        item for item in registry.active_constraints("p1")
        if item["source"] == "agents_md"
    )
    from server.constraints.store import store

    store.update(store.get(entry["id"]), enabled=False)
    try:
        update = await coding_agent(make_state())
        injected = update["rules"]
        assert entry["id"] not in {item["id"] for item in injected}
    finally:
        store.update(store.get(entry["id"]), enabled=True)


async def test_validation_node_emits_14_stub_gates():
    update = await validation(make_state(verify_result={"pass": True}))
    gates = update["verify_result"]["gates"]
    assert [gate["gate_id"] for gate in gates] == list(range(1, 15))
    assert all(gate["pass"] is True for gate in gates)
    assert update["verify_result"]["pass"] is True


async def test_problem_classification_node_emits_rule_update_suggestion():
    gates = registry.stub_gate_results()
    gates[6]["pass"] = False
    state = make_state(
        verify_result={"pass": False, "gates": gates},
        current_iteration=2,
        issue_resolved=False,
    )
    update = await problem_classification(state)
    suggestion = update["feedback_log"][0]
    assert suggestion["event"] == "rule_update_suggestion"
    assert suggestion["gate_ids"] == [7]
    assert suggestion["iteration_at_entry"] == 2


async def test_problem_classification_no_suggestion_when_all_gates_pass():
    state = make_state(
        verify_result={"pass": True, "gates": registry.stub_gate_results()},
        current_iteration=1,
        issue_resolved=False,
    )
    update = await problem_classification(state)
    assert "feedback_log" not in update
