# Journal 08: F002 修订 R2 重审报告（L3 test-reviewer 独立校验）

- 日期: 2026-08-19 18:32 +08:00
- 角色: L3 test-reviewer（独立复现、独立判定，未引用其他 Agent 结论作为依据）
- 被审对象: F002 修订 R2（commit aea54ea）
- 任务卡: docs/handbook/controller-specs/f002-test-review-r2.md
- 范围: 首轮问题 #1-#4 落地验证 + 回归无新缺陷；#5/#6 已排期 L1 跨文档同步，不属本轮

## 验证环境（实测记录）

| 环境 | 构成 | 用途 | 结果 |
|---|---|---|---|
| lock 等价环境 | 工作区 `.venv`（P009 替代法，python 3.12.3 + langgraph 1.2.11 + checkpoint 4.2.0） | 全量回归 + mypy + ruff | 62 passed / 99.46% / 0 error / 0 issue |
| 下限组合环境 | `/tmp/minr2` 独立 venv（langgraph==1.2.11 + langgraph-checkpoint==4.1.0 + lock 版测试依赖） | #1 声明下限全量测试（超越 coder 的仅 build 验证） | 62 passed / 99.46% |
| 静态溯源 | git show/diff + grep 于 aea54ea~1 与 aea54ea | uv.lock registry 溯源、范围合规、journal 对照 | 见 #1 与新缺陷 N1 |

说明: 覆盖率输出均以 COVERAGE_FILE 重定向至 /tmp；唯一例外是为验证 #2 故意在工作区生成 .coverage（验证被 .gitignore 忽略后已删除）。前端闸门未复跑——R2 未触及前端，L1 流程验收已复跑 verify.sh 14/14（journal 09），本轮按 Controller Spec 聚焦后端与依赖，如实记录此边界。

## 首轮 #1-#4 落地验证

### #1 依赖声明自洽 —— 核心落地，验收细则一处未达

- pyproject: `langgraph>=0.2.50` → `langgraph>=1.2.11`，新增 `langgraph-checkpoint>=4.1.0,<5.0.0` ✅（与首轮建议一致）
- 下限组合 `1.2.11 + 4.1.0` 独立 venv **全量测试 62 passed / 99.46%**（coder 仅验证 build，本轮更强）✅
- `uv lock --check` 通过（lock 与声明一致）✅
- **❌ 官方源要求未达**: Controller Spec #1 明确"来源为官方源，无镜像 URL 残留"。实测 aea54ea 的 uv.lock 含 **1602 处** `registry = "https://mirrors.aliyun.com/pypi/simple/"`；pre-R2 lock（aea54ea~1，即首轮 461084d 版本）为 **0 处**——镜像 URL 为 R2 重生成时引入。版本 pin 本身正确（langgraph 1.2.11 / checkpoint 4.2.0），不破坏声明自洽核心，但破坏 lock 可移植性契约：无法访问 aliyun 的环境（海外 CI/官方部署）`uv sync --frozen` 将失败。详见新缺陷 N1。

### #2 .coverage 出库 —— 落地 ✅

- `git ls-files | grep .coverage` 0 条 ✅
- .gitignore 新增 `.coverage` 行实测生效（check-ignore 命中）✅
- 行为验证: 在工作区跑全量覆盖率（生成 .coverage 53248B）后 `git status` 干净——文件被真实忽略 ✅（复核后已删除）

### #3 journal 三处失实更正 —— 落地 ✅

- journal 07 更正段三处（checkpoint 实为 4.2.0 / 60 为总通过数含 53 新 + 7 存量 / 500 实为 422）与首轮报告一致，内容准确 ✅
- journal 02 原文自 e1ba981 后零改动（git log 单条记录 + R2 diff 为空）——"原文保留不动"承诺兑现 ✅

### #4 逃生口 API 覆盖 —— 落地 ✅

- `test_resume_human_intervention_continue_resets_budget_and_loops`: 断言 next=["acceptance_check"]、human_intervention=False、current_iteration==0、status="interrupted"——覆盖 continue 重置语义四维度 ✅
- `test_resume_human_intervention_abort_ends_session`: 断言 status="ended"、next==[]、current_stage != "completed"——覆盖 abort/ended 分支（首轮 routes/harness.py:63 缺口）✅
- 名不副实测试 `test_resume_rejected_gate_loops_and_budget_escape` → 改名 `..._increments_iteration_and_returns_to_acceptance` 并改为真实断言（iteration 递增 + next 判定）✅
- `drive_to_escape_hatch` 真实触发逃逸: 连续驳回 6 次 → 断言 next=["human_intervention"]、current_iteration==6（6 > max_iterations 5）✅
- routes/harness.py 覆盖率 99%→100% ✅；两用例点名复跑通过 ✅

## 回归与技术决策

- 全量: **62 passed / 0 failed**（60→62），总覆盖率 **99.46%**（99.20→99.46），无新 warning
- mypy（项目配置口径）0 error、ruff 0 issue ✅
- 业务代码零改动: `git diff aea54ea~1 aea54ea -- server/graph server/nodes server/routes server/schemas server/main.py` 为空——首轮 3 项技术决策（interrupt 组合 / serde 白名单 / human_intervention 重置）所在文件未触碰，测试全绿佐证无冲突 ✅
- 遗留未覆盖行仅 gates.py:22（非 dict payload 兜底）与 validation.py:53（真实节点预算升级路径），均非 #1-#4 范围，且首轮报告未列为修复项，不构成本轮阻塞

## 新发现问题清单（R2 引入）

- **[N1] 级别: 必须修复**
  位置: uv.lock（1602 处 registry URL）+ journal 07 line 25/56（自述）
  描述: journal 07 自述"已 rm uv.lock 重建为官方源，保持 lock 干净"，但 aea54ea 实际提交的 lock 含 1602 处 aliyun 镜像 registry（pre-R2 为 0 处）——自述与提交事实不符，违反 Controller Spec #1 验收细则"来源为官方源，无镜像 URL 残留"。
  建议: 本沙箱直连 pypi.org 可行（journal 07 自记 56.76s 成功）——重跑 `uv lock`（不带 UV_DEFAULT_INDEX/镜像环境变量）后 `grep -c aliyun uv.lock` 复核为 0 再提交；journal 07 补更正段（模式同 #3，原文保留）。教训沉淀: 凡"重生成 lock"操作必须像 #2 的 ls-files 复核一样做 registry 溯源复核（可并入 pitfalls 或 coding.md 检查单，由 L1 决策）。
- **[N2] 级别: 建议改进**
  位置: journal 07 line 26
  描述: 自述"lock 81 → 80 包（tqdm 不再被解析）"，实测两版 lock 均为 81 个 package 条目且 tqdm 均在——又一处自述失实（同类问题，顺带性质）。
  建议: 随 N1 一并在更正段更正。

## 结论: 需改进后重审

- **达标**: #1 声明自洽核心（声明正确 + 下限组合全量绿 + lock 与声明一致）、#2 完整落地、#3 完整落地、#4 完整落地（断言真实 + 名实相符 + 覆盖缺口补齐）、回归零新缺陷、技术决策无冲突——代码与测试质量良好，修复动作范围合规。
- **未达标**: Controller Spec #1 验收细则"官方源、无镜像 URL 残留"未满足（N1），且伴随自述失实——恰为首轮 #3 同类问题在修订中重现，若放行将误导后续会话认为 lock 干净。
- **不驳回理由**: 无架构性问题；声明自洽的实质核心已落地；N1 修复路径单一、成本低、验证简单。
- 建议 L1: 产出最小范围修订（R3）: 仅重生成官方源 uv.lock + journal 07 补更正段（N1/N2），无需触碰任何代码；修订后可做轻量复核（grep aliyun == 0 + uv lock --check + 测试抽跑）。

## 产出

- 本 journal（08，编号按任务卡预留）
- progress.txt 追加一行
- harness-journal/README.md 索引行更新
- 未修改任何被审代码、测试、pyproject、uv.lock、.gitignore、其他 journal、sub_id
