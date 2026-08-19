# F006 Round 1 修订 — 校验 Controller Spec

## 角色设计校验 Agent
## 被审文档
docs/design/feature-f006-frontend-ui.md（174 行，Status: Draft）

## 审阅性质
修订版全量校验（非聚焦校验——F006 首次修订后的首次 L3 校验）

## Part A: 3 项缺陷修复验证

### 原缺陷 #1: 缺 DAG 视图（Type 1，回环边画不出）
验证点:
- StageTimeline 已替换为 DAGView 组件（基于 @xyflow/react）
- DAGView 定义为 Type 1 只读渲染
- 支持回环边（反馈循环 observability→coding_agent + DRR 长循环）
- 闸门决策点有视觉表示（菱形或特殊节点）
- 模块列表和页面拆分中 StageTimeline 引用已替换为 DAGView
- 验收标准已更新为"DAG 视图展示 8 阶段 + 回环边 + 闸门决策点"

### 原缺陷 #2: TS HarnessState 漂移（缺 6 个闸门布尔 + 后端字段）
验证点:
- TS HarnessState 接口对齐 F002 修订后字段:
  - tech_stack: TechStackSpec（非旧 TechStack 枚举）
  - max_iterations: number [NEW]
  - current_iteration: number [NEW]
- TS HarnessState 对齐 F003 修订后字段:
  - token_usage_total: TokenUsage [NEW]
  - TokenUsage 接口定义存在
- 旧 TechStack 枚举已删除（grep 确认无残留）
- TechStackSpec 接口定义存在且字段与 F002 一致（frontend/backend/database/llm/frontend_package_manager/backend_package_manager）
- 跨文档同步待办已标注（state-design.md）
- 注意：F002 HITL 改为 interrupt 机制后，前端 TS HarnessState 不再需要 6 个闸门布尔字段——验证文档是否正确处理了这一点（闸门状态由后端 interrupt 机制管理，前端通过轮询获取当前阶段和暂停状态）

### 原缺陷 #3: 实时机制矛盾 + StatusBadge 三色 vs 4 状态
验证点:
- 状态管理段明确"当前轮询 / F007 替换为 SSE"（不再同时声称 SSE 和轮询）
- "实时日志"已改为"日志面板"（LogPanel，去掉"实时"措辞）
- 模块列表、页面拆分、验收标准中 LogPanel 名称一致
- StatusBadge 四色对应四状态（非三色）
  - 验证四状态定义：idle/pending/running/completed（或与 F002 阶段状态对齐的等价定义）
  - 验证四色映射完整

## Part B: 7 维度全量检查

### 维度1: 内部一致性
- DAGView 在模块列表、页面拆分、组件描述、验收标准中引用一致
- TS HarnessState 字段在类型定义和使用处一致
- StatusBadge 四色四状态在设计规范和组件描述中一致
- LogPanel 名称全文统一
- 174 行 ≤ 300 行

### 维度2: 跨文档一致性
- 与 F002 对齐: TS HarnessState 字段集与 F002 Python HarnessState 对齐（tech_stack/max_iterations/current_iteration）
- 与 F003 对齐: token_usage_total + TokenUsage 接口与 F003 一致
- 与 F011 对齐: 闸门决策点展示与 F011 §5 多节点 interrupt_before 拓扑一致
- 与 AGENTS.md 对齐: 技术栈基线（React 19 + TypeScript + Vite 7 + Tailwind CSS + @xyflow/react）一致
- 与 AGENTS.md 规则 #1 对齐: API 调用走相对路径 /api/...（非硬编码域名/IP/localhost）
- 与 AGENTS.md 规则 #3 对齐: 无 as any 和隐式 any
- 与 _bootstrap.md 对齐: 硬约束 8 条无违反
- 与 boundaries.md: 如有新增前端目录需标注同步待办

### 维度3: HITL 落地
- 闸门暂停状态前端可展示（轮询获取 current_stage + 暂停标志）
- 人类"通过/拒绝"决策可通过 API 发送（POST /resume 对齐 F002 ResumeRequest）
- 闸门决策点在 DAGView 中有视觉表示

### 维度4: 循环安全
- DAGView 回环边与 F002 反馈循环 + DRR 长循环对齐
- 前端不直接管理循环预算（只读展示 current_iteration/max_iterations）

### 维度5: Node 定义
- N/A（前端设计文档，不涉及 Node 定义）

### 维度6: 非目标边界
- 非目标 4 项清晰（不实现 SSE/不实现认证/不实现多项目/不实现移动端适配——或文档定义的等价非目标）
- 设计内容均在前端 UI 范围内
- 不越界定义后端行为

### 维度7: 遗漏检查
- WorkBuddy F006 专项 3 项缺陷均已覆盖并修复
- 4 页面（需求输入/流程监控/约束配置/产物管理）组件拆分完整
- API 封装层定义完整
- 验收标准覆盖所有修改点

## 验收标准
1. Part A 3 项缺陷全部验证（已修复/部分修复/未修复）
2. Part B 7 维度全量检查，每维度给出通过/缺陷
3. 新引入缺陷（如有）按级别分类
4. 最终结论: 通过 / 需修订后重审
5. journal 写入正确编号
6. progress 追加记录
