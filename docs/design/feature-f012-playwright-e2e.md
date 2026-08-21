last_updated: 2026-08-20
status: draft
owner: @K总

# Feature: F012 Playwright DOM级端到端测试

## Status: Approved

> **K总裁决（2026-08-20，journal 69）：4 项开放问题全部按 design-writer 建议采纳**——①verify.sh 集成形态=方案 C（条件第 15 项：有浏览器→执行，无→skip+WARN）②浏览器范围=仅 Chromium ③E2E 后端=真实后端（完整 API 闭环）④Playwright 纳入技术栈基线（编码阶段同步 AGENTS.md）。

## 目标

引入 Playwright 对 4 页面进行 DOM 级端到端测试，覆盖跨页面导航、真实 API 闭环、SSE 事件驱动渲染等组件测试无法触及的集成路径，弥补当前仅有 vitest 组件测试的验证缺口（PDF 三大失败模式之一："写完代码就标记完成，却没有做端到端测试"）。

## 非目标

- 不替代 vitest 组件测试——两者互补（组件测 prop 行为，E2E 测集成路径）
- 不做视觉回归/性能负载测试——首版聚焦 DOM 结构与交互正确性
- 不新增 API 端点——E2E 消费既有 /api/harness/* + /api/constraints/* + /api/sandbox/*
- 不支持多浏览器并行——首版仅 Chromium（理由见 §3.2）
- 不在编码阶段前修改 verify.sh 闸门语义——集成方案属设计决策，实施绑编码阶段

## 技术方案

### 1. 框架接入设计（验收标准 1）

**依赖**：`@playwright/test: ^1.49.0`（devDependencies）

> Playwright 属新增测试工具，纳入技术栈基线需 K总 审批时确认，AGENTS.md 技术栈段编码阶段同步。

**playwright.config.ts 关键配置**：

```typescript
import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: { baseURL: 'http://localhost:5000', trace: 'on-first-retry', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    { command: 'uv run uvicorn server.main:app --host 0.0.0.0 --port 8000', port: 8000, reuseExistingServer: true, timeout: 15_000 },
    { command: 'pnpm exec vite --host 0.0.0.0 --port 5000', port: 5000, reuseExistingServer: true, timeout: 15_000 },
  ],
})
```

**目录结构**：`tests/e2e/`（项目根目录，Playwright 约定，与 src/ 同级），含 `requirement.spec.ts` / `pipeline.spec.ts` / `constraints.spec.ts` / `artifacts.spec.ts` + `fixtures/harness.ts`（共享固件）。

**pnpm script**：`"test:e2e": "playwright test"`, `"test:e2e:ui": "playwright test --ui"`

### 2. 四页面 E2E 场景设计（验收标准 2）

#### RequirementPage

| # | 场景 | 步骤 | 验证点 |
|---|---|---|---|
| R1 | 完整提交流程 | 填写项目名+需求+技术栈 → 提交 | 页面转至流程监控（sessionId 非空） |
| R2 | 空提交拦截 | 不填字段 → 点提交 | 表单校验提示可见 |
| R3 | 最近项目列表 | 有已存在会话时导航至需求页 | RecentProjects 侧栏 ≥1 条目 |

#### PipelinePage

| # | 场景 | 步骤 | 验证点 |
|---|---|---|---|
| P1 | 无会话空态 | 未启动会话时导航至流程监控 | 空态提示 + "开始新项目"引导 |
| P2 | SSE 驱动渲染 | 启动会话后导航至流程监控 | DAG 8节点 + SSE指示器 + 阶段状态变更 |
| P3 | 闸门决策 | 会话到达 interrupt 闸门 | DecisionPanel 可见 → 通过 → 继续运行 |

#### ConstraintsPage

| # | 场景 | 步骤 | 验证点 |
|---|---|---|---|
| C1 | 规则列表渲染 | 有活动会话时导航至约束页 | 列表非空 + rule_type/enabled/enforcer 可见 |
| C2 | 开关切换 | 点击 enabled 开关 | 状态翻转 + PUT 请求发出 |
| C3 | 新增手动规则 | 填 rule_type+title → 提交 | 新规则出现在列表 + source=manual |

#### ArtifactsPage

| # | 场景 | 步骤 | 验证点 |
|---|---|---|---|
| A1 | 无会话空态 | 未启动会话时导航至产物页 | "无活动会话"提示 |
| A2 | 文件树渲染 | 会话含 code_artifacts 时导航 | FileTree + 统计卡(文件数/行数/覆盖率) |
| A3 | 闸门详情 | 有 verify_result 时 | GateDetailSection 渲染 14 项 |

**E2E 与组件测试分界原则**：

| 留 vitest | 上 Playwright |
|---|---|
| 单组件 prop 驱动渲染 | 跨页面导航流转 |
| mock API 行为断言 | 真实 API 闭环 |
| 事件回调触发逻辑 | SSE 事件流驱动 UI 变更 |
| 纯函数/工具函数单测 | 多步骤用户操作序列 |
| 组件内部状态转换 | 闸门→恢复→继续端到端路径 |
| CSS/DOM 结构断言 | 真实浏览器渲染验证 |

### 3. 运行环境策略（验收标准 3）

#### 3.1 webServer 编排

Playwright webServer 直接声明双栈服务（不调 dev.sh），原因：dev.sh 用 `&` 后台+exec 前端，Playwright 需独立探测两端口。`reuseExistingServer: true` 允许复用已运行服务。启动顺序：8000（后端先）→ 5000（前端后，依赖 8000 代理）。

#### 3.2 浏览器范围

**首版仅 Chromium**，理由：(1) React+Tailwind 无浏览器特异，Chromium 即全平台覆盖；(2) 单浏览器 CI ~30s vs 全家桶 ~90s，下载 ~100MB vs ~300MB；(3) DOM 级关注结构非引擎差异；(4) 后续仅需追加 projects 配置即可扩展。

#### 3.3 CI/沙箱受限环境行为

| 环境状态 | 行为 | 退出码 |
|---|---|---|
| ready（浏览器已安装） | 正常执行 E2E | 测试结果决定 |
| system-browser（系统有浏览器） | PLAYWRIGHT_BROWSERS_PATH=0 用系统浏览器 | 测试结果决定 |
| no-browser（无浏览器） | skip + `⚠️ E2E skipped: no browser binary` | 0（不阻塞） |

探测逻辑编码阶段实现为 shell 函数 `detect_playwright_env()`。

### 4. verify.sh 集成方案（验收标准 4）

| 方案 | 描述 | 优点 | 缺点 |
|---|---|---|---|
| A. 第 15 项 | 无条件 `pnpm test:e2e` | 单闸门不变 | 无浏览器→verify FAIL；时长 +30~60s |
| B. 独立脚本 | scripts/e2e.sh 闸门外调用 | verify 时长不变 | E2E 脱离闸门 |
| C. 条件第 15 项 | 有浏览器→执行；无→skip+WARN | 单闸门保持+环境安全+P009 对齐 | skip 时覆盖缺口 |

**推荐方案 C**：(1) 单闸门哲学——所有检查仍在 verify.sh；(2) 环境安全——no-browser 时 exit 0 不阻塞（P009 先例）；(3) 渐进收紧——CI 预装后自然升级为强制；(4) 时长可控——Chromium 单浏览器 ~30s。

闸门实现示意（编码阶段）：`detect_playwright_env == "no-browser"` → skip+WARN(PASS)；否则 `pnpm test:e2e`。

testing.md 验证表追加：第 15 行 = `playwright-e2e | Playwright DOM级E2E（条件执行：无浏览器时 skip+WARN）`

### 5. 网络受限可行性（验收标准 5）

**浏览器二进制获取三级方案**：

| 优先级 | 方案 | 环境变量 | 说明 |
|---|---|---|---|
| 1 | 镜像下载 | `PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright` | 国内沙箱首选 |
| 2 | 预装探测 | `PLAYWRIGHT_BROWSERS_PATH=0` | 用系统已装 chromium |
| 3 | 降级 skip | 无 | 探测失败 → skip+WARN, exit 0 |

安装流程（编码阶段）：镜像安装 → 失败则探测系统浏览器 → 都不可用则不阻塞（verify.sh skip+WARN）。

**P009 关联**：同根因（沙箱出站网络受限），解决模式一致：镜像→本地替代→降级 skip。浏览器下载属编码阶段事项，设计只给方案。

### 6. 数据契约（验收标准 6）

**E2E 不新增 API**——

| 场景 | 消费端点 |
|---|---|
| R1 需求提交 | `POST /api/harness/start` |
| P2 SSE 渲染 | `GET /api/harness/{id}/stream` |
| P3 闸门决策 | `POST /api/harness/{id}/resume` |
| C1/C2/C3 约束操作 | `GET/POST/PUT /api/constraints*` |
| P1/A1 空态 | 无 API（sessionId=null） |

**testing.md 回写**：E2E 规范段绑编码阶段（F004 裁决①先例），设计仅声明范围——新增「E2E 测试」章节 + 验证表第 15 行。

**convention-to-rule-mapping.md** 新增行：`E2E 测试环境探测降级 | 无浏览器 skip+WARN | verify.sh #15 | ⚠️ 人工审查`

### 7. 测试策略自反（验收标准 7）

**选择器策略**：(1) getByRole/getByText 优先（最接近用户心智模型）；(2) getByTestId 后备（动态文本/无语义元素）；(3) CSS 选择器禁止。data-testid 仅加在动态内容（如 sessionId 截断）上，语义元素不加。

**超时基线**：导航/定位 30s（CI 慢启动）；断言 5s（DOM 变更 <1s+裕量）；SSE 等待 15s（对齐心跳）；webServer 就绪 15s。

**Flake 处置**：`retries: CI?2:0`；`trace: on-first-retry`；`screenshot: only-on-failure`；spec 级 beforeAll/afterAll 隔离会话状态。

**覆盖率闸门**：**E2E 不计入 80% 基线**——(1) Vitest V8 不采集 E2E 路径；(2) 两者测量正交维度；(3) 插桩复杂度远超收益。verify.sh #9 `--cov-fail-under=80` 不变。

### 8. 文档自身（验收标准 8）

≤300 行（见行计数）；遵循 _template.md 骨架；开放问题显式列出。

## 验收标准

1. ✅ 框架接入：@playwright/test 版本 + config 6 字段(baseURL/webServer/testDir/workers/retries/projects) + tests/e2e/ + pnpm script
2. ✅ 四页面场景：9 场景(每页面≥2) + 分界原则 6 条
3. ✅ 运行环境：webServer 双栈编排 + 仅Chromium(4理由) + 三级行为表
4. ✅ verify.sh 集成：3候选比较 + 推荐C(4理由) + 时长评估
5. ✅ 网络受限：三级方案(镜像/预装/skip) + P009关联 + 安装流程
6. ✅ 数据契约：不新增API(5端点消费表) + testing.md口径 + convention-mapping行
7. ✅ 测试自反：选择器3级 + 超时4维 + flake4条 + 覆盖率排除(3理由)
8. ✅ 文档自身：≤300行 + 模板骨架 + 开放问题显式

## 依赖

- F006 前端平台 UI（已 passing）——4 页面可渲染
- F002 LangGraph 编排引擎（已 passing）——/api/harness/* 可用
- F007 SSE 实时状态推送（已 passing）——PipelinePage SSE 可测试
- F004 约束管理层（已 passing）——/api/constraints/* 可用

## 开放问题（提交 K总裁决）

1. **verify.sh 集成形态**：方案 A/B/C，推荐 C——影响闸门时长与环境策略
2. **浏览器范围**：仅 Chromium（推荐）vs Chromium+Firefox——影响 CI 时长与下载体积
3. **真实后端 vs route mock**：默认真实后端（完整 API 闭环），route mock 更快但跳过后端验证
4. **Playwright 纳入技术栈基线**：AGENTS.md 需新增，编码阶段同步——需 K总 审批时确认
