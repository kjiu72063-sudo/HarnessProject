# Journal: F002 LangGraph 编排引擎编码委派

**时间**: 2026-08-19T04:25Z
**阶段**: stage-04-coding
**类型**: L1 委派
**委派角色**: L3 coder

## 背景

设计审批 HITL 闸门通过（见 stage-03-design-review/01-design-approval-approved.md），进入阶段 4 编码实现。编码阶段任务序列：Task 3a F002 → Task 3b F003 → Task 4 F006 → Task 5 集成验证（每个 Task 一个 L3 coder 会话）。

首个委派为 F002：F003 依赖 F002 的 HarnessState 与 Node 框架，F002 按 Approved 设计用 stub 实现、不依赖 F003。

## Controller Spec 摘要

- 文件: docs/handbook/controller-specs/f002-coder.md
- 输出: server/graph/（definition + edges）、server/nodes/ 8 个委派桩 + runtime stub、server/schemas/harness_state.py、server/routes/harness.py、server/tests/、verify.sh 14 项全通过
- 验收标准: 13 条（StateGraph 全路径可达 / 8 Node 注册 / 6 闸门 / 双循环可达 / 预算 > 运算符 / TechStackSpec 校验 / 4 端点 / 委派桩 mypy strict / 覆盖率 ≥80%）
- 关键禁止: 不实现 F003（LLM 层）、不改 Approved 设计文档、不改跨文档、不破坏现有路由

## 委派说明

- L3 启动提示词: docs/handbook/launch-prompts/f002-coding-launch.md
- K总 操作: 开新对话窗口，把该文件全部内容粘贴进去
- journal 编号分配: L3 coder 自写 journal 使用 **stage-04-coding/02-f002-coding.md**（本 delegation journal 01 由 L1 已物理创建，无编号冲突）

## L1 验收计划（coder 产出回来后）

仅流程检查，不做内容质量判定：
1. 产出文件存在于 Controller Spec 指定路径
2. harness-journal 02-f002-coding.md 已记录
3. progress.txt 已追加
4. verify.sh 14 项全通过（L1 复跑确认）
5. 未违反禁止事项（不改设计文档 / 跨文档 / sub_id / 现有路由）
6. 单文件 ≤ 300 行

L1 流程验收通过后 → 委派 L3 test-reviewer 审查（编码阶段的校验角色），审查通过才推进 feature_list F002 状态。
