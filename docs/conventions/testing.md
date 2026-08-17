last_updated: 2026-08-17
status: active

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
- 所有测试绑定到 `scripts/verify.sh`，一次执行
- 前端: `pnpm ts-check` + `pnpm lint` + `pnpm test`
- 后端: `ruff check` + `mypy` + `pytest --cov`
- 任何一项失败即整体失败（等价于 PDF 中的 mvn verify 闸门）

## Agent 自我验证规则
PDF 原文: "Agent 写完代码就标记为完成，却没有做端到端测试" 是三大失败模式之一。
- 标记 feature 为 passing 前，必须运行完整测试套件
- 单元测试通过 ≠ 功能可用，必须做端到端验证
- curl 命令通过 ≠ 功能完成，必须检查响应内容和边界情况
