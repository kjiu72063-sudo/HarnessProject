# Journal 12: F002 修订 R3 重审（L3 test-reviewer）

- 时间: 2026-08-20T03:55Z
- 角色: L3 test-reviewer（独立校验，不引用他人结论）
- 被审对象: commit 1d54504（4 文件: uv.lock +3204/-3204 / journal 11 新增 / progress.txt 1 行 / README 索引 2 行），基线 56e48d8
- 依据: docs/handbook/controller-specs/f002-test-review-r3.md（审查清单 5 项）
- 验证环境: 工作区 .venv（langgraph 1.2.11 / langgraph-checkpoint 4.2.0 / openai 3.2.0，lock 等价）+ uv 0.12.5 + node_modules 就绪；官方源元数据经 pypi.org API 直查（curl 可达）

## 一、N1 落地验证 — 通过

| 验收点 | 独立验证命令与结果 |
|---|---|
| 镜像残留归零 | `grep -cE 'aliyun\|mirrors\.' uv.lock` = 0（pre-R3 `git show 56e48d8:uv.lock` 计数 1602，与 journal 08 N1 证据一致） |
| URL 形态正确 | 80 处 `https://pypi.org/simple`（registry）+ 1522 处 `files.pythonhosted.org`（artifact）= 1602，与 coder 报告的 80+1522 吻合 |
| 版本 pin 零变动 | 提取两版全部 `name`+`version` 对（82 行）排序 diff = 0 行 |
| 哈希零变动 | 提取两版全部 `sha256:<64hex>`（1522 个）排序 diff = 0 行 |
| 无夹带改动 | URL 归一化（aliyun 前缀与官方域名替换为占位符）后全文 diff = 320 行，统计确认 100% 为同一模式：80 块 × 4 行，全部是 `registry = "XX/simple/"` → `registry = "XX/simple"`（尾斜杠差异，PEP 503 规范化等价，非实质改动） |
| uv lock --check | 干净状态下通过（Resolved 81 packages in 3ms，lock 未被修改，exit 0） |
| artifact 真实性 | **两个样本从 files.pythonhosted.org 实测下载比对**：annotated_doc-0.0.5 wheel（sha256 117bac03…4b101 一致）+ annotated_types-0.8.0 sdist（sha256 13b2beaa…5cab7 一致）——改写后 lock 与官方源真实 artifact 对得上，非仅元数据自洽 |

## 二、路径 B 决断合理性评估 — 合理（独立证据支持）

- PyPI API 独立查询：openai 3.3.0 发布于 **2026-08-18T21:17:51**，晚于原始 lock 生成时间（461084d，2026-08-17）；当前 latest = 3.3.0。pyproject 仅声明 `langchain-openai>=0.2.0`（openai 为传递依赖，无版本 pin）→ 8-18 之后任何 fresh resolve 必然将 openai 解析至 3.3.0。coder 的漂移描述与 PyPI 事实吻合。
- 路径 A 两难独立确认：保 3.2.0 须改 pyproject 加 pin（超出 R3 范围且引入版本上界决策）；接受漂移则破坏 lock 等价性（.venv 已装 3.2.0）与"版本 pin 零变动"验收细则。
- 路径 B 的理论风险（镜像 artifact 与官方不一致）已实测排除（上节哈希实测）。
- 结论：在"净化而非升级"的任务语义下，路径 B 是正确决断。

## 三、N2 落地验证 — 通过

- journal 07 原文核对：L25「已 rm uv.lock 重建为官方源…」/ L26「81 → 80 包（tqdm 不再被解析）」/ L73「最终以直连官方源完成…」均存在，journal 11 更正段引用**逐字准确**。
- 更正事实与 journal 08 N2 证据一致（两版 lock 均 81 包、tqdm 均在）；journal 11 补充的「路径 A fresh resolve 才出现 81→80」对失实来源给出了合理闭环（openai 3.3.0 不再依赖 tqdm）。
- journal 07 零篡改：`git diff 56e48d8 1d54504 -- journal07` = 0 行；`git log -- journal07` 最后改动仍是 aea54ea。

## 四、回归 — 通过

- **verify.sh 14/14 全项独立复跑 PASS**（含后端 4 项 + 前端 10 项；62 passed / 覆盖率 99.46%）。
- 环境说明：复跑时我设了 `UV_DEFAULT_INDEX`（阿里云）兜底网络，该设置触发 uv run 重写 lock（详见第六节范外发现 a，污染已恢复，恢复后 `grep -c aliyun` = 0 且干净状态 `uv lock --check` 复跑通过）；测试执行基于 .venv 已装包，不受 lock 重写影响，14/14 结果有效。

## 五、范围合规 — 通过

- 1d54504 恰 4 文件（uv.lock / journal 11 / progress.txt / README 索引），`git diff 56e48d8 1d54504 --stat -- server/ pyproject.toml scripts/ src/` 为空 → 零代码/测试/声明变更。

## 六、范外观察评估（仅建议，不属验收项）

**a. R2 污染机制实证 + verify.sh 复跑陷阱（建议沉淀 pitfall，高优先级）**
本会话两次复现：在 `UV_DEFAULT_INDEX=<镜像>` 环境下执行任何 `uv run`（verify.sh 后端 4 项内部调用即是）都会把 uv.lock 全部 URL 重写为镜像地址（1627 行变更）。这正是 R2 时 1602 处 aliyun 污染的产生机制——coder 在带镜像环境变量的会话中执行了 uv 重建。P009 替代构建法用 `uv pip install`（不写 lock）安全；但**复跑 verify.sh 必须加 `UV_FROZEN=1`**（本会话实证：`UV_FROZEN=1` + 镜像变量下 `uv run` 后 lock 保持干净）。建议：(i) pitfalls.md 扩展 P009 或新增条目记录该机制与防护；(ii) 若 K总批准，可评估 verify.sh 内 uv run 改 `--frozen`（属 verify.sh 变更，我不越界改动）。

**b. 自动 stage 机制确认（建议沉淀 pitfall）**
全局 git config `core.hookspath=/source/git-hooks`（平台级钩子）。本会话我未执行任何 `git add`，但文件修改后即出现在暂存区（两次复现）。coder 报告的「git add -A 自动 stage」实为平台钩子行为，非误操作。建议 pitfall：**提交前必须 `git status` + `git diff --cached --stat` 核对暂存区**，防止 .coverage / uv.lock 意外变更被自动带入提交（R2 的 .coverage 入库与本次 lock 重写若未察觉均会被自动 stage）。

## 七、结论

**通过**。

- N1（lock 镜像净化）真实落地：残留归零、版本 pin 与哈希全量零变动、无夹带改动、官方源 artifact 实测一致、uv lock --check 通过。
- N2（journal 更正）真实落地：引用逐字准确、事实与独立证据一致、原文零篡改。
- 路径 B 决断合理（openai 3.3.0 漂移事实独立核实）。
- 回归 14/14，零新缺陷，范围合规。
- 建议后续（非阻塞）：第六节两条 pitfall 沉淀由 L1/K总 决策。

F002 测试审查链条（05 → 08 → 12）至此收敛，建议 L1 将 F002 状态推进为 passing，进入 F003 编码。

## 产出

- 本 journal（12）
- progress.txt 追加一行
- harness-journal/README.md 索引更新（12 预留 → 实际条目）
