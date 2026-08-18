# Controller Spec: F006 前端 UI 设计文档修订 Round 1

## 角色
L3 设计编写 Agent（design-writer）

## 任务
修订 `docs/design/feature-f006-frontend-ui.md`，修复 3 项缺陷 + 同步 F002/F003 修订后的状态字段变更。

## 上下文
- F002 已 Approved（修订后 225 行）：HarnessState 新增 TechStackSpec（含 frontend_package_manager + backend_package_manager）、max_iterations、current_iteration；6 闸门改为 interrupt_before 机制（非布尔路由）；route_loop_budget 函数
- F003 已 Approved（修订后 187 行）：HarnessState 新增 token_usage_total: TokenUsage
- F011 已 Approved：Agent Registry、Controller Spec、标准引导模板、Skill≠Agent、循环预算、HITL 6 闸门 actor 分配
- F006 当前 Draft（149 行），存在 3 项缺陷

## 缺陷清单

### #1 [致命] 缺 DAG 视图（Type 1，回环边画不出）
- **位置**: F006 §页面组件拆分 → 流程监控页（lines 47-52）
- **问题**: 当前设计用 StageTimeline（8 阶段垂直拓扑线），无法渲染反馈循环（validation→coding_agent）和 DRR 长循环（observability→coding_agent）的回环边。验收标准 line 132 写"8 阶段拓扑完整展示"但垂直时间线无法表达 DAG 回环结构。
- **修法**:
  - 将 StageTimeline 替换为 DAG 视图组件，使用 @xyflow/react（项目已安装 `@xyflow/react`）
  - DAG 为 Type 1 只读视图：8 个线性阶段节点 + 反馈循环边 + DRR 长循环边 + 闸门决策点
  - 节点状态映射 StageStatus（pending/running/passed/failed）
  - 回环边用贝塞尔曲线 + 虚线 + 标签（"反馈循环"/"DRR 长循环"）区分
  - 保留 LogPanel + StatusBadge + 扫描线动画，仅替换 StageTimeline → DAGView
  - 组件列表新增 `src/components/DAGView.tsx`，删除 `StageTimeline` 引用
  - 验收标准更新为"DAG 视图展示 8 阶段 + 回环边 + 闸门决策点"

### #2 [致命] TS HarnessState 与 F002/F003 漂移
- **位置**: F006 §TS 类型定义（lines 94-116）
- **问题**: 当前 TS HarnessState（lines 96-112）与 F002/F003 修订后的 State 严重漂移：
  - `tech_stack: TechStack` 是字符串枚举，但 F002 已改为 TechStackSpec（含 frontend/backend/database/llm/frontend_package_manager/backend_package_manager 6 字段）
  - 缺 max_iterations + current_iteration（F002 [NEW]）
  - 缺 token_usage_total（F003 [NEW]）
  - 缺闸门状态字段（F002 改为 interrupt_before，但前端仍需展示闸门状态——需要从 state 中的 gate_status 或 interrupt 信息推导）
  - TechStack 类型（line 115）需要替换为 TechStackSpec 接口
- **修法**:
  - TS HarnessState 对齐 F002 修订后的字段：
    ```typescript
    interface HarnessState {
      project_id: string;
      project_name: string;
      tech_stack: TechStackSpec;  // 改：从 TechStack 枚举改为 TechStackSpec 接口
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
      max_iterations: number;       // 新增：F002
      current_iteration: number;    // 新增：F002
      token_usage_total: TokenUsage; // 新增：F003
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
    ```
  - 删除旧 `type TechStack = ...` 枚举定义
  - 闸门状态展示：前端通过 current_stage + human_intervention + interrupt 状态推导闸门显示，不需要在 TS State 中新增 6 个布尔字段（F002 已改为 interrupt_before 机制）
  - 验收标准更新为"TS HarnessState 与 F002/F003 修订后字段对齐"
  - 新增跨文档同步待办：state-design.md 需同步（与 F002/F003 已有待办一致）

### #3 [概念] 实时机制矛盾 + "实时日志"名不副实 + StatusBadge 三色 vs 4 状态
- **位置**: F006 §状态管理（line 88）、§页面组件拆分（line 51）、§设计规范（line 121）
- **问题（3 个子项合并）**:
  - (a) F006 写"轮询 getHarnessState（每 2s）"但 F002 设计暗示 SSE 推送。两份文档对实时机制描述矛盾。
  - (b) LogPanel 称"实时日志"但实际是轮询获取，名不副实。
  - (c) StatusBadge 设计"三色"（琥珀/绿/红）但 StageStatus 有 4 个值（pending/running/passed/failed），pending 和 running 无法区分。
- **修法**:
  - (a) 明确：当前阶段（F006）使用轮询（每 2s），F007 实现 SSE 实时推送。在状态管理段标注"F007 将替换为 SSE 实时推送"，消除与 F002 的矛盾
  - (b) LogPanel 名称从"实时日志面板"改为"日志面板"（去掉"实时"措辞），验收标准同步更新
  - (c) StatusBadge 改为 4 色对应 4 状态：pending=石墨灰 #4B5563 / running=琥珀 #F59E0B / passed=翡翠绿 #10B981 / failed=警示红 #EF4444。设计规范段 line 121 同步更新"三色"→"四色"
  - 组件描述 line 31 StatusBadge 同步更新"（琥珀/绿/红 + Lucide 图标）"→"（石墨灰/琥珀/绿/红 + Lucide 图标）"

## 验收标准
1. #1 DAG 视图组件定义（@xyflow/react Type 1 只读 + 回环边 + 闸门决策点）
2. #1 组件列表新增 DAGView.tsx，StageTimeline 引用已替换
3. #1 验收标准更新为"DAG 视图展示 8 阶段 + 回环边 + 闸门决策点"
4. #2 TS HarnessState 对齐 F002/F003（TechStackSpec + max_iterations + current_iteration + token_usage_total + TokenUsage 接口）
5. #2 旧 TechStack 枚举已删除，新增 TechStackSpec 接口
6. #2 跨文档同步待办已添加（state-design.md）
7. #3a 状态管理段明确"当前轮询 / F007 替换为 SSE"
8. #3b LogPanel 名称去掉"实时"，验收标准同步
9. #3c StatusBadge 四色对应四状态，设计规范段同步更新
10. 修订后单文件 ≤ 300 行
11. 添加修订记录段
12. 不修改 F002/F003/F011/state-design.md/boundaries.md/AGENTS.md

## 约束
- 代码示例为 TypeScript 类型定义和组件接口描述，不是完整实现
- 不修改其他设计文档
- 不调用 skill
- 不修改 sub_id
- journal 路径: harness-journal/stage-02-feature-breakdown/33-f006-revision-r1.md
