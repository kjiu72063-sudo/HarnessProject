[Controller Spec]
任务: 审查 F014 settings 死配置清理微任务编码产出（commit 5e736d2）
角色: test-reviewer
前置条件: Sprint1 最终验收通过（journal 27）；跨文档同步批次 (e) 裁决落 coding.md（journal 28）；F014 coding-done（commit 5e736d2，journal 29）；L1 流程验收通过（journal 32；其内容性结论经 journal 33 更正作废——所有内容项以你独立验证为准，L1 无任何先在内容结论）
输入:
  - 功能 ID: F014（settings 死配置清理；编号映射待 K总 裁决，见 journal 32 §5，不影响本审查）
  - 被审提交: 5e736d2（验收 diff 锚点 331e7f6..5e736d2，恰 4 文件 +71/-3）
  - HEAD 知悉: 当前 HEAD=6f8789d，系平台 hookspath 自动提交（Coze-Commit-Type: user，时间晚于 coder 报告 2.5 分钟），混入 assets/ 下 2 个范围外文件（K总 放入的启动提示词 txt + image.png），非 coder 产物。验收 diff 必须锚定 331e7f6..5e736d2，不得误把 6f8789d 计入被审范围
  - 被审对象: server/config/settings.py(-2) + server/tests/test_settings.py(-1) + journal 29 + progress.txt(+1)
  - 任务 Controller Spec: docs/handbook/controller-specs/settings-cleanup-coder.md（8 验收标准 + 5 禁止）
  - 规范依据: docs/conventions/coding.md「后端 (Python)」settings 命名条目（journal 28 批次 (e) 裁决）
  - 参考文档: docs/conventions/testing.md、docs/conventions/pitfalls.md P009/P010/P011
  - L1 流程验收记录: harness-journal/stage-04-coding/32-f014-acceptance-and-test-review-delegation.md（内容性结论已作废，仅流程事实可参考）
  - L1 越界更正段（必读）: harness-journal/stage-04-coding/33-l1-boundary-violation-correction.md
  - 上轮审查方法参考: journal 05/08/12（F002 证据标准）、journal 16（F003 单轮收敛参照）
  - 约束: AGENTS.md 硬性规则 14 条
输出: journal harness-journal/stage-04-coding/30-settings-cleanup-test-review.md + progress.txt 追加 + README 索引更新
验收标准:
  - 1. **删除断权根基复核（最重）**：独立 grep 证实 openai_api_key 全仓零消费方、openai_model 唯一消费方即被同步删除的测试断言（测试锁定死配置 ≠ 业务消费）——"死配置"前提不成立则整个删除失去正当性
  - 2. 删除精确性：settings.py diff 仅 -2 行；LLM_* 大写 5 字段与 F001 存量小写 4 字段（app_name/api_prefix/database_url/backend_port）逐字不变（独立 diff 复核，不信 coder 自报）
  - 3. 测试同步正确性：test_settings.py 仅删 openai_model 断言 -1 行；全文件无对已删字段的残留断言；文件保留（2 函数 4 断言）且未为凑数新增测试
  - 4. **Spec 标准 5 口径独立裁定（无先在结论）**：任务 Spec 标准 5 字面"全仓 grep 零命中"与其禁改清单自相矛盾（journal 15/16/18/28、feature_list.json 等含字段名历史引用且禁改），该措辞矛盾属 L1 起草缺陷（journal 33 §2 确认）。coder 采用了"源码目录零命中"解释（journal 29 备注 1）。L1 曾越界作出"接受"裁定，已作废——口径是否可接受由你独立裁定，不得锚定任何先在结论。你需：独立验证源码目录（server/ src/ scripts/）零命中 + 独立裁定该口径是否可接受（不可接受则列问题清单）
  - 5. 行为影响声明核实：coder"零运行时行为影响"声明独立验证——OpenAIProvider 实际经由 OPENAI_API_KEY 环境变量与 settings.LLM_* 大写字段（不经两被删字段）；Settings 实例化/env 前缀机制不变
  - 6. 回归完整性：verify.sh 14/14 独立复跑（UV_FROZEN=1 前置）；82 passed + 1 skipped；覆盖率 99.55% 与基线一致（微任务不应改变覆盖率）；uv.lock 零漂移（git diff 空）
  - 7. 范围合规：331e7f6..5e736d2 恰 4 文件无夹带；独立确认 6f8789d 对被审对象零改动（仅新增 assets 2 文件）；journal 30 编号未被占用
  - 8. journal 29 真实性核对：coder 自报数据（14/14、82+1skip、99.55%、文件行数 20/12/70、grep 口径与 P011 三次提交修正时序）与你的实测一致；P011 新实证（untracked 文件 commit 时被自动 stage / 修正混入必须 git rm --cached / coder 移回 untracked 后平台仍自动提交形成 6f8789d）证据链完整性评估
禁止:
  - 不得修改任何被审文件（含 uv.lock/pyproject/settings.py/test_settings.py）
  - 不得跳过 journal 记录
  - 不得修改 sub_id / AGENTS.md / verify.sh / 设计文档 / feature_list.json
  - 不得引用 L1 或 coder 的自报结论作为证据（独立验证）
环境提示:
  - 复跑 verify.sh 时前置 UV_FROZEN=1（P010：UV_DEFAULT_INDEX 残留会重写已提交 lock）
  - 本工作区 .venv 为 lock 等价环境（langgraph 1.2.11 + openai 3.2.0），L1 已复用复跑通过，可直接使用；若需重建按 P009 替代法
  - 平台 hookspath 自动 stage 行为存在（P011），git 操作时注意核对暂存区；reviewer 会话自身提交也可能被混入 untracked 文件，提交前 git diff --cached --stat 逐文件核对
