# F003 LLM 提供商层设计文档修订 Round 2

## 步骤名称
F003 可插拔 LLM 提供商层设计文档 — Round 2 修订（2 项跨文档缺陷修复）

## 执行时间
2026-08-18

## 前置条件
- F002 LangGraph 编排引擎已 Approved（225 行，缺陷链闭合）
- F011 Agent Runtime 已 Approved（271 行，缺陷链闭合）
- F003 修订 Round 1 完成（182 行，3 项原始缺陷已修复）
- L3 校验 Agent 全量校验 F003 R1：Part A 3/3 修复，Part B 发现 2 项新跨文档缺陷（journal 30）
- L1 接受校验结论，产出 R2 Controller Spec（2 项缺陷 + 验收标准）委派 L3 修订

## 执行内容

### 1. 冷启动
按标准引导模板执行冷启动 5 步：
1. AGENTS.md — 项目全貌、硬性规则 13 条、L3 硬约束 8 条
2. progress.txt — 103 条历史进度，关注 F003-review（line 101）和 F003-revision-r2-delegation（line 102）
3. feature_list.json — F001 passing, F011/F002 approved, F003-F010 todo
4. docs/plans/current-sprint.md — Sprint 1 范围（F002/F003/F006）
5. harness-journal/README.md — 开发日志索引 + 最近 3 条 journal（29-review-delegation / 30-review / 31-r2-delegation[README 预录但文件未创建]）

### 2. 读取待修订文档和参考文档
- 待修订：docs/design/feature-f003-llm-provider.md（182 行，Status: Draft）
- Controller Spec：docs/handbook/controller-specs/f003-design-writer-revision-r2.md（2 项缺陷 + 验收标准）
- 校验报告：harness-journal/stage-02-feature-breakdown/30-f003-review.md（Part A 3/3 修复 + Part B 2 项新缺陷）
- 参考 F002（Approved）：lines 106-123 Node 委派桩规范（`agent_runtime.delegate()` 委派模式）
- 参考 F011（Approved）：§9 meta 层 vs runtime 层定义

### 3. 逐项修复

#### 缺陷 #1 [中等/跨文档] — Node 集成示例与 F002 委派桩规范不一致
- **位置**: F003 lines 136-155（Node 集成示例段）
- **问题**: Node 示例直接调用 `get_llm_provider()` + `complete_with_state()`，与 F002 委派桩规范和 AGENTS.md 规则 #5 不一致；F003 全文未提及"委派"/"Agent Runtime"/"L3 Agent"
- **修法（方案 B — 添加注释段）**: 在 Node 集成示例段代码块之前添加 blockquote 注释，标注：
  1. 本示例为 **meta 层简化展示**
  2. runtime 层（F011 §9）Agent Runtime 就绪后，LLM 调用应在 L3 Agent 内执行
  3. Node 仅做委派（`agent_runtime.delegate()`）和状态更新（F002 委派桩规范，AGENTS.md 规则 #5）
  4. `complete_with_state` 在 runtime 层由 L3 Agent 内部调用，非 Node 直接调用
- **代码示例本身不修改**（接口展示正确）

#### 缺陷 #2 [轻微/跨文档] — boundaries.md 缺 server/llm/ 同步待办
- **位置**: F003 依赖段（原 lines 174-177）
- **问题**: F003 新增 `server/llm/` 目录（7 个模块文件），但未添加 boundaries.md 跨文档同步待办。F002 和 F011 均有 boundaries.md 同步待办，F003 应遵循相同模式
- **修法**: 在依赖段添加 blockquote 跨文档同步待办标注：
  - boundaries.md 需新增 `server/llm/` 目录
  - 依赖方向：`nodes → llm → schemas, config`
  - 参照 F002/F011 的 boundaries.md 同步待办格式

### 4. 约束遵守
- ✅ 仅修改 Node 集成示例段（添加注释）+ 依赖段（添加同步待办）+ 修订记录
- ✅ 不修改其他章节
- ✅ 不修改跨文档（state-design.md / boundaries.md / AGENTS.md / F002 / F011）
- ✅ 不调用 skill
- ✅ 不修改 sub_id
- ✅ 修订后 187 行 ≤ 300 行
- ✅ 修订记录追加 Round 2 条目

### 5. Journal 编号说明
Controller Spec 指定 journal 路径 `31-f003-revision-r2.md`，但 harness-journal/README.md 已将编号 31 预录为 `31-f003-r2-delegation.md`（L1 R2 决策+修订委派），该文件尚未物理创建。L3 按 Controller Spec 指定路径写入 `31-f003-revision-r2.md`，向 L1 报告此编号冲突，请 L1 调整 delegation 文件编号或 README 索引。

## 产出物
- docs/design/feature-f003-llm-provider.md（修订后，187 行，Status: Draft）

## 验证结果

### 验收标准逐项自检

| # | 验收标准 | 结果 | 证据 |
|---|---|---|---|
| 1 | Node 集成示例段包含 meta 层 vs runtime 层说明注释 | ✅ 通过 | line 139 blockquote |
| 2 | 注释明确标注"本示例为 meta 层简化展示" | ✅ 通过 | line 139: "本示例为 **meta 层简化展示**" |
| 3 | 注释说明 runtime 层 LLM 调用应在 L3 Agent 内执行，Node 仅做委派 | ✅ 通过 | line 139: "LLM 调用应在 L3 Agent 内执行，Node 仅做委派" |
| 4 | 注释引用 F011 §9 和 F002 Node 委派桩规范 | ✅ 通过 | line 139: "(F011 §9 meta 层 vs runtime 层)" + "(F002 Node 委派桩规范，AGENTS.md 规则 #5)" |
| 5 | 代码示例本身不修改 | ✅ 通过 | lines 141-157 代码不变 |
| 6 | 模块段或依赖段包含 boundaries.md 跨文档同步待办标注 | ✅ 通过 | line 181 依赖段 blockquote |
| 7 | 标注列出需同步内容（server/llm/ 目录 + 依赖方向） | ✅ 通过 | line 181: "`server/llm/` 目录及依赖方向（`nodes → llm → schemas, config`）" |
| 8 | 不实际修改 boundaries.md | ✅ 通过 | 仅 F003 内标注待办 |
| 9 | 修订后 ≤ 300 行 | ✅ 通过 | 187 行 |
| 10 | 修订记录追加 Round 2 | ✅ 通过 | line 187 |
| 11 | 不修改其他章节 | ✅ 通过 | 仅 3 处增量修改 |
| 12 | 不修改跨文档 | ✅ 通过 | 未修改 F002/F011/state-design.md/boundaries.md/AGENTS.md |

### 跨文档一致性
- F002 Node 委派桩规范（lines 106-123: `agent_runtime.delegate()` 委派模式）→ F003 注释引用并对齐 ✅
- F011 §9 meta 层 vs runtime 层定义 → F003 注释引用并对齐 ✅
- F002/F011 boundaries.md 同步待办模式 → F003 遵循相同 blockquote 格式 ✅
- R1 修订内容（LLMError/token_usage_total/措辞修正）保持完整 ✅

## 备注
- L3 仅做设计文档修订，不做编码、不做校验、不做测试
- 产出将提交独立 L3 设计校验 Agent 审阅
- Journal 编号冲突已向 L1 报告
