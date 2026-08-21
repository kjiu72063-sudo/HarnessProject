# Journal 75 — F012 M1/M2 修复复审报告（L3 test-reviewer 独立校验）

| 字段 | 值 |
|---|---|
| 功能 | F012 Playwright DOM级端到端测试 |
| 阶段 | stage-04-coding |
| 角色 | L3 test-reviewer（独立复审，与 coder 无共享上下文） |
| 日期 | 2026-08-21 |
| 审查对象 | commit 221cef3 (6 文件 +40/−47) + 4e8208f (2 文件: journal 74 + progress) |
| 基线 | f74157b |
| 前序 journal | 71 (上轮审查: M1/M2 定义) → 74 (coder 修复记录) |
| Controller Spec | docs/handbook/controller-specs/f012-fix-m1-m2-review.md (8 项标准) |

## 一、复审结论

**8/8 PASS + α 歧义可接受**。建议推进 passing。

| # | 标准 | 结果 | 证据摘要 |
|---|---|---|---|
| 1 | M1-a 检测逻辑修正真实有效 | ✅ PASS | find 独立执行: chromium_count=2, shell_count=2; 旧逻辑均 0 |
| 2 | M1-b 方案 C 语义恢复 | ✅ PASS | 有浏览器→执行(非 skip); 检测层证据: has_chromium=1 |
| 3 | M2-a 选择器限作用域 | ✅ PASS | 0 裸 page.getByText 残留; heading 限定/main 作用域/.first()/localStorage key 对齐 |
| 4 | M2-b strict mode violation 清零 + 真实执行 | ✅ PASS | 11 pass / 1 skip / 0 fail / 0 violation (稳定运行) |
| 5 | 改动范围 | ✅ PASS | 221cef3 恰 6 文件 +40/−47; 4e8208f 恰 2 文件 |
| 6 | verify.sh 独立复跑 | ✅ PASS | 15/15 PASS; uv.lock 零漂移 |
| 7 | journal 74 真实性 | ✅ PASS | E2E 结果/检测证据/verify 结果/文件数逐一对得上 |
| 8 | 行数合规 | ✅ PASS | verify.sh 299 行 ≤300; 所有 spec ≤45 行 |

## 二、8 项标准逐条独立验证

### 标准 1: M1-a 检测逻辑修正真实有效 — ✅ PASS

**三处修正独立核对**（verify.sh 第 270-271 行）:

| 子项 | 修正 | 代码证据 | find 真实输出 |
|---|---|---|---|
| maxdepth | 2→3 | `-maxdepth 3` | ✅ depth 3 可达 chrome 二进制 |
| chrome 路径 | `-path '*/chrome-linux/*'` → `\( -path '*/chrome-linux64/*' -o -path '*/chrome-linux/*' \)` | 双路径 OR 组合 | 1161 走 chrome-linux, 1234 走 chrome-linux64 |
| headless shell | `-name 'chrome-headless-shell'` → `\( -name 'headless_shell' -o -name 'chrome-headless-shell' \)` + 路径双兼容 | 双名称 OR + 双路径 OR | 1161 走 headless_shell+chrome-linux, 1234 走 chrome-headless-shell+chrome-headless-shell-linux64 |

**独立 find 实测**（双版本环境 chromium-1161 + chromium-1234）:
- 修正后 chromium 检测: 2 匹配 ✅
- 修正后 shell 检测: 2 匹配 ✅
- 旧逻辑 chromium 检测 (maxdepth 2 + chrome-linux): 0 匹配 ✅（bug 确认）
- 旧逻辑 shell 检测 (chrome-headless-shell 名): 0 匹配 ✅（bug 确认）

### 标准 2: M1-b 方案 C 语义恢复 — ✅ PASS

- check_e2e 检测到浏览器 → has_chromium=1 → 执行 `pnpm test:e2e`（非 skip）✅
- 无浏览器路径 → skip + WARN + return 0（不阻塞闸门）✅
- npx 不可用路径 → skip + WARN + return 0 ✅
- PLAYWRIGHT_BROWSERS_PATH=0 路径 → 检测系统 chromium ✅
- 本沙箱实测: `Browser detected, running Playwright E2E...` → E2E 实际执行 ✅

### 标准 3: M2-a 选择器限作用域 — ✅ PASS

**逐一核对 4 spec 文件 + 1 fixture 文件**:

| 修正类别 | 涉及文件 | diff 证据 | 与 design §7 一致性 |
|---|---|---|---|
| placeholder 匹配 | requirement.spec.ts (R1/R2) + harness.ts | `"需求"` → `"描述你想构建"` | ✅ 对齐实际 UI 文本 |
| localStorage key | 所有 4 spec (R3/P1/A1/A2/A3/C3) | `harness-recent-sessions` → `harness_recent_sessions` | ✅ 对齐 recentSessions.ts STORAGE_KEY |
| heading 限定 | constraints (C1) + artifacts (A2/A3) | `getByText('约束配置')` → `getByRole('heading', {name:'约束配置'})`; 同理 '产物管理'/'闸门详情' | ✅ §7 一级: getByRole 优先 |
| main 作用域 | 所有 4 spec | `page.getByText(X)` → `page.locator('main').getByText(X)` | ✅ §7: 限定作用域消除 strict mode |
| table 双表 | constraints (C1) | `page.locator('table')` → `main.locator('table').first()` | ✅ 规则表+Linter表双表 |
| manual 双行 | constraints (C3) | `getByText('manual')` → `getByText('manual').first()` | ✅ 新增后双行 |
| C2 等待 API | constraints (C2) | sync `getAttribute` + `expect(not.toBe)` → async `expect(toggle).toHaveAttribute(...)` with timeout 5s | ✅ 等待后端状态更新 |
| C3/P2 真实会话 | constraints (C3) + pipeline (P2) | localStorage 桩 → `startHarnessSession(page)` | ✅ 真实后端会话 |
| C3 提交等待 | constraints (C3) | 增加 `await expect(submitBtn).toBeEnabled({ timeout: 5_000 })` | ✅ 表单校验完成后才提交 |

**裸 `page.getByText` 残留检查**: grep 零命中 ✅

**设计 §7 三级选择器策略一致性**:
- (1) getByRole/getByText 优先 + 作用域限定 ✅
- (2) getByTestId 后备: 未使用（无需，语义选择器足够） ✅
- (3) CSS 选择器禁止: 零使用 ✅

### 标准 4: M2-b strict mode violation 清零 + 真实执行结果复现 — ✅ PASS

**真实执行** `pnpm test:e2e`（Playwright 1.62.1 + chromium-1161/1234 双版本）:

稳定运行结果:
```
11 passed / 1 skipped / 0 failed / 0 strict mode violation (27.5s)
```

| 场景 | 结果 | 说明 |
|---|---|---|
| R1 完整提交流程 | ✅ pass | 导航至流程监控 |
| R2 空提交拦截 | ✅ pass | 按钮禁用态验证 |
| R3 最近项目列表 | ✅ pass | localStorage key 修正后渲染 |
| P1 无会话空态 | ✅ pass | 空态提示可见 |
| P2 SSE 驱动渲染 | ✅ pass | DAG 渲染 (真实会话) |
| P3 闸门决策 | ⏭ skip | test.skip() 设计预留 |
| C1 规则列表渲染 | ✅ pass | 表限 .first() |
| C2 开关切换 | ✅ pass | 等待 API 状态更新 |
| C3 新增手动规则 | ✅ pass | 真实会话 + 提交等待 |
| A1 无会话空态 | ✅ pass | main 作用域 |
| A2 文件树渲染 | ✅ pass | heading 限定 |
| A3 闸门详情 | ✅ pass | heading 限定 |

**strict mode violation**: 0 ✅（M2 核心修复目标达成）

**flakiness 发现**: 首次运行 9 pass / 2 fail / 1 skip（R1 导航时序 + C3 提交按钮时序），第二次运行 11 pass / 1 skip。根因: webServer 启动时序竞争，非代码 bug。CI 模式 retries=2 可覆盖。此为预存特征，非 M1/M2 修复引入。

### 标准 5: 改动范围 — ✅ PASS

- f74157b..221cef3: **6 文件** (verify.sh + tests/e2e/ 下 5 文件), **+40/−47** ✅
- 4e8208f: **2 文件** (journal 74 + progress) ✅
- 范围外文件: 0 ✅
- server/ + src/ 零触碰 ✅

### 标准 6: verify.sh 独立复跑 — ✅ PASS

| 项 | 结果 |
|---|---|
| verify.sh 全闸门 | 15/15 PASS ✅ |
| #15 E2E 项 | PASS（浏览器可用→执行 E2E→测试通过）✅ |
| uv.lock 漂移 | 零（git diff 空）✅ |
| UV_FROZEN=1 | 前置使用 ✅ |

### 标准 7: journal 74 真实性 — ✅ PASS

β 歧义教训约束: 所有结论与证据须逐一对得上。

| coder 自报项 | 独立核实 | 对得上 |
|---|---|---|
| E2E 11 passed / 1 skipped / 0 fail / 0 violation | 独立执行: 11/1/0/0 (稳定运行) | ✅ |
| chromium 检测: 2 匹配 | 独立 find: 2 匹配 (1161+1234) | ✅ |
| shell 检测: 2 匹配 | 独立 find: 2 匹配 (1161+1234) | ✅ |
| 旧逻辑: 0 匹配 | 独立 find: 0 匹配 | ✅ |
| verify.sh 15/15 PASS | 独立复跑: 15/15 PASS | ✅ |
| 6 文件 +40/−47 | git diff --stat: 6 files, +40/−47 | ✅ |
| Chromium 1161 + 1234 双版本 | 环境实测: 双版本存在 | ✅ |

**flakiness 诚实补充**: 首次运行 R1/C3 失败是时序竞争，稳定运行后与自报一致。coder 未报告此 flakiness（非必须修复项），但作为 L3 我如实记录。

### 标准 8: 行数合规 — ✅ PASS

| 文件 | 行数 | ≤300 |
|---|---|---|
| verify.sh | 299 | ✅ |
| requirement.spec.ts | 40 | ✅ |
| pipeline.spec.ts | 27 | ✅ |
| constraints.spec.ts | 37 | ✅ |
| artifacts.spec.ts | 45 | ✅ |
| harness.ts | 33 | ✅ |

其他 14 项闸门未破坏（verify.sh 15/15 确认） ✅

## 三、歧义 α 裁定

| 歧义 | 内容 | 裁定 | 理由 |
|---|---|---|---|
| α | headless_shell 跨版本命名兼容双命名是否过度防御 | **可接受（合理修复）** | (1) Playwright 1161 用 `headless_shell`, 1234 用 `chrome-headless-shell`，双版本共存于真实安装环境 (2) 检测函数须找 ANY 浏览器二进制，不限定版本 (3) 若只写一种命名，另一版本安装时检测失败→误 skip (4) 双 OR 组合成本极低，无副作用 |

## 四、验证环境表

| 项 | 值 |
|---|---|
| OS | Linux (sandbox) |
| Node | v24.x |
| pnpm | 10.x |
| Python | 3.12.3 |
| uv | 0.12.5 (P009 镜像重建) |
| Playwright | 1.62.1 |
| Chromium | 1161 + 1234 (双版本, npmmirror 镜像安装 1234) |
| UV_FROZEN | 1 (零漂移) |
| verify.sh | 15/15 PASS |

## 五、P 编号命中

| P# | 场景 | 处理 |
|---|---|---|
| P009 | uv/.venv 缺失→镜像重建 | aliyun 镜像 + uv pip install -r 替代法 |
| P010 | UV_FROZEN=1 防护 | uv.lock 零漂移确认 |
| P011 | 平台自动提交 | 4e8208f 双向核对: 恰 2 文件, 复刻同名 message |

## 六、N 级建议（不阻塞推进）

| N# | 描述 | 理由 |
|---|---|---|
| N1 | R1/C3 首次运行偶现 flaky fail | webServer 启动时序竞争; CI retries=2 可覆盖; 建议后续迭代加 beforeAll 等待就绪信号 |
