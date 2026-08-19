[Controller Spec]
任务: 审查 F003 LLM 提供商层编码产出（commit a775554）
角色: test-reviewer
前置条件: F002 passing（已满足）；F003 coding-done（commit a775554，journal 15）
输入:
  - 功能 ID: F003
  - 被审提交: a775554（基线 385d486，恰 14 文件）
  - 被审对象: server/llm/（base/config/exceptions/openai_provider/__init__）+ schemas/llm_schemas.py + config/settings.py + server/tests/test_llm_provider.py + test_llm_runtime_integration.py + pyproject.toml(+1) + uv.lock(+2)
  - 设计文档: docs/design/feature-f003-llm-provider.md（Approved，权威依据）
  - 关联设计: docs/design/feature-f011-agent-runtime.md §9（runtime delegate 真实接入"当前不实现"边界）
  - 参考文档: docs/conventions/testing.md、docs/conventions/coding.md、pitfalls.md P009/P010/P011
  - L1 流程验收记录: harness-journal/stage-04-coding/17-*.md
  - 上轮审查链参考: journal 05/08/12（F002 审查方法与证据标准）
  - 约束: AGENTS.md 硬性规则 14 条；Controller Spec f003-coder.md 验收标准 8 条
输出: journal harness-journal/stage-04-coding/16-f003-test-review.md + progress.txt 追加 + README 索引更新
验收标准:
  - 1. Protocol 契约：LLMProvider Protocol 两方法签名/文档字符串与设计文档 §抽象接口逐字对齐；complete_with_state 三字段累加逻辑正确（prev 缺省零值起点）
  - 2. OpenAIProvider 实现：async SDK 用法、OPENAI_API_KEY 读取、可配超时（默认 30s）、三类异常路径（key 缺失/API 异常/usage 缺失）统一 raise LLMError 且保留 from exc 因果链——独立断言测试质量而非仅看存在
  - 3. 工厂与配置：get_llm_provider 默认读 settings.LLM_PROVIDER、未知名 raise LLMError；settings 5 配置项默认值与设计文档一致（openai/gpt-4o/0.2/4096/30）
  - 4. **openai 显式声明判定（coder 决策 #1）**：pyproject 新增 `openai>=3.2.0,<4.0.0`——验证声明与代码直接 import 的事实自洽（F002 #1 同类教训），上/下限合理性独立判定
  - 5. **lock 路径 B 编辑正确性（coder 决策 #2）**：手动编辑 uv.lock +2 行（root package 两处）——独立验证编辑与 pyproject 声明一致性（uv lock --check）、镜像 URL 零残留、版本集合与 385d486 相比除 openai 声明外零漂移；路径 B 决断（vs 全量重写 3094 行）合理性评估
  - 6. Node 委派桩约束：server/nodes/ 零改动复核（git diff）；集成测试验证 delegate 链路可行性的测试质量（test_delegate_chain_reaches_provider 是否真实走 runtime→provider 链）
  - 7. 测试策略：mock 为主 + 1 真实调用用例无 key 时 SKIPPED 的保护真实性；20 mock 用例断言质量抽查（非仅状态码）；F002 存量 62 测试回归确认
  - 8. 横切回归：verify.sh 14/14 独立复跑；覆盖率口径核实（总 99%、F003 新增模块 100%、2 行未覆盖是否确为 F002 存量 gates.py:22/validation.py:53）；单文件 ≤300 行；import-linter 分层
  - 9. 设计文档一致性抽查：实现与 F003 设计文档偏差清单（如有）；settings 大写字段名（coder 决策 #3，LLM_PROVIDER vs F001 小写风格）给出事实描述与建议（裁决属 L1，不计入 coder 缺陷）
  - 10. 范围合规：a775554 恰 14 文件无夹带；journal 16 编号未被占用
禁止:
  - 不得修改任何被审文件（含 uv.lock/pyproject）
  - 不得跳过 journal 记录
  - 不得修改 sub_id / AGENTS.md / verify.sh / 设计文档
  - 不得引用 L1 或 coder 的自报结论作为证据（独立验证）
环境提示:
  - 复跑 verify.sh 时前置 UV_FROZEN=1（P010：UV_DEFAULT_INDEX 残留会重写已提交 lock）
  - 本工作区 .venv 为 lock 等价环境（langgraph 1.2.11 + checkpoint 4.2.0 + openai 3.2.0），可直接复用；若需重建按 P009 替代法
  - 平台 hookspath 自动 stage 行为存在（P011），git 操作时注意核对暂存区
