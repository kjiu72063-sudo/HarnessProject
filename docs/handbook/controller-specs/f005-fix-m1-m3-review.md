# F005 M1/M2/M3 修复复审 Controller Spec（test-reviewer）

## 任务性质

F005 代码执行沙箱 L3 审查（journal 51）判定 3 条必须修复：M1（LocalExecutor 用 create_subprocess_shell 削弱白名单安全）+ M2（state-design.md 跨文档两处不一致）+ M3（超时返回 status="completed" 违反契约）。修复 coder 已交付提交 **0eb3326**（6 文件 +91/−14：local_executor.py + test_sandbox_local.py + state-design.md + journal 54 + progress + README 索引）。你复审的唯一对象：**0eb3326**（单看该提交；链上 44d6d60 为平台自动提交零差异，知悉即可）。

修复 Controller Spec：docs/handbook/controller-specs/f005-fix-m1-m3.md
修复 coder 记录：harness-journal/stage-04-coding/54-f005-fix-m1-m3.md
原审查结论（M1/M2/M3 原文与依据）：harness-journal/stage-04-coding/51-f005-test-review.md

## 审查原则

1. **独立验证**：不得引用 coder 自报、L1 journal 56 的任何内容性结论作为你的证据；全部亲测。
2. **修订后必须重新校验**（AGENTS.md L1 职责边界）：本次复审无豁免、不抽样放过。
3. 范围外不裁：N1/N2/N3 已在 journal 53 记档留后续统筹，不属本次复审对象。
4. 回归关注：M1 改 exec + shlex.split 后，白名单校验语义、超时/取消路径、既有 181 项测试是否语义不变。

## 复审标准（每项独立取证）

| # | 标准 | 验证方法（建议） |
|---|---|---|
| 1 | M1-a：local_executor.py 子进程创建全部走 `create_subprocess_exec`（全文件 `create_subprocess_shell` 零命中）；shlex.split 拆分不引入新注入面（如引号内空格命令、unicode 转义） | 读源码 + grep + 构造边界命令实测/测试 |
| 2 | M1-b：白名单校验先于执行且语义不变（对原始命令串校验，与拆分后执行的关系明确；既有白名单测试全过） | 跑 test_sandbox_whitelist.py + 读校验调用序 |
| 3 | M2-a：state-design.md sandbox_result 类型表述与实现一致（dict，disabled 语义）；build_test_commands 表述与 Pydantic 实际形态（field 默认空列表）一致——注意 coder 报告称"method 语法"与 field 形态的措辞差异，须以代码实际为准判定文档正确性 | 读 state-design.md diff + 读 harness_state.py 源码比对 |
| 4 | M3-a：超时路径 status="timeout" + exit_code=-1，与 DockerExecutor 超时行为对齐（ExecutionResult 契约） | 读源码超时分支 + 跑/读超时测试 |
| 5 | M3-b：纵容断言修正真实（原断言 completed 改 timeout 预期，非删除断言或跳过） | 读 test_sandbox_local.py diff |
| 6 | 改动恰 6 文件（git show --stat 0eb3326）：3 目标 + journal 54 + progress 1 行 + README 索引 1 行；server/ src/ 除 local_executor.py 与 test_sandbox_local.py 外零触碰 | git 取证 |
| 7 | verify.sh 14/14 + uv.lock 零漂移（UV_FROZEN=1）+ 后端测试数与基线一致（181+1 或修复后合理变化） | 独立复跑 |
| 8 | 修改后 local_executor.py 仍 ≤300 行 / 函数 ≤50 行；state-design.md ≤300 行 | wc -l |

## 歧义核查（备你裁定，L1 不裁定）

**流程事实**：coder 报告称"2 项自报歧义备审查"，但报告与 journal 54 均未列明具体条目——须由你从 journal 54 与 0eb3326 中识别实际歧义项并裁定。

L1 验收时观察到的流程疑点（供核查线索，非结论）：
- **疑点 ①（范围）**：修复 Spec 验收标准 4 字面为"恰 3 目标文件 + journal 54 + progress"，实际多 README.md 索引 1 行（journal 54 配套登记，项目惯例动作）。
- **疑点 ②（时间戳）**：progress fix-done 行时间戳 15:30Z 早于前一条 17:05Z（沙箱时钟漂移，journal 39 同现象先例）。
- **疑点 ③（M2 方向）**：journal 54 称 state-design.md L68 由 field 语法改为 method 语法（引歧义α裁决"两形态均允许"），而 fbc5d0c 实现为 Pydantic field（`build_test_commands: list[str] = []`），0eb3326 未触碰 harness_state.py——文档改后与实现形态的关系须以代码实际为准判定（复审标准 3 已含）。

## 验证环境指引

本会话沙箱可能无 uv（P009 环境漂移，**新实证：uv 二进制与 .venv 可能在会话中途被清除，且二者可被独立清除——L1 本批次实测 .venv 完好但 uv 缺失**）。替代构建法（journal 39 §9）：`pip install uv`（aliyun 镜像）→ .venv 若完好仅重装 uv 即可复跑；若 .venv 也被清：`UV_DEFAULT_INDEX` 指镜像 + `UV_FROZEN=1` → `uv venv` + 按锁钉版安装。镜像变量用后 unset（P010）。

## 结论格式

- 每项标准：PASS/FAIL + 独立证据摘录（命令 + 输出关键行）
- 歧义 α/β：各自裁定 + 理由
- 总结论：8 项全 PASS 且歧义裁定无必须修复项 → **建议 F005 推进 passing**；任一必须修复 → 列明修复项（F005 维持 review-pending）
- 产出：journal 55（编号已预留，勿改）+ progress.txt 追加 1 行 + harness-journal/README.md 索引更新
- 提交：单提交，恰 3 文件；P011 防护（提交前 `git status --short` + `git diff --cached --stat` 双向核对，40 秒后复查无平台自动提交混入）
- 报告 K 总：8 项对照表 + 歧义裁定 + 总结论
