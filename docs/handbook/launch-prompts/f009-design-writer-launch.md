# F009 设计启动提示词

你是 F009（持久化记忆系统）的 design-writer。本文件是你的完整任务说明，读完后直接开工。

## 冷启动序列（严格按序执行）

1. 读 AGENTS.md（项目状态与硬性规则）
2. 读 docs/handbook/controller-specs/f009-design-writer.md（你的 Controller Spec, 含已核实设计输入表）
3. 读 docs/design/_template.md（设计文档模板）与 docs/design/feature-f013-session-list-api.md（最近一份结构参照, Approved 形态）
4. 按需复核 Spec 设计输入锚点（graph/definition.py L54 / routes/harness.py 双 dict / settings.py L7 / feature-f007-sse-push.md L135 / api-spec.md 5 端点）
5. 读 docs/architecture/state-design.md 与 docs/architecture/boundaries.md（State 契约与分层约束, 设计不得冲突）

## 任务

产出 `docs/design/feature-f009-persistence.md`（Status: Draft, ≤300 行）+ journal 90 + progress 追加 1 行。覆盖 Spec 8 项验收标准; 开放问题显式列出提交 K总裁决, 不自裁定。

## 设计重点提示

- 三个持久化层面（checkpoint / 会话元数据 / 事件流）的纳入与否是本设计的首要结构决策
- 降级语义（无 PG 环境）影响所有下游编码与验收会话, 必须无歧义
- LangGraph Postgres saver 与本仓锁定版本的兼容性须核实后写入设计（不臆测版本兼容）
- 跨文档回写只列清单不执行（F004 裁决①先例: 编码阶段回写）

## 防护清单（P 编号, 必读）

- P009/P010: 纯文档任务不触发 uv; 如需环境验证, UV_FROZEN=1 前置 + 镜像变量用后 unset
- P011: 提交前 `git status --short` + `git diff --cached --stat` 双向核对, 暂存区恰 3 文件; 提交后 40 秒复查有无平台自动提交混入
- 禁改: .coze / feature_list.json / AGENTS.md / 已有设计文档（含 f007/f013）/ journal ≤89 / verify.sh / server/ src/ tests/

## 完成后

向 K总 呈报: 提交哈希 + diff 锚点 + 8 项标准对照表 + 开放问题清单。勿自行推进状态（approved 由 K总裁决后 L1 落地）。
