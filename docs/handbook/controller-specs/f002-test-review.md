[Controller Spec]
任务: 对 F002 首轮编码产出（commit e1ba981）做独立内容校验（测试审查），产出缺陷清单与结论
角色: test-reviewer
前置条件: F002 首轮编码完成（journal 02）；L1 流程验收复跑 verify.sh 得 10 passed / 4 failed（后端项，流程事实见 journal 03 验收表；L1 未做且不得做内容判定，故委派你独立校验）

输入:
  - 功能 ID: F002
  - 被审对象: server/graph/definition.py、server/graph/edges.py、server/nodes/（8 桩 + gates.py + runtime.py）、server/routes/harness.py、server/schemas/harness_state.py、server/schemas/harness.py、server/tests/（5 文件 60 测试）、pyproject.toml（langgraph 依赖声明）
  - 参考文档: docs/design/feature-f002-langgraph.md（Approved，含验收标准 13 条）、docs/architecture/state-design.md、docs/conventions/testing.md、docs/conventions/coding.md
  - coder 自报: journal 02（含 3 项技术决策备注：interrupt_before+interrupt() 组合、msgpack serde 白名单、human_intervention 重置）
  - L1 复跑观察线索（**仅现象记录，非结论**，必须由你独立验证后自行判定）:
      a. L1 会话（无 uv；系统 python3 + langgraph 1.0.2）等效复跑 mypy: server/graph/definition.py:53 `JsonPlusSerializer(allowed_msgpack_modules=...)` 报 call-arg
      b. 同环境等效复跑 pytest: 9 failed + 8 errors（test_graph_definition 全部 ERROR 于 build_harness_graph）
      c. `git show --stat e1ba981` 显示提交含 53KB `.coverage` 二进制
  - 模板: docs/handbook/prompts/test-reviewer.md
  - 约束: AGENTS.md 硬性规则（尤其 #10 verify.sh 14 项、#12 技术栈基线一致性）；禁止修改被审代码

输出:
  - 测试审查报告（按模板输出格式，写入你的 journal 正文）
  - harness-journal/stage-04-coding/05-f002-test-review.md（L3 自写，编号已由 L1 分配）
  - progress.txt 追加一行 [timestamp] stage-04 | F002 | test-review | 一句话结论

校验范围与验收标准:
  - 1. 独立运行测试与覆盖率（≥80% 核实；coder 自报 99.18%）。记录你实际使用的环境与 langgraph 版本
  - 2. **依赖声明自洽性判定**（本单重点）: pyproject 声明 `langgraph>=0.2.50` 与代码实际 API 使用是否匹配——在声明下限/范围内是否可运行、mypy strict 是否通过。判定不得绑定单一会话环境（注意各会话环境漂移：coder 会话 uv sync 得 1.2.11；L1 会话系统 langgraph 1.0.2、无 uv、uv sync 曾因网络受限卡死）。若你的会话 uv sync 可用建议锁定验证，不可用则用系统 python 等效复跑并如实记录版本
  - 3. 测试质量五项（模板标准）: 覆盖率、边界用例（空值/极端值/错误路径）、测试隔离、命名规范、断言质量（断言关键行为而非仅"不报错"）
  - 4. 与 F002 设计文档一致性抽查: 8 Node 委派桩无业务逻辑、6 闸门语义、循环预算 route_loop_budget 的 `>` 语义与 human_intervention 升级时序、HarnessState 全字段
  - 5. coder journal 02 的 3 项技术决策是否带来质量风险（尤其 serde 白名单的版本兼容性）
  - 6. .coverage 纳入 git 追踪是否属缺陷及定级
  - 7. 输出问题清单（#N | 级别[必须修复/建议改进] | 位置 | 描述 | 建议）与结论（通过 / 需改进后重审 / 驳回）
  - 8. journal 05 + progress.txt 已记录

禁止:
  - 不得修改被审阅的代码（只读不写，除 journal 和 progress）
  - 不得以 L1 观察线索为结论——必须独立验证
  - 不得自行调用 skill
  - 不得修改 sub_id / AGENTS.md 硬性规则 / 设计文档 / verify.sh / api-spec.md
  - 不得因"verify.sh 在某环境全绿"而跳过声明范围内自洽性判定（验收标准 #2 是本单核心）
