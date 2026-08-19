# 16 · F003 测试审查（L3 test-reviewer 独立校验）

- **步骤名称**: F003 LLM 提供商层编码产出测试审查（commit a775554，基线 385d486）
- **执行时间**: 2026-08-20（UTC）
- **执行角色**: L3 测试审查 Agent (test-reviewer)
- **前置条件**: Controller Spec `docs/handbook/controller-specs/f003-test-review.md`（10 项验收标准）；F002 passing（1d54504）；F003 coding-done（journal 15）
- **独立性声明**: 全部证据为本人独立执行所得（命令自跑、断言自看、lock 全量机械比对），未引用 L1（journal 17）或 coder（journal 15）的自报结论作为证据

## 验证环境

| 项 | 值（实测） |
|---|---|
| 沙箱 python | 3.12.3（.venv/bin/python sys.version） |
| openai | 3.2.0（import openai.__version__） |
| langgraph / langgraph-checkpoint | 1.2.11 / 4.2.0（importlib.metadata） |
| 环境残留 | UV_DEFAULT_INDEX / UV_INDEX / PIP_INDEX 均无（env grep 空） |
| OPENAI_API_KEY | 未设置（env grep 计数 0）→ 真实调用用例实测 SKIPPED |
| .env 文件 | 不存在（Settings() 测试隔离性安全） |
| git 状态 | 工作区干净、暂存区空（P011 核对通过）；HEAD=9fb7319，被审代码 a775554..HEAD diff 为空 |

## 逐项证据（10 项验收标准）

### 1. Protocol 契约 — 通过

- 签名机械比对：设计文档 §抽象接口 L41-51 vs `server/llm/base.py` L9-18，提取签名行 diff 零差异；两方法文档字符串（"调用 LLM，返回完整响应"/"调用 LLM 并更新 State（用于 Node 内调用）"）逐字一致。唯一差异为 `# pragma: no cover` 注释（coverage pragma，不动签名，合理）。
- `complete_with_state` 三字段累加：`openai_provider.py` L57-68，prev 缺省 `TokenUsage(0,0,0)` 起点、prompt/completion/total 三字段独立累加、`{**state, ...}` 浅合并不变异原 state。
- 测试质量（非仅存在）：`test_complete_with_state_accumulates_usage` 断言 5,5,10 + 10,20,30 → 15,25,40（数学正确）；`test_complete_with_state_prev_missing_starts_from_zero` 真实删除 key 后断言 3,4,7；`test_complete_with_state_preserves_other_fields` 断言 project_id/project_name/current_stage 保留。

### 2. OpenAIProvider 实现 — 通过

- `AsyncOpenAI` async SDK（L10/L26）；`OPENAI_API_KEY` 从 `os.environ` 读取，缺失（含空串 `not api_key`）raise LLMError（L23-25）；超时 `float(settings.LLM_TIMEOUT)` 默认 30 可配（L26）。
- 三类异常路径统一 raise LLMError：key 缺失（`_build_client`）/ API 异常（`except Exception as exc: raise ... from exc`，L38-39 因果链保留）/ usage 缺失（L40-42）。
- 测试断言质量（抽查为真实断言）：`install_fake_openai` 以假工厂替换 `provider_module.AsyncOpenAI` 并记录 `init_kwargs` 与 `calls`；`test_complete_success_returns_response` 断言 `calls[0]` 的 model/messages/temperature/max_tokens 四参数实际值 + `init_kwargs` 的 api_key/timeout——验证真实传参，非仅返回值。

### 3. 工厂与配置 — 通过

- `get_llm_provider(provider_name | None)` 默认 `settings.LLM_PROVIDER`，match "openai"→OpenAIProvider，未知名 `LLMError(f"Unsupported LLM provider: {name}")`——与设计文档 §工厂函数逐字一致（含 docstring）。
- settings 5 配置项默认值实测：openai / gpt-4o / 0.2 / 4096 / 30（`settings.py` L13-17 + `test_settings_llm_defaults_match_design` 独立断言）；F001 既有 6 字段零改动（diff 仅 +7 行：注释 2 + 5 字段）。

### 4. openai 显式声明（决策 #1 裁定）— 正确且必要

- 直接 import 事实：`openai_provider.py` L10-11 `from openai import AsyncOpenAI` / `from openai.types.chat import ChatCompletionMessageParam`——直接 import 而不声明即隐式依赖（F002 #1 教训镜像场景），显式声明 `openai>=3.2.0,<4.0.0` 自洽。
- 下限 >=3.2.0 = lock 实际解析版本 = 本环境实测验证版本（不存在"声明范围内未验证即崩"——与 F002 `langgraph>=0.2.50` 声明下限低于验证版本的问题方向相反）；上限 <4.0.0 防 major 破坏，与 `langgraph-checkpoint>=4.1.0,<5.0.0` 声明风格一致。
- 佐证：385d486 的 uv.lock 中 openai 3.2.0 已存在（langchain-openai 传递依赖），声明后 root `requires-dist` 正确反映直接依赖。

### 5. lock 路径 B 编辑正确性（决策 #2 裁定）— 通过

| 检查 | 命令 | 结果 |
|---|---|---|
| diff 最小性 | `git diff 385d486..a775554 -- uv.lock` | 恰 +2 行（root `dependencies` + `{name="openai"}`；`requires-dist` + specifier 行） |
| 声明一致性 | `uv lock --check`（非 frozen） | Resolved 81 packages 通过（编辑后 resolution 与 pyproject 完全一致） |
| lock 未被检查过程重写 | `git diff --stat uv.lock` | 空 |
| 镜像残留 | `grep -cE "aliyun\|mirrors…\|douban" uv.lock` | 0 |
| 版本集合漂移 | 两版本 lock 提取 name+version 对全集 sort 后 diff | 零差异（81 包） |
| URL 集合漂移 | 两版本 lock 提取全部 https URL sort 后 diff | 零差异 |
| 哈希漂移 | sha256 提取 sort 后 diff + 计数 | 零差异，1522 = 1522 |

- 路径 B 决断评估：合理。全量重写引入 3094 行 size/upload-time 元数据噪音（URL/hash 零变动的格式变更），最小编辑 + `--check` 验证语义等价是更优解；F002 R3 路径 B 先例（journal 12）已验证该方法有效性，本次为同方法正确执行。

### 6. Node 委派桩约束 — 通过

- `server/nodes/` 零改动：`git diff 385d486..a775554 -- server/nodes/ server/graph/ server/routes/ server/models/` 为空。
- `test_delegate_chain_reaches_provider` 质量裁定：monkeypatch `AgentRuntime.delegate` 模拟"L3 Agent 在 delegate 内部执行"（get_llm_provider → complete_with_state → state 累加 → 返回），其中 provider→state 段为真实代码（SDK 层 fake）；delegate→L3 Agent 段为模拟——这如实对应 Controller Spec #6"集成测试验证 delegate 链路拿到 provider 的**可行性**"（非真实接入）与 F011 §9"runtime 层…当前不实现"边界。断言 `observed["usage"] == TokenUsage(10,20,30)` 为数学断言（初始 state 零值起点）。
- `test_runtime_stub_contract_unchanged` 保留 F002 语义零改动证据（status="stub_completed"/role/summary 断言）。两测试合并呈现边界，符合 Spec。

### 7. 测试策略 — 通过

- 用例计数实测：`test_llm_provider.py` 18 passed；`test_llm_runtime_integration.py` 2 passed + 1 skipped（运行输出 `..s`）——20 mock/stub + 1 真实调用。
- skip 保护真实性：本会话 OPENAI_API_KEY 未设置（env 计数 0），真实调用用例实际 SKIPPED（非装饰性 skip）；有 key 环境下该用例断言 content 非空 + usage.total_tokens > 0 + model.startswith("gpt") 三项，为真实质量断言。
- mock 断言质量抽查（见 #2）：kwargs 记录制、`pytest.raises(match=...)`、累加数学断言、字段保留断言——非仅状态码。
- F002 存量回归：82 passed = 62 存量 + 20 新增（计数吻合，verify.sh 全绿佐证），无失败无错误。

### 8. 横切回归 — 通过

- `UV_FROZEN=1 bash scripts/verify.sh` 独立复跑：**14 passed / 0 failed，EXIT=0**（前端 TS/ESLint/Stylelint/dependency-cruiser + 后端 ruff/import-linter/mypy + pytest-cov + 7 项横切全过）。
- 覆盖率口径核实：总 **99.55%**（446 语句 2 未覆盖）；未覆盖 2 行实测定位 `server/nodes/gates.py:22`（97%）+ `server/nodes/validation.py:53`（95%）——均为 F002 存量模块且 F003 零触碰（nodes diff 为空佐证）；F003 新增模块 `server/llm/*`（13/6/4/1/30 语句）与 `llm_schemas.py`（14 语句）全部 **100%**。
- 单文件最大 223 行（test_llm_provider.py）≤ 300；单函数 ≤ 50（File & Function Size 检查项通过）。
- mypy 配置为非 strict（`disallow_untyped_defs = false`）——沿用项目现状，"mypy strict 表述修正"已在 L1 跨文档同步待办 (b)，非本次范围。

### 9. 设计文档一致性抽查 — 通过（2 项 L1 裁决事项带回）

- 实质性偏差清单：**无**。签名/默认值/异常文案/工厂/累加逻辑/5 配置项逐字对齐；`TokenUsage` 复用 `harness_state.py` F002 既有定义（字段 prompt/completion/total 与设计文档一致），符合 Controller Spec 前置条件"不重复定义"；`token_usage_total` 字段在 385d486 的 harness_state.py 已存在（F002 先占位），F003 仅消费。
- settings 大写字段名（决策 #3，事实描述供 L1 裁决）：`LLM_*`（大写，设计文档逐字）与 F001 存量小写（app_name/api_prefix/database_url/openai_api_key/openai_model/backend_port）混搭并存；env 读取名 HARNESS_LLM_PROVIDER 等（env_prefix 机制）。coder 对齐设计文档无偏差，**不计入 coder 缺陷**。
- 存量字段现状（决策 #4 延伸）：`openai_api_key`/`openai_model`（F001 遗留）在 server/ 内**零消费方**（grep 排除定义处与 test_settings 后为空），与新 LLM_MODEL 语义重叠（同值 gpt-4o 双份）。死配置现状带回 L1 裁决，不属 coder 修订范围。

### 10. 范围合规 — 通过

- a775554 恰 14 文件，与 Controller Spec 输入清单逐项对应（llm/ 5 + llm_schemas + settings(+7) + 测试 2 + pyproject(+1) + uv.lock(+2) + journal 产物 3）。
- 禁区 diff = 0：`.coze` / `AGENTS.md` / `scripts/verify.sh` / `docs/`（全部设计文档与规范）/ `feature_list.json` / `server/{nodes,graph,routes,models}/` 均零改动。
- journal 16 编号此前未被占用（目录清单确认：15 与 17 之间存在空缺）。
- 被审对象未被污染：`git diff a775554..HEAD -- server/ pyproject.toml uv.lock` 为空。

## 问题清单（定级）

| # | 级别 | 问题 | 处置建议 |
|---|---|---|---|
| 1 | 建议改进（轻微，journal 自报口径） | journal 15 验证结果段"单文件最大 66 行"与实测不符：业务文件实测最大 69 行（openai_provider.py，wc -l）；含测试文件实测最大 223 行（L1 journal 17 已按 223 口径记录）。66 与任一自然口径均不对应，属自报数字失实。不影响任何合规结论（≤300 约束远未触及，验收与闸门判定均以实测为准） | 无需代码修订；L1 后续跨文档同步或 journal 更正时一并修正口径（参照 F002 N2 先例处理方式） |
| 2 | L1 裁决事项（非 coder 缺陷） | settings 命名风格混搭（LLM_* 大写 vs F001 小写并存）+ 存量 openai_api_key/openai_model 死配置（零消费方、与新配置语义重叠） | 建议纳入 L1 跨文档同步待办清单（现有 (a)-(d) 机制），由 L1 决策统一风格与存量字段去留；设计文档如此规定，coder 无偏差 |
| 3 | 范外观察（不处理） | 每次 `complete` 新建 `AsyncOpenAI` client，无复用 | 设计文档非目标已含"不实现缓存/限流/重试"，client 生命周期未规定；后续接入重试策略时一并考虑 |
| 4 | 范外观察（不处理） | `max_tokens` 参数对齐设计文档；openai 后续模型系列若要求 `max_completion_tokens` 需设计侧确认 | 真实调用用例（key 环境）会在实际调用时验证；届时如有问题属设计文档修订范畴 |

**必须修复项：0 项。**

## 结论

**通过。** 10 项验收标准全部通过（含 4 项 coder 技术决策独立裁定：#1 显式声明正确且必要、#2 路径 B 编辑全量机械验证零漂移、#3 大写字段名如实对齐设计文档裁决归 L1、#4 集成测试边界符合 Controller Spec 与 F011 §9）。独立复跑 verify.sh 14/14、82+1 skip 全绿、覆盖率口径逐项核实、lock 版本集合/URL/哈希 1522 全量零漂移、禁区零改动、无夹带。问题清单 0 必须修复 + 1 建议（journal 自报口径）+ 1 项 L1 裁决带回 + 2 项范外观察。

**建议：F003 推进 passing（coding-done → passing），进入 F006 编码。**
