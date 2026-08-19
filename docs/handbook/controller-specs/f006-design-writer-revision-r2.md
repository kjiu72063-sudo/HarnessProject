# Controller Spec: F006 设计编写 Agent 修订 Round 2

## 角色
L3 设计编写 Agent（design-writer）

## 目标
修复 F006 前端 UI 设计文档 L3 校验发现的 5 项缺陷

## 输入
- 待修订文档: `docs/design/feature-f006-frontend-ui.md`（174 行，Status: Draft）
- 校验报告: journal `35-f006-r1-review.md`

## 5 项缺陷 + 修法

### #1 [概念] 石墨灰同名异值
- **位置**: line 138（配色方案 "石墨灰 #1A1D24"）vs line 140（状态灯 "石墨灰 #4B5563"）
- **问题**: 同一名称"石墨灰"指向两个不同色值，读者无法区分
- **修法**: 状态灯的 #4B5563 改名为"青灰"（或"暗岩灰"），保持配色方案的"石墨灰 #1A1D24"不变。修改 line 32（StatusBadge 组件描述）、line 140（设计规范状态灯描述）中 #4B5563 的名称

### #2 [跨文档] 缺 boundaries.md 跨文档同步待办
- **位置**: 依赖段（line 162-169 附近）
- **问题**: F006 新增前端组件/目录结构（src/components/DAGView.tsx 等），但未标注 boundaries.md 需同步
- **修法**: 在依赖段添加 blockquote 跨文档同步待办：boundaries.md 需在跨文档同步阶段新增前端子目录结构（src/components/ + src/api/ + src/types/）及依赖方向。参照 F002/F011/F003 的 boundaries.md 同步待办格式

### #3 [概念] DiamondNode 三状态 vs StageStatus 四状态
- **位置**: line 51（DiamondNode × 6: 菱形决策点 "通过/待执行/失败"）vs line 134（StageStatus = 'pending' | 'running' | 'passed' | 'failed'）
- **问题**: DiamondNode 三状态无法区分"未到达"和"等待决策"，与 StageStatus 四状态不匹配
- **修法**: DiamondNode 改为四状态对齐 StageStatus：pending（未到达/灰）/ running（等待决策/琥珀）/ passed（通过/绿）/ failed（失败/红）。修改 line 51 描述为"DiamondNode × 6: 菱形决策点（pending/running/passed/failed，对齐 StageStatus）"

### #4 [跨文档] 缺 resumeHarness API 封装 + "stream" 与 F007 矛盾
- **位置**: line 34（`src/api/harness.ts — Harness 相关 API（start/getState/stream）`）+ line 79-85（API 对接代码）
- **问题**: (1) F002 新增 POST /resume 端点（ResumeRequest），F006 缺 resumeHarness 封装；(2) 模块列表写"stream"但 F007 是非目标，矛盾
- **修法**: (1) API 对接段新增 `resumeHarness(sessionId, gate, decision)` 封装，对齐 F002 ResumeRequest（gate: str + decision: bool）; (2) 模块列表 line 34 删除"stream"，改为"start/getState/resume"; (3) 在 resumeHarness 封装处注释"F007 将替换轮询为 SSE"

### #5 [概念] TechStackSelector "4 选 1" 与 TechStackSpec 6 字段不匹配
- **位置**: line 44（TechStackSelector: 4 选 1 grid）vs lines 119-126（TechStackSpec 6 字段）
- **问题**: "4 选 1"暗示用户选 4 个预设技术栈之一，但 TechStackSpec 有 6 个字段（frontend/backend/database/llm/frontend_package_manager/backend_package_manager），4 选 1 无法覆盖
- **修法**: 改为"技术栈表单"——用户分别填写/选择 6 个字段（前端框架/后端框架/数据库/LLM/前端包管理器/后端包管理器），提供默认值（React+FastAPI+PostgreSQL+OpenAI+pnpm+uv）。修改 line 44 为"TechStackSelector: 6 字段表单（含默认值 React/FastAPI/PostgreSQL/OpenAI/pnpm/uv）"

## 验收标准（10 条）
1. #1 石墨灰同名异值消除——状态灯 #4B5563 改名，全文无同名异值残留
2. #2 boundaries.md 跨文档同步待办已添加（blockquote 格式，参照 F002/F011/F003）
3. #3 DiamondNode 四状态对齐 StageStatus，line 51 描述已更新
4. #4 resumeHarness API 封装已添加（对齐 F002 ResumeRequest gate+decision）
5. #4 模块列表"stream"已删除，改为"start/getState/resume"
6. #5 TechStackSelector 改为 6 字段表单，与 TechStackSpec 对齐
7. 修订后 ≤ 300 行
8. 修订记录追加 Round 2
9. 不修改其他章节（仅触及组件描述/API 段/设计规范/依赖段/修订记录）
10. 不修改跨文档（F002/F003/F011/state-design.md/boundaries.md/AGENTS.md）

## 约束
- 遵循 _bootstrap.md 全部硬约束
- 不修改其他设计文档
- 不调用 skill
- 不修改 sub_id
- 修订后写入 journal: `harness-journal/stage-02-feature-breakdown/36-f006-revision-r2.md`
- 更新 progress.txt

## 完成标志
产出修订后的 `docs/design/feature-f006-frontend-ui.md` + journal + progress.txt，输出修订完成报告（逐条验收标准 + 变更文件列表 + 问题）
