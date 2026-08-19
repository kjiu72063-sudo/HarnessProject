# Controller Spec — F002 编码修订 R2

- 委派时间: 2026-08-19T09:57Z
- 委派者: L1 项目管控 Agent
- 依据: L3 test-reviewer 校验报告（harness-journal/stage-04-coding/05-f002-test-review.md，结论"需改进后重审"）
- 注意: 本 Spec 取代已作废的 R1（f002-coder-revision-r1.md）。R1 基于 L1 越权自产的判定，已作废；本 Spec 的缺陷范围全部来自 L3 独立校验结论。

```
[Controller Spec]
任务: 修复 F002 首轮编码（commit e1ba981）经 L3 校验确认的 2 项必须修复缺陷，并纳入 2 项建议改进
角色: coder
前置条件: F002 首轮编码完成 + L3 test-reviewer 校验完成（journal 05）

输入:
  - 功能 ID: F002
  - L3 校验报告: harness-journal/stage-04-coding/05-f002-test-review.md（缺陷唯一权威来源，必读）
  - 待修文件:
      pyproject.toml（依赖声明）
      uv.lock（需随声明变更重新生成）
      .gitignore（补 .coverage 文件规则）
      server/tests/（补逃生口用例）
      journal 更正（见验收标准 5）
  - 参考文档: docs/design/feature-f002-langgraph.md、docs/conventions/coding.md、pitfalls.md P009（环境构建方法）
  - 约束: AGENTS.md 硬性规则（#10 verify.sh 14 项、#12 基线一致性）；不改设计文档/跨文档/verify.sh/api-spec.md

缺陷修复范围（仅此 4 项，不得扩大）:
  #1 [必须修复 — L3 报告 #1] 依赖声明不自洽
     现状: pyproject 声明 langgraph>=0.2.50，但 definition.py 的
     JsonPlusSerializer(allowed_msgpack_modules=...) 仅在 langgraph-checkpoint>=4.1.0 存在；
     声明范围内 0.2.50→checkpoint 2.1.2 与 1.0.2→3.0.0 均 build 即 TypeError；
     已提交 uv.lock(1.2.11+4.2.0) 掩盖缺陷
     修复: 按 L3 建议 — pyproject 显式声明 langgraph-checkpoint>=4.1.0,<5.0.0
           并将 langgraph 下限抬至 >=1.2.11；重新生成 uv.lock；
           确保声明下限组合可 build（自验证：uv.lock 与 pyproject 声明一致）
  #2 [必须修复 — L3 报告 #2] .coverage 误入 git
     修复: git rm --cached .coverage；.gitignore 补 ".coverage" 文件规则（现有规则只覆盖目录/其他模式）
  #3 [建议纳入 — L3 报告 #3] journal 02 三处自报失实
     修复: 在你的修订 journal 07 中以"更正"段列表更正（checkpoint 实为 4.2.0 非 2.1.2；
           "60 新测试"实为 53 新 + 7 存量；"返回 500"实为 422）；
           不改写 journal 02 原文（保留审计链）
  #4 [建议纳入 — L3 报告 #4] API 逃生口零覆盖
     修复: 补 gate="human_intervention" 的 resume 测试用例（人工决策后路由正确）；
           预算逃逸测试名不副实者改为真实断言或改名

输出:
  - 修订后的 pyproject.toml + uv.lock + .gitignore + server/tests/（新增用例）
  - harness-journal/stage-04-coding/07-f002-coding-revision-r2.md（编号已分配，文件自建）
  - progress.txt 追加 [timestamp] stage-04 | F002 | revision-r2-done | 一句话
  - git 提交（含 .coverage 出库）

验收标准:
  1. pyproject 依赖声明自洽: langgraph>=1.2.11 + langgraph-checkpoint>=4.1.0,<5.0.0，
     uv.lock 与声明一致，声明下限组合不再存在 build 即崩的已知 API 缺口
  2. .coverage 已出库（git ls-files 不含 .coverage）且 .gitignore 含该文件规则
  3. 新增逃生口测试通过且断言真实（非仅"不报错"）
  4. journal 07 含三处更正段 + 修订内容 + 验证结果；progress.txt 已追加
  5. verify.sh 14 项全通过（环境受限会话按 P009 替代法验证时，须在 journal 记录实际环境与等效命令）
  6. 未修改: 设计文档/跨文档/api-spec.md/verify.sh/sub_id/其他 Agent journal（02 除外——也不改，更正写 07）
  7. 单文件 ≤ 300 行；改动不超出本 Spec 列出的文件范围
  8. 未调用 skill 产出内容

禁止:
  - 不得自行调用 skill 产出内容
  - 不得跳过 harness-journal 记录
  - 不得修改 sub_id / AGENTS.md 硬性规则
  - 不得修改设计文档与跨文档（#5/#6 已由 L1 排期，不在本轮）
  - 不得扩大修订范围（重构/清理不在本 Spec 内的代码 = 越界）
```
