# 阶段2 — 约束层搭建

> 状态：✅ 已完成

## 触发原因

基于 PDF 原文审计发现：阶段2 约束层整层缺失。AGENTS.md 写了 9 条硬性规则，但没有任何一条被机械化执行。PDF 原文核心哲学："如果不能机械化地强制执行，Agent 就会偏离"。

## 执行内容

### 01 - 前端分层依赖检查（等价于 PDF 的 ArchUnit）
- 工具: dependency-cruiser v18.2.0
- 配置: `.dependency-cruiser.cjs`
- 规则: 前端禁直接 import 后端 + 禁循环依赖
- 错误信息格式: PDF 三要素公式（❌什么错了 ✅怎么修 📖去哪看）

### 02 - 后端分层依赖检查
- 工具: import-linter v2.13
- 配置: `pyproject.toml [tool.importlinter]`
- 规则: routes 禁直接 import models + nodes 禁 import routes

### 03 - 后端 Lint（等价于 PDF 的 Checkstyle）
- 工具: ruff
- 配置: `pyproject.toml [tool.ruff]`
- 规则: E/F/W/I/UP/B 规则族
- 修复: 自动修复了 3 个 import 排序问题

### 04 - 后端类型检查
- 工具: mypy
- 配置: `pyproject.toml [tool.mypy]`

### 05 - 覆盖率闸门（等价于 PDF 的 JaCoCo ≥ 80%）
- 工具: pytest-cov
- 配置: `pyproject.toml [tool.coverage.report] fail_under = 80`
- 基础测试: `server/tests/test_api.py` (5个) + `server/tests/test_settings.py` (2个)
- 当前覆盖率: 100%

### 06 - verify 全闸门脚本
- 脚本: `scripts/verify.sh`
- 等价于: PDF 中的 `mvn -B clean verify`
- 8项检查: ts-check + eslint + depcruise + ruff + mypy + import-linter + pytest-cov + doc-freshness
- 任何一项失败即整体失败

### 07 - 编码 Agent 会话启动脚本
- 脚本: `scripts/coding-agent-start.sh`
- PDF 原文规定的 5 步标准流程:
  1. pwd 确认工作目录
  2. 读取 git log + progress.txt
  3. 读取 feature_list.json 选功能
  4. 运行 verify 闸门 + **启动 dev server + e2e 健康检查**（PDF 原文要求）
  5. 确认正常后开始开发

### 08 - 阶段1 信息层缺口修复
- 创建 `docs/design/_template.md` — PDF 设计文档模板（含 Status 流转）
- 创建 `docs/conventions/testing.md` — 测试规范（AGENTS.md 导航表原本引用但文件不存在）
- 创建 `docs/conventions/convention-to-rule-mapping.md` — 约定→机械规则对照表

### 09 - 踩坑记录
- P005: dependency-cruiser v18 的 `message` 属性已改为 `comment`
- P006: ESLint 扫描 `.dependency-cruiser.cjs` 报 `no-undef`
- P007: import-linter 不支持 `.importlinter.toml` 独立文件，必须放在 pyproject.toml

### 10 - 第二轮 PDF 审计修复

基于 PDF 原文第二轮审计发现 4 个设计缺失（非流程未到），全部修复：

1. **Agent 3 大失败模式**（G1）: PDF 原文 Anthropic 总结的 One-shotting / 过早宣布胜利 / 过早标记功能完成，写入 `docs/conventions/coding.md` 知识库首段
2. **文档新鲜度检查**（G2）: PDF CI 中的 Doc Freshness step，加入 `verify.sh` 第 8 项检查（>60天未更新则失败）
3. **编码 Agent e2e 测试**（G3）: PDF 原文要求编码 Agent 启动时"启动开发服务器，运行基础端到端测试"。`coding-agent-start.sh` Step 4 新增 dev server 启动 + curl 健康检查
4. **环境审查实践**（G4）: PDF 原文"每周30分钟环境审查"含4项检查清单，创建 `docs/conventions/env-review.md`

审计同时确认：Agent 专业化/Agent-to-Agent 审查/三层上下文加载/后台清理 Agent/Doc-gardening/可观测性/Git Worktree/结构化执行强制 8 项均为**流程未到**（归属 F002-F008 后续功能开发），不是设计缺失。PDF 与当前设计**无冲突**。

## 产出物
- `.dependency-cruiser.cjs` — 前端分层依赖检查配置
- `pyproject.toml` — 后端 ruff/mypy/pytest-cov/import-linter 配置
- `scripts/verify.sh` — 全链路闸门脚本（9项）
- `scripts/coding-agent-start.sh` — 编码 Agent 启动脚本（含 e2e）
- `server/tests/test_api.py` — API 基础测试 (5个)
- `server/tests/test_settings.py` — 配置基础测试 (2个)
- `docs/design/_template.md` — 设计文档模板
- `docs/conventions/testing.md` — 测试规范
- `docs/conventions/convention-to-rule-mapping.md` — 约定→机械规则对照表
- `docs/conventions/env-review.md` — 环境审查实践

## 验证结果
- verify.sh 9 项全部通过
- 覆盖率 100%（≥ 80% 阈值）
- 分层依赖: 前端 0 违规, 后端 2 合约全部 KEPT
- 文档新鲜度: 新文件跳过，已有文件全部在 60 天内
- 文件大小: 全部源文件 ≤ 300 行, 全部函数 ≤ 50 行
- test_run 服务探活通过

### 11 - 第三轮 PDF 审计修复

基于 PDF 原文第三轮逐句审计发现 5 个设计缺失（非流程未到），全部修复：

1. **ruff T201 未启用**（G5）: AGENTS.md 硬性规则 #2 声明「禁止裸 print()」但 ruff select 不含 T20 规则族。在 `pyproject.toml` 的 ruff select 中添加 `"T20"`，`convention-to-rule-mapping.md` 状态从 `⬜ 待启用` 更新为 `✅ 已配置`
2. **文件大小/方法长度限制缺失**（G6）: PDF「把主观品味翻译成机械规则」明确列出「单文件 ≤ 300 行」+「单方法 ≤ 50 行」两条机械规则。在 `eslint.config.mjs` 添加 `max-lines` (300) + `max-lines-per-function` (50) 规则；在 `verify.sh` 新增第 9 项检查（bash 文件长度 + Python AST 函数长度）；`convention-to-rule-mapping.md` 新增两行
3. **文档元信息缺少 owner 字段**（G7）: PDF 文档模板要求 `last_updated` + `status` + `owner`。给 10 个缺少 `owner` 的 docs/*.md 文件全部补上 `owner: @K总`
4. **日志规范缺失**（G8）: PDF Anthropic 案例「上下文窗口污染缓解」明确列为关键 Harness 设计。在 `coding.md` 新增「日志规范」段：最小化控制台输出 + 日志写文件 + grep 友好错误格式 + 预计算聚合统计
5. **每月规则回顾 + Linter 管理指导缺失**（G9）: PDF 持续维护要求「每月回顾并更新规则」。在 `env-review.md` 新增「每月规则回顾」段；在 `convention-to-rule-mapping.md` 新增「Linter 管理指导」段（逐条添加原则 + 豁免白名单机制）

附加修复: ESLint `max-lines-per-function` 触发 `App.tsx` 的 `App` 函数超限（53 行 > 50），提取 `ApiStatus` 子组件使主函数降至 50 行以内。AGENTS.md 硬性规则新增 #11（文件大小/方法长度限制）。

审计同时确认：第三轮无新增流程未到项，PDF 与当前设计无冲突。verify.sh 从 8 项扩展为 9 项。

### 12 - 第四轮 PDF 审计修复

基于 PDF 原文第四轮逐项对照落地清单 + 「把主观品味翻译成机械规则」表 + 「自定义 Linter 规则：错误信息即 Prompt」段，发现 1 个设计缺失：

1. **import-linter 合约缺少三要素错误信息**（G10）: PDF 原文「每条 Linter 报错都必须包含三要素——是什么、怎么修、去哪看文档」。dependency-cruiser 自定义规则已有三要素（`comment` 字段），但 import-linter 工具不支持自定义错误输出，合约被违反时只显示合约名 + `BROKEN`。修复：(a) 在 `pyproject.toml` 每个合约上方添加三要素 TOML 注释；(b) 在 `verify.sh` 中将 import-linter 从普通 `run_check` 替换为 `check_import_linter` 自定义函数，合约被违反时解析输出并打印对应的 ❌/✅/📖 三要素引导。`convention-to-rule-mapping.md` 两行 import-linter 规则标注更新为「+ 三要素注释」。

审计同时确认：第四轮无新增流程未到项，PDF 与当前设计无冲突。

修正: 产出物段 verify.sh 从「8项」更正为「9项」（第三轮修复时遗漏）。
