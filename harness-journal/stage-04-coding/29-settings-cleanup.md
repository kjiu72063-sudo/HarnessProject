# 29 · F014 Settings 死配置清理（L3 coder 执行记录）

- **步骤名称**: F014 微任务 — settings 死配置清理（删 openai_api_key / openai_model + 测试断言同步）
- **执行时间**: 2026-08-19T17:41Z（本会话系统时钟；注：journal 28/progress 记录使用 2026-08-20 时间戳，各会话沙箱时钟存在漂移，本 journal 按本会话时钟如实记录，不回溯修正他方时间戳）
- **执行角色**: L3 编码 Agent (coder)
- **前置条件**: Controller Spec `docs/handbook/controller-specs/settings-cleanup-coder.md`（8 验收标准 + 5 禁止）；Sprint1 最终验收已通过（journal 27）；跨文档同步批次 (e) 裁决已落 coding.md（journal 28）；代码基线 = HEAD 331e7f6（L1 交接批次提交）

## 一、验证环境表

| 项 | 值（实测） |
|---|---|
| Python | 3.12.3 |
| uv | 0.12.5 |
| fastapi | 0.141.1 |
| langgraph | 1.2.11 |
| pydantic | 2.13.4 |
| pydantic-settings | 2.15.0 |
| openai | 3.2.0 |
| node / pnpm | v24.19.0 / 9.15.9 |
| git | HEAD 331e7f6 |
| 环境防护 | 会话 env 无 UV_DEFAULT_INDEX / UV_INDEX_URL 残留（P010 零残留）；verify.sh 全程 `UV_FROZEN=1` 前置；.venv 已存在且 lock 等价（journal 21/23 同源环境），本次未执行 uv sync，P009 风险路径未触发 |

## 二、执行内容

冷启动 5 步（AGENTS.md → progress 末 10 行 → current-sprint.md → journal README+27/28/31 → Controller Spec）完成后，独立复核 L1 的 grep 实证，执行删除：

1. `server/config/settings.py` — 删除 `openai_api_key: str = ""` 与 `openai_model: str = "gpt-4o"` 两行（git diff 实证：仅 -2 行，零其他变动）
2. `server/tests/test_settings.py` — 删除 `assert s.openai_model == "gpt-4o"` 一行（git diff 实证：仅 -1 行；该文件无对 openai_api_key 的断言，无需处理）。删除后 test_settings_defaults 仍剩 3 断言（app_name/api_prefix/backend_port）+ singleton 1 断言，文件保持存在，未为凑数添加新测试（验收标准 #4 口径）

删除断权：两字段均零业务消费方（openai_api_key 全仓零消费；openai_model 唯一消费点即被删的测试默认值断言——测试锁定死配置，非业务消费），删除语义 = 消除 F001 存量占位 + 大小写混搭残留，与 journal 28 批次 (e) L1 裁决一致（"禁止新增无消费方占位配置"的存量清底）。

## 三、验收标准逐条核对

| # | 标准 | 结果 | 证据 |
|---|---|---|---|
| 1 | settings.py 不再含 openai_api_key / openai_model | ✅ | 文件终态 21 行，grep 零命中 |
| 2 | 大写 5 字段（LLM_*）逐字不变 | ✅ | git diff 显示 LLM_PROVIDER/LLM_MODEL/LLM_TEMPERATURE/LLM_MAX_TOKENS/LLM_TIMEOUT 六行上下文零变动（diff 块外） |
| 3 | F001 其余存量小写字段（app_name/api_prefix/database_url/backend_port）逐字不变 | ✅ | 同上，四字段行均在 diff 上下文中且无 +/- 标记 |
| 4 | test_settings.py 无残留断言；文件保持存在，不凑数 | ✅ | grep 零命中；文件仍存（13 行，2 测试函数 4 断言）；未新增测试 |
| 5 | 全仓 grep `openai_api_key\|openai_model`（排除 .venv）零命中 | ✅（口径见下方备注 1） | 源码目录（server/ src/ scripts/ 的 *.py/*.ts/*.tsx/*.sh）grep exit=1 零命中 |
| 6 | verify.sh 14/14（UV_FROZEN=1，lock 零漂移） | ✅ | 14 PASS / 0 FAIL；后端 82 passed + 1 skipped，覆盖率 99.55%（与 journal 16 基线一致）；`git diff -- uv.lock` 与 `git diff --cached -- uv.lock` 均空 |
| 7 | 提交范围恰 3 文件 + progress.txt 追加一行 | ✅ | settings.py + test_settings.py + 本 journal + progress.txt 追加；范围外 staged 文件已 unstage（见备注 2） |
| 8 | 行为影响说明 | ✅ | 见下节 |

## 四、行为影响声明（验收标准 #8）

此删除**零运行时行为影响**：两字段在 server/ 业务代码中零消费方（OpenAIProvider 实际从环境变量 OPENAI_API_KEY 读取 API Key，从 LLM_MODEL 读模型名，均不经过这两个小写字段；见 journal 16 决策 #3/#4 与 journal 15 §4 API Key 双通道说明）。唯一受影响的是被同步删除的测试断言本身。Settings 实例化、env 前缀机制（HARNESS_）、.env 读取行为均不变。

## 五、备注

1. **验收标准 #5 口径解释（Spec 未覆盖歧义，按最保守解释执行）**：全仓 grep 字面零命中不可达——journal 15/16/18/28、Controller Spec、launch prompt、feature_list.json、progress.txt 中存在对这两个字段名的**历史性描述引用**（记录"本任务要删什么"的委派与裁决文档），均在禁改清单内（feature_list.json 禁改、journal 属不可篡改历史记录、Spec 是任务输入）。故采用与 Controller Spec 背景段同源的"消费方零命中"口径：**源代码与脚本目录（server/ src/ scripts/）零命中**即为达成；文档历史引用如实保留。此解释记录备 L1/test-reviewer 裁定。
2. **P011 暂存区处理（完整过程，含两次 amend 修正与一项新实证）**：本会话开始时暂存区已含 2 个范围外文件（`assets/# L1 项目管控 Agent 启动提示词.txt`、`assets/image.png`，系 K总 放入 assets/ 后被平台 hookspath 自动 stage，非本任务产物）。处理时序：
   - (a) 提交前已 `git restore --staged` unstage 并核对暂存区恰 4 文件；
   - (b) **首次提交仍被混入**（新实证 #1）：hookspath 在 commit 钩子时把 untracked 的 assets 两文件重新自动 stage——自动 stage 不止作用于已跟踪文件的修改，untracked 文件在 commit 时也会被 add，提交膨胀为 6 files；
   - (c) 第一次 amend 失败（新实证 #2）：仅 mv 移出工作区未清索引（`git rm --cached`），amend 后提交仍 6 files——**移出工作区 ≠ 清索引，索引条目残留会随 amend 入提交**；
   - (d) 第二次 amend 成功：完整序列 = mv 移出 → `git rm --cached` → `git commit --amend` → 核对恰 4 文件 → mv 移回工作区，最终提交恰 4 文件（+66/-3），assets 两文件保留在工作区 untracked 状态未提交（移回未再触发自动 stage）。
   建议以上两条新实证由 L1 评估沉淀入 pitfalls.md P011 补充条目：① commit 时 untracked 文件会被 hookspath 自动 add；② 修正混入提交的完整序列必须含 `git rm --cached`（仅移出文件不够）。
3. **禁止清单核对**：未触碰 LLM_* 大写字段与 F001 存量小写字段；未修改 AGENTS.md / verify.sh / .coze / 设计文档 / feature_list.json；未占用 journal 编号 28（本 journal 用 29）；未为"顺手统一命名"扩大改动。
4. **时钟漂移**：见头部执行时间注。环境结论绑定本会话环境（AGENTS.md 环境漂移条款）。

## 六、产出物

- `server/config/settings.py`（-2 行）
- `server/tests/test_settings.py`（-1 行）
- 本 journal
- progress.txt 追加一行

## 七、验证结果

verify.sh 14/14 全过（UV_FROZEN=1 前置，uv.lock 零漂移）：前端 5 项（ts-check / ESLint / Vitest / Stylelint / dependency-cruiser）+ 后端 4 项（ruff / mypy / import-linter / pytest-cov 82 passed + 1 skipped, coverage 99.55%）+ 检查 5 项（doc freshness / file size / tech stack baseline / git tracking / port consistency 5000=5000）。
