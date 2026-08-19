"""约束注册表 — 规则元数据映射 + 闸门清单 + 注入/结果消费（设计 §模块边界，单执行器原则）。"""

import logging
from dataclasses import dataclass
from typing import Any

from server.constraints import parser
from server.constraints.store import store
from server.schemas.constraints import Constraint, ConstraintSource, Enforcement, RuleType

logger = logging.getLogger(__name__)

GATE_NAMES: dict[int, str] = {
    1: "TypeScript Check",
    2: "ESLint",
    3: "Vitest",
    4: "Stylelint",
    5: "dependency-cruiser",
    6: "Ruff Lint",
    7: "MyPy",
    8: "import-linter",
    9: "Tests + Coverage",
    10: "Doc Freshness",
    11: "File & Function Size",
    12: "Tech Stack Alignment",
    13: "Git Tracking",
    14: "Port Consistency",
}


@dataclass(frozen=True)
class RuleMetadata:
    """AGENTS.md 条目执行元数据 — 文本外的执行信息由本映射表附加，漂移时人工更新。"""

    title: str
    rule_type: RuleType
    enforcer: str
    enforcement: Enforcement
    gate_ids: tuple[int, ...]


RULE_METADATA: dict[str, RuleMetadata] = {
    "agents-md-rule-1": RuleMetadata("API 相对路径", RuleType.STATIC_TEXT, "eslint no-restricted-syntax", Enforcement.MECHANIZED, (2,)),
    "agents-md-rule-2": RuleMetadata("禁裸 print", RuleType.STATIC_TEXT, "ruff T20 + mypy", Enforcement.MECHANIZED, (6, 7)),
    "agents-md-rule-3": RuleMetadata("禁 as any", RuleType.TYPE_CHECK, "eslint no-explicit-any", Enforcement.MECHANIZED, (1, 2)),
    "agents-md-rule-4": RuleMetadata("API 类型定义", RuleType.PROCESS_CONVENTION, "人工审查（schema+TS 成对）", Enforcement.MANUAL_REVIEW, ()),
    "agents-md-rule-5": RuleMetadata("Node 委派桩", RuleType.DEPENDENCY_DIRECTION, "人工审查（分层由 #8 闸门部分保障）", Enforcement.MANUAL_REVIEW, (8,)),
    "agents-md-rule-6": RuleMetadata("端口固定", RuleType.PORT_CONSISTENCY, "check_port_consistency", Enforcement.MECHANIZED, (14,)),
    "agents-md-rule-7": RuleMetadata("sub_id 不可变", RuleType.PROCESS_CONVENTION, "git-level 约束（变更走 K 总裁决）", Enforcement.MANUAL_REVIEW, ()),
    "agents-md-rule-8": RuleMetadata("Pydantic Body 模型", RuleType.PROCESS_CONVENTION, "人工审查（P003）", Enforcement.MANUAL_REVIEW, ()),
    "agents-md-rule-9": RuleMetadata("Git 追踪", RuleType.GIT_TRACKING, "check_git_tracking", Enforcement.MECHANIZED, (13,)),
    "agents-md-rule-10": RuleMetadata("全闸门通过", RuleType.PROCESS_CONVENTION, "scripts/verify.sh", Enforcement.MECHANIZED, tuple(range(1, 15))),
    "agents-md-rule-11": RuleMetadata("文件/函数行数", RuleType.FILE_SIZE, "eslint max-lines + 闸门 11", Enforcement.MECHANIZED, (2, 11)),
    "agents-md-rule-12": RuleMetadata("技术栈基线一致", RuleType.TECH_STACK_ALIGNMENT, "check_tech_stack_alignment", Enforcement.MECHANIZED, (12,)),
    "agents-md-rule-13": RuleMetadata("规则→执行闭合", RuleType.PROCESS_CONVENTION, "跨文档约定，审计时人工校验", Enforcement.MANUAL_REVIEW, ()),
}

DEFAULT_METADATA = RuleMetadata("未登记规则", RuleType.PROCESS_CONVENTION, "人工审查", Enforcement.MANUAL_REVIEW, ())

BOUNDARY_PRESETS: tuple[dict[str, Any], ...] = (
    {
        "source_key": "boundary-frontend-no-backend-import",
        "title": "前端不直接调后端代码",
        "detail": "src/ 禁止 import server/，前端仅经相对路径 /api/... 调用后端（dependency-cruiser 机械化）",
        "enforcer": "dependency-cruiser",
        "gate_ids": (5,),
    },
    {
        "source_key": "boundary-backend-layering",
        "title": "后端分层依赖约束",
        "detail": "routes 不 import models / nodes 不 import routes（import-linter 2 合约机械化）",
        "enforcer": "import-linter",
        "gate_ids": (8,),
    },
)


def _title_from_text(text: str) -> str:
    if len(text) <= 50:
        return text
    return text[:49] + "…"


def initialize(agents_md_text: str) -> int:
    """重置并装载规则库：解析 AGENTS.md + 附加元数据 + 内置边界预设条目。"""
    store.reset()
    for parsed in parser.parse_agents_md(agents_md_text):
        meta = RULE_METADATA.get(parsed["source_key"])
        if meta is None:
            logger.warning("unregistered rule %s, using default manual_review metadata", parsed["source_key"])
            meta = RuleMetadata(
                title=_title_from_text(parsed["text"]),
                rule_type=DEFAULT_METADATA.rule_type,
                enforcer=DEFAULT_METADATA.enforcer,
                enforcement=DEFAULT_METADATA.enforcement,
                gate_ids=DEFAULT_METADATA.gate_ids,
            )
        store.add(
            Constraint(
                project_id="",
                source=ConstraintSource.AGENTS_MD,
                source_key=parsed["source_key"],
                rule_no=parsed["rule_no"],
                title=meta.title,
                detail=parsed["text"],
                rule_type=meta.rule_type,
                enforcer=meta.enforcer,
                enforcement=meta.enforcement,
                gate_ids=list(meta.gate_ids),
                enabled=True,
            )
        )
    for preset in BOUNDARY_PRESETS:
        store.add(
            Constraint(
                project_id="",
                source=ConstraintSource.MANUAL,
                source_key=preset["source_key"],
                rule_no=0,
                title=preset["title"],
                detail=preset["detail"],
                rule_type=RuleType.DEPENDENCY_DIRECTION,
                enforcer=preset["enforcer"],
                enforcement=Enforcement.MECHANIZED,
                gate_ids=list(preset["gate_ids"]),
                enabled=True,
            )
        )
    return len(store.list_all())


def active_constraints(project_id: str) -> list[dict[str, Any]]:
    """阶段 4 注入用：enabled 条目（全局 agents_md + 全局预设 + 项目 manual），序列化为 list[dict]。"""
    return [
        entry.model_dump(mode="json")
        for entry in store.list_for_project(project_id)
        if entry.enabled
    ]


def stub_gate_results() -> list[dict[str, Any]]:
    """stub 委派下的 14 项闸门结构化占位（全 pass）；真实逐闸门结果由委派的 validation Agent 跑 verify.sh 产出。"""
    return [{"gate_id": gate_id, "name": name, "pass": True} for gate_id, name in GATE_NAMES.items()]


def rule_update_suggestion(verify_result: dict[str, Any], iteration_at_entry: int) -> dict[str, Any] | None:
    """结果消费：失败闸门经 gate_ids 反查命中规则条目 → 规则更新建议（feedback_log 条目，供 K 总人工裁决）。"""
    failed_gate_ids = [gate["gate_id"] for gate in verify_result.get("gates") or [] if not gate["pass"]]
    if not failed_gate_ids:
        return None
    hit_keys = [
        entry.source_key
        for entry in store.list_all()
        if set(entry.gate_ids) & set(failed_gate_ids)
    ]
    return {
        "event": "rule_update_suggestion",
        "gate_ids": failed_gate_ids,
        "suggestion": (
            f"闸门 {failed_gate_ids} 失败，命中规则条目: {', '.join(hit_keys) or '无'}；"
            "请人工裁决是否新增/更新规则（AGENTS.md / convention-to-rule-mapping.md）"
        ),
        "iteration_at_entry": iteration_at_entry,
    }
