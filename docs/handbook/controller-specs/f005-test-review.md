# F005 代码执行沙箱 — L3 测试审查 Controller Spec（test-reviewer）

## 角色与边界

你是 L3 独立测试审查 Agent。对 F005 编码产出做内容质量独立验证与歧义裁定。**独立验证：不得引用 coder 报告、L1 journal 52 或 journal 50 自报作为结论依据**；所有结论须有自己的证据（curl 实测 / 测试复跑 / diff 检视 / 代码阅读）。L1 曾在 F014 越界自测（journal 33，新会话必读），审查者不承担 L1 职责，反向同理：你的结论就是内容质量的最终权威。

## 审查对象与锚点

- 代码提交: **fbc5d0c**（diff 锚点 `6d24a92..fbc5d0c`，恰 32 文件 +1498/−6；`6d24a92` 为 L1 journal 49 委派提交非 coder 产出）
- 链上 **be3c61e 为平台自动提交（Coze-Commit-Type: user，与 fbc5d0c 零内容差异）**，知悉即可，非 coder 产物
- 设计权威: docs/design/feature-f005-execution-sandbox.md（**Approved**，头部含 6 项裁决注记）
- Controller Spec（编码）: docs/handbook/controller-specs/f005-coder.md（12 项验收标准）
- journal 50: harness-journal/stage-04-coding/50-f005-coder-execution.md

## 一、12 项编码验收标准独立验证

对编码 Spec 每项标准**独立取证**（不采信报告表格），重点：

1. Executor Protocol 三方法（execute/cancel/cleanup）签名完整 + Docker/Local 双实现 + get_executor 三级分支（代码检视 + 类型检查）
2. 命令白名单 8 允许 + 危险模式 5 拒绝 + 边界用例（空命令/管道/路径穿越）——**白名单测试逐用例抽读，识别"测试存在但断言空洞"**
3. 三级降级链：probe 三返回 → docker/local/disabled（probe 测试 + 起服实测 GET /api/sandbox/status 在无 Docker 环境的真实降级路径）
4. 五维资源隔离参数（cpus/memory/pids/tmpfs/network=none）——mock client 断言的参数逐一核对
5. LocalExecutor 无 shell（create_subprocess_exec）+ 安全降级显式标注 + resource_usage 零值占位
6. GET /api/sandbox/status 实测（curl）+ Pydantic schema + TS 类型镜像逐字段一致
7. HarnessState.sandbox_result 新字段 + State 写入路径（**内容级验证**）
8. 不新增 LangGraph Node、F002 拓扑零改动（definition.py diff 检视）
9. 【歧义α】TechStackSpec.build_test_commands 默认空列表 + F002 既有定义零改动（schema diff + F002 测试复跑）
10. 【裁决②】镜像映射表恰 2 条（python:3.12-slim / node:20-slim）按 TechStackSpec 动态选择
11. 【裁决①】mvn 预留匹配位但不启用（白名单/预留表检视 + mvn 命令实测被拒）
12. 【裁决③④】无并发信号量、无 artifact_paths 字段（grep 零命中）+ verify.sh 独立复跑 14/14（UV_FROZEN=1，uv.lock 零漂移）

## 二、设计符合性抽检

对照 Approved 设计文档核心边界：与 F004 单执行器零交集（scripts/verify.sh 不在白名单、沙箱不执行平台闸门命令——白名单代码检视）；Node 委派桩原则（不新增 Node，State 仅 sandbox_result 全新字段）；生命周期（cleanup 每次执行后同步调用 / lifespan shutdown 按 label 批量清理 / 超时 wait_for→cancel 链路——mock 断言调用序列）；env 不传敏感凭据。

## 三、3 项自报歧义裁定（coder 报告⑥，原文转呈）

- **α DockerExecutor 适配器延迟初始化**：_DockerExecutorAdapter.__init__ 延迟到 execute/cancel 才获取 aiodocker client，Probe 保证 docker 分支可达，但首次调用 aiodocker 不可用抛 ImportError——审查失败路径处理是否符合设计降级语义，裁定可接受/需修复
- **β LocalExecutor cancel 后 kill**：process.kill() 对已退出进程抛 ProcessLookupError 已 try/except——裁定该防御是否恰当（对照"克制兜底"与竞态现实）
- **γ sandbox_result 写入时机（重点）**：coder 称 validation 桩仅设 sandbox_available=True 不实际执行沙箱命令，sandbox_result 恒 None；设计 §编排集成 的代码示意含 `sandbox_result = await executor.execute(request)`。**须对照设计文档判定实现与设计的偏差性质**（设计示意是愿景还是契约、首版语义如何裁定），给出裁定与依据供 K总 知悉

## 四、测试质量审查

- 后端 181 passed + 1 skipped / 覆盖率 94.39%（sandbox 包 88.56%）（L1 复跑口径）——审查者复跑并抽读关键测试：白名单/probe/local 执行/契约（Local vs Docker 结构等价）/API 往返/委派桩，识别断言空洞项
- mypy strict / ruff / import-linter 结果复核

## 五、行数与结构约束

fbc5d0c 新增单文件 ≤300 行、单函数 ≤50 行（verify.sh 已含此项，抽读最可能超标的文件复核）；跨文档 4 份同步（state-design/boundaries/api-spec/convention-to-rule-mapping）内容正确性——与实现逐项对照，防"改了但不一致"（F004 M1/M2 同型缺陷）。

## 六、报告格式

①12 项标准独立验证表（每项证据自采）②3 项歧义裁定（含 γ 的设计对照结论）③测试质量与断言空洞清单④必须修复项（M 编号）/ 建议改进项（N 编号）⑤环境表。产出 journal 51（自写）+ progress.txt 追加一行 + 提交（P011 防护）。
