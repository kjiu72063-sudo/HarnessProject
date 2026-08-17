# 05 - 创建功能列表

## 步骤名称
feature_list.json — 所有功能的优先级和状态

## 执行时间
2026-08-17

## 前置条件
- 架构设计阶段已确定功能模块

## 执行内容

创建 `feature_list.json`，使用 JSON 格式（Anthropic 发现 JSON 比 Markdown 更有效，Agent 不太可能不当修改结构化数据）。

定义 10 个功能，按优先级排序：

| ID | 功能名称 | 优先级 | 初始状态 | 依赖 |
|----|---------|--------|---------|------|
| F001 | 项目初始化与骨架搭建 | 1 | passing | 无 |
| F002 | LangGraph 编排引擎 | 2 | todo | F001 |
| F003 | 可插拔 LLM 提供商层 | 3 | todo | F002 |
| F004 | 约束管理层 | 4 | todo | F002 |
| F005 | 代码执行沙箱 | 5 | todo | F002 |
| F006 | 前端平台 UI | 6 | todo | F001 |
| F007 | SSE 实时状态推送 | 7 | todo | F006 |
| F008 | 熵管理后台任务 | 8 | todo | F002 |
| F009 | 持久化记忆系统 | 9 | todo | F002 |
| F010 | 多技术栈可插拔 | 10 | todo | F004, F005 |

每个功能包含字段：
- `id`: 功能唯一标识
- `name`: 功能名称
- `priority`: 优先级（1=最高）
- `status`: todo / in_progress / passing / failed
- `description`: 功能描述
- `dependencies`: 依赖的其他功能 ID

## 产出物
- `feature_list.json` — 10 个功能的结构化列表

## 验证结果
JSON 格式合法，可被 python json.loads 解析

## 备注
功能列表对应 4 个 Sprint 计划（见 docs/plans/current-sprint.md）。每次功能完成后需更新 status 字段。
