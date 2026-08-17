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

## 通用
- 提交信息: feat/fix/refactor/docs/test/chore
- 文件命名: 前端 kebab-case，后端 snake_case
