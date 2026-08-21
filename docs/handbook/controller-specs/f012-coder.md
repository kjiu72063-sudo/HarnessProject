# F012 Coder Controller Spec — Playwright DOM级端到端测试

> 委派链: journal 68（设计Draft验收）→ journal 69（审批落地+本委派）→ **journal 70 = coder 执行记录** → journal 71 = test-reviewer 审查记录（预留禁占）
> 设计文档（已 Approved）: `docs/design/feature-f012-playwright-e2e.md`（200 行 + 裁决注记）——唯一实现依据，冲突时以设计文档为准

## 任务

按已 Approved 的设计文档实现 Playwright E2E 测试体系：依赖接入 + 配置 + 4 页面 9 场景 + verify.sh 方案 C 条件闸门 + 跨文档同步。

## 硬性约束（违反即 FAIL）

1. **技术栈基线更新（裁决④）**：`AGENTS.md` 技术栈段新增 Playwright（版本须与 package.json 实际安装一致，P008 交叉验证）
2. **依赖管理**：pnpm 安装 `@playwright/test`（设计指定 ^1.49.0），pnpm-lock.yaml 更新提交；**禁止 npm/yarn**
3. **网络受限（P009）**：浏览器二进制下载失败不得 FAIL 闸门——按设计 §5 三级方案（镜像→预装探测→skip 降级）实现
4. **verify.sh 集成（裁决①方案 C）**：条件第 15 项——浏览器可用→执行 E2E，不可用→skip + WARN（非 FAIL）；14 项原有闸门行为零变动
5. **单文件 ≤300 行 / 单函数 ≤50 行**；TS 严格类型，禁 `as any`
6. **禁改清单**：`.coze`、`docs/design/feature-f012-playwright-e2e.md`、journal 68/69/71、本 Spec 与 launch prompt、`progress.txt` 既有行（只可追加）
7. **提交规范**：commit message 用 `test(F012): ...` 前缀；提交前 `git status --short` + `git diff --cached --stat` 双向核对（P011）
8. **环境防护**：全程 `UV_FROZEN=1`；不触碰 uv.lock（本 feature 前端为主，若后端零改动则 lock 零漂移）

## 验收标准（12 项）

| # | 标准 | 验证方式 |
|---|---|---|
| 1 | package.json 含 `@playwright/test ^1.49.0` devDependency + pnpm-lock.yaml 同步 | 文件检查 |
| 2 | `playwright.config.ts` 按设计 §1 六字段（baseURL/webServer 双栈/use/timeout/retries/reporter） | 文件检查 |
| 3 | `tests/e2e/` 目录 + 4 页面 9 场景全实现（设计 §2 场景表逐条对应） | 文件+用例检查 |
| 4 | 【裁决②】仅 Chromium，projects 配置单浏览器，无 Firefox/WebKit 残留 | 配置检查 |
| 5 | 【裁决③】E2E 走真实后端：webServer 拉起 FastAPI + Vite，API 闭环（SSE 场景覆盖 PipelinePage） | config+用例检查 |
| 6 | 【裁决①】verify.sh 第 15 项条件闸门：浏览器可用→执行，不可用→skip+WARN 非 FAIL，退出码语义正确 | 脚本检查+无浏览器环境实测 |
| 7 | 【裁决④】AGENTS.md 技术栈段新增 Playwright 且版本与 package.json 一致 | 交叉验证 |
| 8 | pnpm script 新增（`test:e2e` 等，设计 §1） | package.json 检查 |
| 9 | 跨文档同步：`docs/conventions/testing.md`（E2E 口径）+ `docs/conventions/convention-to-rule-mapping.md`（新行）+ api-spec 零变动（只消费） | 文件 diff |
| 10 | E2E 实际可跑：沙箱内按设计 §5 三级方案至少验证一条路径（有浏览器全过 or 无浏览器 skip+WARN 且 14 项基线全过） | 运行证据入 journal |
| 11 | verify.sh 复跑 14 项基线全 PASS + 第 15 项行为符合裁决① + uv.lock/pnpm-lock 漂移符合预期（pnpm-lock 应有变更，uv.lock 零漂移） | 独立复跑 |
| 12 | ESLint/dependency-cruiser 对新目录不报错（tests/e2e 纳入或排除配置正确） | 工具运行 |

## 开放问题处理

无未决项——4 项开放问题已全部裁决（journal 69），按"硬性约束"执行。

## 产出物

1. 代码：playwright.config.ts + tests/e2e/*.spec.ts + package.json/scripts + verify.sh 第 15 项
2. 文档：AGENTS.md 技术栈段 + testing.md + convention-to-rule-mapping.md
3. journal 70（`harness-journal/stage-04-coding/70-f012-coder-execution.md`）
4. progress.txt 追加 1 行（coding-done）

## 自报义务

journal 70 必须含：环境表（浏览器可用性/下载路径）、P 编号命中（预期 P009/P010/P011）、自报歧义清单（无则声明无）、verify.sh 第 15 项行为实测证据。
