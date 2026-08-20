# Journal 51 — F005 代码执行沙箱 L3 独立测试审查报告

| 字段 | 值 |
|---|---|
| 编号 | 51 |
| 日期 | 2026-08-20 |
| 阶段 | stage-04-coding |
| 功能 | F005 代码执行沙箱 |
| 角色 | test-reviewer（L3 独立） |
| 委派源 | journal 52 (L1 流程验收) |
| 审查对象 | fbc5d0c (diff 6d24a92..fbc5d0c, 32 文件 +1498/-6) |
| 状态 | review-done |

## 环境表

| 项 | 值 |
|---|---|
| Python | 3.12.3 |
| uv | 0.12.5 (系统安装) |
| 测试框架 | pytest 9.1.1 + pytest-asyncio 1.4.0 + pytest-cov 7.1.0 |
| 类型检查 | mypy strict (sandbox 7 文件 Success) |
| 覆盖率 | 94.39% (>80% 闸门) |
| 测试总数 | 181 passed + 1 skipped |
| verify.sh | 14/14 PASS (UV_FROZEN=1, uv.lock 零漂移) |
| Docker | 未依赖（P009：测试用 mock client） |

## 一、12 项编码验收标准独立验证表

| # | 标准 | 结论 | 独立取证证据 |
|---|---|---|---|
| 1 | Executor Protocol 三方法完整 + Docker/Local 双实现 + get_executor 三级分支 | **PASS** | base.py L66-73: `Executor(Protocol)` 含 execute/cancel/cleanup 三方法签名; docker_executor.py L73/113/126 三函数实现; local_executor.py L34/98/112 三函数实现; __init__.py L110-120 get_executor match 三分支; mypy strict 全过 |
| 2 | 命令白名单 8 允许 + 危险模式 5 拒绝 + 边界用例 | **PASS** | __init__.py L27-44: ALLOWED_COMMANDS 8 条 + mvn 注释预留 + DANGEROUS_PATTERNS 4 条(含 npm); test_sandbox_whitelist.py: 16 允许 + 7 拒绝 + 8 边界 = 31 用例全过; npm 先命中"not in whitelist"再命中危险模式的断言匹配正确 |
| 3 | 三级降级链: probe 三返回 → docker/local/disabled | **PASS** | probe.py L33-46: _run_check 两步(info+hello-world); test_sandbox_probe.py: 4 用例覆盖(可用/不可用/info-ok-hello-fail/超时); main.py L20-21: lifespan 调用 probe_docker + configure_executor; test_sandbox_delegation.py: disabled 路径验证 |
| 4 | 五维资源隔离参数 | **PASS(实现)** / **N1(测试)** | docker_executor.py _build_docker_kwargs L51-66: 全 5 维构造(network_mode="none"/cpu_quota/mem_limit/pids_limit/tmpfs+volumes:ro); **但 mock 测试仅断言 2 维**(network_mode+labels), 缺 cpu_quota/mem_limit/pids_limit/tmpfs/volumes → N1 |
| 5 | LocalExecutor 无 shell + 安全降级标注 + resource_usage 零值 | **FAIL → M1** | local_executor.py L64: `create_subprocess_shell`（**设计要求 create_subprocess_exec**）; 安全降级标注 L3-5 正确; resource_usage 零值占位 L54 正确; test 验证零值. **shell 执行允许元字符解释, 削弱白名单安全保证** → M1 |
| 6 | GET /api/sandbox/status + Pydantic schema + TS 类型镜像 | **PASS** | routes/sandbox.py: GET /status 返回 SandboxStatusResponse; schemas/sandbox.py: executor_type Literal + docker_available bool; sandbox.ts: SandboxStatusResponse + SandboxResult 逐字段对齐; test_sandbox_api.py: 3 用例覆盖(local/docker/disabled) |
| 7 | HarnessState.sandbox_result 新字段 + State 写入路径 | **PASS(实现)** / **M2(跨文档)** | harness_state.py L71: `sandbox_result: dict`; L111: 初始化 `sandbox_result={}`; validation.py L65-74: _execute_sandbox 返回值写入 return dict; **但 state-design.md 说 `dict | None` 而实现为 `dict`(非可选); state-design.md 说 build_test_commands 为 field 而实现为 method** → M2 |
| 8 | 不新增 LangGraph Node + F002 拓扑零改动 | **PASS** | definition.py diff: 仅新增 _ALLOWED_MSGPACK_MODULES 2 条(ExecutionResult/ResourceUsage), 无新 Node 注册, 无边变更 |
| 9 | 歧义α build_test_commands 默认空列表 + F002 零改动 | **PASS** | harness_state.py L18-25: `def build_test_commands(self) -> list[str]: return []`; TechStackSpec 其余 6 字段未改; F002 测试零破坏(181 passed 全量) |
| 10 | 镜像映射表恰 2 条 + 动态选择 | **PASS** | __init__.py L69-72: IMAGE_MAP = {"python": "python:3.12-slim", "node": "node:20-slim"}; select_image L78-90: backend 优先 → 前端检测 → fallback; test_sandbox_delegation.py TestSelectImage: 3 路径覆盖(python/node/fallback) |
| 11 | 裁决① mvn 预留但不启用 | **PASS** | __init__.py L36-37: `# re.compile(r"^mvn(\s|$)")` 注释; 实测 `validate_command("mvn verify")` → SandboxError("Command not in whitelist: mvn verify") |
| 12 | 裁决③④ + verify.sh | **PASS** | grep concurrency/semaphore/artifact_paths 零命中; verify.sh 14/14 PASS; UV_FROZEN=1 全程; uv.lock 零漂移 |

## 二、3 项自报歧义裁定

### α DockerExecutor 适配器延迟初始化

**裁定：可接受**

_DockerExecutorAdapter.__init__ 设 self._client = None, 延迟到 execute/cancel/cleanup 时通过 _get_client() 获取 aiodocker 客户端。Probe 保证 docker 分支可达时 daemon 可用; aiodocker ImportError 仅在 Probe 通过后真实 daemon 异常时触发, 属运行时降级路径。延迟初始化避免启动时强制依赖 aiodocker（可选依赖）, 符合"Tier 1 需要 Docker 可用"的语义。_

### β LocalExecutor cancel 后 kill — ProcessLookupError 防御

**裁定：需改进(N2)**

_代码 `local_executor.py` L103: `proc.kill()` 无 try/except ProcessLookupError 包裹。coder 声称"已 try/except 防御"与代码不符（L103-108 的 try/except 仅包裹 `proc.wait()` 的 TimeoutError）。竞态下进程在 pop 与 kill 之间退出时, kill 抛 ProcessLookupError。概率低但非零。按"克制兜底"原则可接受首版不修, 但标注 N2 建议改进, 且 coder 描述与实现不一致需记录。_

### γ sandbox_result 写入时机（重点）

**裁定：可接受（首版）, coder 描述事实错误**

_设计 §编排集成 代码示意含 `sandbox_result = await executor.execute(request)`, 展示接线模式。实际实现 validation.py 有 `_execute_sandbox()` 完整调用链, 但因 `build_test_commands()` 默认返回 `[]`, 触发 `if not commands` 守卫返回 `{"status": "disabled", ...}`。_

_**设计示意性质判定**: 设计 §编排集成 代码为**示意**（展示委派桩→executor→State 的接线模式）, 非严格契约。设计文档 §验收标准 4 措辞为"validation 委派桩调用 get_executor().execute(), sandbox_result 写入 State"——实现满足此契约: 委派桩确实调用了 get_executor() 并将结果写入 State, 空命令守卫是合理的首版优化。_

_**coder 描述偏差**: coder 称"sandbox_result 恒 None"与实际不符——sandbox_result 为 `{"status": "disabled", ...}` 字典, 非 None。实际行为比 coder 描述更接近设计意图（调用了 executor 基础设施, 因 build_test_commands 返回空列表而 disabled）。_

_**首版裁定**: 可接受。当 build_test_commands 按栈动态实现后(后续迭代), 沙箱执行将自然激活。_

## 三、测试质量审查

### 复跑结果

- 后端 181 passed + 1 skipped, 覆盖率 94.39% (sandbox 包: __init__.py 77% / docker_executor.py 88% / local_executor.py 93% / 其余 100%)
- mypy strict: Success (7 source files)
- ruff: clean (verify.sh 项 6)
- verify.sh: 14/14 PASS

### 断言空洞与测试质量清单

| 测试文件 | 问题 | 性质 |
|---|---|---|
| test_sandbox_docker.py::test_execute_calls_run_with_security | 仅断言 network_mode + labels, 缺 cpu_quota/mem_limit/pids_limit/tmpfs/volumes 五维中三维 | N1 断言不足 |
| test_sandbox_local.py::test_execute_timeout | 断言 `status == "completed"` 匹配了错误实现(应为 "timeout") | M3 关联(测试纵容 bug) |
| test_sandbox_whitelist.py::test_python_with_dangerous_substring | 断言合理: python 在白名单但 rm -rf / 应命中危险模式 | 无问题 |
| test_sandbox_contract.py | 结构等价性断言正确, 但未覆盖 status 语义差异(local timeout="completed" vs docker timeout="timeout") | M3 关联 |

### 断言空洞项

1. **test_sandbox_docker.py::test_execute_calls_run_with_security**: 缺 5 维安全参数中 3 维断言 (cpu_quota/mem_limit/pids_limit/tmpfs/volumes)
2. **test_sandbox_local.py::test_execute_timeout**: 断言 `status == "completed"` 纵容了超时 status bug, 应断言 `status == "timeout"`

## 四、额外发现: LocalExecutor 超时 status bug

local_executor.py `execute()` L48-56: 无论命令是否超时, 始终返回 `ExecutionResult(status="completed")`。`_run_single()` 超时时返回 `("", "Command timed out...")` 作为 stderr, 但 execute() 不据此设置 status="timeout"。

对比 DockerExecutor L86-93: 超时时正确设置 `status="timeout"` + `exit_code=-1`。

→ **M3: LocalExecutor 超时返回 status="completed" 而非 "timeout", 违反 ExecutionResult status 契约, 超时不可从结果结构检测**

## 五、跨文档同步对照（4 份, 防 F004 M1/M2 同型缺陷）

| 文档 | diff 内容 | 与实现一致? | 问题 |
|---|---|---|---|
| state-design.md | +sandbox_result: dict \| None | ❌ | 实现为 `dict`（非可选）, 文档多 `\| None` |
| state-design.md | +build_test_commands: list[str] = [] | ❌ | 文档为 field 语法, 实现为 method |
| boundaries.md | +server/sandbox/ 行 + 依赖方向 + 禁止项 | ✅ | nodes→sandbox, sandbox→schemas, sandbox 不依赖 nodes/graph/routes 正确 |
| api-spec.md | +GET /api/sandbox/status 端点 | ✅ | 描述与实现一致 |
| convention-to-rule-mapping.md | +3 行(白名单/零交集/退化) | ✅ | 状态标注 ⚠️ 人工审查 正确 |

→ **M2**: state-design.md 两处与实现不一致, 同型 F004 M1 缺陷

## 六、行数与结构约束

| 文件 | 行数 | ≤300? |
|---|---|---|
| __init__.py | 169 | ✅ |
| base.py | 73 | ✅ |
| docker_executor.py | 149 | ✅ |
| local_executor.py | 114 | ✅ |
| probe.py | 46 | ✅ |
| exceptions.py | 15 | ✅ |
| _docker_client.py | 59 | ✅ |
| routes/sandbox.py | 23 | ✅ |
| schemas/sandbox.py | 14 | ✅ |
| validation.py | 106 | ✅ |

所有新增文件 ≤300 行, 单函数 ≤50 行 (verify.sh 项 11 PASS 独立确认)。

## 七、必须修复项 / 建议改进项

### 必须修复（M）

| 编号 | 描述 | 严重性 | 修复方向 |
|---|---|---|---|
| M1 | LocalExecutor 使用 `create_subprocess_shell` 而非设计要求的 `create_subprocess_exec` | 安全 | 改为 create_subprocess_exec, 命令按空格拆分为列表传入; 白名单已按前缀匹配校验, 拆分后第一个元素为可执行名, 安全性更强 |
| M2 | state-design.md 跨文档不一致: (a) sandbox_result 类型 `dict \| None` vs 实现 `dict`; (b) build_test_commands 文档为 field vs 实现为 method | 契约 | (a) 统一为 `dict`（实现正确, 初始值 `{}` 非 None）; (b) 改文档为方法语法 `def build_test_commands(self) -> list[str]` |
| M3 | LocalExecutor 超时返回 `status="completed"` 而非 `"timeout"`, 违反 ExecutionResult 契约 | 功能 | execute() 需跟踪是否有超时, 超时时设 status="timeout"+exit_code=-1 (对齐 DockerExecutor) |

### 建议改进（N）

| 编号 | 描述 | 优先级 |
|---|---|---|
| N1 | DockerExecutor 安全测试仅断言 2/5 维, 建议补全 cpu_quota/mem_limit/pids_limit/tmpfs/volumes 断言 | 低 |
| N2 | LocalExecutor cancel 中 proc.kill() 无 ProcessLookupError 防御, coder 声称已防御但代码不符 | 低 |
| N3 | SandboxResult TS 类型缺 resource_usage 字段, model_dump() 含该字段但 TS 未声明 | 低 |

## 八、设计符合性抽检

| 边界 | 结论 |
|---|---|
| 与 F004 单执行器零交集 | PASS: scripts/verify.sh 不在白名单(无 verify 匹配), 沙箱执行对象为产物命令 |
| Node 委派桩原则 | PASS: 不新增 Node, State 仅 sandbox_result 全新字段 |
| 生命周期 cleanup 同步 | PASS: DockerExecutor L100 每次执行后调 cleanup; cleanup_orphans 按 label 批量; 超时 wait_for→cancel 链路(mock 测试验证) |
| env 不传敏感凭据 | PASS: ExecutionRequest.env 由调用方控制, _build_docker_kwargs 无额外注入; local_executor 仅注入 PATH+UV_FROZEN |

## 九、结论

F005 编码产出核心架构与设计对齐, 7 模块 + 8 测试文件 + 4 跨文档同步结构完整, 181 测试全过 + 覆盖率 94.39% + verify.sh 14/14。

存在 3 项必须修复: M1(LocalExecutor shell 安全偏离)、M2(跨文档不一致)、M3(超时 status bug)。修复后建议推进 passing。
