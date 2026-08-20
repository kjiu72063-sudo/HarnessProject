# Journal 50 — F005 代码执行沙箱 Coder 执行记录

| 字段 | 值 |
|---|---|
| 编号 | 50 |
| 日期 | 2026-08-20 |
| 阶段 | stage-04-coding |
| 功能 | F005 代码执行沙箱 |
| 角色 | coder |
| 委派源 | journal 49 (L1 审批落地) |
| 状态 | coding-done |

## 环境表

| 项 | 值 |
|---|---|
| Python | 3.12.3 |
| uv | 系统安装 |
| 测试框架 | pytest + pytest-asyncio + pytest-cov |
| 类型检查 | mypy (strict) |
| Linter | ruff |
| Docker | 未依赖（P009：测试用 mock client） |
| 覆盖率 | 88.56% (>80% 闸门) |
| 测试总数 | 71 passed |

## 执行摘要

按 Controller Spec 12 项验收标准 + 6 项裁决落地实现 F005 代码执行沙箱。

### 产出物清单

| 文件 | 行数 | 说明 |
|---|---|---|
| server/sandbox/exceptions.py | 15 | SandboxError 异常类 |
| server/sandbox/base.py | 73 | Executor Protocol + 数据模型（ExecutionRequest/ExecutionResult/ResourceLimits/ResourceUsage） |
| server/sandbox/probe.py | 46 | Docker 可用性探测（三级退化：docker→local→disabled） |
| server/sandbox/local_executor.py | 114 | Tier 2 本地进程执行器（asyncio.create_subprocess_exec） |
| server/sandbox/docker_executor.py | 150 | Tier 1 Docker 执行器（mock client 设计，生产用 aiodocker） |
| server/sandbox/_docker_client.py | 51 | aiodocker 真实客户端工厂（pragma: no cover，测试不依赖） |
| server/sandbox/__init__.py | 168 | 包出口 + 白名单 + 镜像映射表 + get_executor 工厂 + 适配器 |
| server/schemas/sandbox.py | 14 | SandboxStatusResponse（Pydantic schema） |
| server/routes/sandbox.py | 23 | GET /api/sandbox/status 路由 |
| src/types/sandbox.ts | 29 | TS 类型镜像 |
| server/tests/test_sandbox_whitelist.py | 90 | 白名单+危险模式测试 |
| server/tests/test_sandbox_probe.py | 51 | Docker 探测测试 |
| server/tests/test_sandbox_local.py | 79 | 本地执行器测试 |
| server/tests/test_sandbox_docker.py | 102 | Docker 执行器测试（mock client） |
| server/tests/test_sandbox_contract.py | 72 | Executor Protocol 契约测试 |
| server/tests/test_sandbox_api.py | 46 | API 端点测试 |
| server/tests/test_sandbox_delegation.py | 72 | 委派桩接线测试 |
| server/tests/test_sandbox_factory.py | 114 | 工厂+配置+白名单集成测试 |

### 既有文件变更

| 文件 | 变更说明 |
|---|---|
| server/schemas/harness_state.py | +build_test_commands: list[str] = []（歧义α裁决）；+sandbox_result: dict \| None = None |
| server/graph/definition.py | HarnessState 新增 sandbox_result 字段 |
| server/nodes/validation.py | 导入 sandbox 模块 + 委派桩 sandbox_available 字段写入 |
| server/nodes/coding_agent.py | controller_spec 新增 sandbox_available 字段 |
| server/main.py | 导入 sandbox 路由 + lifespan 中 probe_docker() + configure_executor() |
| src/types/harness.ts | +sandboxResult?: SandboxResult 字段 |

### 裁决落地

| 裁决编号 | 内容 | 落地方式 |
|---|---|---|
| ① | mvn 预留但不启用 | `ALLOWED_COMMANDS` 中 mvn 行注释，白名单无 mvn |
| ② | 镜像映射表 2 条 | `IMAGE_MAP = {"python": "python:3.12-slim", "node": "node:20-slim"}` + `select_image()` 动态选择 |
| ③ | 不引入并发信号量 | 无 concurrency 参数/字段 |
| ④ | 不引入 artifact_paths | ExecutionResult 无 artifact_paths 字段 |
| α | build_test_commands() 默认空列表 | `build_test_commands: list[str] = []`，F002 零改动 |
| β | npm 危险模式拒绝保留 | `DANGEROUS_PATTERNS` 含 `^npm(\s|$)`，有意设计保留 |

### 跨文档同步

| 文档 | 变更 |
|---|---|
| state-design.md | +sandbox_result 字段 +build_test_commands 字段 |
| boundaries.md | +server/sandbox/ 目录 +依赖方向 +禁止项（沙箱不执行 verify.sh） |
| api-spec.md | +GET /api/sandbox/status 端点 |
| convention-to-rule-mapping.md | +3 行（白名单校验/零交集/Docker 退化） |

## 踩坑

| 编号 | 描述 |
|---|---|
| P009 | 测试不依赖 Docker daemon，DockerExecutor 全程 mock client |
| P010 | 所有 uv 命令前置 UV_FROZEN=1（local_executor env 默认注入） |
| P011 | 提交前 git status --short + git diff --cached --stat 双向核对 |
| — | `_LocalExecutorAdapter` 初版用 `local` 作模块别名，与 Python 关键字冲突，改用延迟 import |
| — | `npm install` 先命中白名单拒绝再命中危险模式，测试预期修正为 "not in whitelist" |

## 自报歧义/存疑项（备审查）

1. **DockerExecutor 适配器的 docker_client 注入时机**：当前 `_DockerExecutorAdapter.__init__` 延迟到 execute/cancel 时才调用 `_get_production_client()`，首次调用时若 aiodocker 不可用会抛 ImportError。设计文档未明确延迟初始化 vs eager fail——当前行为与 Probe 保证一致（Probe 通过才走 docker 分支），标注备审查。

2. **LocalExecutor 进程清理**：`asyncio.create_subprocess_exec` 创建的子进程在 cancel 时通过 `process.kill()` 终止，但若进程已退出再 kill 会抛 ProcessLookupError——已 try/except 吞掉，标注备审查确认是否符合预期。

3. **沙箱执行结果写入 State 的时机**：validation 委派桩当前仅设置 `sandbox_available=True`，不实际执行沙箱命令（设计文档 §委派桩接线要求"执行由 Agent Runtime 驱动"）。sandbox_result 字段已预留但当前始终为 None——标注备审查确认是否需要首版即执行。
