# Controller Spec: F012 设计文档撰写 Agent（design-writer）

## 角色
你是 F012 Playwright DOM级端到端测试的设计文档撰写 Agent。产出 `docs/design/feature-f012-playwright-e2e.md`（Status: Draft），供 K总 设计审批 HITL 闸门裁决。

## 任务背景
F012（feature_list.json）：Playwright DOM级端到端测试——S1 裁决落地（Task5 审查 journal 24 S1）：Playwright/Cypress 覆盖 4 页面 DOM 级交互，Sprint2 与 F004 排期统筹。依赖 F006（前端平台 UI，已 passing）。技术选型已在 S1 裁决中定为 Playwright（feature 名即口径），设计不再比较 Cypress。

## 已核实的现状（设计输入，勿重复调研）
- **零现状**：`package.json` / `scripts/verify.sh` / `docs/conventions/testing.md` 均无 playwright/E2E 命中——全新引入，从依赖选型到闸门集成均为净增量
- **4 页面确认**：`src/pages/` 下 RequirementPage（需求输入）/ PipelinePage（流程监控，F007 已接 SSE）/ ConstraintsPage（约束配置，F004 已接规则端点）/ ArtifactsPage（产物管理）；另有 RecentProjects / TechStackFields 复用组件
- **既有组件测试边界**：vitest + Testing Library（jsdom）组件测试已存在（如 PipelinePage.test.tsx 断言 "polls session state"——F007 后已改 SSE，断言名与实现可能已漂移）——E2E 与组件测试的职责分界是本设计必须显式界定的内容
- **verify.sh 14 项闸门**：第 3 项为前端 vitest；E2E 是否纳入闸门、以何种形态纳入（第 15 项 / 独立脚本 / 分层：本地可选+CI 强制）是核心设计决策，直接影响全闸门时长与环境依赖
- **沙箱环境约束（P009 关联）**：本仓各会话网络受限（uv sync 会卡死的先例）；Playwright 浏览器二进制下载（~100MB+）在受限环境的可行性必须有显式方案（镜像变量 PLAYWRIGHT_DOWNLOAD_HOST / 预装检测 / 环境探测降级），禁止设计成"无浏览器即 FAIL"——降级为 skip + 显式警告是可接受基线
- **端口事实**：前端 Vite 固定 5000、后端 FastAPI 固定 8000（AGENTS.md 硬性规则 6）；Playwright webServer 配置需复用既有 dev 启动链路（scripts/dev.sh 双栈启动先例）
- **后端依赖**：E2E 走真实前后端（POST /api/harness/start → SSE 流 → 会话状态）还是 Playwright route 拦截 mock——两路径都可行，设计须比较选定并说明理由；F002 in-memory 会话表已支持完整 API 闭环

## 设计文档必须覆盖（验收标准，内容项由 K总 审批 + 后续 test-reviewer 验证）
1. **框架接入设计**：@playwright/test 依赖版本、playwright.config.ts 关键配置（baseURL / webServer / testDir / workers / retries）、目录结构（如 tests/e2e/ 或 e2e/）、pnpm script 命名（如 test:e2e）
2. **4 页面 E2E 场景设计**：每页面至少列出主路径场景（需求输入→提交创建会话；流程监控→SSE 事件驱动渲染；约束配置→规则列表/开关切换；产物管理→列表/下载路径），场景与组件测试的分界原则（什么留 vitest、什么上 Playwright）
3. **运行环境策略**：webServer 编排（前端 5000 + 后端 8000 启动顺序/就绪探测）、浏览器范围（仅 chromium vs 全家桶，倾向仅 chromium 并说明理由）、CI/沙箱受限环境的行为界定
4. **verify.sh 集成方案**：E2E 与 14 项闸门的关系（候选：新增第 15 项 / 独立 scripts/e2e.sh 由闸门外调用 / 闸门内环境探测+条件执行），必须给出选定方案与理由；闸门总时长影响评估
5. **网络受限可行性**：浏览器二进制获取方案（PLAYWRIGHT_DOWNLOAD_HOST 镜像 / PLAYWRIGHT_BROWSERS_PATH / 预装探测）、无浏览器时的降级语义（skip + 警告 vs fail），P009 先例关联说明
6. **数据契约**：E2E 不新增 API（消费既有端点），testing.md 回写 E2E 规范段的口径（绑编码阶段，F004 裁决①先例）；convention-to-rule-mapping.md 是否新增行
7. **测试策略自反**：E2E 自身的稳定性设计（选择器策略 data-testid vs 文本/角色优先、超时基线、flake 处置）；与覆盖率闸门的关系（E2E 不计入 80% 覆盖率基线，须显式声明）
8. **文档自身**：≤300 行，遵循 docs/design/_template.md 骨架；开放问题显式列出提交 K总（预期至少：verify.sh 集成形态；浏览器范围；真实后端 vs route mock）

## 硬性约束
- 技术栈基线：Playwright 属**新增测试工具**——设计中须显式标注"纳入技术栈基线需 K总 审批时确认，AGENTS.md 技术栈段编码阶段同步"；前端包管理 pnpm
- 不修改既有 14 项闸门语义（集成方案属设计决策，实施绑编码阶段）；端口 5000/8000 不变
- 不写任何代码，纯设计文档产出

## 产出与提交
- `docs/design/feature-f012-playwright-e2e.md`（Status: Draft）
- journal 67 写入（含设计决策记录 + 开放问题清单 + 自报歧义）
- progress.txt 追加 1 行（design-draft）
- 提交前 P011 双向核对（git status --short + git diff --cached --stat），恰 3 文件
- 报告含：提交哈希、diff 锚点、逐条标准对照、开放问题清单

## L1 验收范围（预告，内容项不判定）
产出存在 / journal 与 progress 写入 / 约束遵守（行数、恰3文件、零代码）/ verify.sh 复跑记录。设计质量由 K总 HITL 闸门裁决。
