# 30 · F014 Settings 死配置清理 — L3 测试审查报告

- **步骤名称**: F014 微任务独立测试审查（删 openai_api_key / openai_model + 测试断言同步）
- **执行时间**: 2026-08-20T02:20Z（本会话系统时钟；各会话沙箱时钟存在漂移，本 journal 按本会话时钟如实记录）
- **执行角色**: L3 测试审查 Agent (test-reviewer)
- **被审提交**: 5e736d2（基线 331e7f6，验收 diff 锚定 331e7f6..5e736d2）
- **审查结论**: **通过**（0 必须修复，1 建议改进——journal 行数计数偏差，不影响任何判断）

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
| git HEAD | cd35b1c（含 6f8789d 平台提交；验收锚定 331e7f6..5e736d2） |
| 环境防护 | UV_DEFAULT_INDEX / UV_INDEX_URL 均未设置（P010 零残留）；verify.sh 全程 UV_FROZEN=1 前置；.venv 存在于项目根目录，lock 等价环境直接复用 |

## 二、审查标准逐项独立验证

### 标准 1：删除断权根基复核（最重） — ✅ 通过

**独立验证方法**：在基线 331e7f6 下 `git grep` 全源码目录搜索两字段消费方。

**证据**：
- `openai_api_key`：基线 331e7f6 全仓 grep（server/ src/ scripts/）仅命中 `server/config/settings.py` 字段定义行——**零业务消费方**
- `openai_model`：基线 331e7f6 全仓 grep 命中两处——(1) `server/config/settings.py` 字段定义行；(2) `server/tests/test_settings.py` 断言行 `assert s.openai_model == "gpt-4o"`——**唯一消费方即被同步删除的测试断言（测试锁定死配置，非业务消费）**

**命令**：
```
git grep openai_api_key 331e7f6 -- 'server/' 'src/' 'scripts/'  # 1 hit: field definition only
git grep openai_model 331e7f6 -- 'server/' 'src/' 'scripts/'    # 2 hits: field definition + test assert
```

**结论**：两字段均无业务消费方，"死配置"前提成立，删除具有正当性。

### 标准 2：删除精确性 — ✅ 通过

**独立验证方法**：`git diff 331e7f6..5e736d2` 逐文件复核。

**证据**：
- `settings.py` diff 恰 -2 行（`openai_api_key: str = ""` 与 `openai_model: str = "gpt-4o"`），上下文中 LLM_PROVIDER/LLM_MODEL/LLM_TEMPERATURE/LLM_MAX_TOKENS/LLM_TIMEOUT 五行及 app_name/api_prefix/database_url/backend_port 四行均无 +/- 标记
- 当前文件终态 20 行，独立 `wc -l` 确认
- LLM_* 大写 5 字段逐字不变：LLM_PROVIDER="openai", LLM_MODEL="gpt-4o", LLM_TEMPERATURE=0.2, LLM_MAX_TOKENS=4096, LLM_TIMEOUT=30
- F001 存量小写 4 字段逐字不变：app_name="harness-platform", api_prefix="/api", database_url="postgresql://...", backend_port=8000

### 标准 3：测试同步正确性 — ✅ 通过

**独立验证方法**：读取当前 `test_settings.py` 终态 + diff 复核。

**证据**：
- `test_settings.py` diff 恰 -1 行（`assert s.openai_model == "gpt-4o"`）
- 当前终态 12 行，2 函数 4 断言（test_settings_defaults: 3 asserts + test_settings_singleton: 1 assert）
- `grep openai_api_key` / `grep openai_model` 零命中——无残留断言
- 未新增测试（不凑数）

### 标准 4：Spec 标准 5 口径独立裁定（无先在结论） — ✅ 通过

**独立验证——源码目录零命中**：
- 当前源码目录 `server/` grep openai_api_key → 零命中
- 当前源码目录 `server/` grep openai_model → 零命中
- `src/` 与 `scripts/` 同样零命中
- **源码目录零命中独立验证通过**

**独立裁定——口径可接受性**：

任务 Spec 标准 5 字面「全仓 grep 零命中」不可达的原因：
1. journal 15/16/18/28、任务 Controller Spec、launch prompt、feature_list.json、progress.txt 均含两字段名的历史性描述引用
2. 上述文件全部在禁改清单内——不可同时满足「全仓零命中」与「禁改清单」
3. 该措辞矛盾属 L1 起草缺陷（journal 33 §2 已确认），非 coder 执行偏差

coder 采用了「源码目录零命中」解释，与任务 Spec 背景段「零消费方」语义对齐（消费方 = 代码引用，历史描述 ≠ 代码消费）。

**裁定：该口径可接受**。依据：
- 字面口径与禁改清单逻辑自相矛盾，不可达——最保守可达解释即源码目录零命中
- 源码目录零命中已独立验证通过
- 历史描述引用记录「删了什么」，非「什么仍存在」——语义上是删除操作的记录，不是残留消费

### 标准 5：行为影响声明核实 — ✅ 通过

**独立验证方法**：阅读 `server/llm/openai_provider.py` 与 `server/llm/config.py` 源码，确认实际消费路径。

**证据**：
- OpenAIProvider._build_client(): `api_key = os.environ.get("OPENAI_API_KEY", "")` → 直接从环境变量读取，**不经 settings.openai_api_key**
- OpenAIProvider.complete(): `model=config.model` → 从 LLMConfig 参数获取，**不经 settings.openai_model**
- default_llm_config(): `model=settings.LLM_MODEL` → 经大写字段 LLM_MODEL，**不经被删字段**
- settings.LLM_TIMEOUT 供超时 → 大写字段，**不经被删字段**
- Settings 实例化机制（BaseSettings + env_prefix HARNESS_ + .env）未变

**结论**：coder「零运行时行为影响」声明独立验证成立。

### 标准 6：回归完整性 — ✅ 通过

**独立验证方法**：UV_FROZEN=1 前置复跑 verify.sh。

**证据**：
- verify.sh 14/14 PASS
- 前端 5 项：ts-check ✅ / ESLint ✅ / Vitest 83 passed ✅ / Stylelint ✅ / dependency-cruiser 41 modules 0 violations ✅
- 后端 4 项：ruff ✅ / mypy 33 files 0 issues ✅ / import-linter 2 kept 0 broken ✅ / pytest 82 passed + 1 skipped, coverage 99.55% ✅
- 检查 5 项：doc freshness ✅ / file size ✅ / tech stack baseline ✅ / git tracking ✅ / port consistency 5000=5000 ✅
- uv.lock 零漂移：`git diff -- uv.lock` = 0 行, `git diff --cached -- uv.lock` = 0 行

### 标准 7：范围合规 — ✅ 通过

**独立验证方法**：git diff --stat 逐范围核对。

**证据**：
- `git diff 331e7f6..5e736d2 --stat`：恰 4 文件 +71/-3（29-settings-cleanup.md +70 / progress.txt +1 / settings.py -2 / test_settings.py -1），无夹带
- `git diff 5e736d2..6f8789d --stat`：仅 assets/ 2 文件（txt +352 行 + image.png 二进制），对 server/ journal/ progress 零改动
- 6f8789d 提交信息与 5e736d2 同名，Coze-Commit-Type: user，属平台自动提交——**独立确认对被审对象零影响**
- journal 30 编号未被占用（本文件即首次创建）

### 标准 8：journal 29 真实性核对 + P011 证据链评估 — ✅ 通过（含 1 条建议）

**自报数据 vs 实测对比**：

| coder 自报项 | 实测值 | 一致 |
|---|---|---|
| verify.sh 14/14 | 14/14 PASS | ✅ |
| 82 passed + 1 skipped | 82 passed + 1 skipped | ✅ |
| coverage 99.55% | 99.55% | ✅ |
| settings.py 20 行 | 20 行 | ✅ |
| test_settings.py 行数（journal 29 标准表#4："13 行"） | 12 行 | ❌ 差 1 |
| journal 29 70 行 | 70 行 | ✅ |
| grep 口径"源码目录零命中" | 零命中 | ✅ |

**行数偏差分析**：coder 在 journal 29 标准 #4 自报 test_settings.py "13 行"，实测 12 行。推测原因：删除前计数含尾行空行或计数时机差异。该偏差不影响任何判断（标准要求"文件保持存在，不凑数"，12 行仍满足）。

**P011 新实证证据链评估**（3 条）：

| # | 实证内容 | 证据来源 | 独立可验证性 |
|---|---|---|---|
| 1 | commit 钩子时 hookspath 会把 untracked 文件自动 stage | journal 29 备注 2 首手记述 + 5e736d2 提交修正后恰 4 文件证明修正有效 | 5e736d2 提交记录可独立验证；hookspath 机制为 P011 既有认知扩展 |
| 2 | 修正混入提交必须含 `git rm --cached`（仅 mv 移出工作区不清索引） | journal 29 备注 2 首手记述（两次 amend 时序：第一次失败→第二次成功） | 5e736d2 最终 4 文件状态可独立验证修正有效 |
| 3 | 6f8789d 平台自动提交混入 assets 2 文件 | L1 验收发现（journal 32 §4） | **独立验证**：`git diff 5e736d2..6f8789d --stat` 仅 assets/ 2 文件，server/journal/progress 零触碰 |

**证据链完整性**：3 条实证逻辑自洽，第 3 条独立 diff 已复证。建议随 F014 闭环批次沉淀入 pitfalls.md P011 补充条目。

## 三、问题清单

| 编号 | 定级 | 描述 | 影响 |
|---|---|---|---|
| N1 | 建议改进 | journal 29 标准 #4 自报 test_settings.py "13 行"，实测 12 行（差 1 行），属 coder 计数偏差 | 不影响删除正确性与测试通过，仅在 journal 记录中存在微小失实 |

**必须修复：0 项**

## 四、独立裁定汇总

| 裁定项 | 裁定结论 | 依据 |
|---|---|---|
| Spec 标准 5 口径 | 「源码目录零命中」口径可接受 | 字面"全仓零命中"与禁改清单逻辑自相矛盾（属 L1 起草缺陷）；源码目录零命中独立验证通过；与 Spec 背景段"零消费方"语义对齐 |

## 五、结论四要素

- **事实**: F014 被审提交 5e736d2 经 8 项审查标准独立验证全过；删除断权根基成立（openai_api_key 零业务消费 + openai_model 唯一消费即被同步删除的测试断言）；删除精确（settings.py -2 / test_settings.py -1，LLM_* + F001 字段逐字不变）；行为影响零（OpenAIProvider 不经被删字段）；verify.sh 14/14；范围合规无夹带；P011 证据链完整；仅 1 条建议（journal 行数差 1）
- **决策**: 审查通过，0 必须修复，建议 F014 推进 passing
- **影响**: F014 可闭环；P011 三条新实证建议随闭环批次沉淀 pitfalls.md；N1 行数偏差不阻塞
- **后续**: L1 流程验收本报告 → F014 状态推进 passing + P011 沉淀 + 编号映射裁决落地

## 六、产出物

- 本 journal（harness-journal/stage-04-coding/30-settings-cleanup-test-review.md）
- progress.txt 追加一行
- harness-journal/README.md 索引更新
