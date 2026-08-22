# Controller Spec: verify.sh E2E 检测逻辑版本匹配升级（前置微任务）

## 任务

将 `scripts/verify.sh` 第 15 项（check_e2e）的浏览器检测逻辑从**「存在任一浏览器二进制即执行」**升级为**「存在与运行时所需版本匹配的浏览器才执行，否则 skip+WARN」**。

- 来源: N 池候选拆出（journal 80 §三衍生观察），K总裁决 2026-08-22 作为 Sprint3 前置微任务先行（journal 87），不占 F 编号
- 动机: 「存在即执行」在"仅存旧版浏览器"场景下产生比 skip+WARN 更差的结果——检测命中旧版 → 执行 E2E → 运行时缺所需二进制 → 12 用例全 fail（journal 80 实证）

## 角色

coder

## 已核实输入（免重复调研，可复核）

| 事实 | 位置 |
|---|---|
| 检测逻辑现状（F012 M1 修复后形态） | scripts/verify.sh L260-281: L263 `command -v chromium/chromium-browser/google-chrome` 系统浏览器探测分支; L267 cache_dir=`PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright`; L270-271 find maxdepth 3 + chrome-linux64/chrome-linux 双命名 + headless_shell/chrome-headless-shell 双文件名计数; L272-273 两计数均>0 → has_chromium=1; L278-280 否则 skip+WARN（提示 `pnpm exec playwright install chromium`） |
| 版本漂移实证 | journal 80 §三: 缓存仅存 chromium-1161 而 @playwright/test 1.62.1 运行时需 chromium_headless_shell-**1234** → 检测命中旧版 → 执行 → `Executable doesn't exist .../chromium_headless_shell-1234/...` → 12 全 fail; 网络可用时 `pnpm exec playwright install chromium-headless-shell` 重下载后恢复 |
| **verify.sh 当前 299 行 / 闸门 300 行** | `wc -l scripts/verify.sh`; 版本匹配逻辑必增行数, 直接在原函数内扩展**必然超闸门** |
| 版本元数据线索 | node_modules 内 playwright 自带元数据（如 playwright-core 的 browsers.json, 含各浏览器所需 revision/build 号）——候选实现输入之一, 非钦定方案 |
| 检测语义文档记载 | docs/conventions/testing.md L39（第 15 项行）+ L52（环境策略行）; pitfalls.md P009 段（L105-114）**未含浏览器版本漂移形态**（该形态现仅存于 AGENTS.md 环境事实段与 journal 80/86） |

## 验收标准（L1 流程验收 + L3 复审共用, 8 项）

1. **检测语义升级落地**: 判定依据从「存在任一浏览器二进制」改为「存在与运行时所需版本匹配的浏览器」。版本判定依据必须来自依赖安装的本地元数据或运行时自检命令（具体实现方案由 coder 决定并在 journal 88 自报理由）; **禁止硬编码「依赖版本→浏览器 build 号」映射表**（随依赖升级即失效, 复发本次治理的同类脆弱性）
2. **仅存旧版场景**: 版本不匹配 → skip + WARN, 且 WARN 输出版本不匹配证据（所需 revision vs 实存 revision）, 不进入执行; 提示行与新检测语义一致
3. **版本匹配场景**: 检测通过 → 真实执行 E2E 并计入 15 项结果（方案 C 条件闸门语义, F012 裁决①不回退）
4. **F012 M1 三处修正零回退**: maxdepth 3 / chrome-linux64 路径 / headless_shell 双命名兼容语义保持; 系统 chromium 探测分支（L263）的版本语义一并评估处理（journal 自报）
5. **行数闸门**: verify.sh（或抽出的检测脚本）修改后均 ≤300 行。verify.sh 当前 299 行无扩展余量——将检测逻辑抽为独立脚本（如 scripts/ 下检测脚本, verify.sh 调用）为项目既定手法先例（F006 App.tsx 提取子组件同类）; 若采用其他方案 journal 自报理由
6. **跨文档同步**: testing.md L39/L52 检测语义描述同步; pitfalls.md P009 浏览器版本漂移第三形态记录是否新增由 coder 判断（journal 自报判定理由）; 禁改历史设计文档（feature-f012-*.md, N3 先例）
7. **改动范围恰**: scripts/verify.sh（+新建检测脚本如采用抽取方案）+ testing.md（+pitfalls.md 如判定新增）+ journal 88 + progress 追加行; server/ 与 src/ 与 tests/ 零变动（检测逻辑不属于被测应用与测试用例）
8. **verify.sh 复跑 15/15 PASS + uv.lock 零漂移**: 本会话浏览器版本匹配时 #15 真实执行; 仅存旧版/无浏览器时 #15 skip+WARN 且有证据输出——两种环境结果均如实记录（β 教训: 执行/skip 结论附真实运行输出, 禁止推测性解释）

## 硬性约束

- 纯检测逻辑升级: 不改 E2E 测试用例、不重构 verify.sh 无关段、不新增功能
- 单文件 ≤300 行 / 单函数 ≤50 行（修改后整文件复检）
- F012 编码产出的 4 个 spec 文件与 12 test case 零触碰
- P009/P010/P011 防护照常（UV_FROZEN=1 前置; 提交前 `git status --short` + `git diff --cached --stat` 双向核对; 提交后 40 秒复查平台自动提交）
- 禁改: .coze / feature_list.json / AGENTS.md / 历史设计文档 / journal ≤87
- journal 编号: 88 = coder 执行记录（本 Spec 预留, 禁占 89/90）

## 产出物

1. 升级后的 scripts/verify.sh（+ 如采用抽取方案的 scripts/ 新检测脚本）
2. 同步后的 docs/conventions/testing.md（+pitfalls.md 如判定新增）
3. harness-journal/stage-04-coding/88-verify-e2e-detection-upgrade.md（执行记录: 8 标准逐项对照 + 实现方案自报与理由 + 双环境真实输出摘录 + 自报歧义）
4. progress.txt 追加 1 行
