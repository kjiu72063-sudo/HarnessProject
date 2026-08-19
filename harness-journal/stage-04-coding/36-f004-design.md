---
date: 2026-08-20
stage: stage-04-coding
seq: 36
author: design-writer（L3，K总会话派生）
type: design-draft
status: closed
related: [journal-35, controller-spec-f004, feature-f004]
---

# F004 约束管理层设计文档产出（design-writer）

## 任务卡

Controller Spec: `docs/handbook/controller-specs/f004-design-writer.md`（K总启动提示词与其一致）。
任务: 编写 F004 约束管理层设计文档（AGENTS.md 解析 + Linter 规则引擎 + 架构约束），
产出 `docs/design/feature-f004-constraint-management.md`（Status: Draft）。
角色边界: 只写设计文档，不写实现代码，不改 server/ 与 src/ 下任何文件。

## 冷启动过程

按启动提示词顺序读取：AGENTS.md → progress.txt → feature_list.json → current-sprint.md
→ harness-journal/README.md → journal 33/34/35（最近 3 条，含 journal 33 L1 边界越界
事故与职责边界判定测试——本会话确认：design-writer 是被委派的 L3 执行 Agent，
产出设计内容是本职，无需自行校验自己的设计质量，交 K 总设计审批闸门）。

Controller Spec 输入文档全部读取：harness-flow.md / state-design.md / boundaries.md /
api-spec.md / feature-f002-langgraph.md / feature-f011-agent-runtime.md /
convention-to-rule-mapping.md / pitfalls.md / verify.sh / _template.md /
ConstraintsPage.tsx（静态原型现状）/ server 现状（routes/models/schemas/graph/nodes/runtime）。

关键现状事实（设计依据）:
- HarnessState 已有 `rules: list[dict]`（恒空）与 `agents_md: str`（恒空），无 constraint 专用字段
- api-spec.md 已预定义 GET/POST/PUT /api/constraints 三端点
- server/models/ 为空——F002 先例为 in-memory 存储，PostgreSQL 持久化属 F009
- verify.sh 已实现 14 项机械闸门；convention-to-rule-mapping.md 有三级状态分类
- ConstraintsPage 三段静态展示（HARNESS_RULES/LINTER_ENGINES/VERIFY_GATES），verify_result 已接会话

## 核心设计决策（7 项裁决，详见设计文档「总体架构」及各节）

| 裁决 | 内容 | 防的风险 |
|---|---|---|
| A 单执行器原则 | 规则引擎只做注册/注入/结果消费，不执行检查；verify.sh 及工具链保持唯一执行器 | 双轨重复、规则漂移（Controller Spec 点名的重点难点） |
| B 不新增 Node | 约束注入内嵌 coding_agent 委派桩，结果消费内嵌 validation/problem_classification | 改动 F002 已 Approved 拓扑 |
| C 不新增 State 字段 | 复用 `rules: list[dict]`；verify_result 仅内部结构扩展（显式标注） | 字段语义重叠（rules vs constraints） |
| D 启动时解析 | lifespan 解析一次 + 进程内缓存，变更重启感知 | 每请求重复 IO；热刷新扩 API 面 |
| E 双源规则模型 | agents_md 条目文本只读+enabled 可切；manual 条目项目隔离全字段可管 | 解析刷新覆盖用户编辑的假象 |
| F in-memory 存储 | 对齐 F002 先例；ORM 模型 F009 落地，不写无消费方占位代码 | 违反 F014「无消费方占位」裁决 |
| G 建议不自动落库 | 规则更新建议止于 feedback_log，人工裁决后手工更新 AGENTS.md | 自动改写破坏权威文档（WorkBuddy 评审结论） |

解析器关键判断: 文本与元数据分离——parser 纯文本抽取（13/13 条目化），
执行元数据（rule_type/enforcement/gate_ids）由 registry 映射表按 source_key 附加，
与 convention-to-rule-mapping.md 逐条对齐。#13 跨文档约定等 5 条标注 manual_review
不参与闸门关联。

## 产出清单

- docs/design/feature-f004-constraint-management.md（Status: Draft, 282 行）
- harness-journal/stage-04-coding/36-f004-design.md（本 journal）
- progress.txt 追加 1 行（design-draft）

## 开放问题（3 项，提交 K 总设计审批时裁决）

1. api-spec.md 是否按本设计细化三端点 schema（含 project_id 可选语义）
2. 规则更新建议是否产品化为独立端点（GET /api/constraints/suggestions，超 F004 范围）
3. agents_md 条目 enabled=false 仅影响注入、不影响闸门执行——语义是否符合预期

## 边界自查

- 未改 server/ 与 src/ 任何文件 ✓（git status 核对）
- 未自执行 skill 产出内容 ✓（skill ≠ agent，F011 基础约束）
- 未修改 sub_id / AGENTS.md 硬性规则 / api-spec.md ✓
- 未引入技术栈基线以外框架 ✓（仅用既有 FastAPI/Pydantic/LangGraph/React）

## 下一步

K 总设计审批（HITL 闸门: Approve → 委派 coder / 修订 → 本 Agent 按修订意见更新 Draft）
→ Approve 后 L1 流程验收 → 委派 coder 实现（按设计文档「实现清单」节 + 验收标准 9 条）。
