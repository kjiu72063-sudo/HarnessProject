# 03 - 架构设计与技术方案

## 步骤名称
设计 LangGraph 架构、接口、数据库表、前端选型，以及落地顺序和重难点

## 执行时间
2026-08-17

## 前置条件
- 功能设计与原型草图已确认

## 执行内容

### 1. 整体架构

```
┌─────────────┐    ┌───────────────────────────┐    ┌──────────────┐
│   前端 Web   │    │        后端 API 层         │    │   数据库层   │
│  (React/Vite)│◀──▶│      (FastAPI/Python)      │◀──▶│ (PostgreSQL) │
│              │SSE │ · 项目管理 API              │    │              │
│ · 需求输入    │◀──▶│ · Harness 编排 API          │    │ · 项目表     │
│ · 流程监控    │    │ · 约束管理 API              │    │ · Agent状态表│
│ · 约束配置    │    │ · 产物管理 API              │    │ · 规则表     │
│ · 产物查看    │    │ · 实时状态推送 (SSE)        │    │ · 进度表     │
└─────────────┘    └──────────┬──────────────────┘    └──────────────┘
                              │
                   ┌──────────▼──────────────────┐
                   │     LangGraph 编排引擎层     │
                   │  · StateGraph (8阶段拓扑)   │
                   │  · Conditional Edges        │
                   │  · Cycles (反馈循环)        │
                   │  · Checkpointer (持久化)    │
                   │  · 可插拔 Node 层            │
                   └──────────┬──────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │  LLM 提供商    │ │  工具执行沙箱  │ │  代码仓库管理  │
    │  (可插拔)      │ │  (Docker隔离)  │ │  (Git/Worktree)│
    │  OpenAI 首个   │ │  mvn verify   │ │               │
    └───────────────┘ └───────────────┘ └───────────────┘
```

### 2. LangGraph State 设计

核心 State 字段分 6 组：
- 项目信息：project_id, project_name, tech_stack
- 上下文层：agents_md, rules, boundaries, docs_index, current_docs
- 持久化记忆：progress, feature_list, git_log
- 编码产物：code_artifacts, worktree_branch
- 校验结果：verify_result, test_result
- 反馈循环：feedback_log, issue_type, issue_resolved

### 3. LangGraph 拓扑结构

Node 列表（共 20 个）：
- 阶段0: initializer
- 阶段1: requirement_refiner, architect, page_planner, prototype_dev, constraint_builder, info_aggregator
- 阶段2: feature_splitter, doc_designer, doc_reviewer, dispatcher
- 阶段3: coding_session_start
- 阶段4: coder, verify_gate
- 阶段5: test_runner, issue_classifier, doc_lookup, debugger, feedback_loop, human_interrupt
- 阶段6: merger, deployer
- 阶段7: observability
- 阶段8: entropy_manager

Conditional Edges（6 个决策菱形）：
1. 原型确认? → 未通过回到 page_planner
2. 设计审批通过? → 未通过回到 doc_designer
3. 测试结果? → 失败进入 issue_classifier
4. 解决成功? → 失败进入 human_interrupt
5. 审查通过? → 未通过回到 coder
6. 验收通过? → 未通过进入 feedback_loop (DRR长循环)

Cycles（2 个核心循环）：
1. 反馈循环：feedback_loop → coder（虚线回路）
2. DRR长循环：observability(失败) → feedback_loop → coder

### 4. 可插拔接口设计

4 个抽象接口：
- LLMProvider：chat(), stream() — OpenAI/DeepSeek/Doubao/Claude
- CoderNode：execute(state) — SpringBootCoder/NestJSCoder
- ConstraintRule：check(code, state), error_message() — ArchUnitRule/CheckstyleRule
- CodeSandbox：run(command, cwd) — DockerSandbox/LocalSandbox

### 5. 数据库表设计

6 张核心表：
- projects — 项目表
- constraint_rules — 约束规则表
- feature_list — 功能列表表
- feedback_log — 反馈循环日志表
- entropy_records — 熵管理记录表
- agent_sessions — Agent 会话记录表

（LangGraph checkpoint 表由 PostgresSaver 自动管理）

### 6. 前端技术选型

- 框架：React 18 + TypeScript + Vite 7
- 状态推送：SSE (Server-Sent Events)
- UI 组件：Tailwind CSS
- 图表：Recharts
- 代码高亮：Monaco Editor

### 7. 落地顺序

```
第一步：跑通最小闭环（2周）
  FastAPI + LangGraph + PostgreSQL
  只做 Java 1.8 + Spring Boot
  只做 3 个 Node：需求→编码→校验

第二步：补全 Harness 流程（3-4周）
  补全 8 阶段所有 Node
  加入反馈循环 + 约束层 + 持久化记忆

第三步：前端 + 实时监控（2周）
  React 前端 + SSE 实时推送

第四步：可插拔 + 多技术栈（持续迭代）
  Docker 沙箱 + 第二技术栈 + 熵管理
```

## 产出物
- 整体架构图
- HarnessState TypedDict 设计
- LangGraph Graph 拓扑代码
- 4 个可插拔抽象接口
- 6 张数据库表 DDL
- 前端技术选型
- 4 步落地顺序

## 验证结果
用户确认技术栈版本锁定：
- 前端：React 18 + Vite
- 后端：Python 3.12 + FastAPI + LangGraph
- 数据库：PostgreSQL
- LLM：OpenAI ChatGPT
- 项目名：harness-platform

## 备注
架构设计文档后续落地到 `docs/architecture/` 目录中，作为版本控制的制品。
