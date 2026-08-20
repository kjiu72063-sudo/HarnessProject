# Journal 47 — F005 代码执行沙箱设计 Draft

- 时间: 2026-08-20T10:30Z（本会话时钟；沙箱时钟漂移注记同 P009）
- 会话: F005 design-writer Agent
- actor: design-writer
- 性质: 设计产出 journal

## 1. 冷启动确认

按 Controller Spec 逐项读完 7 份文档：
1. AGENTS.md（全文）——技术栈基线、硬性规则、L1 边界、踩坑索引
2. journal 33——报告纪律：自报证据必须真实，不得转述他人结论冒充已核实
3. docs/design/_template.md——骨架与 Status 流转规则
4. F004 设计——单执行器原则（裁决 A）、不新增 Node（裁决 B）、enabled=false 语义（裁决③）三条既定裁决
5. F003 设计——Protocol + 工厂函数可插拔先例
6. server/nodes/validation.py——阶段 5 委派桩现状（消费方）
7. f005-design-writer Controller Spec——9 项验收标准

## 2. 设计决策记录

| # | 决策点 | 决策 | 理由 |
|---|---|---|---|
| D1 | 执行器抽象方式 | Protocol + 工厂函数（F003 先例） | Docker 可用性受限是最大风险，必须可插拔降级 |
| D2 | 降级链 | 三级：Docker → Local → Disabled | Docker 不可用≠整体不可用；Local 降级有安全代价但可走通；禁用不阻断流程 |
| D3 | 安全隔离 | Docker：五维隔离（资源/网络/FS/命令/超时）；Local：命令白名单+cwd 锁定 | Docker 可达五维；Local 只能做命令+cwd+超时，显式标注降级代价 |
| D4 | 命令白名单 | 正则前缀匹配 AND 非危险模式 | 三类起手（test/build/git）可机械校验；npm 列危险（平台用 pnpm） |
| D5 | 与 F004 零交集 | 显式表格对比 + verify.sh 不在白名单 + TechStackSpec.build_test_commands() 生成产物命令 | 防概念混淆双轨，F004 裁决 A 为不可违背约束 |
| D6 | 不新增 Node | 沙箱经 validation 委派桩消费 | F004 裁决 B 先例，F002 拓扑不变 |
| D7 | State 字段 | 新增 sandbox_result: dict（[NEW]） | 不与 verify_result 重叠，语义清晰 |
| D8 | API 端点 | 单一只读 GET /api/sandbox/status | 执行经委派桩不经 API，只暴露能力状态供前端 |
| D9 | Tier 3 禁用语义 | 不阻断流程（human_intervention=False） | F004 裁决③先例：enabled=false 不影响执行，禁用=降级走 stub |
| D10 | 首版跨语言 | 不含 Java/mvn | 平台栈 Python/Node，mvn 留 F010 |

## 3. 开放问题清单

4 项提交 K总裁决（见设计文档 §开放问题）：
1. 跨语言产物支持范围（建议：首版不含 mvn，留 F010）
2. 沙箱镜像策略（建议：方案 B 按 TechStackSpec 动态选择）
3. 并发执行上限（建议：首版不限）
4. 产物 Artifact 检索（建议：首版不支持）

## 4. 自报歧义

- **α**：`TechStackSpec.build_test_commands()` 方法当前不存在于 F002 HarnessState 定义中。设计假设编码阶段在 TechStackSpec 补入此方法（含默认实现返回空列表），属于跨文档同步范围。若 K总认为此方法归属 F002 范围而非 F005，需调整归属。
- **β**：npm 在白名单与危险模式中同时出现（ALLOWED 匹配 + DANGEROUS 拦截），逻辑上 DANGEROUS 优先，效果是 npm 被拒。这是有意设计（平台栈用 pnpm，npm 视为危险），但表述上可能有歧义。

## 5. 产出清单

- `docs/design/feature-f005-execution-sandbox.md`（Status: Draft, 250 行）
- 本 journal（`harness-journal/stage-04-coding/47-f005-design.md`）
- progress.txt 追加 1 行

## 6. 约束遵守自报

- 文档 ≤ 300 行：250 行 ✅
- 纯文档产出，零代码变更 ✅
- 遵循 _template.md 骨架（Status/目标/非目标/技术方案/验收标准/依赖） ✅
- F004 三条既定裁决未违背 ✅
- F002 拓扑不变 ✅
- 开放问题显式列出 ✅
