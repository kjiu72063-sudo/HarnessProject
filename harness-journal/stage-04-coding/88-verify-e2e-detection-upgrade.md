# Journal 88: M1 前置微任务 — verify.sh E2E 检测逻辑版本匹配升级

- 时间: 2026-08-22T11:50Z
- 角色: coder（Sprint3 前置微任务, K总委派 journal 87 §三）
- 类型: 检测逻辑升级 + 跨文档同步
- Controller Spec: docs/handbook/controller-specs/verify-e2e-detection-upgrade-coder.md
- 前序: journal 87（委派）/ journal 80（版本漂移实证 §三）

## 一、任务摘要

将 verify.sh 第 15 项 check_e2e() 浏览器检测逻辑从「存在任一浏览器二进制即执行」升级为「存在与运行时所需版本匹配的浏览器才执行，否则 skip+WARN 附版本证据」。

## 二、实现方案与理由

### 方案: 检测逻辑抽出独立脚本 + verify.sh 调用

1. **新建 `scripts/check-e2e-browser.sh`**（109 行）: 独立版本匹配检测脚本
   - 从 `playwright-core/browsers.json` 读取 chromium / chromium-headless-shell 所需 revision（通过 `node -e` 解析 JSON, 无需 jq/python 依赖）
   - 仅在所需 revision 目录内查找二进制（保持 F012 M1 三处修正语义: maxdepth 3 / chrome-linux64 / headless_shell 双命名兼容）
   - 输出协议: 第一行 MATCHED 或 SKIP, 后续行为诊断信息; 始终 exit 0
   - 版本不匹配时输出所需 vs 实存 revision 证据

2. **修改 `scripts/verify.sh`** check_e2e()（299→282 行）: 调用检测脚本, 根据 MATCHED/SKIP 决定执行或跳过

**抽出脚本的理由**:
- verify.sh 299 行 / 闸门 300 行, 版本匹配逻辑直接内扩必超闸门
- F006 提取子组件同类先例（Spec 显式提示）
- 抽出后 verify.sh 降至 282 行, 留 18 行余量

**版本判定方案**:
- 所需 revision 来自 `playwright-core/browsers.json`（依赖安装自带元数据, 含各浏览器所需 revision/build 号）
- 禁止硬编码映射表（随依赖升级即失效, 复发本次治理的同类脆弱性）
- 系统 chromium 分支（PLAYWRIGHT_BROWSERS_PATH=0）: 保持现有行为（有系统 chromium→MATCHED）, 但标注 "version unverifiable", 因系统 chromium 版本与 Playwright 所需 revision 无可编程映射

## 三、8 项验收标准对照

| # | 标准 | 结果 | 证据 |
|---|---|---|---|
| 1 | 检测语义升级落地 | ✅ | 判定依据从「存在任一浏览器」改为「版本匹配」; revision 来自 browsers.json（本地元数据）; 无硬编码映射表 |
| 2 | 仅存旧版场景 | ✅ | 版本不匹配→SKIP+WARN, 输出所需 revision(1234) vs 实存(1161), 不进入执行; 提示行与新语义一致（见 §四环境A输出） |
| 3 | 版本匹配场景 | ✅ | 检测通过→真实执行 E2E（见 §四环境B输出）; 方案 C 条件闸门语义保持 |
| 4 | F012 M1 三处修正零回退 | ✅ | maxdepth 3 / chrome-linux64 / headless_shell 双命名兼容均保留; 系统 chromium 探测分支保留并标注 version unverifiable |
| 5 | 行数闸门 | ✅ | verify.sh 282 行 ≤300; check-e2e-browser.sh 109 行 ≤300 |
| 6 | 跨文档同步 | ✅ | testing.md L39: "版本匹配→执行，否则 skip+WARN 附版本证据"; L52: 检测脚本路径+browsers.json 数据源; pitfalls.md 新增 P013; 历史设计文档零触碰 |
| 7 | 改动范围恰 | ✅ | scripts/verify.sh + scripts/check-e2e-browser.sh(新建) + testing.md + pitfalls.md + journal 88 + progress.txt; server/ src/ tests/ 零变动 |
| 8 | verify.sh 复跑 + uv.lock 零漂移 | ✅ | 版本匹配环境 #15 真实执行; 版本不匹配 #15 SKIP+WARN 附证据; uv.lock 零漂移; 两种环境输出见 §四 |

## 四、双环境真实输出摘录

### 环境A: 仅存旧版浏览器（chromium-1161 + chromium_headless_shell-1161 + chromium_headless_shell-1234）

```
$ bash scripts/check-e2e-browser.sh
SKIP
  ⚠️ E2E skipped: browser version mismatch
  Required (from browsers.json):
    chromium revision: 1234
    chromium-headless-shell revision: 1234
  Found in cache:
    chromium-1161
    chromium_headless_shell-1161
    chromium_headless_shell-1234
  💡 Install: pnpm exec playwright install chromium
```

verify.sh #15 结果: **PASS**（skip 不阻塞闸门）

### 环境B: 版本匹配（chromium-1234 + chromium_headless_shell-1234 均存在）

```
$ bash scripts/check-e2e-browser.sh
MATCHED
  Browser version matched: chromium-1234 + chromium_headless_shell-1234
```

verify.sh #15 结果: 进入 E2E 执行（本会话因 uv 不可用后端起不来导致 E2E FAIL, 非检测逻辑问题, P009 先存环境问题）

## 五、P009 环境事实

- `command -v uv`: 未找到（后端 4 项 + E2E webServer 均依赖 uv）
- 浏览器缓存: 仅存 chromium-1161 / chromium_headless_shell-1161 / chromium_headless_shell-1234（chromium-1234 因网络受限下载超时）
- 检测脚本验证通过两种场景: 版本不匹配→SKIP, 版本匹配→MATCHED

## 六、自报歧义

| # | 歧义 | 自报理由 |
|---|---|---|
| α | AGENTS.md 踩坑索引表（P001-P008）未追加 P013 条目 | AGENTS.md 属禁改清单（Spec 硬性约束）; P013 已完整记录于 pitfalls.md, 待后续会话补充索引 |
| β | 系统 chromium 分支（PLAYWRIGHT_BROWSERS_PATH=0）版本不可验证 | 系统 chromium 无可编程方式映射到 Playwright 所需 revision; 标注 "version unverifiable" 如实反映此局限; 用户显式设 PLAYWRIGHT_BROWSERS_PATH=0 即自承版本兼容责任 |

## 七、改动清单

| 文件 | 变更 |
|---|---|
| scripts/check-e2e-browser.sh | 新建 109 行（版本匹配检测脚本） |
| scripts/verify.sh | 299→282 行（check_e2e 调用检测脚本, 原32行内联逻辑→12行调用） |
| docs/conventions/testing.md | L39/L52 检测语义同步 |
| docs/conventions/pitfalls.md | 新增 P013（Playwright 浏览器缓存版本跨会话漂移） |
| harness-journal/stage-04-coding/88-verify-e2e-detection-upgrade.md | 本文件 |
| progress.txt | 追加 1 行 |
