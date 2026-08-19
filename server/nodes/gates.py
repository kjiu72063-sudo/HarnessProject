"""HITL 闸门节点 — 3 个人类闸门 + 循环预算逃生口。

机制（F002/F011 §5）：compile(interrupt_before=[...]) 在闸门前暂停；
闸门节点入口调用 interrupt() 消费 Command(resume={"gate_decision": bool})
恢复载荷，决策写入 State 供后续 conditional edge 路由。
"""

import logging
from typing import Any

from langgraph.types import interrupt

from server.schemas.harness_state import HarnessState

logger = logging.getLogger(__name__)


def _gate_decision(gate: str, payload: Any) -> bool:
    """从 interrupt() 恢复载荷解析 gate_decision（True=通过, False=驳回）。"""
    if isinstance(payload, dict):
        return bool(payload.get("gate_decision", False))
    return bool(payload)


async def prototype_confirmation(state: HarnessState) -> dict[str, Any]:
    """人类闸门 1（阶段1 信息层）：原型确认。"""
    payload = interrupt({"gate": "prototype_confirmation", "stage": state["current_stage"]})
    decision = _gate_decision("prototype_confirmation", payload)
    logger.info("gate prototype_confirmation: %s", "approved" if decision else "rejected")
    return {"gate_decision": decision}


async def design_approval(state: HarnessState) -> dict[str, Any]:
    """人类闸门 2（阶段2 功能拆分）：设计文档审批。"""
    payload = interrupt({"gate": "design_approval", "stage": state["current_stage"]})
    decision = _gate_decision("design_approval", payload)
    logger.info("gate design_approval: %s", "approved" if decision else "rejected")
    return {"gate_decision": decision}


async def acceptance_check(state: HarnessState) -> dict[str, Any]:
    """人类闸门 3（阶段7 可观测性）：验收通过。

    驳回即进入 DRR 长循环（验收失败→修正环境→回到写代码），
    current_iteration += 1（F011 §6 规则 2）；超限时先置
    human_intervention=True 再由路由转逃生口（F011 §6 规则 3）。
    """
    payload = interrupt(
        {
            "gate": "acceptance_check",
            "stage": state["current_stage"],
            "current_iteration": state["current_iteration"],
            "max_iterations": state["max_iterations"],
        }
    )
    decision = _gate_decision("acceptance_check", payload)
    updates: dict[str, Any] = {
        "gate_decision": decision,
        "current_stage": "completed" if decision else "coding_agent",
    }
    if not decision:
        iteration = state["current_iteration"] + 1
        updates["current_iteration"] = iteration
        if iteration > state["max_iterations"]:
            updates["human_intervention"] = True
    logger.info("gate acceptance_check: %s (iteration=%d)", decision, state["current_iteration"])
    return updates


async def human_intervention(state: HarnessState) -> dict[str, Any]:
    """循环预算逃生口（F011 §6 规则 3-5）。

    进入时 state.human_intervention 已由上游超限判定置位。
    decision=True 继续：标志清除 + current_iteration 重置 0（规则 5）→ 回到 coding_agent；
    decision=False 放弃：标志保留（流程终态为人工介入）→ END。
    """
    payload = interrupt(
        {
            "gate": "human_intervention",
            "reason": "loop_budget_exhausted",
            "current_iteration": state["current_iteration"],
            "max_iterations": state["max_iterations"],
        }
    )
    decision = _gate_decision("human_intervention", payload)
    logger.warning(
        "human_intervention: %s (iteration=%d/%d)",
        "continue" if decision else "abort",
        state["current_iteration"],
        state["max_iterations"],
    )
    return {
        "human_intervention": False if decision else True,
        "gate_decision": decision,
        "current_iteration": 0 if decision else state["current_iteration"],
        "feedback_log": [
            *state["feedback_log"],
            {
                "event": "human_intervention",
                "decision": "continue" if decision else "abort",
                "iteration_at_entry": state["current_iteration"],
            },
        ],
    }
