last_updated: 2026-08-17
status: active

# 编码规范

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
