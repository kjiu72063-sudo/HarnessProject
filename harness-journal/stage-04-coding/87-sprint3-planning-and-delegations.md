# Journal 87: Sprint3 规划裁决落地 + M1 前置微任务委派 + F009 设计委派

- 时间: 2026-08-22T02:19Z（沙箱时钟漂移注记照旧: progress 最新行 2026-08-21T05:45Z, 本批次时钟单调一致）
- 角色: L1 项目管控 Agent（三任, 任期首批次）
- 类型: 规划落地 + 双委派批次（先例: journal 28 收官+规划+委派合一）
- 触发: K总裁决（2026-08-22, 原文口径: "Sprint3 规划优先（F009 先于 F008），N 池仅拆 M1 候选作前置微任务、其余 15 条挂账，F015 维持 backlog 不评估"）

## 一、K总裁决记录

三方向呈报（L1 建议立场, journal 86 §一.4 先例）后 K总全案采纳:

1. **Sprint3 规划优先**: F009 持久化记忆系统先于 F008 熵管理后台任务
2. **M1 候选拆前置微任务**: verify.sh E2E 检测逻辑版本匹配升级（journal 80 §三衍生观察）单独先行; **不占 F 编号**（N 池候选拆出非新功能, 与 F014 有跨文档裁决委派链来源不同; 此口径 L1 记录于 current-sprint.md, K总如要求编号化再补）
3. **N 池其余 15 条挂账**: 留独立统筹批次, 本批次零处置
4. **F015 维持 backlog 不评估**: 触发条件（F004 运行后人工裁决成瓶颈）未成立, 零动作

## 二、Sprint3 规划落地

docs/plans/current-sprint.md 更新: 头部 status → sprint3-started; Sprint3 段由占位改写为: M1 前置微任务（journal 88/89 预留）→ F009（journal 90 起设计链）→ F008 顺序 + N 池挂账 + F015 backlog 注记。

M1 前置的理由记录（供追溯）: verify.sh #15 是 Sprint3 每个编码/验收会话必过闸门, "存在即执行"检测在版本漂移下假执行致全 fail（journal 80 实证）, 先升级检测使后续所有会话的闸门信号可信。

## 三、M1 前置微任务委派（coder 三件套）

- Spec: docs/handbook/controller-specs/verify-e2e-detection-upgrade-coder.md（8 项验收标准）
- launch prompt: docs/handbook/launch-prompts/verify-e2e-detection-upgrade-launch.md
- journal 预留: 88 = coder 执行记录 / 89 = test-reviewer 复审（复审 Spec 于 L1 流程验收批次产出, F014/F012-fix 先例）

关键设计输入（Spec 已载全表, 此处摘要）:

- 检测逻辑现状 verify.sh L260-281（F012 M1 修复后形态）; 版本漂移实证 journal 80 §三
- **verify.sh 当前 299 行 / 闸门 300 行——原函数内扩展必超, Spec 已显式该矛盾并提示抽独立脚本路径（F006 提取子组件同类先例）, 方案裁量归 coder 自报**
- 实现方案约束: 禁止硬编码「依赖版本→build 号」映射表（防复发同类脆弱性）; 版本判定来自本地依赖元数据或运行时自检, 细节 coder 定 + L3 复审
- 跨文档同步范围: testing.md L39/L52; pitfalls.md P009 浏览器形态是否新增由 coder 判断自报; 历史设计文档禁改（N3 先例）

## 四、F009 设计委派（design-writer 三件套）

- Spec: docs/handbook/controller-specs/f009-design-writer.md（8 项验收标准）
- launch prompt: docs/handbook/launch-prompts/f009-design-writer-launch.md
- journal 预留: 90 = design-writer Draft 产出

关键设计输入（Spec 已载全表, 此处摘要）:

- Checkpointer 现状 definition.py L54 MemorySaver; 会话存储 harness.py 双 dict（_sessions + F013 _session_meta）
- settings.py L7 database_url 零消费方事实（F009 首次赋予语义, 处置归设计）
- F007 L135 对 F009 的显式界定（Last-Event-ID 扩展项）——纳入与否列开放问题
- 降级语义（无 PG 环境）为设计必答题——影响所有下游会话
- 4 项开放问题预判已入 Spec（PG 运行形态/回放范围/降级选型/迁移工具）, 以 design-writer 实际产出为准转呈 K总

## 五、journal 编号分配

| 编号 | 用途 |
|---|---|
| 87 | 本批次（规划 + 双委派） |
| 88 | M1 coder 执行记录（预留） |
| 89 | M1 test-reviewer 复审（预留, 复审 Spec 验收批次产出） |
| 90 | F009 design-writer Draft（预留） |

## 六、会话顺序建议（K总定夺）

建议 M1 coder 会话先于 F009 设计会话开启（M1 使 #15 闸门信号可信, F009 设计会话自身也要复跑 verify.sh, journal 80 先例: 设计验收亦受版本漂移干扰）。两套产物均已就绪, K总可自行决定串行或接续。

## 七、状态与提交

- 本批次提交: journal 87 + Spec×2 + launch prompt×2 + current-sprint.md + AGENTS.md + progress.txt + README 索引（9 文件）
- 下一动作: K总派生 M1 coder 会话（粘贴 launch prompt 全文）→ coder 报告 → L1 流程验收（仅四类行）→ 复审委派（journal 89）
