# Journal 74 — F012 M1/M2 修复 Coder 执行报告

| 字段 | 值 |
|---|---|
| journal | 74 |
| 阶段 | stage-04-coding |
| 功能 | F012 Playwright E2E |
| 角色 | coder (修复) |
| 日期 | 2026-08-21 |
| 提交 | 221cef3 |
| 变更 | 6 文件, +40/-47 行 |

## 委派来源
K总委派, Controller Spec: docs/handbook/controller-specs/f012-fix-m1-m2.md

## 修复内容

### M1: verify.sh check_e2e 检测逻辑三处修正

| # | 原代码 | 修正后 | 根因 |
|---|---|---|---|
| 1 | `-maxdepth 2` | `-maxdepth 3` | Playwright chromium 二进制在 cache 深度 3 (`~/.cache/ms-playwright/chromium-XXXX/chrome-linux64/chrome`) |
| 2 | `-path '*/chrome-linux/*'` | `\( -path '*/chrome-linux64/*' -o -path '*/chrome-linux/*' \)` | Playwright 1.62+ 使用 `chrome-linux64` 目录名 |
| 3 | `-name 'chrome-headless-shell'` | `\( -name 'headless_shell' -o -name 'chrome-headless-shell' \) + 兼容路径` | 新旧 Playwright 版本二进制命名不同(-1161: `headless_shell`, -1234: `chrome-headless-shell`), 兼容两种模式 |

**环境证据** (真实 find 输出):
- 修正后 chromium 检测: 2 个匹配 (chromium-1161 + chromium-1234)
- 修正后 headless shell 检测: 2 个匹配 (旧+新两种命名)
- 旧逻辑 chromium 检测: 0 个匹配 (确认 M1 bug — maxdepth 2 遗漏全部)
- 旧逻辑 headless 检测: 0 个匹配 (确认 M1 bug — 文件名不匹配)

### M2: E2E 选择器限作用域, strict mode violation 清零

| 修正类别 | 涉及文件 | 详情 |
|---|---|---|
| placeholder 匹配 | requirement.spec.ts, harness.ts | `textarea[placeholder*="需求"]` → `textarea[placeholder*="描述你想构建"]` (实际 placeholder 不含"需求") |
| localStorage key | requirement/pipeline/constraints/artifacts.spec.ts | `harness-recent-sessions` → `harness_recent_sessions` (对齐 recentSessions.ts STORAGE_KEY) |
| heading 限定 | constraints/artifacts.spec.ts | `getByText('约束配置')` → `getByRole('heading', {name:'约束配置'})`; 同理 '产物管理'/'产物文件树'/'闸门详情' |
| main 作用域 | 所有 4 个 spec | `page.getByText(X)` → `page.locator('main').getByText(X)` 隔离侧边栏重复文本 |
| table 多表 | constraints.spec.ts | `main.locator('table')` → `main.locator('table').first()` (规则表+Linter表双表) |
| manual 多行 | constraints.spec.ts | `main.getByText('manual')` → `main.getByText('manual').first()` (新增后双行) |
| C2 等待状态 | constraints.spec.ts | toggle click 后用 `expect(toggle).toHaveAttribute('aria-checked', ...)` 等待 API 状态更新, 而非立即 `getAttribute` |
| C3/P2 真实会话 | constraints/pipeline.spec.ts | localStorage 设桩 → `startHarnessSession()` 创建真实后端会话, 使 projectId 非空 |

## 8 项标准对照表

| # | 标准 | 状态 | 证据 |
|---|---|---|---|
| 1 | M1-a: maxdepth 2→3 | ✅ PASS | verify.sh 第270行 `-maxdepth 3`; find 真实输出 2 匹配 |
| 2 | M1-b: chrome-linux→chrome-linux64 | ✅ PASS | verify.sh 第270行 `-path '*/chrome-linux64/*'` 包含于或组合; find 真实输出 2 匹配 |
| 3 | M1-c: chrome-headless-shell→headless_shell | ✅ PASS | verify.sh 第271行 `\( -name 'headless_shell' -o -name 'chrome-headless-shell' \)` 兼容双命名; find 真实输出 2 匹配 |
| 4 | M2-a: 12 test case 选择器已限作用域 | ✅ PASS | 所有 getByText/getByRole 已限 main/heading; 0 strict mode violation |
| 5 | M2-b: β 歧义—所有执行/skip 结论附真实运行输出 | ✅ PASS | 本报告"真实执行结果"段逐条附 Playwright 输出; find 检测附真实匹配数 |
| 6 | 零源码触碰 (server/ + src/ 不动) | ✅ PASS | git diff 仅 6 文件: verify.sh + tests/e2e/ 下 5 文件 |
| 7 | verify.sh 15/15 PASS + uv.lock 零漂移 | ✅ PASS | UV_FROZEN=1 前置, verify.sh 输出 "15 passed, 0 failed" |
| 8 | P011 双向核对: 恰目标文件集合 | ✅ PASS | git diff --cached --stat: 6 files, +40/-47, 无额外文件 |

## 真实执行结果

| 测试 | 结果 | 耗时 | 说明 |
|---|---|---|---|
| A1 | ✅ pass | 1.1s | 无会话空态 |
| A2 | ✅ pass | 5.9s | 文件树+统计卡 |
| A3 | ✅ pass | 1.6s | 闸门详情14项 |
| C1 | ✅ pass | 1.1s | 规则列表(表限.first()) |
| C2 | ✅ pass | 2.5s | 开关翻转(等待API状态) |
| C3 | ✅ pass | 16.0s | 新增手动规则(真实会话) |
| P1 | ✅ pass | 1.0s | 无会话空态 |
| P2 | ✅ pass | 20.9s | DAG渲染(真实会话+SSE) |
| P3 | ⏭ skip | — | test.skip() 设计预留 |
| R1 | ✅ pass | 1.3s | 完整提交流程 |
| R2 | ✅ pass | 5.6s | 空提交拦截 |
| R3 | ✅ pass | 0.9s | 最近项目列表(localStorage key修正) |

**汇总**: 11 passed / 1 skipped / 0 failed / 0 strict mode violation

## 验证环境表

| 项 | 值 |
|---|---|
| OS | Linux (sandbox) |
| Node | v24.x |
| pnpm | 10.x |
| Python | 3.12.3 |
| Playwright | 1.62.1 |
| Chromium | 1161 + 1234 (双版本安装) |
| UV_FROZEN | 1 (零漂移) |
| verify.sh | 15/15 PASS |

## P 编号命中

| P# | 场景 | 处理 |
|---|---|---|
| P009 | 沙箱网络受限→浏览器下载 | 环境已有浏览器双版本, M1修正后检测正常 |
| P010 | UV_DEFAULT_INDEX→uv.lock漂移 | UV_FROZEN=1 防护, 零漂移确认 |
| P011 | 平台hookspath自动stage | git diff --cached --stat 双向核对, 恰6文件无额外 |

## 自报歧义清单

| # | 歧义 | 裁定/处理 |
|---|---|---|
| α | headless_shell 命名跨版本不一致 | 兼容双命名(`-name 'headless_shell' -o -name 'chrome-headless-shell'`), 非单一替换, 环境证据支撑 |
| β | 无 | 上轮β歧义(自报失实)已在本次标准5中兑现——所有结论附真实运行输出 |
