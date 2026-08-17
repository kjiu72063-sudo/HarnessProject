last_updated: 2026-08-17
status: active
owner: @K总

# 约定 → 机械规则对照表

PDF 原文: "经验法则:如果一条规则在 Code Review 中被提过 3 次以上,就应该写成 Linter 规则。"

| 团队口头约定 | 机械化规则 | 实现方式 | 状态 |
|---|---|---|---|
| 前端不直接调后端代码 | 前端 src/ 禁止 import server/ | dependency-cruiser 自定义规则 | ✅ 已配置 |
| 前端不硬编码域名/IP | 前端禁止 localhost/IP/域名 | AGENTS.md 硬性规则 #1 [P001] | ✅ 已配置 |
| routes 不直接操作数据库 | server.routes 禁止 import server.models | import-linter forbidden contract | ✅ 已配置 |
| Node 不操作 HTTP 响应 | server.nodes 禁止 import server.routes | import-linter forbidden contract | ✅ 已配置 |
| 禁止循环依赖 | 任何模块间循环依赖 | dependency-cruiser + ESLint import/no-cycle | ✅ 已配置 |
| 后端禁裸 print() | ruff T201 规则 + AGENTS.md 硬性规则 #2 | ruff T20 规则族 | ✅ 已配置 |
| 前端禁 as any | ESLint @typescript-eslint/no-explicit-any | ESLint recommended 含此规则 | ✅ 已配置 |
| POST 用 Pydantic Body | AGENTS.md 硬性规则 #8 [P003] | 文档约束（人工审查） | ✅ 已记录 |
| 测试覆盖率 ≥ 80% | pytest-cov --cov-fail-under=80 | verify.sh 闸门强制 | ✅ 已配置 |
| Python 版本 ≥ 3.11 | pyproject.toml requires-python | pyproject.toml 约束 | ✅ 已配置 |
| pnpm 版本 ≥ 9 | package.json engines | package.json 约束 | ✅ 已配置 |
| 文件要短 | 单文件 ≤ 300 行 | ESLint max-lines + verify.sh 检查 | ✅ 已配置 |
| 方法要短 | 单方法/函数 ≤ 50 行 | ESLint max-lines-per-function + verify.sh AST 检查 | ✅ 已配置 |

## 新增规则流程

当 Code Review 中发现某个问题被提过 3 次以上时:
1. 判断是否可以机械化（Linter 规则 / 架构约束 / 类型系统）
2. 如可以，在对应工具中添加规则
3. 规则错误信息使用三要素公式: `❌ [什么错了] ✅ FIX: [怎么改] 📖 See: [哪个文档]`
4. 在本表新增一行
5. 运行 `scripts/verify.sh` 确认不冲突

## Linter 管理指导（PDF 踩坑指南）

### 逐条添加
PDF 原文: "逐条添加 Linter 规则，每加一条都让 Agent 试跑一遍"。
- 不要一次性添加多条规则，防止 Agent 陷入"修一个错误又触发另一个"的死循环
- 每加一条规则后运行 `scripts/verify.sh` 验证不产生误报
- 确保每条规则的错误信息使用三要素公式给出具体代码片段

### 豁免白名单
PDF 原文: "架构约束太严，阻碍合理的跨层调用" → "设置豁免白名单机制"。
- 当某条分层规则拦截了合理的跨层调用时，不要直接删除规则
- 在规则配置中添加豁免条件（如 dependency-cruiser 的 `from.to.path` 排除特定路径）
- 豁免必须在配置中可见，不能通过全局 ignore 绕过
