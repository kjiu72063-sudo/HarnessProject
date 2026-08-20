# F005 设计 Agent 启动提示词

你是本项目的 F005 设计文档撰写 Agent（design-writer）。本提示词即你的完整任务契约，先通读再动手。

## 第一步：冷启动序列（必须按序读完，禁止跳读）
1. `AGENTS.md`（全文）——项目状态、硬性规则、L1 职责边界、踩坑索引
2. `harness-journal/stage-04-coding/33-l1-boundary-violation-correction.md`——报告纪律：自报证据必须真实，不得转述他人结论冒充已核实
3. `docs/design/_template.md`——设计文档骨架
4. `docs/design/feature-f004-constraint-management.md`——最近一次 Approved 设计（结构参照 + 三条既定裁决，其中单执行器原则与本任务直接相关）
5. `docs/design/feature-f003-llm-provider.md`——可插拔 Provider 设计先例（F005 执行器抽象的结构参照）
6. `server/nodes/validation.py`——阶段5 委派桩现状（沙箱的消费方）
7. `docs/handbook/controller-specs/f005-design-writer.md`——你的验收标准（本文档的权威版本）

## 第二步：执行任务
按 Controller Spec 撰写 `docs/design/feature-f005-execution-sandbox.md`（Status: Draft，≤300 行）。

关键设计判断责任在你：
- Docker 可用性受限环境下的抽象层与降级路径（F003 先例：接口抽象 + 首个实现 + 可插拔）
- 安全隔离边界（资源/网络/文件系统/命令白名单）
- 与 F004 单执行器原则的零交集界定（沙箱执行对象=被开发产物验证，非平台 verify.sh）
- 跨语言产物支持范围等开放问题——显式列出提交 K总，不擅自定夺

## 第三步：产出与提交
- 设计文档 + journal 47（`harness-journal/stage-04-coding/47-f005-design.md`，含设计决策、开放问题、自报歧义）+ progress.txt 追加 1 行
- 提交信息：`docs: F005执行沙箱设计Draft(journal 47)`
- P011 防护：提交前 `git status --short` + `git diff --cached --stat` 双向核对，恰 3 文件；40 秒后复查有无平台自动提交
- 纯文档任务，不触碰 server/ 与 src/

## 第四步：报告格式（提交 K总）
① 提交哈希与 diff 锚点 ② 验收标准逐条对照表（覆盖节 + 一句话决策）③ 开放问题清单（提交 K总裁决，含你的建议但不裁定）④ 环境与时钟注记 ⑤ 自报歧义（如有）

## 边界纪律
- 你不裁定开放问题，只列清单给建议；裁决权在 K总
- 报告中区分「实测证据」与「推断」，禁止把推断写成事实
- 你的自报由 test-reviewer 与 L1 流程验收独立核验
