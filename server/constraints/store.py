"""约束条目进程内存储 — 对齐 F002 会话表先例（裁决 F：测试内存实现，不引入 ORM）。"""

from datetime import UTC, datetime

from server.schemas.constraints import Constraint, ConstraintSource, Enforcement, RuleType


def _now() -> datetime:
    return datetime.now(UTC)


class ConstraintStore:
    """dict 主键存储 + 自增 ID；系统规则（project_id=""）与手工规则共用一个 ID 序列。"""

    def __init__(self) -> None:
        self._entries: dict[int, Constraint] = {}
        self._next_id = 1

    def reset(self) -> None:
        self._entries = {}
        self._next_id = 1

    def add(self, entry: Constraint) -> Constraint:
        entry_id = self._next_id
        self._next_id += 1
        now = _now()
        entry.id = entry_id
        entry.created_at = now
        entry.updated_at = now
        self._entries[entry_id] = entry
        return entry

    def get(self, entry_id: int) -> Constraint | None:
        return self._entries.get(entry_id)

    def list_all(self) -> list[Constraint]:
        return sorted(self._entries.values(), key=lambda entry: (entry.rule_no, entry.id))

    def list_for_project(self, project_id: str | None) -> list[Constraint]:
        """合并列表：全局条目（agents_md 系统规则 + manual 边界预设）+ 指定项目的 manual 条目。

        project_id 为 None 时不合并项目条目（仅系统规则）；rule_no 升序、稳定按 id 次序。
        """
        return [
            entry
            for entry in self.list_all()
            if entry.project_id == "" or (project_id is not None and entry.project_id == project_id)
        ]

    def update(
        self,
        entry: Constraint,
        *,
        title: str | None = None,
        detail: str | None = None,
        enabled: bool | None = None,
    ) -> Constraint:
        """对已取出的条目应用字段变更并刷新 updated_at（条目存在性由调用方前置判定）。"""
        if title is not None:
            entry.title = title
        if detail is not None:
            entry.detail = detail
        if enabled is not None:
            entry.enabled = enabled
        entry.updated_at = _now()
        return entry

    def create_manual(
        self,
        project_id: str,
        title: str,
        detail: str,
        rule_type: RuleType,
        enforcer: str,
    ) -> Constraint:
        entry = Constraint(
            project_id=project_id,
            source=ConstraintSource.MANUAL,
            source_key=f"manual-{self._next_id}",
            rule_no=0,
            title=title,
            detail=detail,
            rule_type=rule_type,
            enforcer=enforcer,
            enforcement=Enforcement.MANUAL_REVIEW,
            gate_ids=[],
            enabled=True,
        )
        return self.add(entry)


store = ConstraintStore()
