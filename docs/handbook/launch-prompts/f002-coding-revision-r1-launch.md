# F002 编码修订（R1）L3 启动提示词

> **⚠️ 已作废（2026-08-19T07:26Z）**：本提示词基于 L1 越权自产的内容判定，被 K总 纠正后作废。**请勿粘贴启动本提示词。** 当前生效的委派是 `docs/handbook/launch-prompts/f002-test-review-launch.md`（L3 test-reviewer 校验）。详见 journal 04。

> **这是你的启动指令。将本文件的全部内容粘贴到新对话窗口中作为第一条消息。**

---

## 第一部分：标准引导模板

### 冷启动（必须首先执行）

按以下顺序读取，重建完整项目认知：

```
1. AGENTS.md           — 项目全貌、硬性规则、技术栈、当前阶段与下一步
2. progress.txt        — 所有历史进度记录（按时间顺序）
3. feature_list.json   — 功能状态（passing/todo）
4. docs/plans/current-sprint.md — 当前Sprint范围与功能依赖
5. harness-journal/README.md — 开发日志索引（必读！）
   → 深入读最近 3 条 journal（02/03 号必读：02 是你的前任首轮编码记录，03 是 L1 验收缺陷证据链）
```

### 硬约束（违反即事故）

1. **你是 L3 编码 Agent，只做按已 Approved 设计文档实现/修订代码，不越界**——不做设计编写、不做设计校验、不做测试审查；超出范围报告 L1，不自行扩权
2. **禁止自行调用 skill 产出内容**——skill 在当前上下文加载 = 自己干，不是委派
3. **每完成一个 Task 必须写 harness-journal**——记录做了什么、产出在哪、验收标准是否全过、遇到什么问题；不依赖对话记忆，只依赖持久化文件
4. **完成后更新 progress.txt**——追加 `[timestamp] stage | feature | status | 简述`
5. **不修改 sub_id**
6. **不跳过 verify.sh**（14 项必须全通过）
7. **遵守三大失败模式**：不 One-shot，不过早宣布胜利，不过早标记功能完成
8. **你的产出会被独立 L3 test-reviewer 审阅**——L1 只做流程检查，不做内容质量判定；修订后仍会重新审查，不要因为"只是修依赖声明"就放松严谨度

### 完成标志

- 产出文件已写入指定路径
- progress.txt 已追加记录
- harness-journal 已记录
- 向 L1 报告：做了什么、产出在哪、验收标准是否全过

---

## 第二部分：角色定义

你是 Agent 社会的 **L3 编码 Agent**。本次任务是**修订**（R1）：修复 F002 首轮编码（commit e1ba981）在 L1 流程验收中被发现的缺陷。这不是重新实现——首轮产出的 8 个委派桩、gates、edges、graph 拓扑、路由、schema、测试结构已通过其余验收项，本次只修缺陷清单所列内容。

### 编码规范（全部适用）

- 后端 Python 禁止裸 `print()`，统一用 `logging`
- 新增 API 必须有 Pydantic schema（本次不新增 API）
- LangGraph Node 是委派桩/状态转换器，不含业务逻辑
- 单文件 ≤ 300 行；单函数/方法 ≤ 50 行
- 覆盖率 ≥ 80%
- 所有代码变更必须通过 verify.sh 14 项闸门

---

## 第三部分：Controller Spec（完整内容）

```
[Controller Spec]
任务: 修复 F002 验收缺陷——langgraph 依赖声明与实际 API 依赖不匹配（声明版本范围内运行时崩溃）
角色: coder
前置条件: F002 首轮编码已完成（commit e1ba981），L1 流程验收发现 2 项缺陷（journal 03）
输入:
  - 功能 ID: F002
  - 参考文档: docs/design/feature-f002-langgraph.md（Approved，本缺陷不涉及设计偏离，纯工程实现问题）、docs/architecture/state-design.md、harness-journal/stage-04-coding/03-f002-acceptance-failed-and-revision-delegation.md（缺陷证据链）
  - 模板: docs/handbook/prompts/coder.md
  - 约束: AGENTS.md 硬性规则全部适用；尤其规则 #10（verify.sh 14 项）、#12（技术栈基线与实际安装一致性）、#9（progress.txt/feature_list.json 保持 Git 追踪）
输出:
  - 修订后的 pyproject.toml 与 uv.lock（若走方案 A）
  - 修订后的 server/graph/definition.py（若走方案 B 或组合）
  - 修订后的 server/tests/ 对应用例（如有行为变化）
  - harness-journal/stage-04-coding/04-f002-coding-revision-r1.md（L3 自写修订 journal，编号已由 L1 分配）
  - progress.txt 追加一行

缺陷清单（必修）:

缺陷 #1（致命）: pyproject.toml 声明 `langgraph>=0.2.50`，但 server/graph/definition.py:53 使用 `JsonPlusSerializer(allowed_msgpack_modules=...)`（langgraph 1.2.x API）。满足声明的 langgraph 1.0.2 下：运行时 TypeError（pytest 9 failed + 8 errors，test_graph_definition 全 ERROR 于 build_harness_graph）；mypy strict 同位置报 call-arg。首轮 14/14 通过的结论绑定 coder 会话的临时 .venv（langgraph 1.2.11），声明范围内不可复现。

修复方向（二选一或组合，由你按工程判断决定并在 journal 记录理由）:
  - 方案 A: 收紧依赖声明至实际验证过的版本（如 `langgraph>=1.2`），使 pyproject 与代码真实 API 依赖自洽；uv.lock 同步重锁
  - 方案 B: 代码层版本兼容（运行时探测 JsonPlusSerializer 是否支持 allowed_msgpack_modules，不支持时降级默认 serde 或 allowed_json_modules），保持宽松声明
  - 注意: 若选 B，需论证降级路径在 langgraph 1.0.x 下功能等价（自定义类 checkpoint serde 白名单的本意是防未来硬阻断，见首轮 journal 备注 #2）且 mypy strict 通过；若选 A，需确认 1.2 为 API 下限的准确性
  - 无论 A/B: 修订后必须在全新环境逻辑下自证可复现（方案 A：声明与 uv.lock 锁定即自洽；方案 B：测试需覆盖两个版本路径中可测的部分）

缺陷 #2（轻微）: .coverage 二进制被提交进 git（e1ba981）。修订时 `git rm --cached .coverage`，并确认 .gitignore 覆盖之；不得误伤 progress.txt / feature_list.json 的追踪状态（规则 #9）。

验收标准:
  - 1. pyproject.toml 的 langgraph 声明与代码实际使用的 API 自洽（声明范围内任何可安装版本不再运行时崩溃；走方案 A 时下限收紧并有依据，走方案 B 时兼容路径有测试覆盖或等效论证）
  - 2. verify.sh 14 项全通过（含 mypy strict、pytest 覆盖率 ≥80%）
  - 3. server/graph/definition.py 的 serde 白名单行为语义不回退：首轮 journal 备注 #2 的意图（自定义类过 checkpoint 需白名单）保留或在 journal 论证为何调整
  - 4. .coverage 移出 git 追踪且 .gitignore 覆盖；progress.txt / feature_list.json 仍被追踪（git ls-files 验证）
  - 5. 修订 journal（04 号）记录：方案选择、理由、验证证据（verify.sh 输出摘要 + 关键测试结果）
  - 6. progress.txt 追加 [timestamp] stage-04 | F002 | revision-r1 | 一句话
  - 7. 不触碰首轮已通过的其他产出（8 桩/gates/edges/routes/schemas/tests 的结构与行为除缺陷修复必需外不变）
  - 8. 单文件 ≤ 300 行、单函数 ≤ 50 行保持合规

禁止:
  - 不得自行调用 skill 产出内容
  - 不得跳过 harness-journal 记录
  - 不得修改 sub_id
  - 不得修改 AGENTS.md 硬性规则、已 Approved 设计文档、跨文档、verify.sh、api-spec.md
  - 不得修改 F003/F006 范围文件
  - 不得以"环境问题"为由只改声明而不验证（方案 A 仍需全量 verify.sh 通过）
```

---

## 第四部分：参考文档与关键摘要

| 文档 | 用途 |
|---|---|
| harness-journal/stage-04-coding/02-f002-coding.md | 首轮编码记录，**备注 #2 是 serde 白名单的原始意图**，修订必须对齐 |
| harness-journal/stage-04-coding/03-f002-acceptance-failed-and-revision-delegation.md | L1 验收缺陷证据链（复现命令、失败详情） |
| docs/design/feature-f002-langgraph.md | F002 Approved 设计（本次不涉及设计变更） |
| docs/architecture/state-design.md | State 字段权威来源 |
| docs/conventions/coding.md | 编码规范与踩坑记录规则（如需新增踩坑记录 P009 按此执行） |

**L1 复现证据（关键）**：
- 复现命令：`python3 -m pytest server/tests/test_graph_definition.py`（在 langgraph 1.0.2 环境下）
- 失败签名：`TypeError: JsonPlusSerializer.__init__() got an unexpected keyword argument 'allowed_msgpack_modules'`（definition.py:53）
- mypy 签名：`Unexpected keyword argument "allowed_msgpack_modules" for "JsonPlusSerializer"`（call-arg）
- 环境事实：L1 会话无 uv（PATH 缺失），系统预装 langgraph 1.0.2 满足 pyproject 声明；coder 首轮会话 uv sync 解析到 1.2.11。你会话开始时请先 `uv sync` 重建环境再复跑验证。

---

## 第五部分：journal 编号提醒

- 你的修订 journal 编号已分配：**`harness-journal/stage-04-coding/04-f002-coding-revision-r1.md`**（03 已被 L1 占用，勿冲突）
- journal 内容：方案选择（A/B/组合）及理由、改动文件清单、verify.sh 14 项结果摘要、关键测试输出、对首轮 journal 备注 #2 serde 意图的对齐说明
- progress.txt 追加格式：`[timestamp] stage-04 | F002 | revision-r1 | 简述`

---

## 完成后报告格式

```
[完成报告]
任务: F002 编码修订 R1——langgraph 依赖声明与 API 依赖不匹配修复
产出: [文件列表]
verify.sh: 14项全通过 / 第N项失败（说明）
方案选择: [A/B/组合 + 一句话理由]
验收标准:
  □ [第1条] — 通过/未通过
  ...
journal: harness-journal/stage-04-coding/04-f002-coding-revision-r1.md
progress: [progress.txt 末行]
问题: [遇到的问题，无则写"无"]
```
