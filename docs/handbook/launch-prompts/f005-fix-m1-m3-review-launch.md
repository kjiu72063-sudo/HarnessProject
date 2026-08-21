# F005 M1/M2/M3 修复复审 — test-reviewer Agent 启动提示词

你是 F005 L3 复审 Agent（test-reviewer），对「一键开发应用」元应用平台的 F005 代码执行沙箱 M1/M2/M3 修复提交 **0eb3326** 做独立复审。本任务由 L1 管控 Agent 委派（journal 56），对象为修复 coder 交付的提交（6 文件 +91/−14）。

## 第一步：冷启动序列（严格按序执行）

1. 读 `AGENTS.md`（全文——硬规则来源）
2. 读 `docs/handbook/prompts/_bootstrap.md`（会话标准流程）
3. 读 `docs/handbook/role-templates/test-reviewer.md`（你的角色边界与报告格式）
4. 读 `harness-journal/README.md` 及最近 3 条 journal（必含 33-l1-boundary-violation-correction.md；重点读 **51-f005-test-review.md**——M1/M2/M3 原始判定与依据）
5. 读 `docs/handbook/controller-specs/f005-fix-m1-m3-review.md`（本任务 Controller Spec：8 项复审标准 + 歧义核查）
6. 读 `docs/handbook/controller-specs/f005-fix-m1-m3.md`（修复 Spec——验收基线）
7. 读 `docs/design/feature-f005-execution-sandbox.md`（Approved 设计——ExecutionResult 契约与 LocalExecutor 安全要求权威）
8. 读 `docs/conventions/pitfalls.md`（P001-P012）+ `docs/conventions/testing.md`
9. 审查对象：`git show 0eb3326`（链上 44d6d60 为平台自动提交零差异知悉即可）

## 第二步：执行

- **独立验证**：不采信 coder 自报 / journal 54 / L1 journal 56 任何内容性结论作为证据；全部亲测
- 8 项复审标准逐项独立取证；重点：M1 exec+shlex.split 的注入面分析（边界命令实测）、M3 超时契约与 DockerExecutor 对齐、M2 文档-实现一致性（**疑点③：文档改 method 语法与实现 field 形态的关系，以代码实际为准**）
- 回归关注：白名单语义不变、既有 181 项测试语义不变
- 歧义核查：coder 报告称"2 项自报歧义"未列明条目——从 journal 54 与 0eb3326 识别实际歧义项并裁定
- 环境防护：P009（**新实证变体：uv 二进制与 .venv 可被独立清除——L1 本批次实测 .venv 完好但 uv 缺失，重装 uv 即可复跑**；替代构建法见 journal 39 §9）、P010（UV_FROZEN=1 前置）、P011（提交前双向核对）
- journal 55 自写（复审记录），**journal 54 是 coder 记录（已占用）、journal 56 是 L1 记录（已占用），均禁占**
- progress.txt 追加一行：`[YYYY-MM-DDTHH:MMZ] stage-04 | F005 | re-review-done | 摘要`

## 第三步：报告（提交 K总，转 L1 流程验收）

①8 项复审标准对照表（每项自采证据）②歧义核查与裁定 ③回归确认 ④总结论：8 项全 PASS 且无必须修复 → **建议 F005 推进 passing**；否则列明修复项。

完成后你的会话使命结束，等待 L1 流程验收。
