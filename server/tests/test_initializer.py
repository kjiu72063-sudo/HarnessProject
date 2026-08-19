"""initializer 技术栈基线校验测试。"""

import pytest

from server.nodes.initializer import BASELINE_TECH_STACK, initializer, validate_tech_stack
from server.schemas.harness_state import build_initial_state


def baseline_spec():
    return BASELINE_TECH_STACK.model_copy()


def test_validate_accepts_baseline():
    validate_tech_stack(baseline_spec())


def test_validate_normalizes_case_and_space():
    spec = baseline_spec()
    spec.frontend = "  React-19 "
    validate_tech_stack(spec)


def test_validate_rejects_mismatch():
    spec = baseline_spec()
    spec.frontend = "vue-3"
    with pytest.raises(ValueError, match="tech_stack mismatch.*frontend"):
        validate_tech_stack(spec)


def test_validate_rejects_wrong_backend_manager():
    spec = baseline_spec()
    spec.backend_package_manager = "poetry"
    with pytest.raises(ValueError, match="backend_package_manager"):
        validate_tech_stack(spec)


async def test_initializer_node_returns_state_update():
    state = build_initial_state("p1", baseline_spec())
    updates = await initializer(state)
    assert updates == {"current_stage": "information_layer"}


async def test_initializer_node_raises_on_mismatch():
    spec = baseline_spec()
    spec.llm = "claude"
    state = build_initial_state("p1", spec)
    with pytest.raises(ValueError, match="llm"):
        await initializer(state)
