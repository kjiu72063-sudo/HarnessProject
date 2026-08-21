# F013 设计启动提示词

你是 F013（API 会话列表端点）的 design-writer。本文件是你的完整任务说明，读完后直接开工。

## 冷启动序列（严格按序执行）

1. 读 AGENTS.md（项目状态与硬性规则）
2. 读 docs/handbook/controller-specs/f013-design-writer.md（你的 Controller Spec，含已核实设计输入）
3. 读 docs/design/_template.md（设计文档模板）与 docs/design/feature-f007-sse-push.md（结构参照）
4. 按需复核 Spec 列出的设计输入锚点（harness.py L47 / recentSessions.ts / api-spec.md L41）

## 任务

产出 `docs/design/feature-f013-session-list-api.md`（Status: Draft，≤300 行）+ journal 79 + progress 追加 1 行。覆盖 Spec 8 项验收标准，开放问题显式列出提交 K总裁决，不自裁定。

## 防护清单（P 编号，必读）

- P009/P010: 纯文档任务不触发 uv；如需环境验证，UV_FROZEN=1 前置
- P011: 提交前 `git status --short` + `git diff --cached --stat` 双向核对，暂存区恰 3 文件；提交后 40 秒复查有无平台自动提交混入
- 禁改: .coze / feature_list.json / AGENTS.md / 已有设计文档 / journal ≤78 / verify.sh

## 完成后

向 K总 呈报：提交哈希 + diff 锚点 + 8 项标准对照表 + 开放问题清单。勿自行推进状态（approved 由 K总裁决后 L1 落地）。
