# F011 设计编写委派记录

## 步骤名称
F011 Agent Runtime 设计文档 — 委派 L3 设计编写 Agent

## 执行时间
2026-08-17T23:00Z

## 前置条件
- Agent 社会架构方案已由 K总审批通过
- orchestrator-prompt.md 已升级（冷启动加 journal + 禁止自执行 + 委派桩 + 子管控者约束）
- Agent Registry 已创建（docs/handbook/agent-registry.json）
- L3 角色提示词模板已创建（docs/handbook/prompts/ 下 5 个文件）
- 标准引导模板已创建（docs/handbook/prompts/_bootstrap.md）

## 执行内容

### L1 升级 orchestrator-prompt.md
- 冷启动从 4 步扩展为 5 步（新增 harness-journal/README.md → 最近3条）
- 新增"硬约束"段：禁止自执行 skill / 必须写 journal / 子管控者授权约束 / Node 委派桩定义
- 新增 L1 工具白名单（6 个工具）
- Task 3 约束从"Node 必须是纯函数"改为"Node 是委派桩/状态转换器"
- 当前状态更新为 Agent 社会架构方案已审批 → 执行修订序列

### L1 创建 Agent Registry
- docs/handbook/agent-registry.json：5 个角色（project-controller / design-writer / design-reviewer / coder / test-reviewer）
- 每个角色含 level / description / tools / prompt_template / prohibitions

### L1 创建 L3 角色提示词模板
- docs/handbook/prompts/_bootstrap.md：标准引导模板（冷启动5步 + 硬约束7条 + 完成标志）
- docs/handbook/prompts/design-writer.md：设计编写 Agent 模板
- docs/handbook/prompts/design-reviewer.md：设计校验 Agent 模板
- docs/handbook/prompts/coder.md：编码 Agent 模板
- docs/handbook/prompts/test-reviewer.md：测试审查 Agent 模板

### L1 产出 F011 Controller Spec
- docs/handbook/controller-specs/f011-design-writer.md
- 10 条验收标准覆盖 Agent Registry / Controller Spec 格式 / 标准引导模板 / Skill≠Agent / 6闸门actor / 循环预算 / L1工具白名单 / 子管控者vs同级管控者 / meta层vs runtime层 / 单文件≤300行

### L2 生成 L3 完整启动提示词
- docs/handbook/launch-prompts/f011-design-writer-launch.md
- 注入标准引导模板（冷启动5步 + 硬约束7条）
- 填充 F011 Controller Spec 任务上下文
- 包含完成报告格式

## 产出物
1. docs/handbook/orchestrator-prompt.md（升级）
2. docs/handbook/agent-registry.json（新建）
3. docs/handbook/prompts/_bootstrap.md（新建）
4. docs/handbook/prompts/design-writer.md（新建）
5. docs/handbook/prompts/design-reviewer.md（新建）
6. docs/handbook/prompts/coder.md（新建）
7. docs/handbook/prompts/test-reviewer.md（新建）
8. docs/handbook/controller-specs/f011-design-writer.md（新建）
9. docs/handbook/launch-prompts/f011-design-writer-launch.md（新建）

## 验证结果
- orchestrator-prompt.md 冷启动含 harness-journal ✓
- orchestrator-prompt.md 含"禁止自执行 skill"硬约束 ✓
- orchestrator-prompt.md Task 3 约束改为委派桩 ✓
- Agent Registry 5 个角色定义完整 ✓
- 标准引导模板冷启动 5 步 ✓
- F011 Controller Spec 10 条验收标准 ✓
- L3 启动提示词含完整任务上下文 + 标准引导 ✓

## 下一步
- K总使用 f011-design-writer-launch.md 开新对话窗口
- L3 设计编写 Agent 独立编写 F011 设计文档
- L3 产出回 L1 验收
- 验收通过后产出"设计校验"Controller Spec → L3 校验 Agent 独立审阅 F011
