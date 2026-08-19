"""约束管理层 Pydantic schema — F004 设计 §数据契约（条目两类：agents_md 系统规则 / manual 手工规则）。"""

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class ConstraintSource(StrEnum):
    AGENTS_MD = "agents_md"
    MANUAL = "manual"


class RuleType(StrEnum):
    STATIC_TEXT = "static_text"
    FILE_SIZE = "file_size"
    DEPENDENCY_DIRECTION = "dependency_direction"
    PORT_CONSISTENCY = "port_consistency"
    TECH_STACK_ALIGNMENT = "tech_stack_alignment"
    GIT_TRACKING = "git_tracking"
    DOC_FRESHNESS = "doc_freshness"
    TYPE_CHECK = "type_check"
    TEST_COVERAGE = "test_coverage"
    PROCESS_CONVENTION = "process_convention"


class Enforcement(StrEnum):
    MECHANIZED = "mechanized"
    MANUAL_REVIEW = "manual_review"


class ConstraintBase(BaseModel):
    project_id: str = ""
    source: ConstraintSource
    source_key: str = Field(min_length=1, max_length=100)
    rule_no: int = 0
    title: str = Field(min_length=1, max_length=50)
    detail: str = ""
    rule_type: RuleType
    enforcer: str = "manual"
    enforcement: Enforcement
    gate_ids: list[int] = Field(default_factory=list)
    enabled: bool = True


class Constraint(ConstraintBase):
    id: int = 0
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class ConstraintCreate(BaseModel):
    project_id: str = Field(min_length=1)
    title: str = Field(min_length=1, max_length=50)
    detail: str = ""
    rule_type: RuleType
    enforcer: str = "manual"


class ConstraintUpdate(BaseModel):
    title: str | None = None
    detail: str | None = None
    enabled: bool | None = None
