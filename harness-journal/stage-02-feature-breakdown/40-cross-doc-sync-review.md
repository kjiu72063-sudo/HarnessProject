# 跨文档同步一致性校验

## 步骤名称
L3 设计校验 Agent — 跨文档同步一致性校验（6 维度）

## 执行时间
2026-08-18

## 前置条件
- Sprint1 四个设计文档全部 Approved（F011 + F002 + F003 + F006）
- L1 已执行跨文档同步，更新 state-design.md / boundaries.md / harness-flow.md / convention-to-rule-mapping.md
- journal 39-cross-doc-sync-planning.md 记录同步范围

## 执行内容

### 冷启动
按标准引导模板执行 5 步，重建完整项目认知。

### 校验范围
逐文件检查内部一致性 + 跨文件一致性，覆盖 4 个同步文件和 4 个设计文档。

### 维度1: state-design.md 内部一致性
- TechStackSpec 6 字段齐全（frontend/backend/database/llm/frontend_package_manager/backend_package_manager）✅
- TokenUsage 3 字段齐全（prompt_tokens/completion_tokens/total_tokens）✅
- HarnessState 新增字段与 F011 §6 / F002 / F003 定义对齐 ✅
- Graph 拓扑段与 HarnessState 字段集一致 ✅
- **缺陷: 0**

### 维度2: state-design.md ↔ 四个设计文档对齐
- vs F002: TechStackSpec + max_iterations/current_iteration + interrupt_before 多节点 + 阶段0-7 + 熵管理横切 ✅
- vs F003: token_usage_total: TokenUsage + 3 字段 ✅
- vs F011 §6: 循环预算规则 ✅
- vs F011 §5: interrupt 拓扑 ✅
- vs F006: TS HarnessState 关键字段对齐（TechStackSpec + 循环预算 + TokenUsage），验收标准明确限定对齐范围 ✅
- **缺陷: 0**

### 维度3: boundaries.md 内部一致性
- 前端子目录缺 src/pages/（F006 含 4 个 pages 组件，依赖方向引用 pages）❌
- 依赖方向段仅有后端依赖，缺前端依赖方向 `pages → components, api → types` ❌
- server/llm/ 目录 + 依赖方向与 F003 模块列表对齐 ✅
- Node "委派桩/状态转换器"与 AGENTS.md #5 + F002 + F011 对齐 ✅
- 禁止项"nodes 内含业务逻辑"与委派桩定义一致 ✅
- **缺陷: 1（含 2 子项）**

### 维度4: harness-flow.md 内部一致性
- 阶段编号 0-7 与 F002 对齐 ✅
- 熵管理"横切"与 F002 对齐 ✅
- 6 个菱形闸门与 F011 §5 闸门 actor 分配表一致 ✅
- **缺陷: 0**

### 维度5: convention-to-rule-mapping.md 内部一致性
- "LangGraph Node 委派桩/状态转换器"行与 AGENTS.md #5 对齐 ✅
- ⚠️ 人工审查状态合理 ✅
- "harness-journal 沉淀"行标注 _bootstrap.md 硬约束#1，但实际应为 #3 ❌
- 审计闭环校验不受新增行影响 ✅
- **缺陷: 1**

### 维度6: 跨文档遗漏检查
- 所有设计文档跨文档同步待办逐项落地检查：7/8 完整落地，1 项部分未落地（F006 boundaries.md 待办缺前端依赖方向）❌
- 发现遗漏同步点：AGENTS.md 规则 #5 注释"（待 F011/F002 修订后正式生效...）"过时 ❌
- **缺陷: 2**

## 产出物
- 本 journal 文件
- 校验报告（见下方）

## 验收标准

| # | 标准 | 结果 |
|---|---|---|
| 1 | 6 维度逐项检查完成 | ✅ |
| 2 | 缺陷按级别分类（致命/跨文档/概念） | ✅ |
| 3 | 每项缺陷含位置+描述+修法 | ✅ |
| 4 | 最终结论明确（通过/需修订后重审） | ✅ |
| 5 | 未修改任何文件内容（只做审阅） | ✅ |
| 6 | 未调用 skill 产出内容 | ✅ |

## 问题
4 项缺陷（跨文档 2 + 概念 1 + 跨文档遗漏 1），无致命缺陷。结论：需修订后重审。
