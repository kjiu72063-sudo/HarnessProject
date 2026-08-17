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
- `scripts/verify.sh` — 全链路闸门脚本（8项）
- `scripts/coding-agent-start.sh` — 编码 Agent 启动脚本（含 e2e）
- `server/tests/test_api.py` — API 基础测试 (5个)
- `server/tests/test_settings.py` — 配置基础测试 (2个)
- `docs/design/_template.md` — 设计文档模板
- `docs/conventions/testing.md` — 测试规范
- `docs/conventions/convention-to-rule-mapping.md` — 约定→机械规则对照表
- `docs/conventions/env-review.md` — 环境审查实践

## 验证结果
- verify.sh 8 项全部通过
- 覆盖率 100%（≥ 80% 阈值）
- 分层依赖: 前端 0 违规, 后端 2 合约全部 KEPT
- 文档新鲜度: 新文件跳过，已有文件全部在 60 天内
- test_run 服务探活通过
