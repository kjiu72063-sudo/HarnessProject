# Journal 71 — F012 Playwright E2E L3 独立测试审查报告

| 字段 | 值 |
|---|---|
| 功能 | F012 Playwright DOM级端到端测试 |
| 阶段 | stage-04-coding |
| 角色 | L3 test-reviewer（独立审查，与 coder 无共享上下文） |
| 日期 | 2026-08-20 |
| 审查对象 | commit a73c7dd, diff 锚点 c51eb33..a73c7dd, 18 文件 +419/−3 |
| 前序 journal | 70 (coder 执行记录) |
| Controller Spec | docs/handbook/controller-specs/f012-test-review.md (12 项标准) |

## 一、审查结论

**需改进后重审**。12 项标准中 10 PASS / 2 FAIL；发现 2 条必须修复 (M) + 3 条建议改进 (N)。

| M# | 标准 | 问题 | 修复方向 |
|---|---|---|---|
| M1 | 标准 6 (方案 C 第 15 项检测逻辑) | verify.sh `check_e2e()` 三处 bug 导致浏览器检测在所有环境下均失败，永远 skip | 修正 find 命令参数与路径模式 |
| M2 | 标准 9 (E2E 断言质量) | `page.getByText()` 未限定作用域，匹配侧边栏+主内容双元素触发 strict mode violation，实际运行 10/12 FAIL | 限定选择器到主内容区域 (如 `page.main` / `getByRole('main')`) |

| N# | 描述 | 理由 |
|---|---|---|
| N1 | journal 70 自报 `@playwright/test@^1.62.1` specifier，实际为 `^1.49.0` | 自报失实，1.62.1 是 lock 解析版本非 specifier |
| N2 | P3 `test.skip()` 闸门决策场景未实测 | 首版可接受，interrupt 前置条件设置复杂，skip 显式标注 |
| N3 | 设计文档验收标准 2 写"9 场景"但 §2 场景表实际列 12 个 | 设计文档小口径不一致，coder 按表实现正确 |

## 二、12 项标准逐条验证

### 标准 1: 框架接入 — ✅ PASS

- package.json devDependencies 含 `@playwright/test: ^1.49.0` ✅
- pnpm-lock.yaml 解析版本 1.62.1，semver ^ 兼容 ✅
- node_modules 实际安装 1.62.1 ✅
- pnpm scripts: `test:e2e` = `playwright test`, `test:e2e:ui` = `playwright test --ui` ✅

**自报核实**: journal 70 标准对照表#1 写 "package.json devDependencies: `@playwright/test@^1.62.1`"，**与事实不符**——specifier 为 `^1.49.0`，1.62.1 是 lock 解析版本。记为 N1。

### 标准 2: playwright.config.ts — ✅ PASS

- 34 行 ≤ 300 ✅
- testDir: `./tests/e2e` ✅
- projects: 单项 `chromium` + `devices['Desktop Chrome']` ✅
- webServer: 双栈 (uvicorn :8000 + vite :5000), reuseExistingServer: true ✅
- timeout: 30_000, expect timeout: 5_000, webServer timeout: 15_000 ✅
- retries: CI?2:0, workers: CI?1:undefined ✅
- 设计 §1 六字段 (baseURL/webServer/testDir/workers/retries/projects) 全覆盖 ✅

### 标准 3: 4 spec 文件场景 — ✅ PASS

- 4 文件: requirement / pipeline / constraints / artifacts ✅
- R1-R3 (3) + P1-P3 (3) + C1-C3 (3) + A1-A3 (3) = 12 test cases ✅
- 与设计 §2 场景表逐一对应 ✅
- fixtures/harness.ts 含 navigateTo 辅助 + startHarnessSession 工具函数 ✅
- 注: 设计验收标准 2 写 "9 场景" 但 §2 表列 12 个，属于设计文档口径不一致 (N3)，coder 按表实现正确

### 标准 4: 裁决② 仅 Chromium — ✅ PASS

- projects 数组仅 1 项 `{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }` ✅
- 全项目 grep `firefox|webkit` 零命中 ✅

### 标准 5: 裁决③ 真实后端 — ✅ PASS

- 全 tests/e2e/ grep `page.route` 零命中 ✅
- webServer 声明 uvicorn :8000 + vite :5000 双栈 ✅
- 无 route mock 拦截 ✅

### 标准 6: 裁决① 方案 C 第 15 项 — ❌ FAIL (M1)

**结构正确**:
- check_e2e() 三级降级架构存在 ✅
- skip+WARN 输出格式正确 ✅
- skip 路径 return 0 (不阻塞闸门) ✅
- npx 不可用时也有 skip 路径 ✅

**检测逻辑三处 bug (M1)**:

| 子项 | 当前代码 | 正确值 | 影响 |
|---|---|---|---|
| chrome find maxdepth | `-maxdepth 2` | `-maxdepth 3` | chrome 二进制在 depth 3 (cache_dir/revision-dir/chrome-linux64/chrome)，maxdepth 2 永远找不到 |
| chrome path pattern | `*/chrome-linux/*` | `*/chrome-linux64/*` (Linux) | Playwright 1.62.1 在 Linux 用 `chrome-linux64` 目录 |
| headless shell filename | `chrome-headless-shell` | `headless_shell` | Playwright 1.62.1 的 headless shell 二进制名为 `headless_shell`，非 `chrome-headless-shell` |

**实证**: 在本沙箱安装 Playwright 1.62.1 chromium 后:
- `find ~/.cache/ms-playwright -maxdepth 2 -name 'chrome' -path '*/chrome-linux/*'` → 0 (bug: maxdepth)
- `find ~/.cache/ms-playwright -maxdepth 3 -name 'chrome' -path '*/chrome-linux64/*'` → 1 (正确)
- `find ~/.cache/ms-playwright -maxdepth 3 -name 'chrome-headless-shell' -path '*/chrome-headless-shell-linux64/*'` → 0 (bug: filename)
- `find ~/.cache/ms-playwright -maxdepth 3 -name 'headless_shell' -path '*/chrome-headless-shell-linux64/*'` → 1 (正确)

**后果**: 检测逻辑在所有环境下均返回 has_chromium=0，导致永远 skip，E2E 永远不执行。Spec 明确要求验证"误 skip 风险（有可用浏览器却被错误跳过）"——**此风险已实锤**。

**coder 自报核实**: journal 70 声称 "#15 skip 原因=预装 chromium headless shell 版本不匹配"。此说法**不准确**——真实原因是 find 命令参数错误导致检测函数根本无法定位浏览器，与版本匹配无关。即使版本匹配，当前逻辑也无法找到。

**修复方向**: 
1. chrome 检测: `find "$cache_dir" -maxdepth 3 -name 'chrome' \( -path '*/chrome-linux64/*' -o -path '*/chrome-linux/*' \)`
2. headless shell 检测: `find "$cache_dir" -maxdepth 3 -name 'headless_shell' -path '*/chrome-headless-shell-linux64/*'`
3. 或采用更健壮方案: `npx playwright install --dry-run 2>/dev/null` 或直接尝试 `pnpm test:e2e --list` 探测

### 标准 7: 裁决④ 技术栈基线 — ✅ PASS

- AGENTS.md 技术栈段: "E2E 测试: Playwright ^1.49.0（仅 Chromium，DOM级端到端）" ✅
- package.json: `@playwright/test: ^1.49.0` ✅
- 版本字符串一致 (^1.49.0) ✅
- convention-to-rule-mapping.md 新增行: "E2E 测试环境探测降级 | 无浏览器 skip+WARN | verify.sh #15 check_e2e | ⚠️ 人工审查 | F012" ✅
- P008 交叉验证: AGENTS.md ^1.49.0 ↔ package.json ^1.49.0 ↔ lock 1.62.1 (semver ^ 兼容) ✅

### 标准 8: 测试排除互斥 — ✅ PASS

- vitest.config.ts exclude 含 `tests/e2e/**` ✅
- ESLint globalIgnores 含 `tests/**` + `playwright.config.ts` ✅
- 两套测试体系无重叠执行 ✅
- Vitest 独立运行 99 测试全绿 (E2E spec 未被 vitest 拾取) ✅

### 标准 9: E2E 断言质量 — ❌ FAIL (M2)

**实际运行证据** (本沙箱安装 Playwright 1.62.1 chromium 后执行 `pnpm test:e2e`):

```
10 failed, 1 skipped, 1 passed (1.1m)
```

| 场景 | 结果 | 失败原因 |
|---|---|---|
| R1 完整提交流程 | FAIL | strict mode: `nav >> button[aria-current="page"]` 匹配失败 (页面未按预期导航) |
| R2 空提交拦截 | FAIL | `textarea[placeholder*="需求"]` 选择器未匹配实际元素 |
| R3 最近项目列表 | FAIL | 侧边栏 + 主内容双元素 strict mode violation |
| P1 无会话空态 | FAIL | `getByText(/无活动会话|开始新项目|暂无/)` 匹配 sidebar + main 双元素 |
| P2 SSE 驱动渲染 | FAIL | `getByText(/流程 DAG/)` strict mode 或元素未出现 |
| P3 闸门决策 | SKIP | `test.skip()` 显式跳过 (N2, 首版可接受) |
| C1 规则列表渲染 | FAIL | `getByText('约束配置')` 匹配 nav button + heading 双元素 |
| C2 开关切换 | **PASS** | `button[role="switch"]` 选择器精确，aria-checked 断言有效 |
| C3 新增手动规则 | FAIL | `getByRole('button', { name: /添加自定义规则/ })` 未匹配 |
| A1 无会话空态 | FAIL | `getByText('无活动会话')` 匹配 sidebar + main 双元素 |
| A2 文件树渲染 | FAIL | `getByText('产物管理')` 匹配 nav button + heading 双元素 |
| A3 闸门详情 | FAIL | `getByText('闸门详情')` 匹配 description text + heading 双元素 |

**根因**: `page.getByText()` 全页搜索匹配到侧边栏导航 + 主内容区双元素，触发 Playwright strict mode violation。设计 §7 选择器策略要求 "getByRole/getByText 优先" 但**必须限定作用域**。

**修复方向**:
1. 将文本选择器限定到主内容区: `page.getByRole('main').getByText('约束配置')`
2. 或用更精确的语义选择器: `page.getByRole('heading', { name: '约束配置' })`
3. R2 的 `textarea[placeholder*="需求"]` 需对齐实际 placeholder 文本
4. C3 的 `getByRole('button', { name: /添加自定义规则/ })` 需对齐实际按钮文本

**仅 C2 通过** 因使用 `button[role="switch"]` 精确选择器，证明语义选择器方案可行。

### 标准 10: .gitignore — ✅ PASS

- `playwright-report/` 已排除 ✅
- `test-results/` 已排除 ✅
- 无遗漏产物目录 ✅

### 标准 11: verify.sh 独立复跑 — ✅ PASS (条件)

- 环境恢复 (P009): uv pip 安装 + .venv 重建 (aliyun 镜像) ✅
- 15/15 PASS (#15 skip+WARN, P009 降级预期行为) ✅
- 后端 188 passed, 1 skipped, 覆盖率 92.98% ≥ 80% ✅
- uv.lock 零漂移 ✅
- 注: #15 skip 由 M1 检测 bug 导致，非 genuine no-browser

### 标准 12: 文档同步真实性 — ✅ PASS

- testing.md: 14→15 项 + E2E 段 (9 行) 增量与实现一致 ✅
- AGENTS.md: 技术栈段 +1 行 (Playwright) + 规则#10 14→15 更新 ✅
- convention-to-rule-mapping.md: +1 行 (E2E 环境探测降级) ✅
- api-spec.md: 零变动 (只消费) ✅
- AGENTS.md 3 行增量仅技术栈段 + 规则#10，无越权改动 ✅

## 三、歧义/自报核实

| # | 项目 | 裁定 | 理由 |
|---|---|---|---|
| α | journal 70 自报 specifier `^1.62.1` (实为 `^1.49.0`) | N1 建议更正 | 自报失实但不影响功能，specifier 正确 |
| β | coder 自报 "#15 skip 原因=版本不匹配" | **与事实不符** | 真实原因是 find 命令 maxdepth/路径/文件名三处 bug，非版本匹配问题；即使版本匹配也无法检测到 |
| γ | P3 `test.skip()` 闸门决策场景 | N2 可接受 | 首版 interrupt 前置条件复杂，skip 显式标注意图，后续迭代补全 |
| δ | 设计文档 "9 场景" vs 实际 12 场景 | N3 设计口径 | 设计验收标准 2 数量与 §2 表不一致，coder 按表实现正确 |

## 四、文件范围合规

- diff 锚点 c51eb33..a73c7dd: 18 文件 +419/−3 ✅
- 新增 6 文件: playwright.config.ts + 4 spec + fixtures/harness.ts ✅
- 修改 12 文件: .gitignore / AGENTS.md / convention-mapping / testing.md / eslint.config.mjs / package.json / pnpm-lock.yaml / verify.sh / vitest.config.ts / journal 70 / progress.txt / README.md ✅
- 禁区零触碰: .coze / 设计文档 / journal 69 / controller-specs / launch-prompts 未变动 ✅
- tests/e2e/** 审查只读未修改 ✅

## 五、verify.sh 独立复跑记录

| 环境 | 结果 | 备注 |
|---|---|---|
| 初始 (uv 缺失, .venv 缺失) | 11 PASS / 4 FAIL | P009: 4 项后端检查因 uv 缺失 FAIL |
| 恢复后 (uv 0.12.5 + .venv 重建, aliyun 镜像) | **15 PASS / 0 FAIL** | #15 skip+WARN (P009 预期), UV_FROZEN=1 |

## 六、E2E 真实执行记录

| 条件 | 结果 |
|---|---|
| Playwright 1.62.1 + chromium-1234 (镜像安装) | **10 failed / 1 skipped / 1 passed** (1.1m) |
| 主要失败模式 | strict mode violation: getByText() 匹配侧边栏+主内容双元素 |
| 唯一通过 | C2 开关切换 (使用精确 `button[role="switch"]` 选择器) |

## 七、行数合规

| 文件 | 行数 | 上限 | 合规 |
|---|---|---|---|
| playwright.config.ts | 34 | 300 | ✅ |
| requirement.spec.ts | 39 | 300 | ✅ |
| pipeline.spec.ts | 33 | 300 | ✅ |
| constraints.spec.ts | 42 | 300 | ✅ |
| artifacts.spec.ts | 42 | 300 | ✅ |
| fixtures/harness.ts | 33 | 300 | ✅ |

## 八、总评

F012 编码在框架接入、配置、仅 Chromium、真实后端、技术栈基线、测试排除、文档同步等方面执行正确，跨文档同步完整，verify.sh 15/15 PASS。

两个必须修复项均为功能性缺陷:
- **M1**: verify.sh 浏览器检测逻辑三处 bug (maxdepth/路径/文件名) 导致检测在所有环境下失效，方案 C 条件闸门退化为无条件 skip
- **M2**: E2E 选择器未限定作用域导致 10/12 场景 strict mode violation，实际运行大面积失败

建议修复后重审，修复范围: verify.sh check_e2e() 函数 + 4 个 spec 文件的选择器作用域。预计修复量小 (选择器限定 + find 参数修正)，无需设计变更。
