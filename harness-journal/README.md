# Harness Engineering 开发日志

本目录独立于项目源码，专门记录 harness-platform 项目按 Harness Engineering 流程开发的真实过程。每个阶段的每个步骤都有对应文档，记录执行顺序、决策依据、产出物和验证结果。

## 目录结构

```
harness-journal/
├── README.md                          ← 你在这里
├── stage-00-requirement/             ← 阶段0：需求与可行性
│   ├── 01-feasibility-analysis.md       可行性判断
│   ├── 02-feature-design.md            功能设计与原型草图
│   └── 03-architecture-design.md       架构设计与技术方案
├── stage-00-init-agent/              ← 阶段0：初始化 Agent
│   ├── 01-project-structure.md         创建标准项目结构
│   ├── 02-dependency-config.md         初始化依赖配置
│   ├── 03-init-script.md               编写启动脚本
│   ├── 04-progress-file.md             创建进度文件
│   ├── 05-feature-list.md              创建功能列表
│   └── 06-git-init.md                  初始化 Git 仓库
├── stage-01-information-layer/       ← 阶段1：信息层
│   ├── 01-agents-md.md                 编写 AGENTS.md
│   ├── 02-docs-directory.md            创建 docs/ 目录结构
│   ├── 03-architecture-docs.md         编写架构文档
│   ├── 04-pitfalls-knowledge-base.md   踩坑知识库建立
│   ├── 05-prototype-planning.md         原型图开发规划（缺口补齐）
│   ├── 06-prototype-generation.md       原型HTML生成执行
│   └── 07-prototype-confirmation.md     原型确认决策
├── stage-02-constraint-layer/        ← 阶段2：约束层搭建（✅ 已完成）
├── stage-02-feature-breakdown/       ← 阶段2：功能拆分与设计（进行中）
│   ├── 01-design-docs.md               Sprint1 设计文档编写（F002/F003/F006 Draft）
│   ├── 02-agent-society-and-revision-plan.md  Agent 社会架构方案与设计文档修订计划
│   ├── 03-f011-delegation.md           F011 设计编写委派 L3 Agent
│   ├── 04-f011-design.md               F011 设计文档编写（L3 产出）
│   ├── 05-f011-acceptance-and-review-delegation.md  F011 L1验收通过 + 设计校验委派
│   ├── 06-f011-review.md               F011 L3校验Agent审阅（6项缺陷）
│   ├── 07-f011-review-decision-and-revision-delegation.md  L1决策 + 修订委派
│   ├── 08-f011-revision-r1.md          F011 修订 Round 1（6项缺陷修复）
│   ├── 09-f011-approved-and-f002-delegation.md  F011 Approved + F002修订委派
│   ├── 10-l1-scope-violation-correction.md  L1跳过L3校验纠正 + 规则固化
│   ├── 11-f011-re-review-delegation.md  F011修订版补审委派
│   ├── 12-f011-re-review.md             F011 L3补审（6项全修复+1项新缺陷#7）
│   ├── 13-f011-re-review-result-and-r2-delegation.md  回退Draft + Round2委派
│   ├── 14-f011-revision-r2.md          F011 修订 Round 2（缺陷#7修复）
│   ├── 15-f011-r2-review.md            F011 Round2 L3校验通过
│   ├── 16-f011-approved-and-f002-start.md  F011 Approved + F002修订启动
│   ├── 17-f002-revision-r1.md         F002 修订 Round 1（6项致命缺陷修复）
│   ├── 18-f002-review.md              F002 修订 L3校验（6项新引入缺陷，需修订后重审）
│   ├── 19-f002-review-result-and-r2-delegation.md  F002校验结果+R2修订委派
│   ├── 20-f002-revision-r2.md         F002 修订 Round 2（6项缺陷修复，L3产出）
│   ├── 21-f002-r2-review-delegation.md  F002 R2 L1流程验收+校验委派
│   ├── 22-f002-r2-review.md           F002 R2 L3校验（1项新跨文档缺陷，需修订后重审）
│   ├── 23-f002-r2-review-result-and-r3-delegation.md  F002 R2校验结果+R3修订委派
│   ├── 24-f002-revision-r3.md         F002 修订 Round 3（运算符>=→>修复，L3产出）
│   ├── 25-f002-r3-review-delegation.md  F002 R3 L1流程验收+校验委派
│   ├── 26-f002-r3-review.md           F002 R3 L3校验通过（运算符已修复，无新缺陷，可推进Approved）
│   ├── 27-f002-approved-and-f003-delegation.md  F002 Approved + F003修订委派
│   ├── 28-f003-revision-r1.md       F003 修订 Round 1（3项缺陷修复，L3产出）
│   ├── 29-f003-review-delegation.md  F003 R1 L1流程验收+校验委派
│   ├── 30-f003-review.md            F003 R1 L3全量校验（3项修复+2项新跨文档缺陷，需修订后重审）
│   ├── 31-f003-revision-r2.md       F003 修订 Round 2（2项跨文档缺陷修复，L3产出）
│   ├── 32-f003-r2-review.md         F003 R2 L3聚焦校验（通过，F003→Approved）
│   ├── 33-f003-approved-and-f006-delegation.md  F003 Approved + F006修订委派
│   ├── 34-f006-revision-r1.md       F006 修订 Round 1（3项缺陷修复，L3产出）
│   ├── 35-f006-r1-review-delegation.md  F006 R1 L1流程验收+校验委派
│   ├── 36-f006-r1-review-result-and-r2-delegation.md  F006 R1校验5项缺陷+R2修订委派
│   ├── 37-f006-revision-r2.md       F006 修订 Round 2（5项缺陷修复，L3产出）
│   ├── 38-f006-r2-review-delegation.md  F006 R2 L1流程验收+聚焦校验委派
│   ├── 39-cross-doc-sync-planning.md  跨文档同步范围规划（L1执行）
│   ├── 40-cross-doc-sync-review-result-and-r1-fix.md  L3校验3项缺陷+L1修复+重审委派
│   ├── 41-cross-doc-sync-r1-review.md  L3重审通过：跨文档同步正式闭合
│   ├── 42-stage02-complete-and-design-review-gate.md  阶段2完成回顾+设计审批HITL闸门准备
│   └── 43-l1-handoff-and-template-optimization.md  L1交接+orchestrator-prompt升级为模板+journal完整性检查
├── stage-03-design-review/           ← 阶段3：设计审批（✅ 已通过，2026-08-19）
│   └── 01-design-approval-approved.md  K总批准4设计文档+跨文档同步，进入编码
├── stage-04-coding/                  ← 阶段4：编码实现（🔄 进行中）
│   ├── 01-f002-coding-delegation.md    F002 编码委派（L3 coder）
│   ├── 02-f002-coding.md               F002 首轮编码完成（commit e1ba981，coder 自写）
│   ├── 03-f002-acceptance-failed-and-revision-delegation.md  L1 流程验收记录（verify.sh 复跑 10/14；其缺陷判定与修订委派因 L1 越界作废，见 04）
│   ├── 04-l1-boundary-violation-and-test-reviewer-delegation.md  K总纠正L1越界+教训固化+test-reviewer校验委派
│   ├── 05-f002-test-review.md          F002 测试审查（L3 独立校验：需改进后重审，6项问题，2必须修复=依赖声明不自洽+.coverage入库）
│   ├── 06-f002-review-acceptance-and-revision-r2-delegation.md  L1流程验收test-reviewer产出+修订R2委派（#1-#4，#5/#6排期，P009沉淀）
│   ├── 07-f002-coding-revision-r2.md            coder修订R2执行记录（含journal 02三处失实更正段）
│   ├── 08-f002-test-review-r2.md               L3重审R2：#1-#4核心全落地+回归零新缺陷，但uv.lock有1602处aliyun镜像残留（N1必须修复）→需改进后重审
│   ├── 09-f002-r2-acceptance-and-re-review-delegation.md  L1流程验收R2通过(verify.sh 14/14复跑)+重审委派
│   ├── 10-f002-r2-re-review-acceptance-and-revision-r3-delegation.md  R2重审流程验收通过+修订R3委派(N1 lock净化+N2 journal更正, 无代码变更)
│   ├── 11-f002-coding-revision-r3.md            coder修订R3执行记录（N1 lock路径B净化1602处URL→0残留；N2更正journal 07两处失实）
│   ├── 12-f002-test-review-r3.md               L3重审R3：通过（N1净化语义全量验证+官方源artifact实测一致+N2更正准确+路径B决断合理+回归14/14）→ F002审查链收敛，建议推进passing
│   ├── 13-f002-r3-acceptance-and-re-review-delegation.md  L1流程验收R3通过(verify.sh 14/14)+重审委派+范外观察记录
│   ├── 14-f002-passing-and-f003-delegation.md   F002推进passing(审查链05→08→12收敛)+P010/P011沉淀+F003编码委派
│   ├── 15-f003-coding.md               coder F003 编码执行记录（LLMProvider+OpenAI+工厂+5配置+21用例，verify.sh 14/14，openai显式声明lock路径B）
│   ├── 16-f003-test-review.md          L3测试审查：通过（10项标准全过+4决策裁定+lock全量零漂移+回归14/14，0必须修复+1建议journal口径+1项L1裁决带回）→ 建议F003推进passing
│   ├── 17-f003-acceptance-and-test-review-delegation.md  L1流程验收F003通过(14/14复跑)+L1口径更正+审查委派
│   ├── 18-f003-passing-and-f006-delegation.md   F003推进passing(审查链16单轮收敛)+裁决带回入跨文档待办(e)(f)+F006编码委派(前端4页面+15组件+API客户端)
│   ├── 19-f006-coding.md               coder F006 编码执行记录（4页面+DAGView+API客户端，83测试/97.66%行覆盖，verify.sh 14/14，后端环境P009替代法重建）
│   ├── 20-f006-test-review.md          L3 test-reviewer F006 审查通过（13标准全过+7决策全裁合理+0必须修复，建议推进passing）
│   ├── 21-f006-acceptance-and-test-review-delegation.md   L1流程验收通过（49文件白名单合规/verify.sh 14-14复跑/基线勘误教训）+ test-reviewer 审查委派记录
│   ├── 22-f006-passing-and-task5-integration-delegation.md   F006推进passing（审查链20单轮收敛，Sprint1编码全passing）+ Task5集成验证委派记录
│   ├── 23-task5-integration.md          Task5集成验证coder执行记录（双栈启动+端到端主路径走通+契约294断言一致，8标准全过，零缺陷零代码变更，交互验证边界如实声明）
│   ├── 24-task5-integration-review.md   L3 test-reviewer Task5独立审查：通过（6项重点全过，端到端主路径独立走通，契约抽查5组一致，零代码变更核实，verify.sh 14/14，报告质量一致，0必须修复）
│   ├── 25-task5-acceptance-and-test-review-delegation.md   L1流程验收通过（3文档零代码变更/verify.sh 14-14复跑/双栈进程存活探测）+ test-reviewer 审查委派记录
│   └── 26-task5-review-acceptance-sprint1-complete.md   Task5审查验收通过→done + Sprint1收官总结（4任务审查链全景/最终形态提交/S1-I1裁决项/K总最终验收闸门就绪）
│   └── 27-sprint1-final-acceptance-approved.md          K总最终验收通过决策记录（Sprint1全闸门闭环/裁决S1不阻塞/验收后执行清单）
│   └── 28-sprint1-accepted-and-cross-doc-sync.md       跨文档同步批次(a)-(f)执行+Sprint2规划+settings命名裁决+F014清理微任务委派（29预留coder）
│   └── 29-settings-cleanup.md                          F014 settings死配置清理coder执行记录（删2死字段+测试断言同步，verify.sh 14/14，P011新实证2条+3次提交修正时序）
│   └── 30-settings-cleanup-test-review.md              F014 settings死配置清理L3测试审查报告（8标准全过/0必须修复/1建议改进/口径独立裁定可接受/建议推进passing）
│   └── 31-l1-handoff.md                                L1换任交接journal（前任L1任期决策链全景/教训强化/F014进行中状态/新任L1第一件事指引，K总决策换任）
│   └── 32-f014-acceptance-and-test-review-delegation.md   新任L1流程验收F014通过+Spec标准5口径裁定+P011第3条实证(6f8789d)+test-reviewer审查委派（30预留）
│   └── 33-l1-boundary-violation-correction.md       L1越界事故记录与整改（F014验收越界自测被K总纠正；journal 32更正段；边界判定测试+黑名单；委派产物去锚定修订；P012）
│   └── 34-f014-closure.md                           F014闭环（L3审查通过journal 30 + L1流程验收审查报告 + 状态推进passing + P011实证4-6沉淀 + 编号映射再呈K总）
│   └── 35-numbering-ruling-and-sprint2-start.md     功能编号映射裁决落地（K总确认以委派链口径为准, F012=Playwright/F013=API列表/F014=Settings清理）+Sprint2委派循环启动（F004设计Agent优先, 无设计文档按先例先设计后编码）
│   ├── 36-f004-design.md                                F004约束管理层设计Agent产出记录（设计文档282行, 9项标准对照, 3条开放问题）
│   └── 37-f004-design-acceptance.md                     F004设计Draft L1流程验收通过（四类行全过; 开放问题转呈K总; 待设计审批HITL闸门）
│   └── 38-f004-design-approval-and-coder-delegation.md   F004设计审批通过+三条开放问题裁决落地（api-spec回写绑coder/F015 backlog/enabled=false语义）+coder委派三件套（39/40预留）
│   ├── 39-f004-coding-done.md                          F004编码产出（两会话: 前次35f09dc编码+journal正文 / 重复派生会话复验+curl证据补齐+P009替代法附记）
│   └── 41-f004-acceptance-and-test-review-delegation.md F004编码L1流程验收（重复派生场景四类行全过; c670ec3平台提交知悉; 7项歧义移交）+test-reviewer委派（40预留）
│   ├── 40-f004-test-review.md                          F004 L3独立测试审查（10/12 PASS; M1 api-spec缺字段+枚举名错误 / M2 mapping缺裁决③语义; 标准7/8/9补测全过; 7项歧义A-G闭环; 5条建议）
│   └── 42-f004-review-acceptance-and-fix-delegation.md  F004审查报告L1流程验收+M1/M2修复微任务委派（依据100%转写journal 40; 43 coder/44复审预留; 60b18f6平台提交知悉）
│   ├── 43-f004-fix-m1-m2.md                            F004 M1/M2修复coder产出（02830d1恰4文件纯文档; 8标准自报+2歧义α/β备审）
│   └── 45-f004-fix-acceptance-and-review-delegation.md  F004修复L1流程验收（四类行全过; 锚点表述不精确记录; 歧义移交）+复审委派（journal 44预留）
│   ├── 44-f004-fix-m1-m2-review.md                     F004 M1/M2修复复审（8项全PASS+歧义α/β裁定接受; 建议推进passing）
│   └── 46-f004-closure.md                              F004闭环（复审验收四类行全过+P009环境注记+状态推进passing; 全周期journal 36-46）
│   ├── 47-f005-design.md                                F005执行沙箱设计Agent产出（250行, 可插拔执行器+三级降级链+五维安全隔离; 4开放问题+2歧义）
│   ├── 48-f005-design-acceptance.md                     F005设计Draft L1流程验收（四类行全过; 04acfe0平台提交知悉; 开放问题/歧义转呈K总）
│   ├── 49-f005-design-approval-and-coder-delegation.md  F005设计Approved+6项裁决全采纳落地+coder委派三件套（journal编号调整: 50=coder/51=审查）
│   ├── 50-f005-coder-execution.md                       F005编码完成（coder自写: 7模块+8测试文件+跨文档4份, fbc5d0c 32文件）
│   ├── 51-f005-test-review.md                          F005 L3独立测试审查（9PASS+3FAIL: M1 shell替代exec/M2跨文档不一致/M3超时status; 3歧义裁定; 3N留统筹）
│   ├── 52-f005-coding-acceptance-and-review-delegation.md F005编码L1流程验收（四类行全过; be3c61e平台提交知悉P011实证7; 3歧义转呈）+审查委派
│   ├── 53-f005-review-acceptance-and-fix-delegation.md  F005审查L1流程验收（四类行全过; P009新实证.venv中途清除; M/N处置）+M1-M3修复委派（54=coder/55=复审）
│   ├── 54-f005-fix-m1-m3.md                              F005 M1/M2/M3修复完成（coder自写: exec+shlex/文档对齐/timeout契约, 0eb3326 6文件）
│   ├── 55-f005-fix-m1-m3-re-review.md                   F005 M1/M2/M3修复L3复审（8项全PASS+歧义可接受+0M, 建议推进passing）
│   ├── 56-f005-fix-acceptance-and-review-delegation.md  F005修复L1流程验收（四类行全过; 44d6d60平台提交知悉P011实证8; P009变体uv单独清除; 4疑点记录）+复审委派
│   ├── 57-f005-closure.md                               F005闭环passing（journal 47-57全周期; N1-N4留统筹; Sprint2后续F007/F012/F013）
│   ├── 58-f007-design-delegation.md                     F007 SSE推送设计委派（三件套; 59=design-writer预留; stub端点/轮询现状/无F009范围界定入Spec）
│   ├── 59-f007-design-draft.md                          F007设计Draft完成（coder自写: 8事件类型/方案B回调/5场景断线语义, 2e2f529恰3文件, 3开放问题+2歧义）
│   ├── 60-f007-design-acceptance.md                      F007设计Draft L1流程验收（四类行全过; 3开放问题+2歧义转呈K总）
│   ├── 61-f007-design-approval-and-coder-delegation.md  F007设计Approved+5项裁决收口（α替换F007/βstart注入）+coder委派三件套（编号调整: 62=coder/63=审查）
│   ├── 62-f007-coder-execution.md                       F007编码完成（coder自写: 8事件+方案B回调+stream真实化+useSSE改造, 71ac96a 15文件+848/-110）
│   ├── 63-f007-test-review.md                     F007 L3独立测试审查（12标准全PASS/0M/2N/0歧义, 建议推进passing）
│   ├── 64-f007-coding-acceptance-and-review-delegation.md F007编码L1流程验收（四类行全过, 环境完好）+审查委派
│   ├── 65-f007-closure.md                               F007闭环passing（journal 58-65全周期; N池累计11条留统筹; Sprint2余F012/F013）
│   ├── 66-f012-design-delegation.md                     F012 Playwright E2E设计委派（三件套; 67=design-writer预留; 零现状净增量/闸门集成形态/网络受限降级入Spec）
│   ├── 67-f012-design-draft.md                          F012设计Draft完成（coder自写: 9场景/方案C条件闸门/三级网络受限方案, ecdc9d2恰3文件+273行, 4开放问题）
│   ├── 68-f012-design-acceptance.md                      F012设计Draft L1流程验收（四类行全过; 自报哈希笔误ecdc9d2记录; 82cc0af平台提交知悉P011实证10; 4开放问题转呈K总）
│   ├── 69-f012-design-approval-and-coder-delegation.md  F012设计Approved+4项裁决全采纳（方案C/仅Chromium/真实后端/纳基线）+coder委派三件套（70=coder/71=审查）
│   ├── 70-f012-coder-execution.md                       F012编码完成（coder自写: config+4spec+9场景+第15项闸门+跨文档, a73c7dd 18文件+419/-3）
│   ├── 71-f012-test-review.md                            F012 L3独立测试审查（10/12 PASS+2 FAIL: M1 verify.sh检测逻辑三处bug/M2 E2E选择器strict mode violation 10/12; 3N; E2E真实执行10fail/1skip/1pass; 建议修复后重审）
│   ├── 72-f012-coding-acceptance-and-review-delegation.md F012编码L1流程验收（四类行全过, 15/15含#15 skip预期; P011实证11）+审查委派
│   ├── 73-f012-review-acceptance-and-fix-delegation.md  F012审查L1流程验收（四类行全过; b4db473平台提交复刻同名message知悉P011实证12; journal72认知更正段）+M1/M2修复委派（74=coder/75=复审）
│   ├── 74-f012-fix-m1-m2.md                              F012 M1/M2修复完成（coder自写: 检测三修正+选择器限作用域, 221cef3恰6文件+40/-47; journal经4e8208f平台提交落盘P011实证13）
│   ├── 75-f012-fix-m1-m2-review.md                       F012 M1/M2修复复审（8/8 PASS+α可接受+0M+1N, 建议推进passing）
│   ├── 76-f012-fix-acceptance-and-review-delegation.md  F012修复L1流程验收（四类行全过; 4e8208f复刻同名message知悉P011实证13）+复审委派
│   ├── 77-f012-closure.md                               F012闭环passing（journal 66-77全周期含一次修复循环; N池累计15条; Sprint2仅余F013）
│   ├── 78-f013-design-delegation.md                     F013会话列表端点设计委派（三件套; 79=design-writer预留; stub处置/localStorage切换/分页范围入Spec）
│   ├── 79-f013-design-draft.md                          F013设计Draft完成（coder自写: 6字段列表端点/_session_meta方案A/stub删除推荐, d61a9b4恰3文件+280行, 4开放问题+1歧义）
│   ├── 80-f013-design-acceptance.md                      F013设计Draft L1流程验收（四类行全过; P009新形态: 浏览器版本目录漂移1161/1234, 重下载后15/15; N池+1候选）+5项裁决转呈K总
│   ├── 81-f013-design-approval-and-coder-delegation.md  F013设计Approved+5项裁决（stub删/ls移除/无分页/_session_meta/方案A）+coder委派三件套（82=coder/83=审查）
│   ├── 82-f013-coder-execution.md                       F013编码完成（coder自写: sessions端点+stub删除+localStorage移除+E2E R3改API, cd9343b 19文件+388/-180）
│   ├── 83-f013-test-review.md                            F013 L3独立测试审查（12标准全PASS/0M/0N/0歧义, 建议推进passing）
│   ├── 84-f013-coding-acceptance-and-review-delegation.md F013编码L1流程验收（四类行全过; 首轮E2E一次flaky复跑消失15/15; grep模式过宽教训）+审查委派
│   ├── 85-f013-closure-and-sprint2-finale.md           F013闭环passing + Sprint2收官总览（六feature全passing; verify 15项; N池15+1）
│   ├── 86-l1-handover-to-third.md                      L1换任交接（二任→三任: 角色边界/状态快照/决策链全景32-86/P编号速查/委派方法论/冷启动序列）
│   └── 87-sprint3-planning-and-delegations.md          Sprint3规划裁决落地（F009先于F008/M1前置不占F编号/15条挂账/F015维持）+ M1 coder三件套（88/89预留）+ F009设计三件套（90预留）
│   ├── 70-f012-coder-execution.md                       F012编码完成（6新增+7修改+325/-3行, 9场景4spec, verify.sh 15/15 PASS #15 skip+WARN P009降级）
│   └── 54-f005-fix-m1-m3.md                            F005 M1+M2+M3修复coder执行（shell→exec+跨文档对齐+超时status契约, verify.sh 14/14）
│   └── 50-f005-coder-execution.md                      F005编码执行记录（7模块+1路由+1schema+TS镜像+8测试文件71项全过, 覆盖率88.56%, mypy+ruff clean, 6裁决落地, 跨文档4文件同步）
│   └── 44-f004-fix-m1-m2-review.md                       F004 M1/M2修复复审（8项全PASS; 歧义α接受重排/β接受; 建议F004推进passing）
│   └── 40-f004-test-review.md                           F004 L3独立测试审查（12标准10PASS+2FAIL(M1:api-spec字段缺失+枚举名错/M2:convention-mapping缺enabled语义); 设计符合性全PASS; 7歧义裁定/核查; 标准7/8/9内容级独立补测; verify 14/14; 5条建议改进）
│   └── 39-f004-coding-done.md                            F004 coder执行记录（环境表/13项标准对照/4歧义自报/verify 14项全PASS/后端110+前端93测试；40预留test-reviewer）
├── stage-05-validation/              ← 阶段5：自校验与反馈循环（待执行）
├── stage-06-merge-deploy/            ← 阶段6：合并与部署（待执行）
├── stage-07-observability/           ← 阶段7：可观测性验证（待执行）
└── stage-08-entropy/                 ← 阶段8：熵管理（待执行）
```

## 阶段说明

Harness Engineering 流程在本项目中的实际执行顺序与标准 8 阶段的映射关系：

| 实际顺序 | 阶段名称 | 对应 Harness 阶段 | 状态 |
|---------|---------|------------------|------|
| 0 | 需求与可行性 | 前置（文档中未显式定义） | ✅ 已完成 |
| 0 | 初始化 Agent | 阶段0（Anthropic 两阶段模型-初始化） | ✅ 已完成 |
| 1 | 信息层 | 阶段1（信息层） | ✅ 已完成 |
| 2 | 功能拆分与设计 | 阶段2 | ✅ 已完成 |
| 3 | 设计审批 | 阶段2-审批 | ✅ 已完成 |
| 4 | 编码实现 | 阶段4 | 🔄 进行中 |
| 5 | 自校验与反馈循环 | 阶段5 | ⬜ 待执行 |
| 6 | 合并与部署 | 阶段6 | ⬜ 待执行 |
| 7 | 可观测性验证 | 阶段7 | ⬜ 待执行 |
| 8 | 熵管理 | 阶段8 | ⬜ 待执行 |

## 文档规范

每个步骤文档包含以下字段：

```
## 步骤名称
## 执行时间
## 前置条件
## 执行内容
## 产出物
## 验证结果
## 备注
```

## 版本更正记录

stage-00 初始化阶段文档记录了当时的真实决策，部分值后续审计中已更正。**以 AGENTS.md 技术栈基线为准。**

| 原始值 | 更正值 | 变更原因 | 涉及文件 |
|-------|-------|---------|---------|
| React 18 | React 19 | G11（第五轮审计，P008） | stage-00-init-agent/01,02,04; stage-00-requirement/03 |
| Python ≥3.11 | Python ≥3.12 | G11（第五轮审计，P008） | stage-00-requirement/03 |
