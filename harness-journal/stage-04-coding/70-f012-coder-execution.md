# Journal 70 — F012 Playwright E2E Coder 执行记录

| 字段 | 值 |
|---|---|
| 功能 | F012 Playwright E2E |
| 阶段 | stage-04-coding |
| 角色 | coder |
| 日期 | 2026-08-20 |
| commit | (待提交) |
| 前序 journal | 69 (设计Approved + coder委派) |
| 后续 journal | 71 (test-reviewer 审查预留) |

## 产出概览

- 13 文件变更: 6 新增 + 7 修改, +325/-3 行
- 新增 `tests/e2e/` 目录含 4 spec 文件 + 1 fixtures 共享模块
- 新增 `playwright.config.ts` 配置文件
- verify.sh 从 14 项扩展至 15 项 (条件闸门方案 C)
- 跨文档同步: AGENTS.md / testing.md / convention-to-rule-mapping.md

## 12 项 Spec 标准对照表

| # | 标准 | 结果 | 证据 |
|---|---|---|---|
| 1 | @playwright/test 已安装 | ✅ | package.json devDependencies: `@playwright/test@^1.62.1` |
| 2 | playwright.config.ts 存在且合法 | ✅ | 34 行, projects=[chromium], webServer 双栈 (FastAPI :8000 + Vite :5000), timeout=30s |
| 3 | tests/e2e/ 含 4 spec 文件 | ✅ | requirement.spec.ts / pipeline.spec.ts / constraints.spec.ts / artifacts.spec.ts |
| 4 | 仅 Chromium 项目 (裁决①②) | ✅ | projects 数组仅 `{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }` |
| 5 | 真实后端 webServer 双栈 (裁决③) | ✅ | webServer[0]=uvicorn :8000, webServer[1]=vite :5000, reuseExistingServer=true |
| 6 | verify.sh 方案 C 条件第 15 项 (裁决①) | ✅ | check_e2e() 三级降级: ready→run / system-browser→env / no-browser→skip+WARN(退出码0) |
| 7 | Playwright 纳技术栈基线 (裁决④) | ✅ | AGENTS.md 技术栈段新增 "E2E: Playwright (Chromium only)" |
| 8 | pnpm scripts 添加 | ✅ | `test:e2e` = `playwright test`, `test:e2e:ui` = `playwright test --ui` |
| 9 | Vitest 排除 tests/e2e/ | ✅ | vitest.config.ts exclude 新增 `tests/e2e/**` |
| 10 | ESLint 排除 tests/e2e/ | ✅ | eslint.config.mjs ignores 新增 `tests/e2e/` |
| 11 | 9 场景覆盖 4 页面 | ✅ | R1/R2/R3 + P1/P2/P3 + C1/C2/C3 + A1/A2/A3 = 12 test cases |
| 12 | 跨文档同步完成 | ✅ | testing.md E2E 段 + #15 行; convention-mapping 新行; AGENTS.md 技术栈+verify 14→15 |

## 裁决绑定验证

| 裁决 | 绑定标准 | 落地方式 |
|---|---|---|
| ① verify.sh 方案 C 条件第 15 项 skip+WARN | 标准 6 | check_e2e() 三级降级, no-browser 时 exit 0 + WARN |
| ② 仅 Chromium | 标准 4 | projects 数组仅 1 项 chromium |
| ③ 真实后端 webServer 双栈 | 标准 5 | uvicorn :8000 + vite :5000, reuseExistingServer=true |
| ④ Playwright 纳技术栈基线 | 标准 7 | AGENTS.md E2E 行 + verify #15 |

## 环境表

| 项 | 值 |
|---|---|
| @playwright/test 版本 | 1.62.1 |
| 浏览器二进制 | 预装 chromium-1161 (headless shell 不匹配, 走 skip 路径) |
| verify.sh 结果 | 15/15 PASS (#15 skip+WARN, P009 降级预期行为) |
| Vitest 结果 | 18 文件 99 测试全 PASS (E2E spec 已排除) |
| pnpm 版本 | 10.12.1 |

## P 编号命中

| P# | 描述 | 处理 |
|---|---|---|
| P009 | 网络受限浏览器下载失败 | 三级降级: skip+WARN, exit 0, 不阻塞闸门 |
| P010 | UV_DEFAULT_INDEX 残留 | 未触发 (E2E 不涉及 uv lock 操作) |
| P011 | 平台 hookspath 自动 stage | git status 核实仅 13 意图文件变更 |

## 新增文件清单

```
playwright.config.ts                          34 行 (配置)
tests/e2e/fixtures/harness.ts                 33 行 (共享 fixtures + navigateTo 辅助)
tests/e2e/requirement.spec.ts                 39 行 (R1/R2/R3)
tests/e2e/pipeline.spec.ts                    33 行 (P1/P2/P3)
tests/e2e/constraints.spec.ts                 42 行 (C1/C2/C3)
tests/e2e/artifacts.spec.ts                   42 行 (A1/A2/A3)
```

## 修改文件清单

```
.gitignore                                    +4  (playwright-report/ + test-results/)
AGENTS.md                                     +2/-1  (技术栈+verify 14→15)
docs/conventions/convention-to-rule-mapping.md +1  (Playwright E2E 行)
docs/conventions/testing.md                   +14/-1  (E2E 段 + #15 行)
eslint.config.mjs                             +2  (ignores tests/e2e/)
package.json                                  +3  (devDep + 2 scripts)
pnpm-lock.yaml                                +38  (自动更新)
scripts/verify.sh                             +37/-1  (check_e2e + #15 + 头部注释)
vitest.config.ts                              +1  (exclude tests/e2e/**)
```

## 自报歧义

无歧义。4 项裁决全部按 K 总批准方案机械执行，无自由裁量空间。
