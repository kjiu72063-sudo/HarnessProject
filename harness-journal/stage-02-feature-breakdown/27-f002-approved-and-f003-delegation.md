# F002 Approved + F003 修订委派

**时间**: 2026-08-18T09:30Z
**阶段**: stage-02-feature-breakdown
**角色**: L1 项目管控 Agent
**类型**: 状态推进 + 委派

## 事件

### F002 LangGraph 编排引擎 → Approved

L3 校验 Agent 完成 F002 R3 聚焦校验：
- Part A: R2 发现的 1 项跨文档缺陷（route_loop_budget 运算符 >= vs >）已修复，与 F011 §6 规则 3 完全对齐
- Part B: 4 项修订影响检查全部通过
- Part C: 3 项修订范围确认全部通过，R1+R2 共 12 项修复完整性验证全部保持
- 无新引入缺陷

F002 缺陷链闭合：
```
初始 Draft (103 行) → 6 致命缺陷 → R1 (199 行) → 6 新缺陷 → R2 (224 行) → 1 新缺陷 → R3 (225 行) → 通过 → Approved
```

L1 操作：
- F002 Status: Draft → Approved
- feature_list F002: todo → approved

### F003 可插拔 LLM 提供商层 → 修订委派

F003 初版设计文档（123 行）存在 3 项缺陷：
1. [概念] "零改动扩展"夸大 → 改为接口层零改动 + 实现层需新增子类
2. [跨文档] Token 用量未落 State → HarnessState 新增 token_usage_total + complete_with_state 累加
3. [跨文档] 错误处理不一致 → 新增 LLMError 自定义异常 + 统一 raise + Node try/except

产出文件：
- Controller Spec: docs/handbook/controller-specs/f003-design-writer-revision.md（10 条验收标准）
- L3 启动提示词: docs/handbook/launch-prompts/f003-revision-launch.md

## 流程
L3 R3 校验通过 → L1 推进 F002 Approved → L1 读取 F003 设计文档 → L1 产出 F003 Controller Spec → L1 生成 L3 启动提示词 → 等待 K总开会话

## 当前设计文档状态
| 文档 | Status | 行数 | 缺陷链 |
|---|---|---|---|
| F011 Agent Runtime | Approved | 271 | 闭合 |
| F002 LangGraph 编排 | Approved | 225 | 闭合 |
| F003 LLM 提供商 | Draft (待修订) | 123 | 3 项缺陷待修 |
| F006 前端 UI | Draft (待修订) | — | 待 F003 后处理 |
