"""F002: Harness 8 阶段 StateGraph 构建。

拓扑（F002 设计文档）：
START → initializer → information_layer → [原型确认] → feature_breakdown
      → [设计审批] → coding_agent → validation → [测试结果] → merge_deploy
      → [审查] → observability → [验收] → END
回环：原型/设计驳回 → information_layer；测试失败 → problem_classification
     → coding_agent（反馈循环）；验收驳回 → coding_agent（DRR 长循环）。
entropy 为事件驱动横切任务：图内注册、不接线性边（触发接线属 F008）。
"""

from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.serde.jsonplus import JsonPlusSerializer
from langgraph.graph import END, START, StateGraph

from server.graph.edges import (
    route_acceptance_check,
    route_design_approval,
    route_human_intervention,
    route_issue_resolved,
    route_prototype_confirmation,
    route_review,
    route_test_result,
)
from server.nodes import (
    coding_agent,
    entropy,
    feature_breakdown,
    information_layer,
    initializer,
    merge_deploy,
    observability,
    validation,
)
from server.nodes.gates import (
    acceptance_check,
    design_approval,
    human_intervention,
    prototype_confirmation,
)
from server.schemas.harness_state import HarnessState

HUMAN_GATES = ["prototype_confirmation", "design_approval", "acceptance_check"]

# State 中的自定义 Pydantic 类型需显式白名单（langgraph checkpoint 反序列化安全门）
_ALLOWED_MSGPACK_MODULES = [
    ("server.schemas.harness_state", "TechStackSpec"),
    ("server.schemas.harness_state", "TokenUsage"),
]


def _make_checkpointer() -> MemorySaver:
    return MemorySaver(serde=JsonPlusSerializer(allowed_msgpack_modules=_ALLOWED_MSGPACK_MODULES))


def _register_nodes(graph: StateGraph) -> None:
    """注册 8 个阶段 Node + 闸门 Node + 横切 entropy。"""
    graph.add_node("initializer", initializer.initializer)
    graph.add_node("information_layer", information_layer.information_layer)
    graph.add_node("prototype_confirmation", prototype_confirmation)
    graph.add_node("feature_breakdown", feature_breakdown.feature_breakdown)
    graph.add_node("design_approval", design_approval)
    graph.add_node("coding_agent", coding_agent.coding_agent)
    graph.add_node("validation", validation.validation)
    graph.add_node("problem_classification", validation.problem_classification)
    graph.add_node("merge_deploy", merge_deploy.merge_deploy)
    graph.add_node("observability", observability.observability)
    graph.add_node("acceptance_check", acceptance_check)
    graph.add_node("human_intervention", human_intervention)
    graph.add_node("entropy", entropy.entropy)


def _wire_design_phase(graph: StateGraph) -> None:
    """上游：START → initializer → 信息层 → 原型确认/设计审批回环 → coding_agent。"""
    graph.add_edge(START, "initializer")
    graph.add_edge("initializer", "information_layer")
    graph.add_edge("information_layer", "prototype_confirmation")
    graph.add_conditional_edges(
        "prototype_confirmation",
        route_prototype_confirmation,
        {"feature_breakdown": "feature_breakdown", "information_layer": "information_layer"},
    )
    graph.add_edge("feature_breakdown", "design_approval")
    graph.add_conditional_edges(
        "design_approval",
        route_design_approval,
        {"coding_agent": "coding_agent", "information_layer": "information_layer"},
    )
    graph.add_edge("coding_agent", "validation")


def _wire_delivery_phase(graph: StateGraph) -> None:
    """下游：测试结果门 → 审查门 → 验收门 → END；反馈循环与预算逃生口。"""
    graph.add_conditional_edges(
        "validation",
        route_test_result,
        {
            "merge_deploy": "merge_deploy",
            "problem_classification": "problem_classification",
        },
    )
    graph.add_conditional_edges(
        "problem_classification",
        route_issue_resolved,
        {
            "validation": "validation",
            "coding_agent": "coding_agent",
            "human_intervention": "human_intervention",
        },
    )
    graph.add_conditional_edges(
        "merge_deploy",
        route_review,
        {"observability": "observability", "human_intervention": "human_intervention"},
    )
    graph.add_edge("observability", "acceptance_check")
    graph.add_conditional_edges(
        "acceptance_check",
        route_acceptance_check,
        {
            "end": END,
            "coding_agent": "coding_agent",
            "human_intervention": "human_intervention",
        },
    )
    graph.add_conditional_edges(
        "human_intervention",
        route_human_intervention,
        {"coding_agent": "coding_agent", "end": END},
    )


def build_harness_graph():
    """构建并编译 Harness StateGraph（interrupt_before + MemorySaver）。"""
    graph = StateGraph(HarnessState)
    _register_nodes(graph)
    _wire_design_phase(graph)
    _wire_delivery_phase(graph)
    return graph.compile(
        checkpointer=_make_checkpointer(),
        interrupt_before=HUMAN_GATES + ["human_intervention"],
    )


def make_thread_config(session_id: str) -> dict:
    """构造 LangGraph thread 配置。"""
    return {"configurable": {"thread_id": session_id}}
