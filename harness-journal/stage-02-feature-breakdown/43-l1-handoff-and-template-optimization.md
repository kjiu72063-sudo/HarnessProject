## L1 交接与提示词模板优化

## 执行时间
2026-08-18T22:00Z ~ 2026-08-18T23:00Z

## 前置条件
- 阶段2功能拆分全部完成（4设计文档 Approved + 跨文档同步 L3 校验通过）
- 设计审批 HITL 闸门 pending
- 前任 L1 上下文耗尽，需要创建新管控者

## 执行内容

### 1. 产出新 L1 管控者启动提示词

前任 L1 上下文经过压缩已不纯净。K总要求产出完整的新管控者启动提示词。

产出文件：`docs/handbook/launch-prompts/new-l1-controller-launch.md`（373 行，12 章节）

包含：
- 角色定义（6 件事 + 绝不做清单）
- 冷启动序列（5 步，含 harness-journal 最近 5 条）
- 按需深入知识库（完整导航表，含 4 个已 Approved 设计文档）
- Agent 社会分层架构（L0-L3 + Skill≠Agent + 6 闸门 actor 分配）
- 委派工作流（10 步 + Controller Spec 格式 + L3 提示词生成方法 + Journal 编号管理）
- 验收与持久化（L1 验收检查清单 + L1≠L3 + 状态推进规则）
- 6 条硬约束（含 #6 校验必须委派 L3 + 历史教训）
- L1 工具白名单（6 工具 + 用途限制）
- 当前项目状态速查（已完成阶段 + 设计文档状态 + 当前闸门 + 下一步）
- 7 条关键经验教训（harness-journal 冷启动 / L1 不跳过 L3 / 编号冲突 / Skill≠Agent / 单体反模式 / 跨文档同步 / 修订后重新校验）
- 启动后第一个动作
- 与 K总 的沟通规范

### 2. orchestrator-prompt.md 升级为标准化模板

K总要求检查记忆系统中是否有新管控者提示词模板并优化。

发现：
- `orchestrator-prompt.md` 已存在但内容过时（当前状态仍写"Sprint1设计文档Draft"，硬约束 #4 仍标注"待 F011/F002 修订后正式生效"）
- `new-l1-controller-launch.md` 包含了所有改进但是一次性启动提示词

优化：将 `orchestrator-prompt.md` 升级为**标准化模板**，合并 `new-l1-controller-launch.md` 的全部改进：

新增内容：
- 标题改为"L1 项目管控 Agent 启动提示词模板"
- 顶部使用说明（交接时复制 → 更新当前状态段 → 写入 launch-prompts）
- 冷启动从"最近 3 条"改为"最近 5 条"journal
- 新增第 13 章「L1 交接协议」（6 步交接流程 + 4 项确认清单）
- 经验教训从 7 条扩为 8 条（新增"上下文耗尽时主动交接"）
- 硬约束 #4 更新为"F011/F002 已 Approved，正式生效"
- 设计文档状态更新为全部 Approved
- 闸门 actor 分配表更新（原型确认已通过、设计审批当前待决策）

### 3. Journal 完整性检查

检查范围：本轮对话及之前所有对话的持久化记录完整性。

检查结果：
- journal 01-42 覆盖了阶段2功能拆分全部过程（F011/F002/F003/F006 编写/修订/校验 + 跨文档同步 + L1 越权纠正）
- 遗漏 1：前任 L1 产出新管控者启动提示词（上一轮对话末尾）—— progress.txt 有记录但无 journal → 本条 journal 补记
- 遗漏 2：本轮对话（优化模板 + 检查 journal）—— 本条 journal 记录
- 其余无遗漏

## 产出物

- `docs/handbook/orchestrator-prompt.md`（升级为标准化模板，13 章节）
- `docs/handbook/launch-prompts/new-l1-controller-launch.md`（一次性启动提示词，已存在）
- `harness-journal/stage-02-feature-breakdown/43-l1-handoff-and-template-optimization.md`（本 journal）
- `progress.txt` 更新

## 验证结果

- orchestrator-prompt.md 与 new-l1-controller-launch.md 内容对齐
- 6 条硬约束完整保留（含 #6 历史教训）
- 8 条经验教训覆盖全部历史问题
- 交接协议 6 步流程可执行
- Journal 完整性检查完成，2 项遗漏已补记

## 备注

- orchestrator-prompt.md 现在是**模板**（长期维护），new-l1-controller-launch.md 是**实例**（一次性使用）
- 每次交接时，前任 L1 基于模板生成新实例，更新当前状态段
- 新 L1 启动后读冷启动序列，不依赖对话历史
