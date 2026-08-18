# F011 设计文档修订 Round 1

## 步骤名称
F011 Agent Runtime 设计文档 — 修复 L3 校验 Agent 发现的 6 项缺陷

## 执行时间
2026-08-18

## 前置条件
- F011 设计文档 Draft 已完成（04-f011-design.md 记录）
- L3 设计校验 Agent 已完成独立审阅（06-f011-review.md，6 项缺陷）
- L1 已决策全部修复并产出修订 Controller Spec（07-f011-review-decision-and-revision-delegation.md）

## 执行内容

### 1. 冷启动
按标准引导模板执行冷启动 5 步，读取 AGENTS.md / progress.txt / feature_list.json / current-sprint.md / harness-journal README + 最近 3 条 journal（05-acceptance / 06-review / 07-review-decision）。

### 2. 读取校验报告和待修订文档
- 校验报告：06-f011-review.md（6 项缺陷：致命1 + 跨文档2 + 概念3）
- 待修订文档：docs/design/feature-f011-agent-runtime.md（修订前 253 行）
- 参考文档：state-design.md（第54行 interrupt_before）/ boundaries.md（第15行 纯函数）/ agent-registry.json（L1 路径）

### 3. 逐项修复

#### 缺陷 #1 [致命] — 循环预算缺少成功重置规则
- 位置：§6 运行规则
- 修法：新增运行规则第 6 条——"当 issue_resolved=True 或循环正常退出时，current_iteration 重置为 0。循环预算是 per-loop 的，不跨循环累积。"
- 结果：✅ 预算不再跨循环累积

#### 缺陷 #2 [跨文档] — interrupt 拓扑不一致
- 位置：§5 实现机制
- 修法：选择选项 A（多节点 interrupt_before），明确说明理由（闸门位置明确、调试方便），添加跨文档同步待办标注 state-design.md 第 54 行需更新
- 结果：✅ 拓扑选择明确 + state-design.md 同步待办已标注

#### 缺陷 #3 [跨文档] — boundaries.md 未纳入同步计划
- 位置：依赖段
- 修法：添加跨文档同步待办标注 boundaries.md 第 15 行需从"纯函数"更新为"委派桩/状态转换器"
- 结果：✅ 未修改 boundaries.md，仅标注待办

#### 缺陷 #4 [概念] — 共享预算未显式声明
- 位置：§6
- 修法：新增"设计决策"段，显式声明反馈循环和 DRR 共用同一预算 + 3 条理由
- 结果：✅ 共享预算为有意设计，非遗漏

#### 缺陷 #5 [概念] — 可疑升级阈值未定义
- 位置：§5 实现机制
- 修法：形式化触发维度（覆盖率下降/失败比例/代码测试比例失衡）+ 标注具体阈值由 F002 编码定义
- 结果：✅ F011 定义维度，F002 定义阈值

#### 缺陷 #6 [概念] — prompt_template 路径模式不一致
- 位置：§1 结构定义
- 修法：在 JSON 结构块后添加注释，说明 L1 角色 project-controller 为例外，使用 orchestrator-prompt.md
- 结果：✅ 路径例外已注明

### 4. 添加修订记录
在文档末尾添加"修订记录"段，记录 Round 1 修复内容。

## 产出物
- `docs/design/feature-f011-agent-runtime.md`（修订后 269 行，Status: Draft）

## 验证结果

| # | 验收标准 | 结果 | 说明 |
|---|---|---|---|
| 1 | [致命 #1] 循环预算增加成功重置规则 | ✅ | §6 运行规则第 6 条，per-loop 不跨循环累积 |
| 2 | [跨文档 #2] interrupt 拓扑明确选择 + 标注 state-design.md 需同步 | ✅ | 选择多节点 interrupt_before + 跨文档同步待办标注 |
| 3 | [跨文档 #3] 标注 boundaries.md 需纳入跨文档同步 | ✅ | 依赖段添加同步待办，未修改 boundaries.md |
| 4 | [概念 #4] 显式声明共享预算设计决策 | ✅ | §6 新增设计决策段 + 3 条理由 |
| 5 | [概念 #5] 标注可疑升级阈值由 F002 定义 | ✅ | 形式化触发维度 + 阈值由 F002 定义 |
| 6 | [概念 #6] 注明 L1 路径例外 | ✅ | §1 添加注释说明 project-controller 例外 |
| 7 | 修订后单文件 ≤ 300 行 | ✅ | 269 行 |
| 8 | 不引入新架构概念 | ✅ | 仅修复缺陷，未扩展范围 |

## 备注
- journal 编号使用 08（07 已被 f011-review-decision-and-revision-delegation 占用）
- 未修改 state-design.md / boundaries.md（跨文档同步由 L1 统一执行）
- 未修改 AGENTS.md 硬性规则
- 未调用任何 skill
- 未修改 sub_id
- Status 仍为 Draft（待重审）
