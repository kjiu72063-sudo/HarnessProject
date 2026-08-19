last_updated: 2026-08-18
status: Draft
owner: @K总

# Feature: 前端平台 UI (F006)

## Status: Draft

## 目标
实现 Harness Platform 的 4 个核心页面（需求输入/流程监控/约束配置/产物管理），与后端 API 对接，提供用户可交互的完整前端体验。

## 非目标
- 不实现 SSE 实时推送的完整逻辑（F007，本次用轮询或 stub 模拟）
- 不实现用户认证/登录（后续补充）
- 不实现约束的在线编辑功能（本次只展示 + 触发全闸门）
- 不实现产物的在线预览/部署（本次只展示文件树和闸门结果）
- 不实现移动端适配（PC 优先）

## 技术方案

### 涉及的模块
- `src/pages/RequirementPage.tsx` — 需求输入页
- `src/pages/PipelinePage.tsx` — 流程监控页
- `src/pages/ConstraintsPage.tsx` — 约束配置页
- `src/pages/ArtifactsPage.tsx` — 产物管理页
- `src/components/Sidebar.tsx` — 侧边栏导航
- `src/components/Header.tsx` — 顶栏
- `src/components/DAGView.tsx` — DAG 流程图视图（@xyflow/react Type 1 只读）
- `src/components/StageNode.tsx` — 流程阶段节点（DAGView 内使用）
- `src/components/DiamondNode.tsx` — 菱形决策节点（DAGView 内使用）
- `src/components/LogPanel.tsx` — 日志面板
- `src/components/StatusBadge.tsx` — 状态灯（青灰/琥珀/翡翠绿/警示红 + Lucide 图标）
- `src/api/client.ts` — API 调用封装（fetch + 相对路径 /api/...）
- `src/api/harness.ts` — Harness 相关 API（start/getState/resume）
- `src/api/projects.ts` — 项目管理 API
- `src/api/constraints.ts` — 约束管理 API
- `src/types/harness.ts` — HarnessState TS 类型定义
- `src/types/api.ts` — API 请求/响应 TS 类型定义

### 页面组件拆分

#### 需求输入页 (RequirementPage)
- RequirementForm: textarea + 字数统计
- TechStackSelector: 6 字段表单（含默认值 React/FastAPI/PostgreSQL/OpenAI/pnpm/uv）
- ConstraintToggles: 3 个 toggle 开关
- RecentProjects: 近期生成列表

#### 流程监控页 (PipelinePage)
- DAGView: 8 阶段节点 + 回环边 + 闸门决策点（@xyflow/react Type 1 只读）
- StageNode × 8: 阶段节点（状态灯 + 标题 + 描述 + 进度条）
- DiamondNode × 6: 菱形决策点（pending=未到达/running=等待决策/passed=通过/failed=失败）
- 回环边: 贝塞尔曲线 + 虚线 + 标签（"反馈循环"/"DRR 长循环"）
- LogPanel: 等宽字体日志 + 状态摘要
- 扫描线动画（CSS animation，进行中节点）

#### 约束配置页 (ConstraintsPage)
- RulesTable: AGENTS.md 规则列表（编号/描述/状态 Badge）
- LinterList: Linter 引擎列表（图标/名称/版本/规则/启用状态）
- GateResult: 全闸门校验结果网格（14 项 + 通过率 + 耗时）

#### 产物管理页 (ArtifactsPage)
- StatsCards: 3 个统计卡片（文件数/代码行数/覆盖率）
- FileTree: 文件目录树（缩进 + 图标 + 行数）
- VerifyResult: verify.sh 闸门详情

### API 对接

```typescript
// src/api/client.ts — 基础封装
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}

// src/api/harness.ts
export const startHarness = (req: StartHarnessRequest) =>
  apiFetch<StartHarnessResponse>('/harness/start', { method: 'POST', body: JSON.stringify(req) });

export const getHarnessState = (sessionId: string) =>
  apiFetch<HarnessState>(`/harness/${sessionId}/state`);

// POST /api/harness/{sessionId}/resume — 对齐 F002 ResumeRequest
// F007 将替换轮询为 SSE 实时推送
export const resumeHarness = (sessionId: string, gate: string, decision: boolean) =>
  apiFetch<{ status: string }>(`/harness/${sessionId}/resume`, {
    method: 'POST',
    body: JSON.stringify({ gate, decision }),
  });
```

### 状态管理
使用 React 内置 useState/useEffect，不引入额外状态库：
- 需求输入页：表单本地状态
- 流程监控页：session_id → 轮询 getHarnessState（每 2s）→ 更新 DAGView 各节点状态（F007 将替换为 SSE 实时推送）
- 约束配置页：一次性获取约束列表 + 闸门结果
- 产物管理页：一次性获取产物列表 + 闸门结果

### TS 类型定义（与后端 Pydantic 对应）

```typescript
// src/types/harness.ts
interface HarnessState {
  project_id: string;
  project_name: string;
  tech_stack: TechStackSpec;
  agents_md: string;
  rules: Rule[];
  boundaries: string;
  progress: string;
  feature_list: FeatureItem[];
  design_docs: DesignDoc[];
  code_artifacts: CodeArtifact[];
  verify_result: VerifyResult;
  test_result: TestResult;
  feedback_log: FeedbackEntry[];
  current_stage: string;
  human_intervention: boolean;
  max_iterations: number;
  current_iteration: number;
  token_usage_total: TokenUsage;
}

interface TechStackSpec {
  frontend: string;
  backend: string;
  database: string;
  llm: string;
  frontend_package_manager: string;
  backend_package_manager: string;
}

interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

type StageStatus = 'pending' | 'running' | 'passed' | 'failed';
```

### 设计规范（DESIGN.md 执行）
- 配色: 深炭灰 #0F1115 / 石墨灰 #1A1D24 / 工程蓝 #3B82F6 / 琥珀 #F59E0B / 翡翠绿 #10B981 / 警示红 #EF4444
- 字体: Inter + Noto Sans SC (正文), JetBrains Mono (代码/日志)
- 状态灯: 四色对应四状态（pending=青灰 #4B5563 / running=琥珀 #F59E0B / passed=翡翠绿 #10B981 / failed=警示红 #EF4444）+ Lucide 图标双重编码（色盲安全）
- 动效: ease-out 150-200ms, 扫描线动画(进行中), 日志逐行淡入
- 禁忌: 无装饰性图片/无emoji/无蓝紫渐变/无毛玻璃/无弹性动画

### API 变更
无新增 API。前端对接 api-spec.md 已定义的端点。

## 验收标准
- 4 个页面按原型视觉还原（DESIGN.md 配色/字体/动效一致）
- 侧边栏导航 4 页面间跳转正常，当前页高亮
- 需求输入页：表单可填写 + 技术栈可选中 + 启动按钮跳转流程监控页
- 流程监控页：DAG 视图展示 8 阶段 + 回环边 + 闸门决策点 + 日志面板 + 状态灯四色
- 约束配置页：规则列表 + Linter 列表 + 闸门结果展示
- 产物管理页：统计卡片 + 文件树 + 闸门详情
- API 调用走相对路径 `/api/...`，无硬编码域名
- TS HarnessState 与 F002/F003 修订后字段对齐（TechStackSpec + max_iterations + current_iteration + token_usage_total + TokenUsage 接口）
- 禁止 as any 和隐式 any（ESLint 强制）
- 单文件 ≤ 300 行 / 单函数 ≤ 50 行
- 测试覆盖率 ≥ 80%
- verify.sh 14 项全通过
- 依赖 F001（已实现）

## 依赖
- F001 项目初始化与骨架搭建（passing）
- F002 LangGraph 编排引擎（提供 /api/harness/* 端点）
- F003 LLM 提供商层（间接依赖，F002 内部调用）
- DESIGN.md 设计规范
- 原型 4 页面（.cozeproj/prototype/web/）

> **跨文档同步待办**: state-design.md 需在跨文档同步阶段更新 HarnessState 字段，与 F002（TechStackSpec + max_iterations + current_iteration）、F003（token_usage_total）和 F006（前端 TS 类型对齐）一致。

> **跨文档同步待办**: boundaries.md 需在跨文档同步阶段新增前端子目录结构（`src/components/`、`src/api/`、`src/types/`）及依赖方向（`pages → components, api → types`），参照 F002/F011/F003 的 boundaries.md 同步待办格式。

---

## 修订记录
- Round 1（2026-08-18）：修复 3 项缺陷（#1 StageTimeline→DAGView @xyflow/react Type 1 只读含回环边+闸门决策点/#2 TS HarnessState 对齐 F002/F003 修订后字段 TechStackSpec+max_iterations+current_iteration+token_usage_total+TokenUsage 接口，删除旧 TechStack 枚举/#3 实时机制矛盾修正：轮询→F007 SSE 替换 + LogPanel 去掉"实时" + StatusBadge 三色→四色对应四状态），详见 34-f006-revision-r1.md。
- Round 2（2026-08-18）：修复 L3 校验发现的 5 项缺陷（#1 石墨灰同名异值→#4B5563 改名青灰/#2 添加 boundaries.md 跨文档同步待办/#3 DiamondNode 三状态→四状态对齐 StageStatus/#4 新增 resumeHarness API 封装对齐 F002 ResumeRequest + 模块列表 stream→resume/#5 TechStackSelector 4选1→6字段表单对齐 TechStackSpec），详见 36-f006-revision-r2.md。
