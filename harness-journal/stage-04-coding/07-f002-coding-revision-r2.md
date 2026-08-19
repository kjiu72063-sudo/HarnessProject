# 07 — F002 编码修订 R2

## 步骤名称

F002 首轮编码缺陷修复（Controller Spec: docs/handbook/controller-specs/f002-coder-revision-r2.md）

## 执行时间

2026-08-19T09:55Z – 2026-08-19T10:12Z

## 前置条件

- L3 test-reviewer 校验报告（journal 05）确认 2 必须修复 + 2 建议纳入
- L1 流程验收与委派决策（journal 06）：#3 采用"journal 07 更正段"方式，#5/#6 排期 F006 编码前
- 会话环境探测：`command -v uv` 初始不可用 → pip 镜像安装 uv 0.12.5（P009 场景 A）
- .venv 已被环境重置，经 `uv sync`（UV_DEFAULT_INDEX=阿里云镜像）重建

## 执行内容

对照 L3 报告 #1–#4：

### #1 依赖声明自洽（必须修复）

- `pyproject.toml`: `langgraph>=0.2.50` → `langgraph>=1.2.11`，新增 `langgraph-checkpoint>=4.1.0,<5.0.0`
- `uv.lock` 重新生成（先直连 pypi.org 成功，56.76s；先前误用镜像变量导致 registry URL 全量改写为 aliyun，已 `rm uv.lock` 重建为官方源，保持 lock 干净）
- 顺带收敛：旧 lock 中多余的传递依赖 tqdm 不再被解析（81 → 80 包）
- **下限组合净环境验证**：独立 venv 安装 `langgraph==1.2.11 + langgraph-checkpoint==4.1.0 + pydantic`，`build_harness_graph()` 构建成功 → 声明下限不再存在 build 即崩缺口

### #2 .coverage 出库（必须修复）

- `git rm --cached .coverage`（首次执行后被环境自动 stage 机制覆盖，复核发现后重执行成功）
- `.gitignore` 新增 `.coverage` 规则（文件级，不影响 `.coverage.*` 等潜在扩展）
- 验证：`git ls-files | grep ^\.coverage$` → 0 条

### #3 journal 02 三处自报失实更正（建议纳入）

**更正段（对 journal 02，原文保留不动）**：

1. journal 02「验证环境」称 langgraph-checkpoint 为 2.1.2 — **更正：实际安装版本为 langgraph-checkpoint 4.2.0**（langgraph 1.2.11）。
2. journal 02 称新增 60 个测试 — **更正：60 为总通过数，其中新增 53 个、复用存量 7 个**。
3. journal 02 称 tech_stack 不匹配"返回 500" — **更正：实际返回 422**（FastAPI 校验层语义，HTTPException(422)）。

### #4 逃生口 API 零覆盖（建议纳入）

- 实测驳回序列确认预算语义：验收每驳回一次 `current_iteration +1`，第 6 次驳回后 6 > max_iterations(5) → 逃生口中断
- 新增 `drive_to_escape_hatch` 辅助函数 + 2 个真实断言用例：
  - `test_resume_human_intervention_continue_resets_budget_and_loops`：断言 next=["acceptance_check"]、human_intervention=False、current_iteration=0、status=interrupted
  - `test_resume_human_intervention_abort_ends_session`：断言 status="ended"（区别于 completed）、next=[]、current_stage≠"completed"
- 名不副实测试处理：`test_resume_rejected_gate_loops_and_budget_escape`（只循环未逃逸）→ 改名 `test_resume_rejected_gate_increments_iteration_and_returns_to_acceptance` 并改为真实断言（iteration 递增 + next 判定）

## 产出物

| 文件 | 变更 |
|---|---|
| pyproject.toml | langgraph>=1.2.11；新增 langgraph-checkpoint>=4.1.0,<5.0.0 |
| uv.lock | 重新生成（官方 pypi.org registry） |
| .gitignore | +`.coverage` |
| .coverage | git 索引删除（磁盘保留，untracked） |
| server/tests/test_harness_api.py | +2 逃生口用例 +1 辅助函数；1 测试改名改断言 |
| harness-journal/stage-04-coding/07-f002-coding-revision-r2.md | 本文件 |

## 验证结果

- **环境**：python 3.12.3 ｜ langgraph 1.2.11 ｜ langgraph-checkpoint 4.2.0（本会话实测）
- **下限组合 build**：langgraph==1.2.11 + checkpoint==4.1.0 独立 venv 构建图成功（#1 证据）
- **测试**：62 passed（原 60 + 新 2），0.87s
- **verify.sh**：14/14 PASS（本会话全量执行，非环境受限等效替代）
- **.coverage**：git ls-files 0 条 ✅
- **范围合规**：改动仅 Spec 列出的文件；未动设计文档/跨文档/verify.sh/sub_id/其他 journal

## 备注

- 环境漂移实录：本会话 uv 初始不可用、.venv 被重置、uv sync 直连曾超时——按 P009 用镜像装 uv + 镜像 sync 依赖，但 `uv lock` 最终以直连官方源完成以避免 registry 改写污染
- 首次 `git rm --cached .coverage` 后被环境自动 stage 覆盖，提示后续会话凡"出库"操作必须复核 `git ls-files`
- 遗留：L3 报告 #5（mypy strict 表述）、#6（gate_decision 契约回写 state-design.md）已由 L1 排期至 F006 编码前，不在本轮
