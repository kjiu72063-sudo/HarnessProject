"""StateGraph 拓扑、闸门机制、循环路径与横切节点测试。"""

import pytest
from langgraph.types import Command

from server.graph.definition import HUMAN_GATES, build_harness_graph, make_thread_config
from server.nodes.entropy import entropy as entropy_node
from server.nodes.initializer import BASELINE_TECH_STACK
from server.nodes.validation import problem_classification
from server.schemas.harness_state import TechStackSpec, build_initial_state

EXPECTED_NODES = {
    "initializer",
    "information_layer",
    "prototype_confirmation",
    "feature_breakdown",
    "design_approval",
    "coding_agent",
    "validation",
    "problem_classification",
    "merge_deploy",
    "observability",
    "acceptance_check",
    "human_intervention",
    "entropy",
}


def initial_state(**overrides):
    state = build_initial_state(project_id="p1", tech_stack=BASELINE_TECH_STACK)
    for key, value in overrides.items():
        state[key] = value
    return state


@pytest.fixture
def graph():
    return build_harness_graph()


async def _resume(graph, cfg, decision: bool):
    return await graph.ainvoke(Command(resume={"gate_decision": decision}), config=cfg)


def test_graph_builds_with_all_nodes_registered(graph):
    assert set(graph.get_graph().nodes.keys()) >= EXPECTED_NODES


def test_interrupt_before_covers_three_human_gates_and_escape_hatch():
    assert HUMAN_GATES == ["prototype_confirmation", "design_approval", "acceptance_check"]


async def test_full_happy_path_initializer_to_end(graph):
    cfg = make_thread_config("happy")
    result = await graph.ainvoke(initial_state(), config=cfg)
    assert graph.get_state(cfg).next == ("prototype_confirmation",)
    assert result["current_stage"] == "feature_breakdown"

    await _resume(graph, cfg, True)
    assert graph.get_state(cfg).next == ("design_approval",)

    await _resume(graph, cfg, True)
    assert graph.get_state(cfg).next == ("acceptance_check",)

    final = await _resume(graph, cfg, True)
    assert graph.get_state(cfg).next == ()
    assert final["current_stage"] == "completed"
    assert final["tech_stack"].frontend == "react-19"


async def test_prototype_rejection_loops_back_to_information_layer(graph):
    cfg = make_thread_config("proto-reject")
    await graph.ainvoke(initial_state(), config=cfg)
    await _resume(graph, cfg, False)
    assert graph.get_state(cfg).next == ("prototype_confirmation",)


async def test_design_rejection_loops_back_to_information_layer(graph):
    cfg = make_thread_config("design-reject")
    await graph.ainvoke(initial_state(), config=cfg)
    await _resume(graph, cfg, True)
    await _resume(graph, cfg, False)
    assert graph.get_state(cfg).next == ("prototype_confirmation",)


async def test_acceptance_rejection_returns_to_coding_agent(graph):
    cfg = make_thread_config("drr")
    await graph.ainvoke(initial_state(), config=cfg)
    await _resume(graph, cfg, True)
    await _resume(graph, cfg, True)
    result = await _resume(graph, cfg, False)
    assert result["current_iteration"] == 1
    assert graph.get_state(cfg).next == ("acceptance_check",)


async def test_loop_budget_escape_and_abort(graph):
    cfg = make_thread_config("budget")
    await graph.ainvoke(initial_state(current_iteration=6), config=cfg)
    await _resume(graph, cfg, True)
    await _resume(graph, cfg, True)
    await _resume(graph, cfg, False)
    paused = graph.get_state(cfg)
    assert paused.next == ("human_intervention",)
    assert paused.values["human_intervention"] is True

    final = await _resume(graph, cfg, False)
    assert graph.get_state(cfg).next == ()
    assert final["human_intervention"] is True
    assert final["current_iteration"] == 7


async def test_loop_budget_escape_and_continue_resets_iteration(graph):
    cfg = make_thread_config("budget-continue")
    await graph.ainvoke(initial_state(current_iteration=6), config=cfg)
    await _resume(graph, cfg, True)
    await _resume(graph, cfg, True)
    await _resume(graph, cfg, False)
    paused = graph.get_state(cfg)
    assert paused.next == ("human_intervention",)
    assert paused.values["human_intervention"] is True

    final = await _resume(graph, cfg, True)
    assert final["current_iteration"] == 0
    assert final["human_intervention"] is False
    assert final["current_stage"] == "acceptance_check"


async def test_feedback_loop_path_validation_to_coding_agent():
    state = initial_state()
    updates = await problem_classification(state)
    assert updates["current_stage"] == "coding_agent"
    assert updates["issue_resolved"] is False
    assert updates["current_iteration"] == 1


async def test_entropy_registered_but_off_linear_path():
    state = initial_state()
    updates = await entropy_node(state)
    assert updates["feedback_log"][0]["event"] == "entropy"


async def test_initializer_rejects_non_baseline_tech_stack(graph):
    spec = TechStackSpec(
        frontend="vue-3",
        backend="python-3.12",
        database="postgresql",
        llm="openai",
        frontend_package_manager="pnpm",
        backend_package_manager="uv",
    )
    state = build_initial_state(project_id="p1", tech_stack=spec)
    cfg = make_thread_config("bad-stack")
    with pytest.raises(ValueError, match="tech_stack mismatch"):
        await graph.ainvoke(state, config=cfg)
