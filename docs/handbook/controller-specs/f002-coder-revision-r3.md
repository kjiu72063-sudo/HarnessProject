# [Controller Spec] F002 修订 R3 — uv.lock 官方源净化 + journal 更正

> 依据：L3 test-reviewer 重审报告（journal 08）结论"需改进后重审"，问题 N1（必须）+ N2（建议）。
> 本 Spec 由 L1 基于重审报告产出，修复方式由 coder 决断，验收以本 Spec 为准。

## 任务
将 aea54ea 提交的 uv.lock 中 1602 处 aliyun 镜像 registry URL 净化为官方源，并在 R3 journal 中更正 journal 07 两处自述失实。

## 角色
coder（Agent Registry: `docs/handbook/agent-registry.json`）

## 前置条件
- F002 修订 R2 已完成（commit aea54ea），重审确认 #1-#4 代码级修复全部真实落地
- 本任务**不动任何 Python 代码、测试、pyproject.toml**——声明已自洽，仅 lock 产物卫生问题

## 输入
- 重审报告: `harness-journal/stage-04-coding/08-f002-test-review-r2.md`（N1 证据命令与 N2 明细）
- 被净化对象: `uv.lock`（当前 HEAD 版本）
- 环境事实: `docs/conventions/pitfalls.md` P009（uv 不继承 pip 镜像配置；直连 pypi.org 受限时 UV_DEFAULT_INDEX 可用）

## 工作内容
### N1（必须修复）uv.lock 镜像残留净化
- 重审者建议两种路径，coder 按环境可用性决断其一：
  - **路径 A（首选）**：官方源重生成 lock。注意 P009——若 uv 直连 pypi.org 卡死，需先设 UV_DEFAULT_INDEX 指向可用镜像完成下载、但生成的 lock 必须无镜像 URL（如先镜像装包后替换，需保证最终 lock 干净且校验通过）。
  - **路径 B（替代）**：将 lock 中所有 `https://mirrors.aliyun.com/pypi/simple/` registry URL 全局替换为 `https://pypi.org/simple`（hash 不受 URL 影响，重审已确认代码层面无影响），随后以 `uv lock --check` 验证 lock 与 pyproject 一致；若 --check 因网络不可达失败，用"lock 可被 uv export --frozen 完整导出 + 双关键包版本与声明一致"替代验证，并在 journal 中记录验证方式与限制。
- 净化后 lock 中镜像 registry URL 必须为 **0 处**。

### N2（建议纳入）journal 07 两处自述失实在 R3 journal 更正
- (a) "以官方源重生成 uv.lock" 与实测 1602 处镜像残留矛盾——更正为实际情况；
- (b) "81→80 包（tqdm 移除）" 实测两侧均 81 包且 tqdm 均存在——更正。
- 惯例：journal 07 原文零篡改，更正写入 R3 journal（编号 11）更正段。

## 输出
- `uv.lock`（净化版，官方源 URL）
- `harness-journal/stage-04-coding/11-f002-coding-revision-r3.md`（含 N2 更正段）
- `progress.txt` 追加一行
- `harness-journal/README.md` 索引更新

## 验收标准
1. `grep -c "aliyun\|mirrors\." uv.lock` = 0（无镜像 registry URL 残留）
2. lock 与 pyproject 一致性验证通过（uv lock --check；或替代验证并如实记录）
3. lock 等价环境全量测试 62 passed（可用工作区 .venv 或按 P009 重建），verify.sh 14/14
4. journal 11 存在且含 N2 两处更正，journal 07 原文未被修改（git diff 仅限本 Spec 范围文件）
5. 改动范围仅限：uv.lock、journal 11、progress.txt、README 索引（+ git 提交）
6. 提交信息符合 feat/fix/refactor/docs/test/chore 规范

## 禁止
- 不得修改任何 Python 代码 / 测试文件 / pyproject.toml（本任务无代码变更）
- 不得修改 .coze（含 sub_id）、AGENTS.md、verify.sh、设计文档、跨文档
- 不得跳过 harness-journal 记录
- 不得调用 skill 产出内容
