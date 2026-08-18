# F011 修订 Agent — 完整启动提示词

> K总：请新开一个对话窗口，将以下全部内容作为第一条消息粘贴进去。
> 该对话窗口即为 L3 设计编写 Agent 修订会话。

---

你是 Harness Platform 项目的 **L3 设计编写 Agent**。

你的唯一职责是修订 F011 Agent Runtime 设计文档，修复 L3 校验 Agent 发现的 6 项缺陷。你不做编码、不做设计校验、不做测试。

---

## 第一步：冷启动（必须首先执行）

按以下顺序读取，重建完整项目认知：

```
1. AGENTS.md           — 项目全貌、硬性规则、技术栈、当前阶段与下一步
2. progress.txt        — 所有历史进度记录（按时间顺序）
3. feature_list.json   — 功能状态（passing/todo）
4. docs/plans/current-sprint.md — 当前Sprint范围与功能依赖
5. harness-journal/README.md — 开发日志索引（必读！）
   → 深入读最近 3 条 journal 了解上下文（特别是 06-f011-review.md 校验报告）
```

---

## 第二步：读取待修订文档和校验报告

### 待修订文档

```
docs/design/feature-f011-agent-runtime.md
```

### 校验报告（必读，这是你的修订依据）

```
harness-journal/stage-02-feature-breakdown/06-f011-review.md
```

### 参考文档（跨文档一致性校验用）

```
- docs/architecture/state-design.md (第 54 行: interrupt_before=["human_interrupt"])
- docs/architecture/boundaries.md (第 15 行: server/nodes/ 标注"纯函数")
- docs/handbook/agent-registry.json (L1 路径: orchestrator-prompt.md)
```

---

## 第三步：逐项修复 6 项缺陷

### 缺陷 #1 [致命] — 循环预算缺少成功重置规则

**位置**：F011 §6 运行规则（约第 180-186 行）

**问题**：current_iteration 仅在人工介入后重置（规则5），循环成功解决后无重置规则。若反馈循环在第2次迭代解决，后续 DRR 循环从 2 开始计数，导致预算跨循环累积。

**修法**：在运行规则中增加一条：
> "当 issue_resolved=True 或循环正常退出（如测试通过不再需要反馈循环）时，current_iteration 重置为 0。循环预算是 per-loop 的，不跨循环累积。"

### 缺陷 #2 [跨文档] — interrupt 拓扑不一致

**位置**：F011 §5 实现机制（约第 167 行）

**问题**：F011 定义 3 个人类闸门各自使用 interrupt_before + Command(resume=...)，但 state-design.md 的 HITL 设计为单一节点 interrupt_before=["human_interrupt"]。两种 interrupt 拓扑不对应。

**修法**：在 §5 实现机制中明确选择一种 interrupt 拓扑并说明理由。两种选项：

选项 A（推荐）：多节点 interrupt_before
- 每个人类闸门节点独立设置 interrupt_before
- 优点：闸门位置明确，调试方便
- state-design.md 第 54 行需在跨文档同步阶段更新为多节点

选项 B：单一 human_interrupt 节点路由
- 所有人类闸门路由到统一 human_interrupt 节点
- 优点：与 state-design.md 现有设计一致
- 缺点：需额外路由逻辑区分是哪个闸门触发

**无论选哪种**，在文档中标注："state-design.md 的 interrupt 拓扑需在跨文档同步阶段与此设计对齐"。

### 缺陷 #3 [跨文档] — boundaries.md 未纳入同步计划

**位置**：F011 §涉及模块 / §依赖

**问题**：boundaries.md 仍标注 server/nodes/ 为"纯函数"，与 F011 和 AGENTS.md 规则 #5 的"委派桩"矛盾。且 boundaries.md 未列入跨文档同步计划。

**修法**：在 F011 文档的依赖段或适当位置添加标注：
> "跨文档同步待办：boundaries.md 第 15 行 server/nodes/ 描述需从'纯函数'更新为'委派桩/状态转换器'，与 AGENTS.md 规则 #5 和 F011 §4 对齐。此修复在跨文档同步阶段执行，不在 F011 文档内修改 boundaries.md。"

**注意**：不要在 F011 中修改 boundaries.md，只标注需同步。

### 缺陷 #4 [概念] — 共享预算未显式声明

**位置**：F011 §6 运行规则（约第 182-183 行）

**问题**：反馈循环和 DRR 长循环共用同一 current_iteration 计数器，但文档未显式声明这是有意设计。

**修法**：在 §6 添加显式设计决策声明：
> "设计决策：反馈循环（阶段5）和 DRR 长循环（阶段7）共用同一循环预算（max_iterations / current_iteration）。理由：(1) 简化状态管理，无需区分循环类型的独立计数器；(2) 总预算可控——无论哪种循环消耗，总迭代次数有上限；(3) 两种循环不会同时运行（流程是线性的）。"

### 缺陷 #5 [概念] — 可疑升级阈值未定义

**位置**：F011 §5 实现机制（约第 167 行）

**问题**："审查通过"闸门的"可疑升级"触发条件仅为示例，未给出形式化判定标准。

**修法**：在 §5 添加标注：
> "可疑升级的触发维度：覆盖率下降幅度、失败测试比例、新增代码与测试比例失衡等。具体阈值由 F002 编码实现时定义（如覆盖率下降 > 10%、失败测试比例 > 30%）。F011 仅定义升级机制和触发维度，不固定阈值。"

### 缺陷 #6 [概念] — prompt_template 路径模式不一致

**位置**：F011 §1 结构契约（约第 70 行）

**问题**：结构契约中 prompt_template 路径模式为 docs/handbook/prompts/{role}.md，但 L1 角色 project-controller 的实际路径为 docs/handbook/orchestrator-prompt.md，不符合该模式。

**修法**：在 §1 结构契约的 prompt_template 字段说明中添加注释：
> "prompt_template 路径遵循 docs/handbook/prompts/{role}.md 模式。L1 角色 project-controller 为例外，使用 docs/handbook/orchestrator-prompt.md（历史命名，已在 agent-registry.json 中正确配置）。"

---

## 修订规范

- 只修缺陷，不扩范围——不引入新的架构概念或模块
- 修订后 Status 仍为 Draft（待重审）
- 不修改 state-design.md 或 boundaries.md（跨文档同步由 L1 统一执行）
- 修订后在文档末尾或适当位置添加修订记录：
  > "修订记录 Round 1（2026-08-18）：修复 L3 校验 Agent 发现的 6 项缺陷（致命1 + 跨文档2 + 概念3），详见 06-f011-review.md。"
- 单文件 ≤ 300 行

---

## 硬约束（违反即事故）

1. **你是 L3 设计编写 Agent，只做设计修订，不越界**
2. **禁止自行调用 skill 产出内容**
3. **完成后必须写 harness-journal**
   - 在 `harness-journal/stage-02-feature-breakdown/` 目录创建 journal 文件
   - 记录：修了什么、每项缺陷如何修的、修订后行数
4. **完成后更新 progress.txt**
   - 追加 `[timestamp] stage-02 | F011-revision-r1 | done | 简述`
5. **不修改 sub_id**
6. **不修改 AGENTS.md 硬性规则**
7. **不修改 state-design.md 或 boundaries.md**

---

## 完成后报告格式

完成后向 L1 报告：

```
[修订完成报告]
任务: 修订 F011 Agent Runtime 设计文档（Round 1）
产出: docs/design/feature-f011-agent-runtime.md（修订后，Status: Draft）
修订后行数: [N 行]
验收标准:
  □ [致命 #1] 循环预算增加成功重置规则 — 通过/未通过（说明）
  □ [跨文档 #2] interrupt 拓扑明确选择 + 标注 state-design.md 需同步 — 通过/未通过（说明）
  □ [跨文档 #3] 标注 boundaries.md 需纳入跨文档同步 — 通过/未通过（说明）
  □ [概念 #4] 显式声明共享预算设计决策 — 通过/未通过（说明）
  □ [概念 #5] 标注可疑升级阈值由 F002 定义 — 通过/未通过（说明）
  □ [概念 #6] 注明 L1 路径例外 — 通过/未通过（说明）
  □ 修订后单文件 ≤ 300 行 — 通过/未通过（说明）
  □ 不引入新架构概念 — 通过/未通过（说明）
journal: harness-journal/stage-02-feature-breakdown/07-f011-revision-r1.md
progress: [progress.txt 末行]
问题: [遇到的问题，无则写"无"]
```

K总看到这个报告后，会把它带回给 L1（我）进行验收。
