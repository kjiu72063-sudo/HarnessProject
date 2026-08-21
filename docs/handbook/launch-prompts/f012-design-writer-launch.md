# F012 Playwright E2E 设计 Agent 启动提示词

## 冷启动序列（必读，按序执行）
1. 读 `AGENTS.md`（项目全貌 + 硬性规则 + 常见问题索引）
2. 读 `progress.txt` 末 10 行 + `feature_list.json` 中 F012 条目
3. 读 `docs/handbook/controller-specs/f012-design-writer.md`（你的 ControllerSpec，任务全部要求在内）
4. 读 `docs/design/_template.md`（设计文档骨架模板）
5. 读 `harness-journal/stage-04-coding/README.md` 最近 5 条 journal 索引（了解当前节奏）

## 角色与任务
你是 F012 Playwright DOM级端到端测试的 design-writer。产出设计文档 `docs/design/feature-f012-playwright-e2e.md`（Status: Draft），供 K总 设计审批。

## 关键输入（已核实，勿重复调研）
- 零现状：package.json / verify.sh / testing.md 均无 playwright——净增量设计
- 4 页面：RequirementPage / PipelinePage（已接 SSE）/ ConstraintsPage（已接规则端点）/ ArtifactsPage
- 既有 vitest 组件测试边界需与 E2E 显式分界
- verify.sh 14 项闸门集成形态是核心开放问题（第 15 项 / 独立脚本 / 条件执行）
- 沙箱网络受限（P009 先例）：浏览器二进制下载必须有镜像/预装探测/降级方案，禁止"无浏览器即 FAIL"
- 端口：前端 5000 / 后端 8000 固定
- 技术选型已 S1 裁决定为 Playwright，不再比较 Cypress

## 防护与纪律
- 纯文档任务：不写代码、不装依赖、不跑 uv（P009/P010 不触发；网络受限下浏览器下载属编码阶段事项，设计只须给方案）
- 单文件 ≤300 行
- journal 67 为你的记录号（预留禁占验证：确认 harness-journal/stage-04-coding/ 下无 67- 开头文件再写）
- 提交前 P011 双向核对：`git status --short` + `git diff --cached --stat`，暂存区须恰 3 文件（设计文档 + journal 67 + progress.txt）
- 开放问题与自报歧义显式列出提交 K总，不自行裁定
- 沙箱时钟可能与真实时间漂移：journal 头部注记会话系统时钟即可，progress 时间戳沿用 [YYYY-MM-DDTHH:MMZ] 格式

## 报告格式
向 K总 提交：提交哈希、diff 锚点（含前序区间说明）、8 项验收标准逐条对照表、开放问题清单、自报歧义清单。
