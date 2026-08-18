# F003 LLM 提供商层设计文档 — L3 R2 聚焦校验

## 步骤名称
F003 可插拔 LLM 提供商层 — Round 2 修订聚焦校验（Part A-D）

## 执行时间
2026-08-18

## 前置条件
- F011 Agent Runtime 已 Approved（271 行，缺陷链闭合）
- F002 LangGraph 编排引擎已 Approved（225 行，缺陷链闭合）
- F003 R1 修订完成（182 行），L3 全量校验发现 2 项跨文档缺陷（journal 30）
- L1 接受结论，委派 L3 设计编写 Agent R2 修订（journal 31）
- F003 R2 修订完成（187 行，Status: Draft），L1 流程验收通过，委派 L3 聚焦校验

## 执行内容

### 1. 冷启动
按标准引导模板执行冷启动 5 步：
1. AGENTS.md — 项目全貌、硬性规则 13 条、L3 硬约束 8 条
2. progress.txt — 105 条历史进度，关注 F003-review（line 101）、F003-revision-r2（line 103）、F003-r2-review-delegation（line 104）
3. feature_list.json — F001 passing, F011/F002 approved, F003-F010 todo
4. docs/plans/current-sprint.md — Sprint 1 范围（F002/F003/F006）
5. harness-journal/README.md — 开发日志索引 + 最近 3 条 journal（29/30/31）

### 2. 读取校验输入
- Controller Spec: 启动提示词内嵌（Part A-D 四维度聚焦校验）
- 被审文档: docs/design/feature-f003-llm-provider.md（187 行，Status: Draft）
- 参考文档: F011 §5/§9、F002 Node 委派桩规范 + boundaries.md 同步待办、state-design.md、boundaries.md、AGENTS.md 规则 #5

### 3. Part A: R2 缺陷修复验证（2 项）

#### A1. R1-#1 meta 层 vs runtime 层注释
结论: 已修复

逐项验证:
- ✅ line 139 blockquote 注释存在，标注"本示例为 **meta 层简化展示**"
- ✅ 注释说明 runtime 层 LLM 调用应在 L3 Agent 内执行，Node 仅做委派（通过 `agent_runtime.delegate()`）
- ✅ 注释引用 F011 §9（meta 层 vs runtime 层）+ F002 Node 委派桩规范 + AGENTS.md 规则 #5
- ✅ 代码示例本身未修改（lines 141-157 内容与 R1 lines 140-155 一致，仅行号偏移）
- ✅ blockquote 与代码块之间有空行分隔，不影响可读性

#### A2. R1-#2 boundaries.md 同步待办
结论: 已修复

逐项验证:
- ✅ line 181 依赖段 blockquote 跨文档同步待办标注
- ✅ 列出需同步内容: `server/llm/` 目录 + 依赖方向（`nodes → llm → schemas, config`）
- ✅ 格式参照 F002（blockquote `> **跨文档同步待办**:`）一致
- ✅ 未实际修改 boundaries.md（验证: boundaries.md 仍不含 server/llm/ 条目）

### 4. Part B: 修订影响检查（3 项）

#### B1. 内部一致性: 通过
- 全文无其他"Node 直接调用"残留矛盾: line 137 描述 meta 层行为（Node 直接调用），line 139 blockquote 明确标注为 meta 层简化展示并解释 runtime 层差异，两者语境区分清晰不冲突
- 注释与代码示例不冲突: 注释明确"本示例为 meta 层简化展示"，代码示例展示的正是 meta 层接口调用方式，注释为代码提供上下文而非否定代码
- complete_with_state docstring（line 49: "用于 Node 内调用"）描述方法设计目的（服务于 Node 场景），annotation（line 139: "runtime 层由 L3 Agent 内部调用"）描述 runtime 层实际调用者——设计目的与实现细节互补不矛盾

#### B2. 修订记录完整: 通过
- line 187: Round 2 条目存在，格式 `- Round 2（date）：修复描述，详见 journal-path.md`，与 Round 1（line 186）格式一致

#### B3. 行数 ≤ 300: 通过
- wc -l 确认 187 行 ≤ 300 行

### 5. Part C: 修订范围确认（3 项）

#### C1. 修改点清单: 通过
R2 相比 R1（182→187 行）的修改点:
1. line 139: 新增 blockquote meta 层 vs runtime 层说明注释
2. line 181: 新增 blockquote boundaries.md 跨文档同步待办
3. line 187: 新增 Round 2 修订记录
未触及其他章节（代码示例/目标段/非目标段/模块列表/Protocol 定义/OpenAIProvider 要点/工厂函数/验收标准均不变，仅因新增注释导致行号偏移）

#### C2. R1 修复完整性: 通过
3 项原始缺陷修复全部保持完整:
1. "零改动扩展"措辞: line 10 "接口层零改动，实现层需新增 Provider 子类并注册到工厂函数" ✅
2. Token 用量落 State: line 82 token_usage_total [NEW] + line 85 state-design.md 同步待办 + lines 106-125 complete_with_state 累加 + lines 143-149 Node 示例写入 ✅
3. LLMError 统一异常: lines 29-36 类定义 + line 97 工厂 raise + line 104 OpenAI raise + lines 155-156 Node try/except + lines 166-167 验收标准 ✅

#### C3. 无意外修改: 通过
- 未触及目标段（line 10 不变）
- 未触及非目标段（lines 12-16 不变）
- 未触及模块列表（lines 20-27 不变）
- 未触及 Protocol 定义（lines 40-51 不变）
- 未触及 OpenAIProvider 要点（lines 100-104 不变）
- 未触及工厂函数（lines 89-98 不变）
- 未触及验收标准（lines 162-174 不变，仅行号偏移）

### 6. Part D: 跨文档快速复核（4 项）

#### D1. meta 层注释引用的 F011 §9 和 F002 委派桩规范: 通过
- F011 §9（lines 230-242）: 定义 meta 层（L0 手动开会话，当前阶段）vs runtime 层（Agent Runtime 自动派生 L3 Agent，未来目标）
  - F003 line 139 引用"F011 §9 meta 层 vs runtime 层"并说明"Agent Runtime 就绪后，LLM 调用应在 L3 Agent 内执行"——与 F011 §9 runtime 层定义（Agent Runtime 自动派生 L3 Agent）语义对齐 ✅
- F002 Node 委派桩规范（lines 106-123）: "每个 Node 是委派桩/状态转换器，不含业务逻辑"，示例 `agent_runtime.delegate(role=..., controller_spec=...)`
  - F003 line 139 引用"F002 Node 委派桩规范"并说明"Node 仅做委派（通过 `agent_runtime.delegate()` 构造 Controller Spec 调用 L3 Agent）"——与 F002 委派桩规范语义对齐 ✅
- AGENTS.md 规则 #5（line 50）: "LangGraph Node 是委派桩/状态转换器：接收 State → 委派 Agent Runtime 执行 → 返回更新后的 State。Node 本身不含业务逻辑。"
  - F003 line 139 引用"AGENTS.md 规则 #5"——语义对齐 ✅

#### D2. boundaries.md 同步待办格式一致: 通过
- F002 格式（lines 216-217）: `> **跨文档同步待办**: boundaries.md line 15 需从...更新为...`
- F011 格式（line 264）: `- 跨文档同步待办：boundaries.md 第 15 行...需从...更新为...`
- F003 格式（line 181）: `> **跨文档同步待办**: boundaries.md 需在跨文档同步阶段新增 server/llm/ 目录及依赖方向...`
- F003 使用 blockquote `>` 格式与 F002 一致；内容为新增条目（非修改现有行），不引用行号是合理的 ✅

#### D3. HarnessState token_usage_total 字段定义与 F002 不冲突: 通过
- F002 HarnessState（lines 51-58）: 定义 TechStackSpec + max_iterations/current_iteration [NEW]，不含 token_usage_total
- F003 HarnessState（lines 78-82）: 新增 token_usage_total: TokenUsage [NEW]，引用 F002
- 两者字段集无重叠，token_usage_total 为 F003 独有新增，不与 F002 冲突 ✅
- state-design.md 同步待办（line 85）已从 R1 保持完整 ✅

#### D4. LLMError → human_intervention 路径与 F011 §5 逃生口一致: 通过
- F003（lines 155-156）: `except LLMError: return {**state, "human_intervention": True}`
- F011 §5（line 174）: "Agent 审查发现异常模式时设置 human_intervention = True 转入逃生口"
- F011 §6 rule 4（line 194）: "human_intervention = True 触发逃生口：流程暂停，等待人工介入决策"
- F002（lines 162-168）: route_review 检查 `state["human_intervention"]` 路由到 "human_intervention" 节点
- 路径完整: F003 Node 捕获 LLMError → 设 human_intervention=True → F002 route 函数检测 → 路由到逃生口 → F011 §5 interrupt_before 暂停等人工决策 ✅

### 7. 约束遵守
- ✅ 仅做设计文档审阅，不写设计文档、不写代码
- ✅ 未调用任何 skill
- ✅ 未修改被审文档
- ✅ 未修改跨文档（F002/F011/state-design.md/boundaries.md/AGENTS.md）
- ✅ 未修改 sub_id
- ✅ 产出可被独立审查

## 产出物
- 校验报告（纯文本，输出给 L1）
- harness-journal: 32-f003-r2-review.md
- progress.txt: 追加 F003-r2-review 记录

## 验证结果

### Part A: 2/2 已修复
### Part B: 3/3 通过
### Part C: 3/3 通过
### Part D: 4/4 通过
### 新引入缺陷: 无
### 最终结论: 通过 — 可推进 Approved

## 备注
- F003 缺陷链闭合: 初始 Draft(123行) → 3缺陷 → R1(182行) → 全量校验发现2项跨文档缺陷 → R2(187行) → 聚焦校验通过
- R2 修订精准: 仅添加 meta 层注释 + boundaries.md 同步待办 + 修订记录，未触及代码示例和其他章节
- 3 项原始缺陷修复（R1）+ 2 项跨文档缺陷修复（R2）全部保持完整
