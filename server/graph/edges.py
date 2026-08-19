"""conditional edge 路由函数 — 2 个自动闸门 + 回环与门后路由。"""

from server.schemas.harness_state import HarnessState


def route_test_result(state: HarnessState) -> str:
    """自动闸门（阶段5）：测试通过 → merge_deploy；失败 → problem_classification。"""
    return "merge_deploy" if state["test_result"]["pass"] else "problem_classification"


def route_issue_resolved(state: HarnessState) -> str:
    """反馈循环出口：问题解决 → validation；未解决 → coding_agent（current_iteration 已 +1）。

    循环预算优先（F011 §6 规则 3）：超限先转 human_intervention，
    由逃生口决定继续（重置计数）或终止。
    """
    if state["current_iteration"] > state["max_iterations"]:
        return "human_intervention"
    return "validation" if state["issue_resolved"] else "coding_agent"


def route_review(state: HarnessState) -> str:
    """审查闸门出口（阶段6，默认 Agent）：human_intervention=True 时升级逃生口。"""
    return "human_intervention" if state["human_intervention"] else "observability"


def route_loop_budget(state: HarnessState) -> str:
    """DRR 长循环路由（阶段7 验收驳回后）：current_iteration > max_iterations → human_intervention。"""
    if state["current_iteration"] > state["max_iterations"]:
        return "human_intervention"
    return "coding_agent"


def route_prototype_confirmation(state: HarnessState) -> str:
    """人类闸门 1 出口：通过 → feature_breakdown；驳回 → information_layer（回环）。"""
    return "feature_breakdown" if state["gate_decision"] else "information_layer"


def route_design_approval(state: HarnessState) -> str:
    """人类闸门 2 出口：通过 → coding_agent；驳回 → information_layer（回环）。"""
    return "coding_agent" if state["gate_decision"] else "information_layer"


def route_acceptance_check(state: HarnessState) -> str:
    """人类闸门 3 出口：通过 → END；驳回 → route_loop_budget 判定。"""
    return "end" if state["gate_decision"] else route_loop_budget(state)


def route_human_intervention(state: HarnessState) -> str:
    """逃生口出口：继续（重置计数）→ coding_agent；放弃 → END。"""
    return "coding_agent" if state["gate_decision"] else "end"
