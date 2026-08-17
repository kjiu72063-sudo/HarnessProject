last_updated: 2026-08-17
status: active

# 约定 → 机械规则对照表

PDF 原文: "经验法则:如果一条规则在 Code Review 中被提过 3 次以上,就应该写成 Linter 规则。"

| 团队口头约定 | 机械化规则 | 实现方式 | 状态 |
|---|---|---|---|
| 前端不直接调后端代码 | 前端 src/ 禁止 import server/ | dependency-cruiser 自定义规则 | ✅ 已配置 |
| 前端不硬编码域名/IP | 前端禁止 localhost/IP/域名 | AGENTS.md 硬性规则 #1 [P001] | ✅ 已配置 |
| routes 不直接操作数据库 | server.routes 禁止 import server.models | import-linter forbidden contract | ✅ 已配置 |
| Node 不操作 HTTP 响应 | server.nodes 禁止 import server.routes | import-linter forbidden contract | ✅ 已配置 |
| 禁止循环依赖 | 任何模块间循环依赖 | dependency-cruiser + ESLint import/no-cycle | ✅ 已配置 |
| 后端禁裸 print() | ruff 检查 + AGENTS.md 硬性规则 #2 | ruff T201 规则 | ⬜ 待启用 |
| 前端禁 as any | ESLint @typescript-eslint/no-explicit-any | ESLint recommended 含此规则 | ✅ 已配置 |
| POST 用 Pydantic Body | AGENTS.md 硬性规则 #8 [P003] | 文档约束（人工审查） | ✅ 已记录 |
| 测试覆盖率 ≥ 80% | pytest-cov --cov-fail-under=80 | verify.sh 闸门强制 | ✅ 已配置 |
| Python 版本 ≥ 3.11 | pyproject.toml requires-python | pyproject.toml 约束 | ✅ 已配置 |
| pnpm 版本 ≥ 9 | package.json engines | package.json 约束 | ✅ 已配置 |

## 新增规则流程

当 Code Review 中发现某个问题被提过 3 次以上时:
1. 判断是否可以机械化（Linter 规则 / 架构约束 / 类型系统）
2. 如可以，在对应工具中添加规则
3. 规则错误信息使用三要素公式: `❌ [什么错了] ✅ FIX: [怎么改] 📖 See: [哪个文档]`
4. 在本表新增一行
5. 运行 `scripts/verify.sh` 确认不冲突
