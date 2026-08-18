# Controller Spec: F003 修订 Round 2

## 基本信息

| 字段 | 值 |
|---|---|
| 任务编号 | F003-R2 |
| 角色 | design-writer (L3) |
| 操作类型 | 修订（非新建） |
| 目标文件 | docs/design/feature-f003-llm-provider.md |
| 当前状态 | Draft, 182 行 |
| 预期行数 | ≤ 200 行（增量极小） |

## 任务背景

L3 校验 Agent 全量校验 F003 R1 修订版，Part A 3 项原始缺陷全部修复，Part B 发现 2 项新跨文档缺陷。

## 缺陷清单

### [#1] 中等 / 跨文档一致性 — Node 集成示例与 F002 委派桩规范不一致

**位置**: F003 lines 136-155（Node 集成示例段）

**问题**: Node 集成示例展示 Node 直接调用 `get_llm_provider()` + `complete_with_state()` 并设置 `design_docs`，与 F002 §Node 委派桩规范（"Node 不含业务逻辑，通过 agent_runtime.delegate() 委派 L3 Agent"，lines 106-123）和 AGENTS.md 规则 #5（"Node 是委派桩/状态转换器，不含业务逻辑"）不一致。`complete_with_state` 方法专为 Node 级调用设计，进一步强化了 Node 直接调用模式。F003 全文未提及"委派"、"Agent Runtime"或"L3 Agent"。

**修法（推荐方案 B）**:

在 Node 集成示例段添加注释段，标注：
1. 本示例为 **meta 层简化展示**，展示 LLM Provider 的调用接口
2. **runtime 层**（F011 §9 meta 层 vs runtime 层）Agent Runtime 就绪后，LLM 调用应在 L3 Agent 内执行
3. Node 仅做委派（通过 `agent_runtime.delegate()`）和状态更新
4. `complete_with_state` 方法在 runtime 层由 L3 Agent 内部调用，非 Node 直接调用

保留现有代码示例不变（它正确展示了 LLM Provider 接口），仅添加 meta 层 vs runtime 层说明注释。

**验收标准**:
- [ ] Node 集成示例段包含 meta 层 vs runtime 层说明注释
- [ ] 注释明确标注"本示例为 meta 层简化展示"
- [ ] 注释说明 runtime 层 LLM 调用应在 L3 Agent 内执行，Node 仅做委派
- [ ] 注释引用 F011 §9（meta 层 vs runtime 层）和 F002 Node 委派桩规范
- [ ] 代码示例本身不修改（接口展示正确）

### [#2] 轻微 / 跨文档一致性 — boundaries.md 缺 server/llm/ 同步待办

**位置**: F003 模块段（lines 21-27）或依赖段

**问题**: F003 新增 `server/llm/` 目录（7 个模块文件），但未添加 boundaries.md 跨文档同步待办。F002 和 F011 均有 boundaries.md 同步待办，F003 应遵循相同模式。

**修法**: 在"模块"段或"依赖"段添加跨文档同步待办标注：
- boundaries.md 需新增 `server/llm/` 目录
- 依赖方向：`nodes → llm → schemas, config`
- 参照 F002/F011 的 boundaries.md 同步待办格式

**验收标准**:
- [ ] 模块段或依赖段包含 boundaries.md 跨文档同步待办标注
- [ ] 标注列出需同步内容（server/llm/ 目录 + 依赖方向）
- [ ] 不实际修改 boundaries.md

## 约束

1. 仅修改 Node 集成示例段（添加注释）+ 模块/依赖段（添加同步待办）+ 修订记录
2. 不修改其他章节
3. 不修改跨文档（state-design.md / boundaries.md / AGENTS.md / F002 / F011）
4. 不调用 skill
5. 不修改 sub_id
6. 修订后 ≤ 300 行
7. 修订记录追加 Round 2 条目
8. journal 写入 `harness-journal/stage-02-feature-breakdown/31-f003-revision-r2.md`
9. 完成后更新 progress.txt

## 完成报告格式

```
任务: 修复 F003 L3校验发现的2项缺陷（Round 2）
产出: docs/design/feature-f003-llm-provider.md（修订后，Status: Draft）
修订后行数: N 行
验收标准:
  □ #1 meta层vs runtime层注释 — 通过/不通过
  □ #2 boundaries.md同步待办 — 通过/不通过
  □ 修订后 ≤ 300 行 — 通过/不通过
  □ 修订记录追加 Round 2 — 通过/不通过
  □ 不修改其他章节 — 通过/不通过
  □ 不修改跨文档 — 通过/不通过
journal: harness-journal/stage-02-feature-breakdown/31-f003-revision-r2.md
progress: [timestamp] stage-02 | F003-revision-r2 | done | ...
问题: 无/描述
```
