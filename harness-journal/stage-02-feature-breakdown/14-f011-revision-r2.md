# F011 设计文档修订 Round 2

## 步骤名称
F011 Agent Runtime 设计文档 — 修复补审发现的 1 项跨文档缺陷 #7

## 执行时间
2026-08-18

## 前置条件
- F011 修订 Round 1 已完成（08-f011-revision-r1.md）
- L3 补审已完成（12-f011-re-review.md），发现缺陷 #7
- L1 已回退 F011 Approved→Draft 并委派 Round 2（13-f011-re-review-result-and-r2-delegation.md）

## 执行内容

### 1. 冷启动
按标准引导模板执行冷启动 5 步，读取 AGENTS.md / progress.txt / feature_list.json / current-sprint.md / harness-journal README + 最近 3 条 journal（11-re-review-delegation / 12-re-review / 13-re-review-result-and-r2-delegation）。

### 2. 读取待修订文档和参考文档
- 待修订文档：docs/design/feature-f011-agent-runtime.md（269 行，Status: Draft）
- 补审报告：12-f011-re-review.md（缺陷 #7 详情）
- 参考文档：_bootstrap.md（确认硬约束 8 条，第 8 条为 L3 校验独立性约束）

### 3. 修复缺陷 #7

**缺陷**：F011 §3 声称"硬约束 7 条"，但 _bootstrap.md 在 L1 越权纠正事件中新增了第 8 条，F011 未同步。

**三处修改**：

1. §3 硬约束计数 "7 条" → "8 条"，补列第 8 条：
   > 8. 产出会被独立 L3 校验 Agent 审阅——L1 只做流程检查不做内容质量判定，修订后必须重新校验。你需要对自己的产出质量负责。
   
   与 _bootstrap.md 第 8 条 4 个子条目语义对齐，保持 §3 单行简化风格。

2. 验收标准第 3 条 "硬约束 7 条" → "硬约束 8 条"，与 §3 计数同步。

3. 修订记录追加 Round 2 条目。

### 4. 未修改其他章节
仅修改 §3 硬约束计数和列表 + 验收标准第 3 条计数 + 修订记录段，不碰其他内容。

## 产出物
- `docs/design/feature-f011-agent-runtime.md`（修订后 271 行，Status: Draft）

## 验证结果

| # | 验收标准 | 结果 | 说明 |
|---|---|---|---|
| 1 | §3 硬约束计数 7→8 | ✅ | line 128: "硬约束 8 条" |
| 2 | §3 补列第 8 条内容 | ✅ | line 137: L3 校验独立性约束 |
| 3 | 补列内容与 _bootstrap.md 对齐 | ✅ | 4 个子条目语义全覆盖，单行简化风格一致 |
| 4 | 修订记录追加 Round 2 | ✅ | line 271: Round 2 条目 |
| 5 | 修订后 ≤ 300 行 | ✅ | 271 行 |
| 6 | 不修改其他章节 | ✅ | 仅 §3 + 验收标准第3条 + 修订记录段 |

## 备注
- journal 编号使用 14（13 已被 f011-re-review-result-and-r2-delegation 占用）
- 未修改 _bootstrap.md / AGENTS.md / 其他文档
- 未调用任何 skill
- 未修改 sub_id
- Status 仍为 Draft（待重审）
- 缺陷 #7 非修订 Round 1 引入，而是 L1 越权纠正事件（02:00Z）在 _bootstrap.md 新增第 8 条的副作用
