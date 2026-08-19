"""路由函数（conditional edges）单元测试。"""

from server.graph.edges import (
    route_acceptance_check,
    route_design_approval,
    route_human_intervention,
    route_issue_resolved,
    route_loop_budget,
    route_prototype_confirmation,
    route_review,
    route_test_result,
)
from server.schemas.harness_state import build_initial_state


def make_state(**overrides):
    state = build_initial_state(project_id="p1", tech_stack=_spec())
    for key, value in overrides.items():
        state[key] = value
    return state


def _spec():
    from server.nodes.initializer import BASELINE_TECH_STACK

    return BASELINE_TECH_STACK


def test_route_test_result_pass():
    assert route_test_result(make_state(test_result={"pass": True})) == "merge_deploy"


def test_route_test_result_fail():
    assert route_test_result(make_state(test_result={"pass": False})) == "problem_classification"


def test_route_issue_resolved_true():
    state = make_state(issue_resolved=True, current_iteration=1)
    assert route_issue_resolved(state) == "validation"


def test_route_issue_resolved_false_loops_back():
    state = make_state(issue_resolved=False, current_iteration=1)
    assert route_issue_resolved(state) == "coding_agent"


def test_route_issue_resolved_budget_exceeded_escapes():
    state = make_state(issue_resolved=False, current_iteration=6, max_iterations=5)
    assert route_issue_resolved(state) == "human_intervention"


def test_route_review_default_agent():
    assert route_review(make_state(human_intervention=False)) == "observability"


def test_route_review_upgrades_on_suspicious():
    assert route_review(make_state(human_intervention=True)) == "human_intervention"


def test_route_loop_budget_within_budget():
    state = make_state(current_iteration=5, max_iterations=5)
    assert route_loop_budget(state) == "coding_agent"


def test_route_loop_budget_exceeded_uses_strict_greater_than():
    state = make_state(current_iteration=6, max_iterations=5)
    assert route_loop_budget(state) == "human_intervention"


def test_route_prototype_confirmation_approved():
    assert route_prototype_confirmation(make_state(gate_decision=True)) == "feature_breakdown"


def test_route_prototype_confirmation_rejected():
    assert route_prototype_confirmation(make_state(gate_decision=False)) == "information_layer"


def test_route_design_approval_approved():
    assert route_design_approval(make_state(gate_decision=True)) == "coding_agent"


def test_route_design_approval_rejected_loops_to_information_layer():
    assert route_design_approval(make_state(gate_decision=False)) == "information_layer"


def test_route_acceptance_check_passed_ends():
    assert route_acceptance_check(make_state(gate_decision=True)) == "end"


def test_route_acceptance_check_rejected_returns_to_coding():
    state = make_state(gate_decision=False, current_iteration=1)
    assert route_acceptance_check(state) == "coding_agent"


def test_route_acceptance_check_rejected_budget_exceeded():
    state = make_state(gate_decision=False, current_iteration=6, max_iterations=5)
    assert route_acceptance_check(state) == "human_intervention"


def test_route_human_intervention_continue_resets_to_coding():
    assert route_human_intervention(make_state(gate_decision=True)) == "coding_agent"


def test_route_human_intervention_abort_ends():
    assert route_human_intervention(make_state(gate_decision=False)) == "end"
