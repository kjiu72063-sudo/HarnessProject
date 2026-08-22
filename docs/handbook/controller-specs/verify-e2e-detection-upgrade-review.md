# M1 复审 Controller Spec — verify.sh E2E 检测版本匹配升级（L3 test-reviewer）

> 委派人: L1（三任） | 被委派: L3 test-reviewer | diff 范围: `5d71e1f..ad4be00`
> journal 预留: 89（本篇复审 journal）
> 铁律: 独立验证，不得引用 L1 或 coder 的结论作为证据；所有 PASS 须自带你环境的真实输出

## 背景

M1 前置微任务（journal 87 委派，journal 88 coder 自报完成）: verify.sh #15 E2E 检测从"存在即执行"升级为"版本匹配才执行"，检测逻辑抽出 `scripts/check-e2e-browser.sh`。动机: P013（journal 80 实证，浏览器缓存版本漂移导致假执行真全 fail）。

coder 自报 8 项标准全过 + 2 条歧义（α: AGENTS.md 踩坑索引未追加 P013，称"AGENTS.md 禁改"; β: 系统 chromium 分支版本不可验证，标注 version unverifiable）。

L1 流程验收已完成（四类行，见 journal 89 呈报段）: 产出存在/写入/约束遵守均中; verify.sh 复跑受限（本 L1 会话 uv+.venv 双缺 + chromium-1234 下载受限），已按 P009 预防规则等效记录: 检测脚本单独执行输出 SKIP+WARN 附版本证据 exit=0。

## 你必须独立完成的复审（12 项）

1. **环境自建**: 按 pitfalls.md P009 替代构建法构建 Python 环境（UV_FROZEN=1 防 P010）; 尝试 `pnpm exec playwright install chromium` 补齐 chromium-1234。环境状态写入 journal。
2. **diff 范围核对**: `git diff --stat 5d71e1f..ad4be00` 恰 7 文件，server/src/tests 零变动。
3. **标准1 检测语义**: check-e2e-browser.sh 的 revision 来源是 playwright-core/browsers.json 动态读取，无硬编码版本映射表（grep 数字 revision 字面量验证）。
4. **标准2 SKIP 路径实测**: 缓存仅旧版时（或人为 PATH 隔离）输出 skip+WARN 且附"所需 revision vs 实存缓存"证据、安装提示命令。
5. **标准3 MATCHED 路径实测**: 装齐 1234 后检测输出 matched 并真实进入 E2E 执行（若你的环境后端可起则记录 E2E 真实结果; 起不来按 P009 记录环境事实，不归因检测逻辑）。
6. **标准4 F012 M1 零回退**: maxdepth 3 / 双浏览器命名 / 路径探测三处修正仍在新脚本中保留（对照 f012 的修复点）。
7. **标准5 行数闸门**: verify.sh ≤300 行（自报 282）、check-e2e-browser.sh ≤300 行（自报 109），`wc -l` 实测。
8. **标准6 跨文档同步**: testing.md 检测描述与 pitfalls.md P013 条目与脚本实际行为一致（三处互查，含 P013 表格六字段完整）。
9. **标准7 改动范围恰**: 逐文件核对 7 文件均在 journal 87 Spec 授权语义内; 特别核对 harness-journal/README.md +1 行（Spec 未列但有 F012 coder 先例 a73c7dd 含 README 更新）——给出你的独立判定。
10. **标准8 verify.sh 全量复跑**: 你环境跑 `bash scripts/verify.sh`，15 项逐项记录 PASS/FAIL/SKIP; uv.lock 零漂移（git diff 复核）。
11. **歧义 α 裁定**: coder 称"AGENTS.md 禁改"故未把 P013 加踩坑索引表——核实 journal 87 Spec 是否禁止 coder 改 AGENTS.md，给出 P013 索引行应由谁在哪个批次补的裁定建议（备 K 总）。
12. **歧义 β 裁定**: 系统 chromium 分支标注 "version unverifiable" 的处理是否可接受，给出裁定建议（备 K 总）。

## 产出要求

- journal 89: 12 项逐项 PASS/FAIL + M(必须修复)/N(建议)/歧义清单 + 环境记录
- 复审基线: M1 无先在结论（journal 88 自报与你无关），不得锚定
- 若有 M 级: 给出修复方向供 L1 起草修复 Spec

## 边界

- 你是内容质量校验者，可深挖实现细节; 但修复实施归 coder 会话
- git 取证锚定 diff 范围 5d71e1f..ad4be00，平台自动提交（f03515b 已核零差异）不构成污染
