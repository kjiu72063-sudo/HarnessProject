last_updated: 2026-08-17
status: active

# 设计文档模板

Agent 执行复杂功能前，先填写此模板。审批通过后再动手写代码。这就是"明确意图"的工程化实现。

## 使用方法

1. 复制此模板到 `docs/design/feature-xxx.md`
2. 填写各字段
3. Status 从 Draft → Approved → In Progress → Implemented 流转
4. 审批通过（Approved）后才能开始编码

## 模板

```markdown
# Feature: [功能名称]

## Status: Draft | Approved | In Progress | Implemented

## 目标
一句话描述这个功能要解决什么问题。

## 非目标
明确列出这次不做什么（防止 Agent 扩大范围）。

## 技术方案

### 涉及的模块
- src/ : 前端页面/组件变更
- server/routes/ : 新增 API 端点
- server/graph/ : LangGraph Node 变更
- server/schemas/ : Pydantic 模型变更

### 数据模型变更
如有数据库变更，写在这里（Alembic 迁移脚本路径：server/migrations/versions/xxx.py）

### API 变更
POST /api/xxx
Request: { ... }
Response: { ... }

## 验收标准
- 标准 1: 具体的、可验证的
- 标准 2: 具体的、可验证的
- 测试覆盖率 ≥ 80%
- 对应的 ESLint / ruff 规则通过
- 依赖 feature-xxx（已实现）

## 依赖
列出依赖的其他 feature 或外部条件。
```

## Status 流转规则

| 状态 | 含义 | 谁能流转 |
|---|---|---|
| Draft | 初稿，尚未审查 | 任何人创建 |
| Approved | 审查通过，可以开始编码 | 人工审批 |
| In Progress | 正在开发中 | 编码 Agent |
| Implemented | 已实现并通过验证 | 编码 Agent（验证通过后自动流转） |
