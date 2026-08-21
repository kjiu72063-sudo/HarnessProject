# journal 58: F007 设计委派（L1）

**时间**: 2026-08-20T20:15Z
**角色**: L1 项目管控 Agent
**类型**: 委派记录（journal 编号分配：58=本记录，59=design-writer 预留）

## 一、委派背景

F005 闭环（journal 57）后，K总 指令"F007 设计委派"。F007（SSE 实时状态推送）为 Sprint2 剩余三项之一（F007/F012/F013），当前 status=todo，无设计文档，按 F004/F005 先例先派设计 Agent。

## 二、设计输入核实（L1 流程级取证，内容判定归 K总 + test-reviewer）

- **stub 端点在案**：`server/routes/harness.py` L104-117 stream 端点存在，一次性推送即关闭；api-spec.md 已登记该端点条目（F002 遗留 stub）
- **前端轮询在案**：PipelinePage 测试断言 "polls session state"——消费方为轮询模式
- **编排层零事件出口**：graph/definition.py 无 stream/callback 命中
- **F009 依赖缺口**：断线回放所需持久化未实现（todo），设计需显式界定范围
- **docstring 归属口径**：stub 注释称"流式框架属 F006/F009"，与 feature_list 编号体系（F007）存在历史不一致——已列入 Spec 让 design-writer 澄清

## 三、委派三件套产出

| 产出 | 路径 |
|---|---|
| Controller Spec | docs/handbook/controller-specs/f007-design-writer.md（8 项验收标准） |
| 启动提示词 | docs/handbook/launch-prompts/f007-design-writer-launch.md |
| journal 预留 | 59 = design-writer 记录（本 journal 58 已占用） |

Spec 要点：SSE 事件契约 / 推送触发机制（三候选路径比较）/ stub 真实化 / 前端轮询→EventSource 改造 / 生命周期与断线语义（无 F009 显式界定）/ api-spec 回写绑编码（F004 裁决①先例）/ 测试策略 / ≤300 行。

硬性约束：技术栈基线不变（原生 StreamingResponse，禁 WebSocket/新依赖）、F002 拓扑不变、Node 委派桩原则、纯文档零代码。

## 四、后续流程

1. K总 派生 design-writer（粘贴 launch prompt 全文到新会话）
2. design-writer 产出 Draft → 报告 K总
3. L1 流程验收（四类行）→ 转呈开放问题
4. K总 设计审批 HITL 闸门（Approve/修订）
5. Approve 后 L1 产出 coder 委派三件套（journal 编号届时顺延分配）
