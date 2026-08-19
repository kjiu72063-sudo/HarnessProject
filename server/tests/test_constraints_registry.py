"""约束注册表测试（F004 设计 §5.2 registry：装载/激活过滤/闸门占位/失败反查建议）。"""

from pathlib import Path

from server.constraints import registry
from server.constraints.store import store

AGENTS_MD = Path("AGENTS.md").read_text(encoding="utf-8")


def setup_module() -> None:
    registry.initialize(AGENTS_MD)


def teardown_module() -> None:
    registry.initialize(AGENTS_MD)


def test_initialize_loads_agents_md_rules_and_boundary_presets():
    count = registry.initialize(AGENTS_MD)
    sources = {entry.source for entry in store.list_all()}
    assert sources == {"agents_md", "manual"}
    agents_md = [entry for entry in store.list_all() if entry.source == "agents_md"]
    boundary = [
        entry for entry in store.list_all()
        if entry.source_key.startswith("boundary-")
    ]
    assert len(agents_md) >= 13
    assert len(boundary) == 2
    assert count == len(agents_md) + len(boundary)


def test_rule_metadata_mapping_covers_registered_gate_ids():
    rule_10 = next(
        entry for entry in store.list_all() if entry.source_key == "agents-md-rule-10"
    )
    assert rule_10.gate_ids == list(range(1, 15))
    assert rule_10.enforcement == "mechanized"


def test_active_constraints_filters_disabled_entries():
    entry = store.list_for_project(None)[0]
    store.update(entry, enabled=False)
    active = registry.active_constraints("p-x")
    assert all(item["enabled"] for item in active)
    assert entry.id not in {item["id"] for item in active}


def test_active_constraints_merges_project_manual_entries():
    created = store.create_manual(
        project_id="p-merge",
        title="项目级规则",
        detail="仅 p-merge 可见",
        rule_type="process_convention",
        enforcer="manual",
    )
    active = registry.active_constraints("p-merge")
    assert created.id in {item["id"] for item in active}
    other = registry.active_constraints("p-other")
    assert created.id not in {item["id"] for item in other}


def test_stub_gate_results_covers_14_gates_all_pass():
    gates = registry.stub_gate_results()
    assert [gate["gate_id"] for gate in gates] == list(range(1, 15))
    assert all(gate["pass"] is True for gate in gates)
    assert gates[0]["name"] == registry.GATE_NAMES[1]


def test_rule_update_suggestion_maps_failed_gates_to_rules():
    verify_result = {"pass": False, "gates": registry.stub_gate_results()}
    verify_result["gates"][5]["pass"] = False
    suggestion = registry.rule_update_suggestion(verify_result, iteration_at_entry=2)
    assert suggestion is not None
    assert suggestion["event"] == "rule_update_suggestion"
    assert suggestion["gate_ids"] == [6]
    assert suggestion["iteration_at_entry"] == 2
    assert "agents-md-rule-2" in suggestion["suggestion"]


def test_rule_update_suggestion_none_when_all_gates_pass():
    assert registry.rule_update_suggestion({"gates": registry.stub_gate_results()}, 1) is None


def test_rule_update_suggestion_handles_missing_gates():
    assert registry.rule_update_suggestion({}, 1) is None
