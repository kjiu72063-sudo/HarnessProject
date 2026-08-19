# F006 前端 UI 设计文档修订 Round 2

## 步骤名称
F006 前端平台 UI 设计文档 — Round 2 修订（5 项缺陷修复）

## 执行时间
2026-08-18

## 前置条件
- F011 Agent Runtime 已 Approved（271 行，缺陷链闭合）
- F002 LangGraph 编排引擎已 Approved（225 行，缺陷链闭合）
- F003 LLM 提供商层已 Approved（187 行，缺陷链闭合）
- F006 R1 修订完成（174 行，Status: Draft），L3 全量校验发现 5 项新引入缺陷（journal 35）
- L1 接受结论，产出 R2 修订 Controller Spec（5 项缺陷 + 10 条验收标准）委派 L3 修订

## 执行内容

### 1. 冷启动
按标准引导模板执行冷启动 5 步：
1. AGENTS.md — 项目全貌、硬性规则 13 条、L3 硬约束 8 条
2. progress.txt — 111 条历史进度，关注 F006-r1-review（line 109）、F006-r2-delegation（line 110）
3. feature_list.json — F001 passing, F011/F002/F003 approved, F004-F010 todo, F006 todo
4. docs/plans/current-sprint.md — Sprint 1 范围（F002/F003/F006）
5. harness-journal/README.md — 开发日志索引 + 最近 3 条 journal（34/35/36）

### 2. 读取待修订文档和参考文档
- 待修订：docs/design/feature-f006-frontend-ui.md（174 行，Status: Draft）
- Controller Spec：启动提示词内嵌（5 项缺陷 + 10 条验收标准）
- 校验报告：journal 35-f006-r1-review-delegation.md + 36-f006-r1-review-result-and-r2-delegation.md
- 参考 F002（Approved）：ResumeRequest 定义（gate: str + decision: bool）、TechStackSpec 双包管理器
- 参考 F003（Approved）：TokenUsage 接口
- 参考 F011（Approved）：HITL 机制
- 参考 state-design.md：当前 HarnessState 定义
- 参考 boundaries.md：当前目录结构

### 3. 逐项修复

#### 缺陷 #1 [概念] 石墨灰同名异值
- **位置**: line 32（StatusBadge 组件描述）+ line 140（设计规范状态灯描述）
- **问题**: 配色方案"石墨灰 #1A1D24" vs 状态灯"石墨灰 #4B5563"同名异值
- **修法**: 状态灯 #4B5563 改名为"青灰"，保持配色方案"石墨灰 #1A1D24"不变
  - line 32: StatusBadge 描述"石墨灰"→"青灰"
  - line 148: 设计规范"pending=石墨灰 #4B5563"→"pending=青灰 #4B5563"
- **验证**: grep 确认"石墨灰 #4B5563"在设计内容中零残留，"石墨灰"仅存于配色方案（line 146）和修订记录段

#### 缺陷 #2 [跨文档] 缺 boundaries.md 跨文档同步待办
- **位置**: 依赖段（line 169 附近）
- **问题**: F006 新增前端组件/目录结构但未标注 boundaries.md 需同步
- **修法**: 在依赖段 state-design.md 同步待办后新增 blockquote：
  - boundaries.md 需新增前端子目录结构（src/components/、src/api/、src/types/）及依赖方向（pages → components, api → types）
  - 格式参照 F002/F011/F003 的 boundaries.md 同步待办

#### 缺陷 #3 [概念] DiamondNode 三状态 vs StageStatus 四状态
- **位置**: line 51（DiamondNode 描述）
- **问题**: "通过/待执行/失败"三状态无法区分"未到达"和"等待决策"，与 StageStatus 四状态不匹配
- **修法**: 改为四状态对齐 StageStatus：pending=未到达 / running=等待决策 / passed=通过 / failed=失败

#### 缺陷 #4 [跨文档] 缺 resumeHarness API 封装 + "stream" 与 F007 矛盾
- **位置**: line 34（模块列表）+ lines 79-85（API 对接代码段）
- **问题**: (1) F002 新增 POST /resume 端点但 F006 缺封装；(2) 模块列表写"stream"但 F007 是非目标
- **修法**:
  1. 模块列表 line 34: "start/getState/stream"→"start/getState/resume"
  2. API 对接段新增 resumeHarness 封装，对齐 F002 ResumeRequest（gate: str + decision: bool）
  3. resumeHarness 封装处注释"F007 将替换轮询为 SSE 实时推送"
- **验证**: grep 确认"stream"仅存于修订记录段（描述变更内容），设计内容中已替换

#### 缺陷 #5 [概念] TechStackSelector "4 选 1" 与 TechStackSpec 6 字段不匹配
- **位置**: line 44（TechStackSelector 描述）
- **问题**: "4 选 1"暗示选预设技术栈，但 TechStackSpec 有 6 个字段
- **修法**: 改为"6 字段表单（含默认值 React/FastAPI/PostgreSQL/OpenAI/pnpm/uv）"，与 TechStackSpec 6 字段对齐

### 4. 约束遵守
- ✅ 仅修改 F006 设计文档
- ✅ 不修改 F002/F003/F011/state-design.md/boundaries.md/AGENTS.md（git status 确认）
- ✅ 不调用 skill
- ✅ 不修改 sub_id
- ✅ 修订后 185 行 ≤ 300 行
- ✅ 修订记录追加 Round 2 条目
- ✅ 仅触及组件描述/API 段/设计规范/依赖段/修订记录

### 5. Journal 编号说明
Controller Spec 指定 journal 路径 `36-f006-revision-r2.md`，但 harness-journal/README.md 已将编号 36 预录为 `36-f006-r1-review-result-and-r2-delegation.md`（已物理存在）。L3 按 Controller Spec 指定路径写入 `36-f006-revision-r2.md`，向 L1 报告此编号冲突，请 L1 调整 README 索引或重新编号。

## 产出物
- docs/design/feature-f006-frontend-ui.md（修订后，185 行，Status: Draft）

## 验证结果

### 验收标准逐项自检

| # | 验收标准 | 结果 | 证据 |
|---|---|---|---|
| 1 | #1 石墨灰同名异值消除——状态灯 #4B5563 改名，全文无同名异值残留 | ✅ 通过 | line 148 "青灰 #4B5563"；grep 确认"石墨灰 #4B5563"零残留；"石墨灰"仅存于 line 146（配色 #1A1D24）和修订记录 |
| 2 | #2 boundaries.md 跨文档同步待办已添加（blockquote 格式） | ✅ 通过 | line 179 blockquote，格式参照 F002/F011/F003 |
| 3 | #3 DiamondNode 四状态对齐 StageStatus，line 51 描述已更新 | ✅ 通过 | line 51 "pending=未到达/running=等待决策/passed=通过/failed=失败" |
| 4 | #4 resumeHarness API 封装已添加（对齐 F002 ResumeRequest gate+decision） | ✅ 通过 | lines 86-91 resumeHarness 函数，参数 gate+decision 对齐 F002 ResumeRequest |
| 5 | #4 模块列表"stream"已删除，改为"start/getState/resume" | ✅ 通过 | line 34；grep 确认"stream"仅存于修订记录段 |
| 6 | #5 TechStackSelector 改为 6 字段表单，与 TechStackSpec 对齐 | ✅ 通过 | line 44 "6 字段表单（含默认值 React/FastAPI/PostgreSQL/OpenAI/pnpm/uv）" |
| 7 | 修订后 ≤ 300 行 | ✅ 通过 | 185 行 |
| 8 | 修订记录追加 Round 2 | ✅ 通过 | line 185 |
| 9 | 不修改其他章节（仅触及组件描述/API 段/设计规范/依赖段/修订记录） | ✅ 通过 | 7 处增量修改均在指定范围 |
| 10 | 不修改跨文档（F002/F003/F011/state-design.md/boundaries.md/AGENTS.md） | ✅ 通过 | git status 仅显示 F006 修改 |

### 跨文档一致性
- F002 ResumeRequest（gate: str + decision: bool）→ F006 resumeHarness 参数对齐 ✅
- F002 TechStackSpec（6 字段）→ F006 TechStackSelector 6 字段表单对齐 ✅
- F003 TokenUsage（3 字段）→ F006 R1 已对齐，R2 保持完整 ✅
- F002/F011/F003 boundaries.md 同步待办格式 → F006 遵循相同 blockquote 格式 ✅
- R1 修订内容（DAGView/HarnessState 对齐/轮询→SSE/LogPanel/StatusBadge 四色）保持完整 ✅

## 备注
- L3 仅做设计文档修订，不做编码、不做校验、不做测试
- 产出将提交独立 L3 设计校验 Agent 审阅
- Journal 编号冲突已向 L1 报告
