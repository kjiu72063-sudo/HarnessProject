# F005 M1+M2+M3 修复 Controller Spec — L3 审查必须修复项

- 版本: 1.0
- 委派者: L1 管控 Agent
- 执行者: F005 修复 Coder Agent（角色模板: docs/handbook/role-templates/coder.md）
- journal 预留: 54 = 修复执行记录（自写），55 = 复审记录（禁占）
- 依据: journal 51（L3 审查，3M+3N）+ L1 流程验收 journal 53；L1 无先在内容结论，M 项的技术事实以 journal 51 审查结论为委派依据，修复实现中的一切内容判断以设计文档（Approved）与审查报告为准，发现矛盾记歧义事实（不裁定）

## 一、任务

修复 F005 L3 审查判定的 3 项必须修复项（M1 安全 / M2 契约 / M3 功能），最小改动，不顺带无关清理。

## 二、修复项定义（journal 51 口径）

| # | 严重性 | 缺陷 | 修复方向 |
|---|---|---|---|
| M1 | 安全 | LocalExecutor 用 `create_subprocess_shell` 而非设计要求的 `create_subprocess_exec`，shell 元字符削弱白名单安全 | 改 exec 形态（零 shell 调用），命令安全拆分，白名单校验语义不变 |
| M2 | 契约 | state-design.md 跨文档不一致：sandbox_result 类型 dict\|None vs 实现恒 dict；build_test_commands field vs method 表述冲突 | 文档对齐实现（F004 M1/M2 同型先例；歧义α裁决明示"Pydantic field 或方法按现有形态落地"均允许） |
| M3 | 功能 | LocalExecutor 超时返回 status="completed" 而非 "timeout"，违反 ExecutionResult 契约 | 超时路径返回 "timeout"；纵容该 bug 的既有测试断言同步修正 |

N1/N2/N3（建议改进）不在本微任务范围（F004 journal 40 先例：留后续批次统筹）；如 K总 另行指示顺带修复以指示为准。

## 三、验收标准（8 项，逐条自报证据）

| # | 标准 | 证据要求 |
|---|---|---|
| 1 | M1: local_executor.py 全部子进程创建走 `create_subprocess_exec`，全文件 grep `create_subprocess_shell` 零命中；命令拆分不引入新注入面；白名单校验先于执行且语义不变（既有白名单测试全过） | diff 摘录 + grep 结果 |
| 2 | M3: 超时路径 status="timeout"；超时相关既有测试断言由纵容 completed 修正为 timeout 预期 | diff 摘录 + 测试输出 |
| 3 | M2: state-design.md 两处表述与实现一致（sandbox_result: dict 及 disabled 字典语义；build_test_commands 按 Pydantic field 默认空列表形态） | diff 摘录 |
| 4 | 改动范围恰 3 目标文件（server/sandbox/local_executor.py + 受影响测试文件 + docs/architecture/state-design.md）+ journal 54 + progress 追加；范围外零文件 | git diff --cached --stat |
| 5 | 零范围外代码触碰: server/ src/ 除 M1/M3 目标文件外零变动 | git diff --name-only 比对 |
| 6 | verify.sh 14/14 PASS + uv.lock 零漂移（UV_FROZEN=1 前置） | 输出摘录 + git diff -- uv.lock 空 |
| 7 | journal 54 写入 + progress.txt 追加恰 1 行（fix-done） | wc -l + progress 末行 |
| 8 | 修改后文件仍 ≤300 行 / 函数 ≤50 行 | wc -l 清单 |

## 四、约束（硬性）

1. 禁改: 设计文档（Approved）、.coze、journal 53/55、审查报告 journal 51、F002/F003/F004 既有代码与测试语义（M3 涉及的 F005 测试断言修正除外——属本修复范围）
2. 最小改动：仅 M1/M2/M3 三项，不顺带 N 项与格式化清理
3. 全部 13 条硬规则 + P009（uv 缺失/sync 卡死替代法见 journal 39 §9；**新实证：L1 会话发现 .venv 与 uv 二进制会话中途被清除，环境重置不只发生在会话冷启动**）/P010（UV_FROZEN=1 前置）/P011（提交前 git status --short + git diff --cached --stat 双向核对；平台自动提交零差异知悉不处理）/P012（不转述未核实结论）
4. 提交锚点: e165d04..HEAD 区间内自报最终 commit 哈希 + 文件清单

## 五、报告格式

①8 项验收标准逐条对照（表）②提交哈希 + diff 锚点 ③环境表 ④踩坑与 P 编号命中 ⑤产出物清单 ⑥自报歧义/存疑项（标注"备审查"，L1 不裁定）。

## 六、完成定义

8 项全过 + verify.sh 14/14 + journal 54 自写 + progress 追加一行（`[时间] stage-04 | F005 | fix-done | 摘要`）+ 恰当文件数提交（P011 防护通过）→ L1 流程验收 → test-reviewer 复审（journal 55，聚焦 M1/M2/M3 修复正确性 + 回归）。
