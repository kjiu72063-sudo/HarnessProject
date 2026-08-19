last_updated: 2026-08-18
status: active
owner: @K总

# 约定 → 机械规则对照表

PDF 原文: "经验法则:如果一条规则在 Code Review 中被提过 3 次以上,就应该写成 Linter 规则。"

## 状态分类（根因修复：消除"✅ 已配置"歧义）

| 状态 | 含义 | 条件 |
|---|---|---|
| ✅ 已机械化 | verify.sh 闸门或工具安装时强制执行 | 规则→工具→闸门 完整链路 |
| ⚠️ 人工审查 | 仅文档约束，依赖 Code Review | 可机械化但复杂度高或触发次数 < 3 |
| ⬜ 待机械化 | 应机械化但未实现 | 流程未到或工具不支持 |

| 团队口头约定 | 机械化规则 | 实现方式 | 状态 | AGENTS.md |
|---|---|---|---|---|
| 前端不直接调后端代码 | src/ 禁止 import server/ | dependency-cruiser → verify.sh #5 | ✅ 已机械化 | #1 |
| 前端不硬编码域名/IP | 禁止 localhost/IP/域名 | ESLint no-restricted-syntax → verify.sh #2 | ✅ 已机械化 | #1 |
| routes 不直接操作数据库 | routes 禁止 import models | import-linter + 三要素 → verify.sh #8 | ✅ 已机械化 | #8 |
| Node 不操作 HTTP 响应 | nodes 禁止 import routes | import-linter + 三要素 → verify.sh #8 | ✅ 已机械化 | #8 |
| 禁止循环依赖 | 模块间循环依赖 | dep-cruiser + ESLint → verify.sh #2+#5 | ✅ 已机械化 | — |
| 后端禁裸 print() | ruff T201 规则族 | ruff T20 → verify.sh #6 | ✅ 已机械化 | #2 |
| 前端禁 as any | no-explicit-any | ESLint recommended → verify.sh #2 | ✅ 已机械化 | #3 |
| POST 用 Pydantic Body | 路由参数必须 Pydantic Body | 文档约束 [P003] | ⚠️ 人工审查 | #8 |
| API 必须有类型定义 | Pydantic schema + TS 类型 | FastAPI 自动校验 + mypy | ⚠️ 人工审查 | #4 |
| LangGraph Node 委派桩/状态转换器 | Node 不含业务逻辑，通过 Agent Runtime 委派 L3 Agent | 文档约束 (F011/F002) | ⚠️ 人工审查 | #5 |
| harness-journal 沉淀 | 每次交互/开发任务必须写 harness-journal | 文档约束 (_bootstrap.md 硬约束#3) | ⚠️ 人工审查 | — |
| 测试覆盖率 ≥ 80% | --cov-fail-under=80 | pytest-cov → verify.sh #9 | ✅ 已机械化 | #10 |
| Python 版本 ≥ 3.12 | requires-python >= 3.12 | pyproject.toml + check_tech_stack_alignment → #12 | ✅ 已机械化 | #12 |
| pnpm 版本 ≥ 9 | engines pnpm >= 9 | package.json engines（pnpm install 时强制） | ✅ 已机械化 | — |
| 文件要短 | 单文件 ≤ 300 行 | ESLint max-lines + verify.sh #11 | ✅ 已机械化 | #11 |
| 方法要短 | 单方法 ≤ 50 行 | ESLint max-lines-per-function + verify.sh #11 | ✅ 已机械化 | #11 |
| CSS 代码规范 | stylelint-config-standard | stylelint → verify.sh #4 | ✅ 已机械化 | #10 |
| 技术栈基线一致性 | 声明版本 = 实际版本 | check_tech_stack_alignment → verify.sh #12 [P008] | ✅ 已机械化 | #12 |
| 端口一致性 | .preview = vite.config.ts | check_port_consistency → verify.sh #14 | ✅ 已机械化 | #6 |
| Git 追踪关键文件 | progress.txt/feature_list.json | check_git_tracking → verify.sh #13 [P004] | ✅ 已机械化 | #9 |
| sub_id 不可变 | .coze sub_id 创建后不可改 | git-level 约束 | ⚠️ 人工审查 | #7 |
| 约束层不执行检查（单执行器原则） | server/constraints/ 禁止 import routes/nodes，引擎只注册/注入/消费 | import-linter forbidden 合约 → verify.sh #8 (F004) | ✅ 已机械化 | F004设计裁决 |

## 审计闭环校验（根因修复）

每次审计结束前必须执行:
1. 遍历 AGENTS.md 每条硬性规则，确认在本表有对应行
2. 遍历本表每行，确认「实现方式」真实存在于代码库
3. 任何 ⬜ 行必须在 journal 中记录为「流程未到」并标注功能 ID
4. 任何 ⚠️ 行累计触发 ≥ 3 次时，升级为 ✅（写入 Linter/闸门）

## 新增规则流程

当 Code Review 中发现某个问题被提过 3 次以上时:
1. 判断是否可以机械化（Linter 规则 / 架构约束 / 类型系统）
2. 如可以，在对应工具中添加规则
3. 规则错误信息使用三要素公式: `❌ [什么错了] ✅ FIX: [怎么改] 📖 See: [哪个文档]`
4. 在本表新增一行，状态标为 ✅ 已机械化
5. 运行 `scripts/verify.sh` 确认不冲突

## Linter 管理指导（PDF 踩坑指南）

### 逐条添加
PDF 原文: "逐条添加 Linter 规则，每加一条都让 Agent 试跑一遍"。
- 不要一次性添加多条规则，防止 Agent 陷入"修一个错误又触发另一个"的死循环
- 每加一条规则后运行 `scripts/verify.sh` 验证不产生误报
- 确保每条规则的错误信息使用三要素公式给出具体代码片段

### 豁免白名单
PDF 原文: "架构约束太严，阻碍合理的跨层调用" → "设置豁免白名单机制"。
- 当某条分层规则拦截了合理的跨层调用时，不要直接删除规则
- 在规则配置中添加豁免条件（如 dependency-cruiser 的 `from.to.path` 排除特定路径）
- 豁免必须在配置中可见，不能通过全局 ignore 绕过
