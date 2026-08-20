last_updated: 2026-08-20
status: Approved
owner: @K总

# Feature: F005 代码执行沙箱

## Status: Approved

> 2026-08-20 K总设计审批通过（HITL 闸门），4 项开放问题 + 2 项自报歧义全部按 design-writer 建议采纳（journal 49）：
> ① 跨语言支持范围：首版不含 Java/mvn，排期 F010 协同交付；白名单预留 mvn 匹配位但不启用。feature_list.json F005 描述中 "mvn verify" 同步修正。
> ② 沙箱镜像策略：方案 B（按 TechStackSpec 动态选择），映射表内置 2 条（python:3.12-slim / node:20-slim），对齐 F003 Provider 注册先例。
> ③ 并发执行上限：首版不限（单会话场景），并发控制留 F009；单实例隔离由 Docker 资源限制提供。
> ④ Artifact 检索：首版不支持，沙箱仅执行验证命令；后续可增 `artifact_paths` 字段。
> 歧义 α `TechStackSpec.build_test_commands()`：归属 F005 编码阶段补入（默认实现返回空列表，Pydantic field 或方法按现有 TechStackSpec 形态落地），F002 既有定义不动。
> 歧义 β npm 白名单双重出现：有意设计（平台栈用 pnpm），保留——npm 命中危险模式即拒绝，与白名单其他条目不冲突。

## 目标

为 Harness 阶段 5 验证提供**隔离的代码执行环境**：在被开发产物上下文中运行测试套件与构建验证，结果回写 State 供反馈循环消费。执行对象是「被开发产物的验证」（产物自身的 test/verify 命令），与平台 verify.sh 14 项闸门**零交集**（见 §与 F004 关系界定）。

## 非目标

- 不执行平台 verify.sh 闸门——F004 单执行器原则领域，沙箱不重复不替代
- 不实现沙箱镜像构建管线——首个实现复用预构建镜像，镜像策略见开放问题
- 不实现交互式终端/SSH 接入——仅支持提交-执行-回收模式
- 不新增 LangGraph Node——沙箱是 Agent Runtime 执行基础设施，经委派桩接线（F004 裁决 B 先例）
- 不改变 F002 已 Approved 的 StateGraph 拓扑
- 不支持跨语言产物（Java/mvn 等）——首个实现仅覆盖 Python/Node 栈，跨语言见开放问题

## 技术方案

### 总体架构：可插拔执行器（验收标准 1，F003 先例）

参照 F003 `LLMProvider(Protocol)` + 工厂函数模式：

```
server/sandbox/
├── __init__.py          # 包出口，导出 get_executor 工厂
├── base.py              # Executor Protocol + 数据模型
├── docker_executor.py   # Docker 实现（首选）
├── local_executor.py    # 本地进程实现（降级）
├── probe.py             # Docker 可用性探测
└── exceptions.py        # SandboxError 自定义异常
```

**Executor Protocol**：

```python
class Executor(Protocol):
    async def execute(self, request: ExecutionRequest) -> ExecutionResult: ...
    async def cancel(self, execution_id: str) -> bool: ...
    async def cleanup(self, execution_id: str) -> None: ...
```

**数据模型**（`server/sandbox/base.py`）：

```python
class ExecutionRequest(BaseModel):
    execution_id: str
    project_path: str               # 产物项目路径（挂载源）
    commands: list[str]             # 顺序执行的命令序列
    env: dict[str, str] = {}        # 不传敏感凭据，见安全隔离
    timeout: int = 300              # 默认 5 分钟
    resource_limits: ResourceLimits = ResourceLimits()

class ResourceLimits(BaseModel):
    cpu_quota: float = 1.0          # CPU 核数
    memory_mb: int = 512
    disk_mb: int = 100
    pids_limit: int = 100

class ExecutionResult(BaseModel):
    execution_id: str
    exit_code: int
    stdout: str                     # 截断至 64KB
    stderr: str                     # 截断至 64KB
    duration_ms: int
    resource_usage: ResourceUsage
    status: Literal["completed", "timeout", "cancelled", "error"]

class ResourceUsage(BaseModel):
    cpu_seconds: float = 0.0
    memory_peak_mb: float = 0.0
    disk_used_mb: float = 0.0
```

**工厂函数**（启动探测 → 选择实现）：

```python
def get_executor() -> Executor:
    match _executor_type:
        case "docker": return DockerExecutor()
        case "local": return LocalExecutor()
        case "disabled": raise SandboxError("Sandbox disabled: Docker unavailable")
```

### 安全隔离边界（验收标准 2）

**Docker 实现安全策略**：

| 维度 | 策略 | 实现 |
|---|---|---|
| 资源 | CPU/内存/磁盘/PID 四项限制 | `docker run --cpus --memory --pids-limit` + tmpfs size |
| 网络 | 默认禁用 | `--network none` |
| 文件系统 | 产物只读挂载 + 可写 workspace | `-v {path}:/project:ro` + tmpfs `/workspace` |
| 命令 | 白名单匹配 AND 非危险模式 | 见下方 |
| 超时 | 硬超时 kill | `asyncio.wait_for` + `docker stop -t 5` |

**命令白名单**（正则前缀匹配）：

```python
ALLOWED_COMMANDS = [
    re.compile(r"^python(\s|$)"),   re.compile(r"^pytest(\s|$)"),
    re.compile(r"^uv(\s|$)"),       re.compile(r"^pnpm(\s|$)"),
    re.compile(r"^node(\s|$)"),     re.compile(r"^npx(\s|$)"),
    re.compile(r"^git(\s|$)"),      re.compile(r"^echo(\s|$)"),
]
DANGEROUS_PATTERNS = [
    re.compile(r"rm\s+-rf\s+/"),    re.compile(r"curl.*\|\s*sh"),
    re.compile(r"wget.*\|\s*sh"),   re.compile(r"^npm(\s|$)"),  # 平台用 pnpm
]
```

校验：白名单匹配 AND 不命中危险模式。拒绝时抛 `SandboxError`，记录被拒命令原文。

**LocalExecutor 安全降级**：命令白名单同等校验 + 工作目录锁定（`cwd=`）+ 超时同等。**无资源/网络/文件系统隔离**——降级代价，显式标注。`resource_limits` 忽略，`resource_usage` 返回零值占位。

### 环境不可用降级路径（验收标准 3）

**启动探测**（`probe.py`，FastAPI lifespan 调用）：`docker info` 可执行 → `docker run hello-world` 成功 → 磁盘空间充裕。

**三级降级链**：

| 级别 | 条件 | 行为 | 前端 |
|---|---|---|---|
| Tier 1 | Docker 可用 | DockerExecutor | 沙箱功能完整 |
| Tier 2 | Docker 不可用 | LocalExecutor | 可用，安全降级（UI 提示） |
| Tier 3 | 显式禁用 | SandboxError | disabled，委派桩降级为 stub |

Tier 3：`get_executor()` 抛 SandboxError → 委派桩 catch → `sandbox_result.status="disabled"` → `human_intervention=False`（不阻断流程，F004 裁决③ `enabled=false` 语义先例：禁用不阻断）。

### 与编排集成（验收标准 4）

**不新增 Node**（F004 裁决 B 先例）。沙箱经 `validation` 委派桩消费：

```python
async def validation(state: HarnessState) -> dict[str, Any]:
    executor = get_executor()
    request = ExecutionRequest(
        execution_id=state["project_id"],
        project_path=state["worktree_branch"],
        commands=state["tech_stack"].build_test_commands(),
    )
    try:
        sandbox_result = await executor.execute(request)
    except SandboxError:
        sandbox_result = ExecutionResult(status="disabled", ...)
    return {"sandbox_result": sandbox_result.model_dump(), ...}
```

**State 字段**：新增 `sandbox_result: dict`（[NEW]，F005 全新字段，不与 `verify_result` 重叠）。Node 不解析内容，L3 委派结果透传。

**coding_agent 委派桩**：阶段 4 不调用沙箱，Controller Spec 注入 `inputs.sandbox_available: bool`。

### 与 F004 单执行器原则关系界定（验收标准 5）

| 维度 | F004 verify.sh | F005 沙箱 |
|---|---|---|
| 执行对象 | 平台自身代码（harness-platform） | 被开发产物（用户项目） |
| 执行内容 | 14 项闸门（ESLint/ruff/mypy/…） | 产物的 test/verify 命令 |
| 执行位置 | 宿主进程 | 隔离容器/进程 |
| 结果字段 | `verify_result`（逐闸门） | `sandbox_result`（整体） |

零交集保证：沙箱不执行 `scripts/verify.sh`（不在白名单）。`commands` 由 `TechStackSpec.build_test_commands()` 按产物栈生成（如 `["pnpm","test"]` / `["uv","run","pytest"]`），与平台闸门命令无交集。

### 生命周期管理（验收标准 6）

**Docker 容器**：`execute()` → 创建容器 → 等待/超时 → 收集结果 → `cleanup()` 删除容器+tmpfs。

**泄漏防护**：
- 每次执行后 `cleanup()` 同步调用（成功/超时/取消均触发）
- lifespan shutdown 批量清理残留容器（label 过滤 `managed-by=harness-sandbox`）
- 执行 ID 与 project_id 关联，支持按项目清理

**熵管理衔接**：沙箱执行完成后，清理 Agent 调用 `executor.cleanup(execution_id)` 释放资源。沙箱不触发清理 Agent，只提供 cleanup 接口。

**超时与取消**：`execute()` 内 `asyncio.wait_for(timeout=request.timeout)` → 超时触发 `cancel()` → Docker: `docker stop -t 5` / Local: `process.kill()`。

### 数据契约与 API（验收标准 7）

**新增端点**（只读状态查询，执行由委派桩内部调用不经 API）：

```
GET /api/sandbox/status
  → 200 {"executor_type": "docker"|"local"|"disabled", "docker_available": bool}
```

**Pydantic schema**（`server/schemas/sandbox.py`）：`SandboxStatusResponse`，字段同上。
**TS 类型**（`src/types/sandbox.ts`，硬性规则 4）：镜像。
**api-spec.md 回写**：绑编码阶段（F004 裁决①先例）。

**`sandbox_result` State 字段结构**（dict，与 `verify_result` 对齐）：

```python
{"execution_id": str, "exit_code": int, "stdout": str, "stderr": str,
 "duration_ms": int, "status": "completed"|"timeout"|"cancelled"|"error"|"disabled"}
```

前端 `SandboxResult` TS 类型在 `src/types/harness.ts` 补入，可选字段（向后兼容）。

### 测试策略（验收标准 8）

| 层 | 范围 | 方法 |
|---|---|---|
| 单测 | Executor 契约 | LocalExecutor 真实执行（`echo hello`），验证结果结构 |
| 单测 | DockerExecutor | mock docker SDK client；验证 run/stop/wait 参数与安全策略 |
| 单测 | 命令白名单 | ALLOWED+DANGEROUS 全用例；边界：空命令/管道/路径穿越 |
| 单测 | probe | mock subprocess.run；三返回（可用/不可用/超时）→ 三级降级 |
| 集成 | API 端点 | httpx AsyncClient；GET /api/sandbox/status 往返 |
| 集成 | 委派桩 | validation 桩调用 get_executor()；SandboxError → disabled |
| 契约 | Local vs Docker | 同一 ExecutionRequest → 两实现结果结构等价 |

覆盖率 ≥ 80%；ESLint / ruff / mypy / import-linter 全过。

## 验收标准

1. Executor Protocol 定义完整：`execute` / `cancel` / `cleanup`；DockerExecutor 与 LocalExecutor 双实现
2. 命令白名单拦截：允许 python/pytest/uv/pnpm/node/npx/git/echo；拒绝 rm -rf / / curl|sh / npm
3. 三级降级链：Docker 可用→DockerExecutor，不可用→LocalExecutor，禁用→disabled
4. `validation` 委派桩调用 `get_executor().execute()`，`sandbox_result` 写入 State；`coding_agent` Controller Spec 含 `sandbox_available`
5. 沙箱执行对象 ≠ 平台 verify.sh：`TechStackSpec.build_test_commands()` 产出产物命令，verify.sh 不在白名单
6. cleanup() 每次执行后同步调用；lifespan shutdown 清理残留容器；超时触发 cancel
7. GET /api/sandbox/status 返回执行器类型与 Docker 可用性；Pydantic schema + TS 类型镜像
8. 测试覆盖率 ≥ 80%；verify.sh 14 项闸门全 PASS
9. 单文件 ≤ 300 行 / 单函数 ≤ 50 行

## 依赖

- F002 编排引擎（passing）：HarnessState、委派桩、Controller Spec 机制
- F003 可插拔 LLM Provider（passing）：Protocol + 工厂函数设计先例
- F004 约束管理层（passing）：单执行器原则、不新增 Node 先例、enabled=false 语义先例
- Docker（可选）：daemon 可用 Tier 1，不可用 Tier 2 降级

## 跨文档同步待办（编码阶段执行，本设计不改这些文档）

| 文档 | 待办 |
|---|---|
| state-design.md | 新增 `sandbox_result: dict` 字段（[NEW]，标注 F005） |
| boundaries.md | 补 `server/sandbox/` 一行及依赖方向（`nodes → sandbox → schemas`） |
| api-spec.md | 新增 GET /api/sandbox/status 端点（编码阶段回写，F004 裁决①先例） |
| convention-to-rule-mapping.md | 命令白名单作为新约束条目登记 |

## 开放问题（K总 裁决）

1. **跨语言产物支持范围**：首个实现仅覆盖 Python（pytest/uv）+ Node（pnpm/vitest）。feature_list.json 描述含"mvn verify"（Java 生态），但平台栈为 Python/Node。是否首版含 Java/mvn？建议：不含，排期 F010（多技术栈可插拔）协同交付；白名单预留 mvn 匹配位但不启用。
2. **沙箱镜像策略**：方案 A 单一多工具镜像（大但简单）；方案 B 按 TechStackSpec 动态选择（python:3.12-slim / node:20-slim，需维护映射表）；方案 C 从产物 Dockerfile 构建（最灵活但复杂）。建议：方案 B，映射表内置 2 条，对齐 F003 Provider 注册先例。
3. **并发执行上限**：多会话同时运行时沙箱实例数是否限制？建议：首版不限（单会话场景），并发控制留 F009；Docker 资源限制已提供单实例隔离。
4. **产物 Artifact 检索**：是否需从容器取回构建产物（dist/、build/）？建议：首版不支持——沙箱仅执行验证命令，构建产物在 worktree 本地可访问。后续可增 `artifact_paths` 字段。
