from fastapi import APIRouter, HTTPException, status

from server.constraints.store import store
from server.schemas.constraints import Constraint, ConstraintCreate, ConstraintSource, ConstraintUpdate

router = APIRouter()


@router.get("/constraints", response_model=list[Constraint])
async def list_constraints(project_id: str = "") -> list[Constraint]:
    """合并列表：全局系统条目（agents_md + 边界预设）+ 指定项目的 manual 条目；省略时仅系统规则。"""
    return store.list_for_project(project_id or None)


@router.post("/constraints", response_model=Constraint, status_code=status.HTTP_201_CREATED)
async def create_constraint(req: ConstraintCreate) -> Constraint:
    """仅创建 manual 条目（source/source_key 服务端生成，enforcement 固定 manual_review）。"""
    return store.create_manual(
        project_id=req.project_id,
        title=req.title,
        detail=req.detail,
        rule_type=req.rule_type,
        enforcer=req.enforcer,
    )


@router.put("/constraints/{entry_id}", response_model=Constraint)
async def update_constraint(entry_id: int, req: ConstraintUpdate) -> Constraint:
    """enabled 全部条目可切换；title/detail 仅 manual 条目可改（agents_md 文本与源一致，见设计裁决 E）。"""
    entry = store.get(entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"constraint {entry_id} not found")
    if entry.source == ConstraintSource.AGENTS_MD and (req.title is not None or req.detail is not None):
        raise HTTPException(
            status_code=403,
            detail="agents_md 条目文本只读（与 AGENTS.md 源一致），仅可切换 enabled",
        )
    return store.update(entry, title=req.title, detail=req.detail, enabled=req.enabled)
