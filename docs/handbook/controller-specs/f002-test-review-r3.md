# Controller Spec: F002 修订 R3 重审

## 任务
对 F002 修订 R3（commit 1d54504）进行独立重审：核实 N1（uv.lock 镜像 URL 净化）与 N2（journal 07 两处自述更正）真实落地，回归确认零新缺陷，给出重审结论。

## 角色
test-reviewer（docs/handbook/prompts/test-reviewer.md）

## 前置条件
- R2 重审（journal 08）结论"需改进后重审"，问题 N1/N2
- R3 修订完成（commit 1d54504），coder 报告：N1 路径 B 净化（1602→0，版本 pin 零变动）、N2 journal 11 更正段、62 测试全绿、verify.sh 14/14

## 输入
- 被审提交: commit 1d54504（4 文件: uv.lock 3254 行 URL 变更 / journal 11 新增 67 行 / progress.txt 1 行 / README 索引 2 行）
- 对照基线: commit 56e48d8（R3 前状态）
- 参考文档:
  - docs/handbook/controller-specs/f002-coder-revision-r3.md（R3 Controller Spec，验收细则）
  - harness-journal/stage-04-coding/08-f002-test-review-r2.md（N1/N2 原始证据）
  - harness-journal/stage-04-coding/10-f002-r2-re-review-acceptance-and-revision-r3-delegation.md（R3 委派记录）
  - harness-journal/stage-04-coding/11-f002-coding-revision-r3.md（R3 coder journal，含路径 B 决断理由）
- 验证环境: 工作区 .venv（langgraph 1.2.11 + checkpoint 4.2.0，R3 报告确认无网络依赖可复用）；如需重建按 pitfalls.md P009

## 审查范围（严格收窄，勿扩大）
1. N1 落地验证:
   - 镜像 URL 残留归零的独立复验（grep 计数）
   - URL 替换正确性: 抽查替换后 URL 的哈希值与基线一致（PEP 503 路径重写不应改变哈希）、版本 pin 零变动（对比 56e48d8 与 1d54504 的 lock 版本集合）
   - lock 有效性: uv lock --check
   - coder 路径 B 决断（弃官方源重生成防 openai 3.2.0→3.3.0 漂移）的合理性评估——这是内容判断，属你的职责
2. N2 落地验证: journal 11 更正段与 journal 08 事实的一致性；journal 07 原文零篡改（git diff 56e48d8..1d54504 -- journal07 = 0）
3. 回归: 全量测试 62 passed / 覆盖率 ≥80% / verify.sh 14 项
4. 范围合规: 提交仅 4 文件，零代码/测试/pyproject 变更
5. coder 范外观察评估（git add -A 环境自动 stage 行为，R2/R3 两次遇到）: 判断是否需沉淀为 pitfall，给出建议即可，不必自写 pitfalls.md

## L1 流程验收记录的事实（供参考，非结论）
- journal 11 存在（67 行）、progress.txt 已追加、README 索引已更新
- git show --stat 1d54504: 恰好 4 文件，与 coder 报告一致
- grep -cE "aliyun|mirrors" uv.lock = 0（L1 复验）
- uv lock --check: Resolved 81 packages（通过）
- git diff 56e48d8 1d54504 -- journal07 = 0 行（零篡改）
- verify.sh 复跑 14/14 PASS（L1，lock 等价环境）

## 输出
- 重审报告 journal: harness-journal/stage-04-coding/12-f002-test-review-r3.md（编号已预留，勿改）
- progress.txt 追加一行
- harness-journal/README.md 索引更新

## 验收标准
- 重审报告含: 验证环境表 / N1+N2 逐项核实矩阵（含证据命令）/ 回归结果 / 范围合规确认 / 明确结论（通过 或 需改进后重审+问题清单）
- 未修改任何被审文件（uv.lock / journal / 代码）
- 未调用 skill 产出内容

## 禁止
- 不得修改被审代码 / uv.lock / journal 07/11 原文
- 不得跳过 journal 记录
- 不得修改 sub_id / AGENTS.md 硬性规则 / verify.sh / 设计文档
- 不得将结论限于 L1 记录的事实——必须独立验证后自行判定
