last_updated: 2026-08-17
status: active
owner: @K总

# 编码规范

## Agent 三大失败模式（PDF 原文）

Anthropic 总结的 Agent 长时间运行时的三种典型翻车姿势，编码 Agent 每次会话必须警惕：

1. **试图一步到位（One-shotting）**：Agent 在一个会话里把所有功能做完，上下文窗口耗尽，留下一堆没有文档的半成品代码。禁止：一次会话只做一个功能。
2. **过早宣布胜利**：看到已有进展就直接宣布任务完成，即使还有大量功能未实现。禁止：标记 passing 前必须跑完整测试套件 + e2e 验证。
3. **过早标记功能完成**：写完代码就标记为完成，没有做端到端测试。单元测试通过 ≠ 功能可用。禁止：curl 返回 200 ≠ 功能完成，必须检查响应内容和边界情况。

此外 Agent 擅长模式复制——代码库里有什么模式就忠实复制并放大，包括坏模式。这就是为什么需要架构约束层机械化执行。

## 前端 (TypeScript)
- strict 模式，禁止隐式 any 和 as any
- 函数参数、返回值、事件对象需有明确类型
- 清理未使用的变量和导入
- 使用 Tailwind CSS 进行样式开发

## 后端 (Python)
- 使用 type hints
- 禁止裸 print()，统一用 logging
- Pydantic 模型用于请求/响应校验
- FastAPI 路由函数使用 async def
- LangGraph Node 是纯函数: 接收 State 返回 State

## 日志规范（Anthropic 上下文窗口污染缓解）

PDF Anthropic 案例的关键 Harness 设计——Agent 运行时上下文窗口是稀缺资源，过多日志输出会污染上下文，导致 Agent 无法聚焦关键信息。

- **最小化控制台输出**：Node 执行时只输出关键状态变更（阶段进入/退出、错误），不输出中间数据
- **日志写入文件**：结构化日志写入 `logs/` 目录，不直接打印到 stdout
- **grep 友好的错误格式**：`ERROR: [模块] [原因]` 单行格式，便于 Agent 用 grep 快速定位
- **预计算聚合统计**：输出"5 个测试失败，3 个在 routes 层"而非原始堆栈；Agent 需要详情时再查文件

## 踩坑记录规则

遇到非平凡问题并修复后，**必须**执行以下流程：

1. 在 `docs/conventions/pitfalls.md` 新增一条记录（编号 P + 递增序号）
2. 记录必须包含：错误特征、根因、修复方案、关联文件、预防规则
3. 如果踩坑属于高危/易复发类型，将预防规则同步写入 AGENTS.md 硬性规则，并在规则后标注 `[P0xx]`
4. 在 `progress.txt` 中追加一条记录，标注 `pitfall` 类型
5. 在对应 `harness-journal/stage-xx/` 文档的"验证结果"段引用踩坑编号

查找机制：遇到报错时，用错误关键词在 `pitfalls.md` 中搜索，匹配错误特征字段。

## 通用
- 提交信息: feat/fix/refactor/docs/test/chore
- 文件命名: 前端 kebab-case，后端 snake_case
