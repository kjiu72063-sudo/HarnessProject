# journal 66: F012 Playwright E2E 设计委派

- 日期: 2026-08-20（L1 会话时钟 23:40Z，沙箱时钟漂移已知先例）
- 记录人: L1 项目管控 Agent
- 类型: 委派记录（三件套产出）

## 一、委派背景

K总指示"F012 设计委派"。F007 已闭环（journal 65），Sprint2 余 F012/F013，本批次启动 F012。

F012 口径（2026-08-20 K总裁决的编号映射，journal 35）：F012 = Playwright DOM级端到端测试（S1 裁决落地，Task5 审查 journal 24 S1：Playwright/Cypress 覆盖 4 页面 DOM 级交互）。技术选型已定为 Playwright（feature 名即口径），设计不再比较 Cypress。

## 二、设计输入核实（L1 流程事实，内容判断归 K总/审查）

- `package.json` / `scripts/verify.sh` / `docs/conventions/testing.md` 零 playwright/E2E 命中——全新引入净增量
- 4 页面确认：RequirementPage / PipelinePage（F007 已接 SSE）/ ConstraintsPage（F004 已接规则端点）/ ArtifactsPage
- 既有 vitest + Testing Library 组件测试存在——E2E 与组件测试职责分界入 Spec 标准第 2 项
- verify.sh 14 项闸门：E2E 集成形态（第 15 项/独立脚本/条件执行）列 Spec 标准第 4 项 + 预期开放问题
- P009 关联：沙箱网络受限下浏览器二进制下载可行性必须显式方案（镜像/预装探测/skip 降级），禁止"无浏览器即 FAIL"
- 端口硬性规则：前端 5000 / 后端 8000 不变

## 三、委派三件套产出

| 产出 | 路径 |
|---|---|
| ControllerSpec（8 项验收标准） | docs/handbook/controller-specs/f012-design-writer.md |
| 启动提示词 | docs/handbook/launch-prompts/f012-design-writer-launch.md |
| journal 预留 | 67 = design-writer（本批次 66 已占用） |

Spec 要点：8 项标准（框架接入 / 4页面场景+测试分界 / 运行环境策略 / verify.sh 集成方案 / 网络受限可行性 / 数据契约回写 / 测试策略自反 / 文档自身）；硬性约束含"Playwright 纳入技术栈基线需 K总 审批确认 + 编码阶段同步 AGENTS.md"。

预期开放问题（供 design-writer 参考，以其实际产出为准）：verify.sh 集成形态 / 浏览器范围（倾向仅 chromium）/ 真实后端 vs route mock。

## 四、下一步

K总派生 F012 design-writer（粘贴 launch prompt 全文到新会话）→ Draft 报告回来后 L1 流程验收（四类行）→ 开放问题/歧义转呈 → K总设计审批 HITL 闸门 → Approve 后 L1 产出 coder 委派三件套。
