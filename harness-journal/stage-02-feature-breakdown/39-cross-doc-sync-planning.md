# 跨文档同步记录

## 同步背景

Sprint1 四个设计文档（F011/F002/F003/F006）全部 Approved 后，各设计文档修订过程中标注了多处跨文档同步待办。本次同步由 L1 统一执行，将待办逐项落地。

## 同步范围

### 1. state-design.md（来源：F002 + F003 + F006 同步待办）

| 变更项 | 来源 | 修法 |
|---|---|---|
| tech_stack: dict → TechStackSpec | F002 R1 | tech_stack 字段类型改为 TechStackSpec |
| 新增 max_iterations + current_iteration | F002 R1 / F011 §6 | 新增字段，默认值 5 / 初始值 0 |
| 新增 token_usage_total: TokenUsage | F003 R1 | 新增字段 |
| interrupt_before 单节点 → 多节点 | F002 R1 / F011 §5 | ["human_interrupt"] → ["prototype_confirmation","design_approval","acceptance_check"] |
| 阶段编号标注 0-7 | F002 R1 | Graph 拓扑段标注"阶段 0-7（8 阶段）" |
| 熵管理标注横切 | F002 R1 | 阶段8 描述改为"横切关注点" |

### 2. boundaries.md（来源：F002 + F011 + F003 + F006 同步待办）

| 变更项 | 来源 | 修法 |
|---|---|---|
| server/nodes/ "纯函数" → "委派桩/状态转换器" | F011 / F002 | 更新描述 |
| 新增 server/llm/ 目录 + 依赖方向 | F003 | 新增条目 + 依赖方向 nodes → llm → schemas, config |
| 新增前端子目录结构 | F006 | 新增 src/components/ + src/api/ + src/types/ + 依赖方向 |

### 3. harness-flow.md（来源：F002 R1 阶段编号统一）

| 变更项 | 来源 | 修法 |
|---|---|---|
| 阶段编号统一 0-7 | F002 R1 | 阶段8 → 横切标注（不计入线性编号） |
| 熵管理改为横切 | F002 R1 | "阶段8: 熵管理" → "横切: 熵管理（事件驱动）" |

### 4. convention-to-rule-mapping.md（来源：AGENTS.md 规则 #5 修订 + F011）

| 变更项 | 来源 | 修法 |
|---|---|---|
| "LangGraph Node 纯函数" → "委派桩/状态转换器" | AGENTS.md 规则 #5 修订 | 更新行描述 |
| 状态 ⬜ 待机械化 → ⚠️ 人工审查 | F011 Node 委派桩定义 | 更新状态 |
| 新增 harness-journal 沉淀规则行 | L1 越权纠正 | 新增行 |

### 5. AGENTS.md（来源：F011 + 越权纠正）

| 变更项 | 来源 | 修法 |
|---|---|---|
| 规则 #5 "纯函数" → "委派桩/状态转换器" | 已完成 | ✅ |
| L1 职责边界 | 已完成 | ✅ |
| 当前阶段更新 | 已完成 | ✅ |

## 同步原则

- 每个文件修改后检查内部一致性
- 同步完成后由 L3 设计校验 Agent 做跨文档一致性校验
- 同步不修改设计文档本身（F011/F002/F003/F006 已 Approved 不动）
