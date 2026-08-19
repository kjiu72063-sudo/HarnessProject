# 05. F002 测试审查（L3 test-reviewer 独立校验）

## 步骤名称

F002 首轮编码产出（commit e1ba981）独立内容校验：测试覆盖率与质量审查、依赖声明自洽性判定。

## 执行时间

2026-08-19T08:03Z（16:03+08:00）

## 前置条件

- F002 首轮编码完成（journal 02，commit e1ba981）
- L1 流程验收复跑 verify.sh 得 10 passed / 4 failed（journal 03 验收表，仅流程事实）
- L1 越界已纠正、本委派生效（journal 04）；L1 观察线索仅作现象参考，本审查全部独立复验，未引用其结论
- 审查纪律：只读被审代码，未修改任何被审代码/配置/设计文档/verify.sh/api-spec.md；未调用 skill；未动 sub_id

## 执行内容

### 1. 实际验证环境（多环境交叉）

| 环境 | Python | langgraph | langgraph-checkpoint | 来源与用途 |
|---|---|---|---|---|
| A（系统） | 3.12.3 | 1.0.2 | 3.0.0 | 会话预装，等效复跑（本会话无 uv） |
| B（lock 等价） | 3.12.3 | 1.2.11 | 4.2.0 | 按已提交 uv.lock 精确版本经阿里云镜像装临时 venv（含 fastapi 0.141.1/pytest 9.1.1/mypy 2.3.1/ruff 0.16.3/import-linter 2.13 等全部 lock 钉版） |
| C（下限探测） | 3.12.3 | 0.2.50 | 2.1.2 | 安装声明下限，观察解析结果与 API 存在性 |
| D（边界探测） | 3.12.3 | 1.2.11 | 4.0.0 / 4.1.0 | 人工强制配对，仅测 allowed_msgpack_modules 参数存在性边界 |

本会话环境事实：无预装 uv（经 pip 镜像装得 uv 0.12.5）；pip 全局配置阿里云镜像而 **uv 不继承 pip.conf**——uv 不加 `UV_DEFAULT_INDEX=https://mirrors.aliyun.com/pypi/simple/` 时直连 pypi.org，本沙箱对 files.pythonhosted.org 限速约 3MB/min，`uv sync --frozen` 按 lock 记录的原始 URL 下载、镜像变量对它无效。**这正是 journal 03 记录「uv sync 卡死超 6 分钟」的根因**（详见备注，建议 L1 决策是否沉淀入 pitfalls.md）。

### 2. 独立复跑结果（verify.sh 后端 4 项等效命令，命令逐字一致）

| 闸门 | 环境 A（1.0.2 / 3.0.0） | 环境 B（lock 1.2.11 / 4.2.0） |
|---|---|---|
| `pytest server/ --cov=server ... --cov-fail-under=80` | 43 passed / 9 failed / 8 errors，总覆盖率 **78.28% FAIL** | **60 passed，总覆盖率 99.20% PASS** |
| `mypy server/ --config-file pyproject.toml` | 1 error：definition.py:53 call-arg | **0 error PASS** |
| `ruff check server/` | PASS | PASS |
| `lint-imports` | 系统未装（改由环境 B 实跑 + 静态核验） | **2 contracts kept PASS** |

环境 A 失败定位（独立取证）：9 failed 全部是经 `POST /api/harness/start` 建图的 test_harness_api 用例；8 errors 全部是 test_graph_definition 中使用 graph fixture 的用例；单一根因为 `build_harness_graph()` 在 definition.py:53 抛 `TypeError: JsonPlusSerializer.__init__() got an unexpected keyword argument 'allowed_msgpack_modules'`。与 journal 03 的 L1 现象记录一致，但本结论为独立复现。

覆盖率说明：环境 B 实测 99.20% 与 coder 自报 99.18% 的 0.02pp 差异源于依赖集微差（本环境未装 langchain 系列包），不影响达标结论。完整 verify.sh 前端 10 项未复跑：e1ba981 未触及任何前端文件，且 L1 会话已复跑通过（journal 03）；后端 4 项已用与 verify.sh 逐字相同的命令复跑。所有 coverage 输出重定向至 /tmp，未污染 git 追踪的 .coverage。

### 3. 依赖声明自洽性判定（Controller Spec 验收标准 #2，本单重点）

**实测 API 存在性矩阵**（inspect.signature 独立验证）：

| langgraph-checkpoint | allowed_msgpack_modules | 备注 |
|---|---|---|
| 2.1.2 | ✗ | langgraph==0.2.50（声明下限）实际解析结果 |
| 3.0.0 | ✗ | 参数名已改为 allowed_json_modules；langgraph 1.0.2 合法配对 |
| 4.0.0 | ✗ | 边界探测（强制配对，非解析器合法组合） |
| 4.1.0 | ✓ | 边界探测 |
| 4.2.0 | ✓ | 已提交 uv.lock 锁定版本 |

**解析器合法组合实测**：

- `langgraph==0.2.50`（=声明下限）→ checkpoint 2.1.2 → build_harness_graph 即 TypeError ✗
- `langgraph==1.0.2`（范围内，满足 langgraph 1.0.2 对 checkpoint 的 `>=2.1.0,<4.0.0` 约束）→ checkpoint 3.0.0 → 同上 ✗
- `langgraph==1.2.11`（lock）→ checkpoint 4.2.0（langgraph 1.2.11 约束 `>=4.1.0,<5.0.0`）→ 60 测试全绿 ✓

**判定：pyproject 声明 `langgraph>=0.2.50` 与代码实际 API 使用不自洽。** 声明下限自身即崩，范围内存在合法解析组合崩溃；当前唯一验证可运行的环境是已提交 uv.lock 锁定的 1.2.11+4.2.0（恰因 langgraph 1.2.11 强制 checkpoint>=4.1.0 而安全）。lock 掩盖了声明缺陷；无 uv 的会话（如 L1、本会话的系统环境）或以声明范围安装的环境必然失败。

mypy strict 口径：实测 `mypy --strict server/`（排除 tests）有 **15 errors**（type-arg、no-untyped-call 等）；通过的是项目配置口径（pyproject `[tool.mypy]`，即 verify.sh 实际执行口径）。设计文档验收标准 #4 括注「mypy strict 通过」按字面不成立，按 verify.sh 实际口径成立（见问题 #5）。

### 4. coder journal 02 三项技术决策质量风险评估（验收标准 #5）

1. **interrupt_before + interrupt() 组合**：实测语义成立——interrupt_before 暂停后，resume payload 由节点内 interrupt() 消费且不产生二次暂停；graph 层测试覆盖 continue/abort 两条出路。interrupt 自 langgraph 0.2.31 即存在，版本兼容性好。**风险低**。
2. **msgpack serde 白名单**：白名单本身符合设计文档安全要求（防任意反序列化）；当前 State 字段均为原生类型，不触发模块序列化，功能性风险低。但其载体参数 `allowed_msgpack_modules` 仅存在于 checkpoint≥4.1.0——**是问题 #1 依赖声明缺陷的直接成因，版本耦合风险高**。
3. **human_intervention 重置**：continue 重置 current_iteration=0，edge 层与 graph 层双重测试覆盖。**风险低**。

### 5. 测试质量五项（验收标准 #3）

1. **覆盖率**：99.20%（环境 B，≥80% 达标；环境 A 的 78.28% 是环境崩溃所致，非测试质量问题）。缺口 3 行：gates.py:22（非 dict payload 兜底分支）、validation.py:53（真实 problem_classification 节点的预算升级路径——预算逃逸目前仅 edges 层覆盖）、harness.py:63（ended 分支）。
2. **边界用例**：良好。预算边界（==max 不逃逸 / >max 逃逸）有显式测试；API 错误路径 404/409/422 覆盖；State 默认值（空列表/零值）覆盖。缺口：API 层无预算逃逸触发用例（见 #4）。
3. **测试隔离**：良好。每测试独立构造 state/graph/session，无跨测试依赖；SESSIONS 模块级字典仅增不改，无测试依赖其他测试的 session。
4. **命名规范**：良好（test_route_loop_budget_exceeded_uses_strict_greater_than、test_initializer_rejects_non_baseline_tech_stack 等描述被测行为）。例外：test_resume_rejected_gate_loops_and_budget_escape 名不副实——实际仅循环 1 次（current_iteration=1<5），未触发预算逃逸。
5. **断言质量**：良好。断言具体值（下一节点名、迭代重置、标志位、状态码），非仅「不报错」。

### 6. 与 F002 设计文档一致性抽查（验收标准 #4）

- 8 Node 委派桩无业务逻辑：✓（均为构造 ControllerSpec → 委派 Runtime → 返回 State 更新）
- 12 节点拓扑 / 3 HITL 闸门 interrupt_before / 2 自动闸门 / 审查默认 Agent：✓
- route_loop_budget 严格 `>` 语义：✓（含 ==max 不逃逸的显式测试）
- human_intervention 升级时序（标志位先于路由设置）：✓（节点 updates 设标志 → conditional edge 路由，与设计伪代码语义等价）
- HarnessState 全字段：基本 ✓；新增 gate_decision 字段未同步进 state-design.md（见 #6）
- SSE stub：符合验收标准「本次仅建立连接+推送 stub 数据」
- 文档侧偏差：ResumeRequest.gate 扩展了 human_intervention（API 驱动逃生口恢复所必需，合理）；resume 响应体为 {status(实际态)/next/state} 而非设计文档示例 {"status":"resumed"}（信息更丰富、对 F006 有用，但契约未回写文档，见 #6）

### 7. .coverage 纳入 git 追踪判定（验收标准 #6）

缺陷成立。e1ba981 含 53,248 字节 .coverage 二进制（非首次入库，最早 023a967 约束层阶段即被追踪）；根因是 .gitignore 仅有 `coverage`/`coverage/` 目录规则、缺 `.coverage` 文件规则。后果：每次执行 verify.sh 的 pytest --cov 闸门都会改写该二进制 → 工作区恒脏、diff 噪音、二进制合并冲突风险，直接干扰 L1 流程验收对工作区状态的判断。定级：必须修复（修复成本一行）。

## 验收标准核实汇总（Controller Spec 8 项）

| # | 校验项 | 结果 |
|---|---|---|
| 1 | 独立运行测试与覆盖率 | 环境 B：60 passed / 99.20% ✓；环境 A：43/9F/8E / 78.28%（环境崩溃证据） |
| 2 | 依赖声明自洽性 | **✗ 不自洽**：下限即崩、范围内合法组合崩，仅 lock 组合可跑 |
| 3 | 测试质量五项 | ✓ 总体良好，3 处小缺口（问题 #4/#5 与覆盖率缺口 3 行） |
| 4 | 设计一致性抽查 | ✓ 通过，2 处文档侧偏差待回写（问题 #6） |
| 5 | 3 项技术决策风险 | 组合/重置低风险；serde 白名单版本耦合风险高（#1 成因） |
| 6 | .coverage 追踪判定 | 缺陷成立，必须修复（#2） |
| 7 | 问题清单与结论 | 6 项（2 必须修复 + 4 建议改进），结论=需改进后重审 |
| 8 | journal + progress 记录 | 本文件 + progress.txt 已追加 |

## 问题清单

```
[#1] 级别: 必须修复
     位置: pyproject.toml:12（langgraph>=0.2.50）× server/graph/definition.py:53
     描述: 代码使用仅 langgraph-checkpoint>=4.1.0 才有的 JsonPlusSerializer(allowed_msgpack_modules=...)，
           而声明下限（0.2.50→checkpoint 2.1.2）及范围内合法组合（1.0.2→3.0.0）在 build_harness_graph
           即 TypeError；已提交 uv.lock（1.2.11+4.2.0）掩盖了缺陷。
     建议: pyproject 显式声明 langgraph-checkpoint>=4.1.0,<5.0.0（代码直接 import
           langgraph.checkpoint.* API，理应显式依赖），并将 langgraph 下限抬至 >=1.2.11（已实测其
           约束链强制 checkpoint>=4.1.0）；同步重新生成并提交 uv.lock；修复后在无 lock 缓存的
           净环境验证 build_harness_graph 可执行且 mypy 通过。

[#2] 级别: 必须修复
     位置: 仓库根 .coverage（e1ba981 内 53,248 字节；首次入库 023a967）；.gitignore 缺 .coverage 规则
     描述: 测试产物二进制入库，每次 verify.sh 的 pytest --cov 闸门运行都改写它，工作区恒脏、
           二进制 diff 噪音与合并冲突风险，干扰流程验收。
     建议: git rm --cached .coverage + .gitignore 增加 ".coverage" 一行。

[#3] 级别: 建议改进
     位置: harness-journal/stage-04-coding/02-f002-coding.md:29/33/45
     描述: coder 自报三处事实错误——"langgraph-checkpoint 2.1.2 实际落地"与已提交 uv.lock（4.2.0）
           矛盾，且 2.1.2 无 allowed_msgpack_modules 参数（该环境下测试不可能通过）；"共 60 个新测试"
           实为 5 文件 53 个新测试 + 7 个存量 = 60 总；"基线不匹配返回 500" 实为 422（api-spec.md
           亦无统一错误格式定义）。
     建议: journal 02 追加勘误段（保留原文）；后续修订 ControllerSpec 要求 coder 自报环境以
           uv.lock / uv pip list 实际输出为准。

[#4] 级别: 建议改进
     位置: server/tests/test_harness_api.py
     描述: API 层逃生口零覆盖——无 gate="human_intervention" 的 resume 用例（continue/abort 均无）；
           test_resume_rejected_gate_loops_and_budget_escape 名不副实（仅循环 1 次，未触发逃逸）；
           覆盖缺口 harness.py:63（ended 分支）。
     建议: 补 2 个 API 用例：多次拒绝驱动 current_iteration>max 后 resume human_intervention
           continue/abort，断言 next 与 status（ended）。

[#5] 级别: 建议改进
     位置: docs/design/feature-f002-langgraph.md 验收标准#4 括注「mypy strict 通过」；journal 02:33
     描述: 实测 mypy --strict（排除 tests）15 errors；通过的是项目配置口径（[tool.mypy]，
           verify.sh 实际执行口径）。「strict」表述与事实不符。
     建议: 设计文档措辞改为「项目配置 mypy 通过」，或将收紧 [tool.mypy] 至 strict 排期处理；
           本次不强制改代码（配置为 stage-02 既有基线）。

[#6] 级别: 建议改进
     位置: docs/architecture/state-design.md（HarnessState 字段表）；docs/design/feature-f002-langgraph.md（resume 响应示例）
     描述: 代码新增 HarnessState.gate_decision 字段未同步进 state-design.md；RESUMABLE_GATES 扩展
           human_intervention、resume 响应体 {status/next/state} 与设计文档示例 {"status":"resumed"}
           的偏差未回写文档——F006 前端将消费该契约，存在按旧文档实现出偏差的风险。
     建议: F006 编码前同步 state-design.md 字段表与 F002 设计文档（或 api-spec.md）的 harness
           端点契约。
```

## 结论

**需改进后重审。**

被审代码本身质量良好：lock 环境下 60 测试全绿、覆盖率 99.20%、四项后端闸门全过、委派桩约束遵守、测试质量五项达标、设计一致性抽查通过。但问题 #1（依赖声明不自洽）是必须修复的实质缺陷——声明下限自身即崩，当前可运行性完全依赖未被 pyproject 表达的 uv.lock 约束；问题 #2（.coverage 入库）直接干扰流程验收。#3–#6 为改进项，可随修订一并处理或排期。

建议 L1 基于本报告产出修订 ControllerSpec：范围建议 #1+#2 必须，#3 勘误与 #4 测试补充建议纳入，#5/#6 文档措辞与同步可排期。修订后按流程重新校验。

## 产出物

- 本审查报告（本文件正文）
- progress.txt 追加记录
- harness-journal/README.md 索引行更新

## 验证结果

见上文「独立复跑结果」与「验收标准核实汇总」；全部结论均有本会话实测证据支撑，未引用 L1 观察作结论。

## 备注

- 本审查未修改任何被审代码；除本 journal、progress.txt、README 索引行外零写入。
- 环境教训（供 L1 决策是否沉淀入 docs/conventions/pitfalls.md / env-review.md，本审查不越界代改）：
  1. uv 不继承 pip 镜像配置，会话内使用需 `UV_DEFAULT_INDEX=https://mirrors.aliyun.com/pypi/simple/`；
  2. `uv sync --frozen` 按 lock 记录的 files.pythonhosted.org 原始 URL 下载、镜像变量无效，且该域在本沙箱限速约 3MB/min——journal 03「uv sync 卡死超 6 分钟」的根因即此；
  3. 本会话用「uv venv + uv pip install + UV_DEFAULT_INDEX（按 lock 精确版本）」绕过限速，构建 lock 等价环境约 3 分钟，可作为后续会话的标准替代路径。
- 附带观察（不计入问题清单，均非 F002 引入）：pyproject dev 组 pytest-asyncio 重复声明两行（stage-02 既有）；lock 环境 fastapi 0.141.1/starlette 1.6.0 下 TestClient 有 1 条 httpx 弃用 warning（非代码问题）。
