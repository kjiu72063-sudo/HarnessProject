# 功能拆分与设计文档

## 步骤名称
Sprint 1 功能拆分 → 设计文档编写（F002/F003/F006）

## 执行时间
2026-08-17

## 前置条件
- 原型确认通过（07-prototype-confirmation.md）
- feature_list.json F001 passing, F002-F010 todo
- 架构文档(harness-flow/boundaries/state-design/api-spec)已就绪
- 设计文档模板(_template.md)已定义

## 执行内容

### 1. 设计文档编写
按 _template.md 为 Sprint 1 三个功能各写设计文档：

#### F002 LangGraph 编排引擎
- 8 个 Node 全部定义（initializer → information_layer → feature_breakdown → coding_agent → validation → merge_deploy → observability → entropy）
- 6 个 Conditional Edge 路由函数
- 反馈循环 + DRR 长循环路径
- API: POST /harness/start + GET /harness/{id}/state + GET /harness/{id}/stream(SSE stub)
- Node 接口: 纯函数 (HarnessState) → HarnessState
- F002 先用 stub 实现，不依赖 F003

#### F003 可插拔 LLM 提供商层
- LLMProvider Protocol: complete + complete_with_state
- OpenAIProvider 首个实现
- get_llm_provider 工厂函数
- Pydantic schema: Message/LLMConfig/LLMResponse/TokenUsage
- settings.py 新增 5 个配置项
- 不暴露 API，为 F002 Node 内部服务

#### F006 前端平台 UI
- 4 页面组件拆分（RequirementPage/PipelinePage/ConstraintsPage/ArtifactsPage）
- 11 个子组件（Sidebar/Header/StageNode/DiamondNode/LogPanel/StatusBadge 等）
- API 封装: apiFetch + harness/projects/constraints
- TS 类型与 Pydantic 对应
- 状态管理: React useState + 轮询(2s)
- DESIGN.md 视觉规范执行

### 2. 交叉检查
- 依赖方向: F001 → F002 → F003, F001 → F006, F002 → F006 ✅ 无循环
- F003↔F002 接口: complete_with_state(HarnessState) → (LLMResponse, HarnessState) ✅ 一致
- F006↔F002 API: /harness/start + /state + /stream ✅ 路径和参数一致
- Pydantic↔TS: HarnessState TypedDict ↔ TS HarnessState ✅ 字段对应
- 非目标冲突: SSE stub(F002) ↔ 轮询替代(F006) ✅ 两端各自声明
- 全部 Status: Draft

## 产出物
- `docs/design/feature-f002-langgraph.md` (Draft)
- `docs/design/feature-f003-llm-provider.md` (Draft)
- `docs/design/feature-f006-frontend-ui.md` (Draft)

## 验证结果
✅ 3 个设计文档按模板填写，无空段
✅ 验收标准具体可验证（含覆盖率 ≥80%）
✅ F002→F003 依赖关系明确
✅ F006 API 变更与 F002 routes 对应
✅ 非目标明确列出
⬜ 待 K总审批 → Status Draft → Approved

## 备注
- F002 先用 stub Node 实现，F003 实现后替换 LLM 调用
- SSE 完整逻辑在 F007，本次 F002 仅建立连接+推送 stub, F006 用轮询替代
- 审批通过后才能进入编码阶段（阶段3/4）
