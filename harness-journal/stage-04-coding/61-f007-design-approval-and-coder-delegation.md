# journal 61: F007 设计 Approved + coder 委派三件套

**时间**: 2026-08-20T21:40Z
**角色**: L1 项目管控 Agent
**类型**: HITL 闸门落地 + 委派记录

## 一、K总裁决（2026-08-20，原文口径）

5 项待裁决全部收口（journal 60 §二转呈项）：

| # | 事项 | 裁决 |
|---|---|---|
| ①事件粒度 | Node 级 vs 字段级 diff | 按 design-writer 建议采纳：首版 Node 级 + snapshot 全量推送 |
| ②轮询回退 | 是否保留轮询兜底 | 按 design-writer 建议采纳：首版不保留（内置重连 + 404 终止） |
| ③多订阅 | 并发 EventSource | 按 design-writer 建议采纳：首版单订阅，broadcast 留后续 |
| α docstring 归属 | 替换 vs 保留溯源 | **替换为 F007**（不保留 F006/F009 历史标记） |
| β handler 绑定点 | start 注入 vs 惰性创建 | **start_harness() 构造注入**（与执行同生，首事件 snapshot 兜底补偿） |

## 二、落地动作

1. 设计文档 Status: Draft → **Approved**（头部裁决注记，5 项全列）
2. feature_list.json：F007 status todo → **approved** + description 补裁决要点
3. coder 委派三件套产出：
   - `docs/handbook/controller-specs/f007-coder.md`（12 项验收标准，6 项裁决绑定为标准 4-8）
   - `docs/handbook/launch-prompts/f007-coder-launch.md`
   - journal 编号分配见 §四

## 三、设计要点摘录（供 coder 会话快速定位）

- 8 事件类型：stage-start/stage-end/snapshot/status/gate/done/error/heartbeat，15s 心跳
- 方案 B：SSECallbackHandler 自定义回调，Node 边界发事件，graph 拓扑零改动
- stub 真实化：生成器 = snapshot 兜底 → queue 消费 → 心跳 → done/error 退出
- 前端：useSSE hook + PipelinePage 轮询改 EventSource + 四组件消费方映射
- 无 F009 依赖（内存事件环），断线回放显式界定为首版不支持

## 四、journal 编号调整（F005 journal 49 §4 同构）

原 journal 60 §三计划"61=coder/62=审查"。因本审批落地批次占用 61，调整为：
**62 = coder 执行记录（coder 自写）｜63 = test-reviewer 审查记录（预留禁占）**

## 五、后续流程

K总 派生 F007 coder（粘贴 launch prompt 全文）→ coder 报告 → L1 流程验收（四类行，journal 64 届时分配）→ test-reviewer 委派（journal 63 预留）→ 审查通过则闭环 passing / 有 M 则修复循环。
