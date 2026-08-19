[Controller Spec]
任务: Sprint 1 Task 5 — 前后端集成验证（端到端主路径走通 + 集成缺陷修复）
角色: coder
前置条件: F002/F003/F006 全部 passing（commit 00eed47 为当前 HEAD 基线）
输入:
  - 功能 ID: TASK5（集成验证，非新功能编码）
  - 被验证产物: F002 LangGraph 编排引擎 + F003 LLM 提供商层 + F006 前端 UI
  - 参考文档:
    - docs/architecture/boundaries.md（前后端分层边界）
    - docs/reference/api-spec.md（注意:「Agent 会话」段 /api/agent-sessions 为 F001 骨架 stub，本次验证以 /api/harness/* 为准，api-spec 对齐是 L1 待办不属本任务）
    - AGENTS.md 硬性规则（相对路径 /api/...、端口 5000/8000、verify.sh 全闸门）
    - harness-journal/stage-04-coding/19-f006-coding.md（前端 API 消费口径：轮询为唯一状态源，SSE 不消费）
  - 启动方式: scripts/dev.sh（读 .preview 端口）或等效分栈启动（前端 Vite 5000 / 后端 FastAPI 8000）
  - 环境事实（pitfalls.md P009/P010/P011 必读）:
    - 沙箱无 uv 时按 P009 替代法构建后端环境（UV_DEFAULT_INDEX 镜像）
    - 涉及 uv 命令一律前置 UV_FROZEN=1（P010）
    - 提交前 git diff --cached --stat 核对暂存清单（P011）
输出:
  - 集成验证 journal: harness-journal/stage-04-coding/23-task5-integration.md（验证环境表 + 端到端步骤记录 + 发现问题与处理）
  - 集成缺陷修复（如发现）: 仅限使集成跑通的最小修复，逐项记录于 journal
  - 可选: 集成测试代码（若产出，纳入 verify.sh 闸门体系）
  - progress.txt 追加一行
验收标准:
  1. 双栈启动成功: 后端 FastAPI 于 8000 可访问（curl /api/harness/* 非连接拒绝），前端 Vite dev server 于 5000 可访问（HTTP 200）；端口从 .preview 读取，禁止 hardcode（代码内既有常量除外）
  2. 端到端主路径走通（后端 API 层实调验证）:
     a. POST /api/harness/start（合法 TechStackSpec kebab-case 请求体）→ 返回 {session_id, status}
     b. GET /api/harness/{sid}/state → 返回快照（state 非 null、current_stage 推进、闸门暂停语义正确）
     c. POST /api/harness/{sid}/resume（gate + decision 合法组合）→ 流程继续推进
     d. 全流程推到 END 或人类闸门暂停，至少完整走一轮
  3. 前端集成验证: dev server 起动后 4 页面路由可达（HTTP 层验证 index.html 或路由响应即可）；若会话环境支持更深的交互验证则执行，不支持时如实记录验证边界（不得虚构交互验证结论）
  4. API 契约运行时一致性抽查: 前端 fetch 消费的响应字段（session_id/status/state/current_stage/token_usage_total 等）与后端实际返回逐字段一致（curl 实测响应对照前端 TS 类型定义）
  5. 发现的集成缺陷: 已修复（最小修复 + verify.sh 全绿）或如实报告并给出定位证据；禁止静默绕过（如 try/catch 吞错、mock 顶替真实调用）
  6. 有代码变更时 verify.sh 14/14 全通过；无代码变更时也需复跑一次记录（P010 防护）
  7. journal 23 完整（验证环境表、每个验收标准的实测命令与输出摘要、问题清单）
  8. 改动范围合规: 修复仅限集成所需（预期为 src/api 层或 server/routes 层小修），单文件 ≤300 行/单函数 ≤50 行；verify.sh/AGENTS.md/.coze/设计文档/feature_list.json 禁改
禁止:
  - 不得自行调用 skill 产出内容
  - 不得跳过 harness-journal 记录（journal 23）
  - 不得修改 sub_id / AGENTS.md 硬性规则 / verify.sh
  - 不得修改设计文档与跨文档（api-spec.md 对齐属 L1 待办 (a)）
  - 不得升级技术栈基线或新增重依赖（集成验证不需要新框架；e2e 框架不引入）
  - 不得以 mock/假成功冒充集成验证通过
  - 不得占用 journal 24 编号（预留给 test-reviewer 审查）
