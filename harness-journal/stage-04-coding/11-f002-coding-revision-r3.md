# Journal 11 — F002 修订 R3：uv.lock 净化 + journal 07 更正

## 步骤名称
F002 编码修订 R3（N1 lock 净化 + N2 journal 更正）

## 执行时间
2026-08-19T10:30Z — 2026-08-19T10:55Z

## 前置条件
- Controller Spec: docs/handbook/controller-specs/f002-coder-revision-r3.md
- 输入 journal: 05（首轮审查）/ 08（R2 重审，N1/N2 唯一来源）/ 09 / 10（L1 委派）
- 基线 commit: aea54ea（R2 修订，lock 含 1602 处 aliyun URL）

## 执行内容

### N1: uv.lock 净化（路径 B — URL 改写，版本零变动）

**决断过程**：
1. 先按 Spec 首选路径 A 尝试官方源重生成：备份 lock → `rm uv.lock` → 直连 `uv lock`（1.38s 完成，uv 本地缓存命中）→ 产物官方源零残留，但 fresh resolve 将 openai 3.2.0 → **3.3.0**（2026-08-18 发布，其移除 tqdm 依赖导致 81 → 80 包）。
2. 评估后**放弃该产物**：任务语义是"净化"而非"升级依赖"；openai 3.3.0 发布不足 1 天，且 .venv 等价环境为 3.2.0，版本漂移会引入不必要的验证面。pyproject 约束禁止修改，无合法手段钉回 3.2.0 重新 fresh resolve。
3. 改走 Spec 路径 B：从 HEAD 恢复 lock → `sed` 两类 URL 全局替换：
   - `https://mirrors.aliyun.com/pypi/simple/` → `https://pypi.org/simple`（registry 端点，80 处）
   - `https://mirrors.aliyun.com/pypi/packages/` → `https://files.pythonhosted.org/packages/`（sdist/wheel 下载路径，1522 处；PEP 503 镜像保留相同路径哈希，hash 字段不受 URL 影响）
4. 与 HEAD diff 3204 行 = 1602 URL 行 × 2（每处一对 `<`/`>`），**精确吻合——除 URL 行外零字节变动**，openai 3.2.0 / 81 包 / tqdm 全部保留。

### N2: journal 07 两处自述失实更正

以下更正针对 journal 07（07-f002-coding-revision-r2.md）原文，原文按审计链要求零篡改：

**更正 1 — "官方源重生成 lock"表述失实**
- 原文（L25）: "`uv.lock` 重新生成（先直连 pypi.org 成功，56.76s；……已 `rm uv.lock` 重建为官方源，保持 lock 干净）"；L73 同类表述: "`uv lock` 最终以直连官方源完成以避免 registry 改写污染"
- 事实（journal 08 N1 证据）: 那次 `rm uv.lock` 重建的产物实际含 **1602 处 aliyun registry URL**——重建时会话仍残留镜像环境变量（UV_DEFAULT_INDEX），直连仅是误判。宣称"保持 lock 干净"与提交产物直接矛盾。
- 本次 R3 已实际完成官方源净化（见上），该缺陷闭合。

**更正 2 — "81 → 80 包（tqdm 移除）"表述失实**
- 原文（L26）: "顺带收敛：旧 lock 中多余的传递依赖 tqdm 不再被解析（81 → 80 包）"
- 事实（journal 08 N2 证据）: R2 前后两版 lock **均为 81 个 package 条目且 tqdm 均在**——当时解析器未移除 tqdm，包数从未变为 80。该句描述的现象不存在。
- 佐证：本 R3 会话路径 A fresh resolve 才真正出现 81→80（openai 3.3.0 移除 tqdm 依赖），但该产物已被主动放弃；最终提交版本为 81 包含 tqdm，与 R2 版包集合一致。

## 产出物
- `uv.lock` — 净化版（官方 pypi.org/simple + files.pythonhosted.org，81 包，版本 pin 与 aea54ea 完全一致）
- `harness-journal/stage-04-coding/11-f002-coding-revision-r3.md` — 本文件
- `progress.txt` — 追加 revision-r3-done 行
- `harness-journal/stage-04-coding/README.md` — 索引更新

## 验证结果

环境: python 3.12.3 | uv 0.12.5 | 工作区 .venv（langgraph 1.2.11 + langgraph-checkpoint 4.2.0 + openai 3.2.0，与净化后 lock 等价）

| 验收标准 | 命令 | 结果 |
|---|---|---|
| 1. 零镜像残留 | `grep -c "aliyun\|mirrors\." uv.lock` | **0** ✅ |
| 2. lock 与声明一致 | `uv lock --check` | Resolved 81 packages, exit 0 ✅ |
| 3a. 测试全绿 | `pytest server/tests/ -q` | **62 passed** (0.79s) ✅ |
| 3b. 全闸门 | `bash scripts/verify.sh` | **14 passed, 0 failed** ✅ |
| 4. journal 07 未动 | `git diff HEAD -- harness-journal/stage-04-coding/07-*.md` | 空（零改动）✅ |

补充: URL 改写完整性经 diff 定量核对——1602 处替换 × 2 = 3204 差异行，与 HEAD 对比差异行数精确相等，排除任何非 URL 字节变动。

## 遗留问题 / 范围外备注
- openai 3.3.0（2026-08-18 发布）存在于官方源，下次合法依赖更新时 fresh resolve 会自然引入——届时是否接受由 F003 编码阶段决定，非本轮范围。
- L1 跨文档同步待办（api-spec 对齐 / mypy strict 表述 / gate_decision 契约回写）仍按既定排期在 F006 编码前完成，不在本轮。
- 范围外发现: 无新增。

## 备注
- 编号 12 预留给重审 test-reviewer，未占用；journal 10（L1 委派）未触碰。
- 路径 B 决断理由：净化 ≠ 升级。fresh resolve 引入发布不足 1 天的 openai 3.3.0 属超出 Spec 意图的连带变更；URL 改写方案与 .venv 等价环境（openai 3.2.0）完全一致，验证面最小。
