# F005 Coder Controller Spec — 代码执行沙箱实现

- 版本: 1.0
- 委派者: L1 管控 Agent
- 执行者: F005 Coder Agent（角色模板: docs/handbook/role-templates/coder.md）
- journal 预留: 50 = coder 执行记录（自写），51 = test-reviewer 审查记录（禁占）。编号调整说明: 原预留 49 让位于 L1 审批落地批次（journal 49），参照 journal 42 编号调整先例
- 设计权威: `docs/design/feature-f005-execution-sandbox.md`（Status: Approved，250+ 行，含 K总 4 开放问题 + 2 歧义裁决注记）——设计文档与本 Spec 为唯一实现依据；L1 无先在内容结论，执行中一切内容判断以设计文档为准，发现 Spec 与设计冲突时以设计文档为准并在报告与 journal 50 中记录歧义事实（不裁定）

## 一、任务

按 Approved 设计文档实现代码执行沙箱（Executor Protocol + Docker/Local 双实现 + probe 探测 + 命令白名单 + validation 委派桩接线 + GET /api/sandbox/status + TS 类型 + 七层测试 + 四份跨文档同步），Sprint2 第三个正式 feature。

## 二、输入（冷启动序列）

1. AGENTS.md（全文——硬规则来源）
2. docs/design/feature-f005-execution-sandbox.md（Approved 设计，含裁决注记）
3. docs/architecture/harness-flow.md / boundaries.md / state-design.md
4. docs/reference/api-spec.md / docs/conventions/convention-to-rule-mapping.md / coding.md / pitfalls.md（P001-P012）
5. 现有代码定位: server/graph/definition.py（validation/coding_agent 委派桩）、server/schemas/（TechStackSpec 所在）、server/config/settings.py、src/types/harness.ts、server/main.py（lifespan）
6. harness-journal/stage-04-coding/README.md（最近 3 条 journal）
7. docs/handbook/prompts/_bootstrap.md → role-templates/coder.md → scripts/coding-agent-start.sh

## 三、产出布局（设计文档既定，不自行增删模块）

```
server/sandbox/__init__.py        # 包出口，导出 get_executor
server/sandbox/base.py            # Executor Protocol + ExecutionRequest/Result/ResourceLimits/Usage
server/sandbox/docker_executor.py # Docker 实现（Tier 1）
server/sandbox/local_executor.py  # 本地进程实现（Tier 2 降级）
server/sandbox/probe.py           # Docker 可用性探测（lifespan 调用）
server/sandbox/exceptions.py      # SandboxError
server/routes/sandbox.py          # GET /api/sandbox/status
server/schemas/sandbox.py         # SandboxStatusResponse
src/types/sandbox.ts              # TS 类型镜像（硬性规则 4）
src/types/harness.ts              # SandboxResult 可选字段补入
（TechStackSpec.build_test_commands 补入所在 schema 文件，裁决歧义α）
server/tests/test_sandbox_*.py    # 白名单/probe/local/契约/API/委派桩测试
```

## 四、验收标准（12 项，逐条自报证据）

| # | 标准 | 证据要求 |
|---|---|---|
| 1 | Executor Protocol 三方法（execute/cancel/cleanup）完整；DockerExecutor 与 LocalExecutor 双实现；get_executor 工厂三级分支 | Protocol 定义摘录 + 两实现文件存在 |
| 2 | 命令白名单：允许 python/pytest/uv/pnpm/node/npx/git/echo；拒绝 rm -rf / / curl\|sh / wget\|sh / npm；**mvn 预留匹配位但不启用（裁决①，白名单或预留表含注释性占位）** | 白名单单测全用例通过数（含边界：空命令/管道/路径穿越） |
| 3 | 三级降级链：probe 三返回（可用/不可用/超时）→ docker/local/disabled；Tier 3 SandboxError → validation 桩 catch → status="disabled" + human_intervention=False | probe 单测 + 委派桩集成测试摘录 |
| 4 | validation 委派桩调用 get_executor().execute()，sandbox_result 写入 State；coding_agent Controller Spec 含 inputs.sandbox_available | 委派桩集成测试 |
| 5 | **【裁决歧义α】TechStackSpec.build_test_commands() 在 F005 编码阶段补入，默认实现返回空列表；F002 既有定义零改动** | schema diff 摘录 + F002 测试零破坏 |
| 6 | **【裁决②】镜像映射表内置 2 条（python:3.12-slim / node:20-slim），按 TechStackSpec 动态选择** | 映射表代码摘录 |
| 7 | 生命周期：cleanup() 每次执行后同步调用（成功/超时/取消均触发）；lifespan shutdown 按 label（managed-by=harness-sandbox）批量清理；超时 asyncio.wait_for → cancel → docker stop -t 5 / process.kill | DockerExecutor mock 测试断言调用序列 |
| 8 | GET /api/sandbox/status 返回 {"executor_type": ..., "docker_available": ...}；Pydantic schema + TS 类型镜像；**api-spec.md 回写与实现同一提交（F004 裁决①先例）** | curl 实测摘录 + api-spec.md diff |
| 9 | 跨文档同步 3 份：state-design.md 新增 sandbox_result: dict（[NEW] 标注 F005）；boundaries.md 补 server/sandbox/ 行及依赖方向（nodes → sandbox → schemas）；convention-to-rule-mapping.md 命令白名单登记新条目 | 三文档 diff 摘录 |
| 10 | Local vs Docker 契约测试：同一 ExecutionRequest → 两实现结果结构等价；LocalExecutor 安全降级显式标注（无资源/网络/文件系统隔离，resource_usage 零值占位） | 契约测试通过证明 |
| 11 | 测试覆盖率 ≥80%（server 与 src 分册），verify.sh 14/14 PASS | 覆盖率数字 + verify.sh 输出 |
| 12 | 单文件 ≤300 行，单函数 ≤50 行；**裁决③④落地确认：不引入并发信号量、不引入 artifact_paths 字段** | wc -l 清单 + grep 零命中证明 |

## 五、约束（硬性，verify.sh 与审查会核）

1. **与 F004 单执行器零交集**：沙箱不执行 scripts/verify.sh（不在白名单）；执行对象是被开发产物的验证命令，与平台 14 项闸门无重叠
2. **Node 委派桩原则**：不新增 LangGraph Node，不改 F002 拓扑（设计§编排集成）；State 仅新增 sandbox_result: dict 全新字段，不动 verify_result
3. **安全边界**：env 不传敏感凭据（LLM key 等不入 ExecutionRequest.env）；产物挂载 :ro；网络默认 --network none
4. 禁改: 设计文档（已 Approved）、.coze、journal 49/51、F002/F003/F004 既有测试语义（扩展允许，语义破坏禁止）
5. 全部 13 条硬规则 + P009（uv 缺失/sync 卡死替代法，见 journal 39 §9）/P010（UV_FROZEN=1 前置）/P011（提交前 git status --short + git diff --cached --stat 双向核对，含 untracked 自动 stage 检查；平台自动提交零差异知悉不处理）/P012（不转述未核实结论）
6. 提交锚点: 3bdbe09..HEAD 区间内自报最终 commit 哈希 + 文件清单（验收以 diff 范围为准，区间含 L1 的 journal 49 委派提交，非 coder 产出）
7. Docker 在沙箱环境可能不可用（P009 同源环境漂移）——Tier 2/3 路径正是为此设计：测试不得依赖 Docker daemon 真实可用，DockerExecutor 用 mock client（设计测试策略既定）

## 六、报告格式

按 role-templates/coder.md：①验收标准逐条对照（表）②提交哈希与 diff 锚点 ③环境表 ④踩坑与 P 编号命中 ⑤产出物清单 ⑥自报歧义/存疑项（标注"备审查"，L1 不裁定）。

## 七、完成定义

验收标准 12 项全过 + verify.sh 14/14 + journal 50 自写 + progress.txt 追加一行（格式 `[时间] stage-04 | F005 | coding-done | 摘要`）+ 恰当文件数提交（P011 防护通过）→ L1 流程验收 → test-reviewer 独立审查（journal 51，无豁免）。
