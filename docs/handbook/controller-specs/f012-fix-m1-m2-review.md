# F012 M1/M2 修复复审 Controller Spec（test-reviewer 用）

## 任务性质
对 F012 M1/M2 修复提交 221cef3（+平台自动提交 4e8208f 承载 journal 74/progress）做**独立复审**。上一轮审查（journal 71）已裁定 M1（verify.sh 检测逻辑三 bug）与 M2（选择器未限作用域致 10 fail），coder 自报 8 项标准全 PASS。你是本次微任务唯一的独立验证者，禁止信任 coder 自报证据。

## 审查对象与锚点
- 修复提交：221cef3（恰 6 文件 +40/−47：scripts/verify.sh + tests/e2e/ 5 文件）
- journal 74 + progress fix-done 行由平台自动提交 4e8208f 承载（Coze-Commit-Type: user，复刻同名 message，P011 实证 13）——验收锚定 f74157b..221cef3 的 6 文件 + 4e8208f 的 2 文件，共 8 文件
- 基线：f74157b

## 8 项复审标准（逐项独立验证，每项给 PASS/FAIL + 证据）

1. **M1-a 检测逻辑修正真实有效**：独立核对 verify.sh check_e2e 三处修正（maxdepth 2→3 / chrome-linux→chrome-linux64+chrome-linux 双兼容 / chrome-headless-shell→headless_shell+chrome-headless-shell 双兼容）在当前沙箱环境真实命中浏览器（find 命令实测 ≥1 匹配），并验证旧逻辑确为 0 匹配（coder 提供的根因证据）
2. **M1-b 方案 C 语义恢复**：#15 在浏览器可用环境真实执行 E2E 而非 skip；若本会话环境不可达浏览器，须如实报告并给出检测层证据（find 命中数），不得宣称"已验证真实执行"
3. **M2-a 选择器限作用域**：逐一核对 4 spec 文件的 heading 限定（getByRole('heading')）/ main 作用域（page.locator('main')）/ .first() 使用与 design §7 选择器三级策略一致；确认无裸 page.getByText 全局匹配残留（R2 placeholder 修正为"描述你想构建"、localStorage key 对齐 harness_recent_sessions 亦须核对）
4. **M2-b strict mode violation 清零 + 真实执行结果复现**：真实执行 `pnpm test:e2e`，结果应为 11 passed / 1 skipped(P3 设计预留) / 0 failed / 0 strict mode violation；若环境受限无法真实执行，如实报告并以静态证据（选择器代码审读）替代，明确标注"未真实执行"
5. **改动范围**：f74157b..221cef3 恰 6 文件（verify.sh + tests/e2e/ 5），无范围外文件；4e8208f 恰 2 文件（journal 74 + progress）
6. **verify.sh 独立复跑**：15/15 PASS + uv.lock 零漂移（UV_FROZEN=1 前置）
7. **journal 74 真实性**：对照真实运行输出核验自报数据（E2E 结果、检测证据、verify 结果）无夸大无失实——β 歧义教训约束：所有结论与证据须逐一对得上
8. **行数合规**：改动文件均 ≤300 行；verify.sh 修改未破坏其他 14 项闸门

## 歧义裁定清单（coder 自报，你须独立裁定）
- **α**：headless_shell 跨版本命名兼容双命名（coder 称环境证据支撑）——判定兼容双命名是否为合理修复而非过度防御

## 结论口径
- 8 项全 PASS + 歧义可接受 → 建议推进 passing
- 有 FAIL → 列 M 项（必须修复）与 N 项（建议改进），不推进
- 你的产出：journal 75（预留号）+ progress 追加 + README 索引，提交恰 3 文件

## 边界与约束
- 独立验证，禁止转述 coder 自报证据为已核实
- 真实执行受限时如实报告缺口，不虚构执行结果
- 禁改清单：.coze / 设计文档 / journal 73/74 / 委派三件套
