# Controller Spec: F003 Round 2 聚焦校验

## 角色
L3 设计校验 Agent

## 任务
聚焦校验 F003 LLM 提供商层设计文档 Round 2 修订版（非全量重审）。

## 被审文档
docs/design/feature-f003-llm-provider.md（187 行，Status: Draft）

## 审阅性质
Round 2 修订校验（聚焦校验，非全量重审）

## 校验维度

### Part A: R2 缺陷修复验证（2 项）

#### A1. R1-#1 meta 层 vs runtime 层注释
验证点：
- [ ] line 139 附近有 blockquote 注释，标注"本示例为 meta 层简化展示"
- [ ] 注释说明 runtime 层 LLM 调用应在 L3 Agent 内执行，Node 仅做委派
- [ ] 注释引用 F011 §9（meta 层 vs runtime 层）和 F002 Node 委派桩规范 + AGENTS.md 规则 #5
- [ ] 代码示例本身未修改（lines 141-157 内容不变）
- [ ] 注释存在不影响代码示例的可读性

#### A2. R1-#2 boundaries.md 同步待办
验证点：
- [ ] 依赖段有 blockquote 跨文档同步待办标注
- [ ] 列出需同步内容：server/llm/ 目录 + 依赖方向（nodes → llm → schemas, config）
- [ ] 格式参照 F002/F011 的同步待办标注
- [ ] 未实际修改 boundaries.md

### Part B: 修订影响检查（3 项）

- B1. 内部一致性：全文无其他"Node 直接调用"残留矛盾；注释与代码示例不冲突
- B2. 修订记录完整：末尾有 Round 2 条目，格式与 Round 1 一致
- B3. 行数 ≤ 300：187 行

### Part C: 修订范围确认（3 项）

- C1. 修改点清单：R2 仅触及注释 + 同步待办 + 修订记录，未触及其他章节
- C2. R1 修复完整性：3 项原始缺陷修复全部保持完整（零改动措辞 / Token 落 State / LLMError 统一异常）
- C3. 无意外修改：未触及目标段/非目标段/模块列表/Protocol 定义/OpenAIProvider 要点/工厂函数/验收标准（除可能因新增注释导致行号偏移）

### Part D: 跨文档快速复核（4 项）

- D1. meta 层注释引用的 F011 §9 和 F002 委派桩规范内容存在且语义对齐
- D2. boundaries.md 同步待办与 F002/F011 的同类待办格式一致
- D3. HarnessState token_usage_total 字段定义与 F002 不冲突
- D4. LLMError → human_intervention 路径与 F011 §5 逃生口一致

## 验收标准
1. Part A 2 项缺陷全部修复验证
2. Part B 3 项修订影响检查通过
3. Part C 3 项修订范围确认通过
4. Part D 4 项跨文档快速复核通过
5. 无新引入缺陷
6. 结论为"通过"或"需修订后重审"+ 缺陷清单

## 禁止项
- 不修改任何设计文档
- 不修改跨文档（F002/F011/state-design.md/boundaries.md/AGENTS.md）
- 不调用 skill
- 不修改 sub_id
