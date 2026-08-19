"""HarnessState 定义 — 对齐 docs/architecture/state-design.md 与 F002/F011 设计文档。"""

from typing import TypedDict

from pydantic import BaseModel, Field


class TechStackSpec(BaseModel):
    """技术栈规格（F002）：覆盖前后端双包管理器，与 AGENTS.md 技术栈基线对齐。"""

    frontend: str = Field(description="如 react-19")
    backend: str = Field(description="如 python-3.12")
    database: str = Field(description="如 postgresql")
    llm: str = Field(description="如 openai")
    frontend_package_manager: str = Field(description="如 pnpm")
    backend_package_manager: str = Field(description="如 uv")


class TokenUsage(BaseModel):
    """LLM token 用量（F003 定义，F002 先占位默认值）。"""

    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


class HarnessState(TypedDict):
    """LangGraph 全局状态，字段与 state-design.md 完全对齐。

    gate_decision 为实现补充字段：人类闸门 interrupt() 恢复载荷的落点，
    供闸门后的 conditional edge 路由读取（state-design.md 未显式列出，
    见 harness-journal/stage-04-coding/02-f002-coding.md）。
    """

    # 项目信息
    project_id: str
    project_name: str
    tech_stack: TechStackSpec

    # 上下文层
    agents_md: str
    rules: list[dict]
    boundaries: str

    # 持久化记忆
    progress: str
    feature_list: list[dict]
    git_log: str

    # 设计文档
    design_docs: list[dict]

    # 编码产物
    code_artifacts: list[dict]
    worktree_branch: str

    # 校验结果
    verify_result: dict
    test_result: dict

    # 反馈循环
    feedback_log: list[dict]
    issue_type: str | None
    issue_resolved: bool

    # 循环预算（F011 §6）
    max_iterations: int  # 默认 5
    current_iteration: int  # 初始 0，per-loop 重置

    # LLM 用量（F003）
    token_usage_total: TokenUsage

    # 流程控制
    current_stage: str
    next_feature: str | None
    human_intervention: bool

    # 闸门决策（人类闸门 resume 载荷落点）
    gate_decision: bool


def build_initial_state(project_id: str, tech_stack: TechStackSpec, project_name: str = "") -> HarnessState:
    """按 state-design.md 构造初始 HarnessState。"""
    return HarnessState(
        project_id=project_id,
        project_name=project_name,
        tech_stack=tech_stack,
        agents_md="",
        rules=[],
        boundaries="",
        progress="",
        feature_list=[],
        git_log="",
        design_docs=[],
        code_artifacts=[],
        worktree_branch="",
        verify_result={},
        test_result={},
        feedback_log=[],
        issue_type=None,
        issue_resolved=False,
        max_iterations=5,
        current_iteration=0,
        token_usage_total=TokenUsage(),
        current_stage="initializer",
        next_feature=None,
        human_intervention=False,
        gate_decision=False,
    )
