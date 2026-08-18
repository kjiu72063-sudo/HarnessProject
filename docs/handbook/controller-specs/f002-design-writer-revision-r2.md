# Controller Spec: F002 设计文档修订 Round 2

## 基本信息

| 字段 | 值 |
|---|---|
| spec_id | f002-design-writer-revision-r2 |
| feature_id | F002 |
| task_type | design-revision |
| role | design-writer |
| priority | P0 |
| status | ready |

## 目标

修复 L3 校验发现的 6 项缺陷（1 项部分修复 + 5 项新引入），使 F002 通过校验推进 Approved。

## 输入

- 待修订文件: `docs/design/feature-f002-langgraph.md`（199 行，Status: Draft）
- 校验报告: `harness-journal/stage-02-feature-breakdown/18-f002-review.md`
- 参考文档: `docs/design/feature-f011-agent-runtime.md`（已 Approved，特别 §5 §6）

## 缺陷清单与修法

### #1 [概念] DRR 长循环预算检查缺失

**位置**: F002 lines 161-172（循环预算段）
**问题**: 声明"反馈循环和 DRR 长循环共用循环预算"但仅定义 route_feedback_loop，DRR 长循环预算检查路由函数未展示
**修法**: 将 route_feedback_loop 重命名为 route_loop_budget，函数注释说明两个循环共用；或新增 route_drr_loop 函数。验收标准 line 179 要求两个循环都有终止保护
**优先级**: 1（最高）

### #2 [跨文档] state-design.md 同步待办缺失

**位置**: F002 line 40（"与 state-design.md 对齐"声明）
**问题**: state-design.md 仍为旧定义（tech_stack: dict, 无 max_iterations/current_iteration, interrupt_before 单节点），F002 未标注同步待办
**修法**: 在依赖段或数据模型段添加跨文档同步待办标注，列出 state-design.md 需同步的 3 项变更（TechStackSpec / max_iterations+current_iteration / 多节点 interrupt_before）
**优先级**: 4

### #3 [跨文档] boundaries.md 同步待办缺失

**位置**: F002 依赖段（缺失标注）
**问题**: boundaries.md line 15 仍为"纯函数"，F002 定义 Node 为"委派桩"但未标注需同步
**修法**: 在依赖段添加跨文档同步待办标注，引用 F011 line 264 已有标注
**优先级**: 4

### #4 [概念] POST /resume 缺 Pydantic BaseModel + 命名不一致

**位置**: F002 lines 92-94（API 定义）和 lines 138-140（resume_gate 函数）
**问题**: (1) POST /resume 请求体用裸 dict 违反 AGENTS.md 规则 #8; (2) API 参数 "decision" 与 Command key "gate_decision" 命名不一致; (3) API 的 "gate" 参数在 resume_gate 函数中未使用
**修法**: 定义 ResumeRequest(BaseModel) 含 gate: str 和 decision: bool; 对齐 Command key 或明确映射; 说明 gate 参数用途（标识恢复哪个闸门）
**优先级**: 2

### #5 [概念] TechStackSpec 未覆盖 uv

**位置**: F002 lines 43-48（TechStackSpec 定义）
**问题**: AGENTS.md 声明"包管理: 前端 pnpm，后端 uv"，TechStackSpec 仅有一个 package_manager 字段，uv 未被显式表示
**修法**: 拆分为 frontend_package_manager: str = "pnpm" + backend_package_manager: str = "uv"，或改为 package_managers: dict[str, str]
**优先级**: 3

### #6 [跨文档] route_feedback_loop 绕过标志位

**位置**: F002 lines 166-170（route_feedback_loop 函数）
**问题**: F011 §6 规定超限时"设置 human_intervention = True"→标志位触发逃生口（两步机制）；F002 的 route_feedback_loop 直接 return "human_intervention" 跳过标志位设置，与 route_review（检查标志位）的机制不一致
**修法**: route_feedback_loop（或重命名后的 route_loop_budget）应先设置 state["human_intervention"] = True 再返回节点名，与 route_review 机制一致
**优先级**: 5

## 验收标准

1. #1: DRR 长循环预算检查有路由函数或统一函数注明两个循环共用
2. #2: 依赖段或数据模型段有 state-design.md 同步待办标注（3 项变更）
3. #3: 依赖段有 boundaries.md 同步待办标注
4. #4: 定义 ResumeRequest(BaseModel)，gate 和 decision 字段明确，命名对齐
5. #5: TechStackSpec 覆盖 frontend + backend 双包管理器，与 AGENTS.md 基线对齐
6. #6: 循环预算路由函数先设 human_intervention = True 再返回，与 route_review 一致
7. 修订后单文件 ≤ 300 行
8. 添加修订记录追加 Round 2 条目
9. 不修改其他章节（仅触及循环预算段 + API 段 + TechStackSpec 定义 + 依赖段 + 修订记录）
10. 不修改 state-design.md / boundaries.md / AGENTS.md（跨文档同步由 L1 统一执行）

## 禁止项

- 禁止自行调用 skill
- 禁止修改 sub_id
- 禁止修改非缺陷涉及的章节
- 禁止引入新架构概念
- 完成后必须写 harness-journal
- 完成后更新 progress.txt
