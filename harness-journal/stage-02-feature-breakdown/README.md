# 阶段2 — 功能拆分与设计

> 状态：⬜ 待执行

## 前置条件
- 阶段1 信息层全部完成
- AGENTS.md 和 docs/ 已就绪

## 计划步骤

### 01 - 功能拆分
- 读取 feature_list.json
- 将 10 个功能拆分为前端/后端子任务
- 确定开发顺序（按依赖关系）
- 产出：功能开发文档（docs/design/feature-xxx.md）

### 02 - 设计文档编写
- 为每个功能编写设计文档，使用模板：
  ```
  # Feature: [功能名称]
  ## Status: Draft | Approved | In Progress | Implemented
  ## 目标
  ## 非目标
  ## 技术方案
  ## 验收标准
  ## 依赖
  ```
- 产出：docs/design/ 下的设计文档集合

## 对应 feature_list.json
- F002: LangGraph 编排引擎
- F003: 可插拔 LLM 提供商层
- F004: 约束管理层
- F005: 代码执行沙箱
- F006: 前端平台 UI
- F007-F010: 后续功能

## 产出物
- `docs/design/feature-langgraph-engine.md`
- `docs/design/feature-llm-provider.md`
- `docs/design/feature-constraint-manager.md`
- `docs/design/feature-code-sandbox.md`
- `docs/design/feature-frontend-ui.md`

## 验证结果
（开发时补充）
