"""阶段5: 自校验与反馈循环 — validation + problem_classification 两个委派桩。

problem_classification 在测试失败后运行（问题分类 + 尝试解决）：
- 未解决（issue_resolved=False）：进入反馈循环，current_iteration += 1（F011 §6 规则 1）
- 已解决（issue_resolved=True）：current_iteration 重置 0（F011 §6 规则 6，per-loop 不累积）

stub 语义：问题分类结果恒为未解决，用于验证循环预算保护。
"""

import logging
from typing import Any

from server.nodes.runtime import agent_runtime, build_controller_spec
from server.schemas.harness_state import HarnessState

logger = logging.getLogger(__name__)


async def validation(state: HarnessState) -> dict[str, Any]:
    """委派桩：委派自校验 Agent 跑测试套件 → 测试结果写入 State。"""
    controller_spec = build_controller_spec(
        state,
        task="自校验：运行完整测试套件 + e2e 验证（不做过早宣布胜利）",
        role="validation",
        outputs=["test_result", "verify_result"],
    )
    result = await agent_runtime.delegate(role="validation", controller_spec=controller_spec)
    return {
        "current_stage": "merge_deploy",
        "test_result": {"pass": True, "summary": result.summary},
        "verify_result": {"pass": True, "summary": result.summary},
    }


async def problem_classification(state: HarnessState) -> dict[str, Any]:
    """委派桩：委派问题分类 Agent（老/新问题 + 查询文档 + 尝试解决）→ 更新 State。"""
    controller_spec = build_controller_spec(
        state,
        task="问题分类（老/新）→ 查询文档 → 尝试解决",
        role="problem_classification",
        outputs=["issue_type", "issue_resolved"],
    )
    result = await agent_runtime.delegate(role="problem_classification", controller_spec=controller_spec)
    issue_resolved = False
    current_iteration = 0 if issue_resolved else state["current_iteration"] + 1
    updates: dict[str, Any] = {
        "current_stage": "coding_agent" if not issue_resolved else "validation",
        "issue_type": "stub:unclassified",
        "issue_resolved": issue_resolved,
        "current_iteration": current_iteration,
    }
    if current_iteration > state["max_iterations"]:
        updates["human_intervention"] = True
    logger.info(
        "problem_classification: iteration=%d resolved=%s (%s)",
        current_iteration,
        issue_resolved,
        result.status,
    )
    return updates
