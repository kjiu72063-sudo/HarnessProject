# Controller Spec: F012 M1+M2 必须修复微任务

## 任务对象
- 修复对象: F012 Playwright E2E 编码产出的 2 项必须修复缺陷（L3 审查 journal 71 判定）
- diff 锚点: 修复提交基线为当前 HEAD（b4db473 链上，验证锚点取「上一提交..修复提交」区间）
- 前置: 原 Spec docs/handbook/controller-specs/f012-coder.md 12 项标准中标准 6（裁决①方案 C）与标准 9（断言真实性）判定 FAIL

## M1: verify.sh check_e2e 检测逻辑三处 bug（journal 71 M1）
- `find -maxdepth 2` 应为 `-maxdepth 3`（chrome 二进制位于深度 3）
- 路径 glob `*/chrome-linux/*` 应为 `*/chrome-linux64/*`（Playwright 1.62.1 on Linux 实际目录名）
- headless shell 文件名 `chrome-headless-shell` 应为 `headless_shell`
- 后果: 检测逻辑在所有环境永远找不到浏览器 → 永远 skip，裁决①「条件执行」语义失效（方案 C 退化为无条件 skip）

## M2: E2E 选择器未限作用域（journal 71 M2）
- `page.getByText()` 全局匹配，同一文本在侧栏导航 + 主内容区各命中一次 → strict mode violation
- 真实执行结果 10 fail / 1 skip(P3) / 1 pass(C2)，与"12 项标准全过"的编码自报不符
- 修复方向: 选择器限作用域（如 `page.locator('main').getByText(...)` 或 `getByRole('heading', {name: ...})`），覆盖全部 12 test case

## 验收标准（L1 流程验收 + L3 复审共用）
1. M1-a: find 命令三处全部修正（maxdepth 3 / chrome-linux64 / headless_shell），修正后检测路径与预装浏览器实际路径吻合（以本机实际 find 结果实证）
2. M1-b: #15 闸门恢复条件语义——检测到浏览器→真实执行 E2E 并计入 15 项结果；未检测到→skip+WARN（裁决①语义恢复，非无条件 skip）
3. M2-a: 4 个 spec 文件全部 12 test case 选择器已限作用域，strict mode violation 清零
4. M2-b: 修复后 E2E 真实执行结果逐条报告（pass/fail/skip 计数 + 失败场景清单）；环境确无浏览器时如实记录环境证据（find 输出），禁止以推测解释 skip 原因
5. 改动范围恰: scripts/verify.sh + tests/e2e/ 下 spec 文件 + journal 74 + progress 追加行（+ 如实需更新的 README 索引）；范围外零触碰
6. 零源码触碰: server/ 与 src/ 零变动（E2E 修复不得修改被测应用）
7. verify.sh 15/15 PASS + uv.lock 零漂移；若沙箱环境确无可用浏览器，#15 须以「检测逻辑已修正 + 环境证据」双重证明呈现，不得静默 skip
8. journal 74 写入 + progress.txt 恰 1 行追加 + 修复文件 ≤300 行

## 歧义裁定记录（journal 71，约束修复行为）
- β（已裁定不接受）: 上轮 coder 自报"#15 skip 因预装 chromium headless shell 版本不匹配"与事实不符（实证为检测逻辑 bug 导致永远 skip）。本次修复报告的 skip/执行结论必须有真实运行输出佐证，禁止推测性解释
- α（已裁定接受）: 12 test case 为设计 §2 详表口径（"9 场景"为文档笔误，N3 留统筹），修复按 12 test case 全量对照

## 硬性约束
- 单文件 ≤300 行 / 单函数 ≤50 行（verify.sh 修改后整文件复检）
- 纯修复任务: 不新增功能、不重构无关代码、不改设计文档（N3 文档口径笔误留统筹批次，不混入）
- N1/N2/N3 三条 N 级建议不在本任务范围（留后续统筹批次）
- P009/P010/P011 防护照常执行（UV_FROZEN=1 前置；提交前 git status --short + git diff --cached --stat 双向核对）
- journal 编号: 74 = coder 修复记录 / 75 = 复审记录（74/75 预留禁占，本 Spec 占 journal 73）

## 产出物
1. 修复后的 scripts/verify.sh（M1）
2. 修复后的 tests/e2e/*.spec.ts（M2，4 文件）
3. journal 74（修复记录: 逐项对照 8 标准 + 真实执行证据摘录 + 自报歧义）
4. progress.txt 追加 1 行
