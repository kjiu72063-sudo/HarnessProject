# Controller Spec: F002 修订 R2 重审（test-reviewer）

> 状态: active | 委派者: L1 | 目标角色: test-reviewer
> 前置: 修订 R2 已完成（commit aea54ea）并通过 L1 流程验收（journal 09）

## 任务

对 F002 修订 R2（commit aea54ea）进行重审：验证首轮审查 6 项问题中纳入修订范围的 #1-#4 是否全部真实落地，并确认修订未引入新缺陷。

## 背景

首轮审查（journal 05）结论"需改进后重审"。修订 R2 由 coder 执行（journal 07），改动严格限于 Controller Spec f002-coder-revision-r2.md 范围：
- #1 [必须修复] pyproject 依赖声明不自洽 → 抬 langgraph>=1.2.11 + 显式 langgraph-checkpoint>=4.1.0,<5.0.0 + uv.lock 重生成
- #2 [必须修复] .coverage 误入 git → 出库 + .gitignore 补规则
- #3 [建议] journal 02 三处自报失实 → journal 07 更正段更正（原文保留）
- #4 [建议] 逃生口零覆盖 + 测试名不副实 → 新增 continue/abort 真实断言用例 + 改名改断言

#5（mypy strict 表述）/ #6（gate_decision 契约回写）已排期至 L1 跨文档同步待办，不属本次重审范围。

L1 流程验收已记录：提交 aea54ea 含 7 文件（pyproject.toml / uv.lock / .gitignore / .coverage 出库 / journal 07 / progress.txt / server/tests/test_harness_api.py），L1 复跑 verify.sh 14/14 PASS（lock 等价环境 langgraph 1.2.11 + checkpoint 4.2.0）。

## 被审对象

- commit aea54ea 全部改动（`git show aea54ea`）
- 承载文件: server/graph/definition.py, server/graph/edges.py, server/nodes/（8 桩 + gates.py + runtime.py）, server/routes/harness.py, server/schemas/harness_state.py, server/schemas/harness.py, server/tests/, pyproject.toml, uv.lock, .gitignore

## 审查清单（重审特化）

1. **#1 修复落地验证**（核心）: pyproject 依赖声明自洽性——声明下限组合（langgraph==1.2.11 + langgraph-checkpoint==4.1.0）下 build_harness_graph 是否真实可用；uv.lock 与声明是否一致（官方源、无镜像 URL 残留）
2. **#2 修复落地验证**: `git ls-files | grep .coverage` 为空；.gitignore 规则有效（新跑 coverage 不再入库）
3. **#3 修复落地验证**: journal 07 更正段与 journal 02 原文对照，三处失实（checkpoint 4.2.0 / 53 新+7 存量 / 422）是否如实更正且原文未篡改
4. **#4 修复落地验证**: 逃生口 API 用例是否真实断言 continue/abort 行为（非仅 200 状态码）；改名测试断言是否与名相符
5. **回归检查**: 62 测试全绿 + 覆盖率 ≥80% + 修订未引入新缺陷（重点：test_harness_api.py 改动段）
6. **技术决策回归**: 首轮报告的 3 项技术决策（interrupt 组合实现 / msgpack serde 白名单 / 逃生口状态重置）与 R2 改动无冲突

## 验证环境说明

本会话无 uv 网络直连能力时按 pitfalls.md P009 替代法构建 lock 等价环境（约 3 分钟）：
`uv export --frozen --dev -o /tmp/req-all.txt && uv venv .venv --python 3.12 --clear && UV_DEFAULT_INDEX=https://mirrors.aliyun.com/pypi/simple/ uv pip install -r /tmp/req-all.txt -p .venv/bin/python`
当前工作区 .venv 已按此法构建（langgraph 1.2.11 + checkpoint 4.2.0），可直接使用或重建。

## 输出

- harness-journal/stage-04-coding/08-f002-test-review-r2.md（**编号 08 已预留**）
  - 必含: 验证环境表、#1-#4 逐项核实结果、回归结果、结论
- progress.txt 追加一行
- harness-journal/README.md 索引更新

## 结论选项

- **通过** → L1 推进 F002 → passing
- **需改进后重审** → 列问题清单（分级: 必须修复/建议），L1 产出修订 Controller Spec R3

## 禁止

- 不得修改被审代码与文档（只审不改）
- 不得修改 .coze / sub_id / AGENTS.md 硬性规则 / verify.sh
- 不得调用 skill 产出内容
- 不得跳过 journal 记录
- L1 上一轮观察仅作现象线索，一切结论以你独立验证为准
