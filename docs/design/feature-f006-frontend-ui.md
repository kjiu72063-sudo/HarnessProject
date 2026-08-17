last_updated: 2026-08-17
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
- `src/components/StageNode.tsx` — 流程阶段节点
- `src/components/DiamondNode.tsx` — 菱形决策节点
- `src/components/LogPanel.tsx` — 实时日志面板
- `src/components/StatusBadge.tsx` — 状态灯（琥珀/绿/红 + Lucide 图标）
- `src/api/client.ts` — API 调用封装（fetch + 相对路径 /api/...）
- `src/api/harness.ts` — Harness 相关 API（start/getState/stream）
- `src/api/projects.ts` — 项目管理 API
- `src/api/constraints.ts` — 约束管理 API
- `src/types/harness.ts` — HarnessState TS 类型定义
- `src/types/api.ts` — API 请求/响应 TS 类型定义

### 页面组件拆分

#### 需求输入页 (RequirementPage)
- RequirementForm: textarea + 字数统计
- TechStackSelector: 4 选 1 grid
- ConstraintToggles: 3 个 toggle 开关
- RecentProjects: 近期生成列表

#### 流程监控页 (PipelinePage)
- StageTimeline: 8 阶段垂直拓扑线
- StageNode × 8: 阶段节点（状态灯 + 标题 + 描述 + 进度条）
- DiamondNode × 6: 菱形决策点（通过/待执行/失败）
- LogPanel: 等宽字体实时日志 + 状态摘要
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
```

### 状态管理
使用 React 内置 useState/useEffect，不引入额外状态库：
- 需求输入页：表单本地状态
- 流程监控页：session_id → 轮询 getHarnessState（每 2s）→ 更新各 StageNode 状态
- 约束配置页：一次性获取约束列表 + 闸门结果
- 产物管理页：一次性获取产物列表 + 闸门结果

### TS 类型定义（与后端 Pydantic 对应）

```typescript
// src/types/harness.ts
interface HarnessState {
  project_id: string;
  project_name: string;
  tech_stack: TechStack;
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
}

type StageStatus = 'pending' | 'running' | 'passed' | 'failed';
type TechStack = 'react-fastapi' | 'next-prisma' | 'taro-miniprogram' | 'custom';
```

### 设计规范（DESIGN.md 执行）
- 配色: 深炭灰 #0F1115 / 石墨灰 #1A1D24 / 工程蓝 #3B82F6 / 琥珀 #F59E0B / 翡翠绿 #10B981 / 警示红 #EF4444
- 字体: Inter + Noto Sans SC (正文), JetBrains Mono (代码/日志)
- 状态灯: 三色 + Lucide 图标双重编码（色盲安全）
- 动效: ease-out 150-200ms, 扫描线动画(进行中), 日志逐行淡入
- 禁忌: 无装饰性图片/无emoji/无蓝紫渐变/无毛玻璃/无弹性动画

### API 变更
无新增 API。前端对接 api-spec.md 已定义的端点。

## 验收标准
- 4 个页面按原型视觉还原（DESIGN.md 配色/字体/动效一致）
- 侧边栏导航 4 页面间跳转正常，当前页高亮
- 需求输入页：表单可填写 + 技术栈可选中 + 启动按钮跳转流程监控页
- 流程监控页：8 阶段拓扑完整展示 + 日志面板 + 状态灯三色
- 约束配置页：规则列表 + Linter 列表 + 闸门结果展示
- 产物管理页：统计卡片 + 文件树 + 闸门详情
- API 调用走相对路径 `/api/...`，无硬编码域名
- TS 类型与后端 Pydantic schema 对应
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
