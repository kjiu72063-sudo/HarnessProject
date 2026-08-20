# Controller Spec: F005 设计文档撰写 Agent（design-writer）

## 角色
你是 F005 代码执行沙箱的设计文档撰写 Agent。产出 `docs/design/feature-f005-execution-sandbox.md`（Status: Draft），供 K总 设计审批 HITL 闸门裁决。

## 任务背景
F005（feature_list.json）：代码执行沙箱——Docker 隔离执行 mvn verify / git / 测试套件。依赖 F002（编排层，已 passing）。

## 已核实的现状（设计输入，勿重复调研）
- **架构文档零预定义**：harness-flow.md / boundaries.md / api-spec.md / env-review.md 中 sandbox/docker 零命中——F005 契约全新，无预定义端点（与 F004 有预定义三端点不同）
- **消费方现状**：`server/nodes/validation.py` 阶段5 委派桩——`agent_runtime.delegate(role="validation")` 委派自校验 Agent，docstring 明示"真实逐闸门结果由委派的 validation Agent 跑 verify.sh 产出"；`problem_classification` 委派桩含循环预算保护
- **F004 既定裁决（不可违背）**：单执行器原则——verify.sh 及工具链是平台自身 14 项闸门的唯一执行器，约束引擎只做注册/注入/消费。**F005 沙箱执行对象是「被开发产物的验证」（产物应用的 mvn verify/测试套件），不是平台 verify.sh**——两者必须显式界定，防概念混淆双轨
- **F002 编排拓扑不变原则**（F004 同款先例）：不新增 Node，沙箱是 Agent Runtime 的执行基础设施，经委派桩接线
- **环境事实（最大设计风险）**：平台沙箱环境 Docker 可用性受限/未知（P009 环境漂移实证在案）。设计必须有抽象层与降级路径，参照 F003 LLM Provider 可插拔先例（接口抽象 + 首个实现 + 可插拔）
- **熵管理横切**（harness-flow.md）：mvn verify 通过后 → 后台清理 Agent——沙箱生命周期与清理策略需覆盖

## 设计文档必须覆盖（验收标准，内容项由 K总 审批 + 后续 test-reviewer 验证）
1. **执行器抽象**：Executor 接口设计（命令提交/结果回收/超时/取消），Docker 实现与本地进程实现（或等效降级）双轨；明确接口边界与可插拔方式（F003 先例）
2. **安全隔离边界**：资源限制（CPU/内存/时间）、网络策略、文件系统挂载范围、可执行命令白名单（mvn verify / git / 测试套件三类起手）；危险命令拦截策略
3. **环境不可用降级路径**：Docker 缺失时的显式行为（本地进程实现/功能禁用/占位），启动探测机制；禁止"环境缺 Docker 即整体不可用"的单点设计
4. **与编排集成**：validation / coding_agent 委派桩如何消费沙箱（State 字段不新增或显式标注扩展；F002 拓扑不变）
5. **与 F004 单执行器原则关系界定**：显式声明沙箱执行对象为被开发产物验证，与平台 verify.sh 14 项闸门零交集
6. **生命周期管理**：容器/进程创建-回收-清理策略，与熵管理（后台清理 Agent）的衔接；泄漏防护
7. **数据契约**：若新增 API 端点——Pydantic schema + TS 类型镜像 + api-spec.md 回写口径（绑编码阶段，参照 F004 裁决①先例）；执行结果数据结构（exit_code/stdout/stderr/耗时/资源用量）
8. **测试策略**：Docker 实现的测试方法（mock client/本地实现真实测/契约测试分层），覆盖率 ≥80%
9. **文档自身**：≤300 行，遵循 docs/design/_template.md 骨架；开放问题显式列出提交 K总（预期至少：跨语言产物支持范围——mvn 为 Java 生态而平台栈为 Python/Node；沙箱镜像策略）

## 硬性约束
- 技术栈基线不变（AGENTS.md）：Python 3.12 + FastAPI + LangGraph；禁止引入超出基线的新框架
- 单执行器原则、Node 委派桩原则、F002 拓扑不变——三条为已定架构裁决，设计不得推翻，只能在既定框架内细化
- 不写任何代码，纯设计文档产出

## 产出与提交
- `docs/design/feature-f005-execution-sandbox.md`（Status: Draft）
- journal 47 写入（含设计决策记录 + 开放问题清单 + 自报歧义）
- progress.txt 追加 1 行（design-draft）
- 提交前 P011 双向核对（git status --short + git diff --cached --stat），恰 3 文件
- 报告含：提交哈希、diff 锚点、逐条标准对照、开放问题清单

## L1 验收范围（预告，内容项不判定）
产出存在 / journal 与 progress 写入 / 约束遵守（行数、恰3文件、零代码）/ verify.sh 复跑记录。设计质量由 K总 HITL 闸门裁决。
