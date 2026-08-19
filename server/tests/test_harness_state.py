"""HarnessState / TechStackSpec / 初始状态构造测试。"""

import pytest
from pydantic import ValidationError

from server.schemas.harness_state import (
    HarnessState,
    TechStackSpec,
    TokenUsage,
    build_initial_state,
)


def make_spec() -> TechStackSpec:
    return TechStackSpec(
        frontend="react-19",
        backend="python-3.12",
        database="postgresql",
        llm="openai",
        frontend_package_manager="pnpm",
        backend_package_manager="uv",
    )


def test_tech_stack_spec_requires_all_fields():
    with pytest.raises(ValidationError):
        TechStackSpec(frontend="react-19")


def test_tech_stack_spec_covers_both_package_managers():
    spec = make_spec()
    assert spec.frontend_package_manager == "pnpm"
    assert spec.backend_package_manager == "uv"


def test_token_usage_defaults_zero():
    usage = TokenUsage()
    assert usage.prompt_tokens == 0
    assert usage.completion_tokens == 0
    assert usage.total_tokens == 0


def test_build_initial_state_defaults():
    state = build_initial_state(project_id="p1", tech_stack=make_spec())
    assert isinstance(state, dict)
    assert state["project_id"] == "p1"
    assert state["tech_stack"].frontend == "react-19"
    assert state["max_iterations"] == 5
    assert state["current_iteration"] == 0
    assert state["current_stage"] == "initializer"
    assert state["human_intervention"] is False
    assert state["token_usage_total"].total_tokens == 0
    assert state["feedback_log"] == []
    assert state["issue_resolved"] is False


def test_harness_state_typeddict_annotations_cover_state_design_fields():
    hints = HarnessState.__annotations__
    expected = {
        "project_id",
        "project_name",
        "tech_stack",
        "agents_md",
        "rules",
        "boundaries",
        "progress",
        "feature_list",
        "git_log",
        "design_docs",
        "code_artifacts",
        "worktree_branch",
        "verify_result",
        "test_result",
        "feedback_log",
        "issue_type",
        "issue_resolved",
        "max_iterations",
        "current_iteration",
        "token_usage_total",
        "current_stage",
        "next_feature",
        "human_intervention",
        "gate_decision",
    }
    assert expected == set(hints.keys())
    assert hints["tech_stack"] is TechStackSpec
    assert hints["token_usage_total"] is TokenUsage
