# verify.sh E2E 检测逻辑升级（前置微任务）启动提示词

你是 Sprint3 前置微任务的 coder：升级 verify.sh 第 15 项浏览器检测逻辑为版本匹配语义。本文件是你的完整任务说明，读完后直接开工。

## 冷启动序列（严格按序执行）

1. 读 AGENTS.md（项目状态与硬性规则, 重点「L1职责边界」不适用于你——你是 coder, 但硬性规则13条全部适用）
2. 读 progress.txt 末 20 行 + docs/plans/current-sprint.md（Sprint3 段）
3. 读 harness-journal/README.md 索引 + journal 87（本任务委派背景）+ journal 80（版本漂移实证, §三）+ journal 71/74（F012 检测逻辑前史, M1 修复与 β 教训）
4. 读 docs/handbook/controller-specs/verify-e2e-detection-upgrade-coder.md（你的 Controller Spec, 含已核实输入与 299 行风险）
5. 按 Spec「已核实输入」表复核锚点（verify.sh L260-281 / testing.md L39+L52 / node_modules playwright 元数据）

## 任务

按 Spec 8 项验收标准执行: 检测逻辑「存在即执行」→「版本匹配才执行, 否则 skip+WARN 附版本证据」。产出 = 升级后的 verify.sh（或+抽出检测脚本）+ 跨文档同步 + journal 88 + progress 1 行。

## 关键风险（Spec 已载, 此处强调）

- **verify.sh 299/300 行**: 原函数内扩展必超闸门, 优先考虑抽独立脚本（F006 先例）
- **禁止硬编码版本映射表**: 版本判定来自本地依赖元数据或运行时自检, 方案自报理由
- **β 教训（journal 71）**: 上轮 coder 自报"版本不匹配"与事实不符被 L3 实证纠正——本次所有执行/skip 结论必须附真实运行输出, 禁止推测性解释
- **F012 产出零触碰**: tests/e2e/ 4 spec 文件与 12 test case 不属于本任务

## 防护清单（P 编号, 必读）

- P009: 会话开始先探测环境（`command -v uv` / 浏览器缓存目录实存 revision）; 环境事实写入 journal
- P010: 一律 `export UV_FROZEN=1` 前置再跑 verify.sh; 镜像变量用后 unset; 提交前 `git diff -- uv.lock` 必查
- P011: 提交前 `git status --short` + `git diff --cached --stat` 双向核对暂存区恰与改动清单一致; 提交后 40 秒复查有无平台自动提交混入

## 禁改

.coze / feature_list.json / AGENTS.md / docs/design/ 历史设计文档 / tests/e2e/ / server/ / src/ / journal ≤87 / journal 89+90（预留禁占）

## 完成后

向 K总 呈报: 提交哈希 + diff 锚点 + 8 项标准对照表 + 实现方案与理由 + 双环境（版本匹配 / 仅存旧版或无浏览器）真实输出摘录 + 自报歧义清单。勿自行推进状态, 勿自聘审查。
