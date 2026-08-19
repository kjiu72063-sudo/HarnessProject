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
│   ├── 01-f002-coding-delegation.md    F002 编码委派（L3 coder，journal 02 已预留）
│   ├── 02-f002-coding.md               F002 首轮编码完成（commit e1ba981，coder 自写）
│   ├── 03-f002-acceptance-failed-and-revision-delegation.md  L1 验收不通过（langgraph 依赖声明与 API 不匹配）+ 修订 R1 委派
│   ├── 04-f002-coding-revision-r1.md   F002 修订 R1（coder 自写，编号已预留）
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
