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
  - 无论 A/B: 修订后必须在**全新环境**逻辑下自证可复现（方案 A：声明与 uv.lock 锁定即自洽；方案 B：测试需覆盖两个版本路径中可测的部分）

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
