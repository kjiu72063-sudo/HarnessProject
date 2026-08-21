last_updated: 2026-08-17
status: active
owner: @K总

# 测试规范

## 前端测试
- 框架: Vitest（与 Vite 原生集成）
- 类型: 单元测试 + 组件测试
- 覆盖率: 行覆盖率 ≥ 80%（由 verify 闸门强制）
- 命名: `*.test.ts(x)`，与源文件同目录或 `__tests__/` 下

## 后端测试
- 框架: pytest + pytest-asyncio
- 类型: 单元测试（Node 纯函数测试）+ 集成测试（API 端到端）
- 覆盖率: 行覆盖率 ≥ 80%（由 verify 闸门强制）
- 命名: `test_*.py`，与源文件同目录或 `tests/` 下
- LangGraph Node 测试: 输入 State → 调用 Node → 断言输出 State

## 验证流程
所有检查绑定到 `scripts/verify.sh`，一次执行（15 项），等价于 PDF 中的 `mvn verify` 闸门：

| # | 检查项 | 说明 |
|---|---|---|
| 1 | `pnpm ts-check` | 前端 TypeScript 类型检查 |
| 2 | `pnpm lint` | 前端 ESLint（含 max-lines / max-lines-per-function / import/no-cycle / no-restricted-syntax） |
| 3 | `pnpm vitest run --passWithNoTests` | 前端单元测试（无测试文件时通过，有测试时强制执行） |
| 4 | `pnpm lint:style` | 前端 CSS Lint（Stylelint + stylelint-config-standard） |
| 5 | `npx depcruise` | 前端分层依赖检查 |
| 6 | `uv run ruff check` | 后端 Lint（含 T20 print 检查） |
| 7 | `uv run mypy` | 后端类型检查 |
| 8 | `uv run lint-imports` | 后端分层依赖检查（含三要素错误信息） |
| 9 | `uv run pytest --cov --cov-fail-under=80` | 后端单元测试 + 覆盖率 ≥ 80% |
| 10 | doc-freshness | 文档新鲜度（>60 天未更新则失败） |
| 11 | file-size | 文件 ≤ 300 行 + Python 函数 ≤ 50 行 |
| 12 | tech-stack-alignment | AGENTS.md 声明版本与 package.json / pyproject.toml 实际版本一致 [P008] |
| 13 | git-tracking | progress.txt 和 feature_list.json 必须被 Git 追踪 [P004] |
| 14 | port-consistency | .preview expose_port 与 vite.config.ts port 一致 |
| 15 | playwright-e2e | Playwright DOM级E2E（条件执行：无浏览器时 skip+WARN） |

任何一项失败即整体失败。

## E2E 测试

- 框架: Playwright（仅 Chromium，DOM级端到端）
- 类型: 跨页面导航 + 真实 API 闭环 + SSE 事件驱动渲染验证
- 目录: `tests/e2e/`，与 `src/` 同级（Playwright 约定）
- 命名: `*.spec.ts`，每页面一个 spec 文件
- 配置: `playwright.config.ts`（双栈 webServer: FastAPI 8000 + Vite 5000）
- 覆盖率: **E2E 不计入 80% 基线**（Vitest V8 不采集 E2E 路径，两者测量正交维度）
- 运行: `pnpm test:e2e`（CI）或 `pnpm test:e2e:ui`（本地调试）
- 环境策略: 有浏览器→执行；无浏览器→skip+WARN（P009 先例），verify.sh 第 15 项条件闸门
- 选择器: getByRole/getByText 优先 → getByTestId 后备 → CSS 选择器禁止

## Agent 自我验证规则
PDF 原文: "Agent 写完代码就标记为完成，却没有做端到端测试" 是三大失败模式之一。
- 标记 feature 为 passing 前，必须运行完整测试套件
- 单元测试通过 ≠ 功能可用，必须做端到端验证
- curl 命令通过 ≠ 功能完成，必须检查响应内容和边界情况
