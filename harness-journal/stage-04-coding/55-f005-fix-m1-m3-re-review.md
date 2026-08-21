# Journal 55 — F005 M1/M2/M3 修复 L3 复审报告

| 字段 | 值 |
|---|---|
| 编号 | 55 |
| 日期 | 2026-08-20 |
| 阶段 | stage-04-coding |
| 功能 | F005 代码执行沙箱 |
| 角色 | test-reviewer（L3 复审） |
| 委派源 | journal 56 (L1 流程验收 + 复审委派) |
| 审查对象 | 0eb3326 (6 文件 +91/-14, M1+M2+M3 修复) |
| 原审查 | journal 51 (M1/M2/M3 原始判定) |
| 状态 | re-review-done |

## 环境表

| 项 | 值 |
|---|---|
| Python | 3.12.3 |
| uv | 0.12.5 |
| 测试 | 181 passed + 1 skipped (基线不变) |
| verify.sh | 14/14 PASS |
| mypy | clean |
| ruff | clean |
| Docker | 未依赖 (mock client) |

## 一、8 项复审标准独立验证表

| # | 标准 | 结论 | 独立取证证据 |
|---|---|---|---|
| 1 | M1-a: create_subprocess_shell 零命中 + shlex.split 注入面 | **PASS** | `grep -rn "create_subprocess_shell" server/` 零输出; local_executor.py L70-72: `shlex.split(cmd_str)` → `create_subprocess_exec(args[0], *args[1:])`; 实测: shlex.split("python script.py; rm -rf /") = `['python', 'script.py;', 'rm', '-rf', '/']` — 分号成为字面量参数, exec 不解释为命令分隔; 管道/&&同理; unicode正常拆分 |
| 2 | M1-b: 白名单校验先于执行且语义不变 | **PASS** | __init__.py L126-130: _LocalExecutorAdapter.execute() 对每个 cmd 调 validate_command(cmd) → 再调 _local_mod.execute(); 白名单仍按完整命令字符串做前缀匹配(与拆分无关); test_sandbox_whitelist.py 31 用例全过 |
| 3 | M2-a: state-design.md 与实现一致 | **PASS** | state-design.md L50: `sandbox_result: dict` ↔ harness_state.py L71: `sandbox_result: dict` (一致); state-design.md L70: `def build_test_commands(self) -> list[str]: ...` ↔ harness_state.py L18: `def build_test_commands(self) -> list[str]:` (一致, method 形态); 初始值 harness_state.py L111: `sandbox_result={}` 与文档注释"初始 {}"一致 |
| 4 | M3-a: 超时路径 status="timeout" + exit_code=-1, 与 DockerExecutor 对齐 | **PASS** | local_executor.py L53-56: `any_timeout → status="timeout", exit_code=-1`; docker_executor.py L90-93: `TimeoutError → exit_code=-1, status="timeout"`; 两实现行为完全对齐 |
| 5 | M3-b: 纵容断言修正真实 | **PASS** | test_sandbox_local.py diff: `assert result.status == "completed"` → `assert result.status == "timeout"` + `assert result.exit_code == -1`; 真实修正, 非删除或跳过; 原有 `"timed out" in result.stderr` 保留 |
| 6 | 改动恰 6 文件, 范围外零触碰 | **PASS** | `git show --stat 0eb3326`: 6 文件 +91/-14; 3 目标(local_executor.py + test_sandbox_local.py + state-design.md) + journal 54 + progress + README 索引; `git diff --name-only | grep -E "^(server|src)/" | grep -v 目标文件` 零输出 |
| 7 | verify.sh 14/14 + uv.lock 零漂移 + 测试基线不变 | **PASS** | verify.sh 14/14 PASS; `git diff uv.lock` 零输出; 181 passed + 1 skipped (与修复前基线一致) |
| 8 | 文件行数 ≤300, 函数 ≤50 | **PASS** | local_executor.py=121行, state-design.md=96行, test_sandbox_local.py=78行; 最大函数 execute=27行; 全在限额内 |

## 二、歧义核查与裁定

### coder 自报歧义识别

coder 报告称"2 项自报歧义备审查"但 journal 54 未列明具体条目。从 journal 54 与 0eb3326 识别：

**歧义α: build_test_commands method 形态（journal 54 M2 段提及）**

裁定：**可接受**。设计歧义α裁决明示"Pydantic field 或方法按现有形态落地均允许"。实现为 method (harness_state.py L18), state-design.md 已改为 method 语法 (L70), 二者对齐。修复方向正确。

**第二项歧义：未识别**。journal 54 与 0eb3326 中仅此 1 项可识别歧义。coder 声称"2 项"与实际不符（疑点② L1 已记录）。

### 3 项流程疑点裁定

| 疑点 | 裁定 | 理由 |
|---|---|---|
| ① README 索引超出 Spec 字面范围 | **可接受** | journal 配套登记为项目惯例（先例: journal 28/30/34 等）; Spec "3 目标 + journal + progress" 语义为核心产出, README 索引属 journal 配套 |
| ② 时间戳倒挂 (15:30Z < 17:05Z) | **可接受** | 沙箱时钟漂移已知先例 (journal 39 同现象); 不影响内容正确性, 时间序以 journal 编号为准 |
| ③ M2 文档 method 语法与实现 field 形态关系 | **已解决** | 实现为 **method** (非 field); 文档已改为 method 语法; 二者对齐正确。疑点前提"实现为 Pydantic field"不成立 |

## 三、回归确认

| 回归项 | 结论 | 证据 |
|---|---|---|
| 白名单语义不变 | ✅ | validate_command 仍在 shlex.split 前按完整命令字符串校验; 31 用例全过 |
| 超时测试修正 | ✅ | 断言从 completed 改为 timeout + exit_code=-1; 真实修正非空洞 |
| 181+1 测试基线 | ✅ | 181 passed + 1 skipped, 与修复前一致 |
| DockerExecutor 零触碰 | ✅ | 0eb3326 未修改 docker_executor.py 及其测试 |
| 既有白名单测试语义 | ✅ | test_sandbox_whitelist.py 0eb3326 零 diff |

## 四、建议改进项

| 编号 | 描述 | 优先级 |
|---|---|---|
| N4 | shlex.split ValueError 未捕获: 未闭合引号命令（如 `python -c "import os`）可通过白名单前缀匹配但在 shlex.split 抛 ValueError, _run_single 的 `except OSError` 不捕获此异常; 建议改为 `except (OSError, ValueError)` | 低 |

说明: 所有白名单允许的 8 条命令均为 well-formed, 正常路径不触发; 但若绕过 adapter 直接调 execute() 或未来新增白名单条目时可能触发。按"克制兜底"原则首版可不修, 但作为已知边界记录。

## 五、shlex.split 注入面详析（M1-a 补充）

| 输入 | shlex.split 结果 | exec 行为 | 安全评估 |
|---|---|---|---|
| `python script.py --arg` | `['python', 'script.py', '--arg']` | python 接收 2 个参数 | ✅ 正常 |
| `python script.py; rm -rf /` | `['python', 'script.py;', 'rm', '-rf', '/']` | python 接收 4 个参数, 分号为字面量 | ✅ shell 元字符不解释 |
| `python script.py \| cat` | `['python', 'script.py', '\|', 'cat']` | python 接收 2 个参数, 管道符为字面量 | ✅ |
| `python script.py && rm -rf /` | `['python', 'script.py', '&&', 'rm', '-rf', '/']` | python 接收 4 个参数, && 为字面量 | ✅ |
| `python -c "import os; os.system('rm -rf /')"` | `['python', '-c', "import os; os.system('rm -rf /')"]` | python 执行 -c 参数 | ⚠️ 同 shell 行为, 但白名单危险模式检查先于此拦截 "rm -rf /" |
| `echo 你好` | `['echo', '你好']` | echo 接收 unicode 参数 | ✅ |
| `python -c "import os` | **ValueError: No closing quotation** | 未捕获, 异常传播 | ⚠️ N4 |

## 六、总结论

8 项复审标准**全部 PASS**。歧义裁定无必须修复项。3 项流程疑点均可接受。

1 项建议改进: N4 (shlex.split ValueError 未捕获, 低优先级)。

**建议 F005 推进 passing**。
