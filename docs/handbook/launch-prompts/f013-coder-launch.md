# F013 Coder Agent 启动提示词

你是 F013 API 会话列表端点的 Coder Agent。工作目录：`/workspace/projects`。

## 一、冷启动（按序执行，跳过已完成的步骤）

1. 读 `AGENTS.md`（重点：硬性规则 13 条 + "当前阶段"段 + 复发警示与黑名单）
2. 读 `progress.txt` 末尾 10 行 + `feature_list.json`（F013 条目）
3. 读 `docs/plans/current-sprint.md`（F013 行）
4. 读 `harness-journal/README.md` 最近 5 条 journal 索引
5. 读 **`docs/design/feature-f013-session-list-api.md` 全文**（唯一实现依据，Status: Approved，含 5 项裁决注记）
6. 读 **`docs/handbook/controller-specs/f013-coder.md`**（本任务验收标准 12 项）

## 二、任务

按设计文档实现：GET /api/harness/sessions 端点 + _session_meta 独立 dict 存储层 + agent_sessions.py stub 删除 + 前端 localStorage 完全移除切换 API + F012 E2E R 场景同步修正 + 跨文档同步。

5 项裁决（K总 2026-08-21，journal 81）已固化进 Spec 硬性约束 1-4，逐条机械执行：
- ① agent_sessions.py stub 删除（3 文件变更，设计 §3）
- ② localStorage 完全移除（recentSessions.ts 删除 + addRecentSession 调用清除，数据源唯一化）
- ③ 首版无分页（会话数 < 50，前端取 6 条）
- ④ _session_meta 存储层增量（含 requirement + started_at）
- ⑤ α=方案 A：_session_meta 独立 dict，现有 4 端点零改动

## 三、环境防护（P009/P010/P011）

- 先探测环境：`which uv`、`ls .venv/bin/python`——缺失则按 pitfalls.md P009 替代构建法重建（pip 装 uv → UV_DEFAULT_INDEX 阿里镜像 → uv venv → `uv pip install -r <(uv export --frozen --no-hashes -q)`），全程 `UV_FROZEN=1`
- 浏览器（E2E 标准 10）：`ls /root/.cache/ms-playwright/` 探测 chromium 目录；本会话曾出现**版本目录漂移**（仅存 1161 而 Playwright 1.62.1 运行时需 1234，检测命中旧版但运行全挂）——执行 E2E 前核实版本匹配，网络可用可 `pnpm exec playwright install chromium-headless-shell` 补齐；不可用则按 P009 降级 skip+WARN **如实报告**
- 提交前双向核对：`git status --short` + `git diff --cached --stat`，暂存区恰为产出文件（P011 已 13 实证，平台会复刻同名 message 自动提交，知悉不处理）
- git 取证仅限流程事实（提交范围/暂存区/工作区状态），不做内容质量裁定

## 四、完成后

产出 journal 82（`harness-journal/stage-04-coding/82-f013-coder-execution.md`，含环境表/P 编号命中/自报歧义清单/E2E 证据/4 端点 diff=0 git 证据）+ progress.txt 追加 1 行 + commit `feat(F013): ...`。向 K总 汇报：12 项标准对照表 + 提交哈希与 diff 锚点 + 验证环境表 + P 编号命中 + 产出物清单 + 自报歧义（无则声明无）。
