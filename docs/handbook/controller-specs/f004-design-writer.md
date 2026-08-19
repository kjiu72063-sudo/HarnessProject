# F004 设计编写 Controller Spec

> 由 L1 项目管控 Agent 产出，用于委派 L3 设计编写 Agent 编写 F004 约束管理层设计文档。

## Controller Spec

```
任务: 编写 F004 约束管理层设计文档 (AGENTS.md 解析 + Linter 规则引擎 + 架构约束)
角色: design-writer
前置条件: F002 passing (编排引擎), 原型确认通过 (约束配置页面), F011 Approved (Agent Runtime)
输入:
  - 功能 ID: F004
  - 参考文档（必须全部读取）:
    - docs/architecture/harness-flow.md (阶段4 编码实现·约束层接入: 上游背压 AGENTS.md+规则文档+boundaries.md→约束注入; 阶段5 文档反馈循环: 更新 AGENTS.md+Linter 规则)
    - docs/architecture/state-design.md (HarnessState 定义, 注意: 当前无 constraint 字段, 设计若需扩展须显式标注新增字段)
    - docs/architecture/boundaries.md (前后端分层边界, 架构约束依据)
    - docs/reference/api-spec.md (约束管理 API 已预定义: GET/POST/PUT /api/constraints)
    - docs/design/feature-f002-*.md 与 docs/design/feature-f011-agent-runtime.md (已 Approved 设计先例, 编码委派桩形态)
    - AGENTS.md (硬性规则 13 条: 本功能要解析的对象本身)
    - docs/conventions/convention-to-rule-mapping.md (约定→机械规则对照, Linter 规则引擎的现实蓝本)
    - docs/conventions/pitfalls.md (P005/P006/P007/P011 等已机械化条目)
    - scripts/verify.sh (现有 14 项闸门, Linter 规则引擎与它的关系必须澄清)
  - 前端现状: src/pages/ConstraintsPage.tsx 已实现为静态原型页 (无 API 接线)
  - 后端现状: server/routes/ 仅 harness.py/projects.py/agent_sessions.py(stub), /api/constraints 无实现
  - 模板: docs/design/_template.md
  - 约束: AGENTS.md 硬性规则, docs/conventions/coding.md
输出: docs/design/feature-f004-constraint-management.md (Status: Draft)
验收标准:
  1. AGENTS.md 解析器设计: 将 AGENTS.md 硬性规则(13条)解析为结构化约束条目的方案 (解析时机/解析产物数据结构/与手工规则的关系须明确)
  2. 约束规则数据模型: DB 模型 + Pydantic schema 完整定义, 对齐 api-spec.md 已预定义的 GET/POST/PUT /api/constraints 三端点 (含 TS 类型, 硬性规则4)
  3. Linter 规则引擎设计: 规则类型分类 (静态文本检查/文件大小/依赖方向/端口一致性等, 参考 convention-to-rule-mapping.md 现实分类), 规则执行时机 (阶段4 约束注入 vs 阶段5 反馈循环), 与 scripts/verify.sh 14 项闸门的关系界定 (复用/调用了 verify.sh 还是独立引擎, 必须明确边界, 避免双轨)
  4. 架构约束设计: 基于 boundaries.md 的分层依赖约束如何进入规则引擎 (与 import-linter/dependency-cruiser 现有配置的关系)
  5. LangGraph Node 形态: 约束相关 Node 必须是委派桩/状态转换器 (硬性规则5), 接收 State→委派 Agent Runtime→返回更新 State; 若需新增 State 字段须与 state-design.md 对齐并显式标注
  6. 前端接线设计: ConstraintsPage.tsx 从静态原型到真实 API 的接线方案 (走相对路径 /api/..., 硬性规则1)
  7. 文档反馈循环闭环: 阶段5 "更新 AGENTS.md + Linter 规则" 的数据流设计 (规则引擎输出→规则库更新→下轮约束注入)
  8. 测试策略: 对齐 docs/conventions/testing.md, 覆盖解析器/规则引擎/API 三层
  9. 设计文档自身遵循 _template.md 结构, 单文件 ≤ 300 行
禁止:
  - 不得自行调用 skill 产出内容 (skill≠agent, F011 约束)
  - 不得跳过 harness-journal 记录 (产出记录写 journal 36)
  - 不得修改 sub_id
  - 不得修改 AGENTS.md 硬性规则
  - 不得在设计中引入 AGENTS.md 技术栈基线以外的框架
  - 不得修改 api-spec.md 预定义的端点路径 (有变更需求→在设计中提出, 记入设计文档"开放问题"段, 由 K总裁决)
```
