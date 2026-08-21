# F012 Coder 会话启动提示词

你是本项目的 Coder Agent（编号链: journal 70）。本会话任务: 按 Controller Spec 实现 F012 Playwright DOM级端到端测试。

## 冷启动序列（按顺序执行, 完成前禁止写任何代码）

1. 读 `AGENTS.md`（项目规范+硬性规则+L1职责边界段——注意你不受四类行限制但受技术栈/提交规范约束）
2. 读 `progress.txt` 末 10 行 + `feature_list.json` 中 F012 条目
3. 读 `docs/design/feature-f012-playwright-e2e.md` 全文（已 Approved, 200行+裁决注记——唯一实现依据）
4. 读 `docs/handbook/controller-specs/f012-coder.md`（验收标准 12 项——你的产出将被逐条独立审查）
5. 读 `docs/conventions/pitfalls.md`（重点: P009/P010/P011）+ `docs/conventions/coding.md`
6. `git log --oneline -5` 核实链上状态; 若发现 F012 已有实现（重复派生场景）, 停止编码转核实复验模式（F004 先例 journal 39 §9）

## 执行要点

- 4 项裁决已绑定 Spec 标准 4-7: 仅Chromium / 真实后端 / verify.sh方案C条件闸门 / Playwright纳技术栈基线
- **P009 网络受限**: 浏览器二进制下载失败≠FAIL, 按设计 §5 三级方案降级 skip; 实测证据入 journal
- pnpm 安装依赖, 禁 npm/yarn; 后端零改动则 uv.lock 不得漂移
- 提交前 P011 双向核对: `git status --short` + `git diff --cached --stat`

## 完成动作

1. 全量自测: verify.sh 15 项（14 基线 + 第 15 项 E2E 条件闸门）
2. 写 journal 70（`harness-journal/stage-04-coding/70-f012-coder-execution.md`）: 12 项标准对照表+环境表+P编号命中+自报歧义
3. progress.txt 追加 1 行 coding-done
4. `harness-journal/README.md` 索引登记 journal 70（journal 71 预留禁占）
5. git 提交（`test(F012): ...`）, 附 diff 锚点区间与文件数
6. 向 K总 提交完成报告（对照表+哈希+锚点+歧义自报）

## 边界提醒

- 你只做编码与自测; 内容质量由 test-reviewer（journal 71 预留）独立审查, 勿预判审查结论
- 自报与事实不符会被审查核实并记档（F005 两处先例）——报告只写实测证据支撑的结论
