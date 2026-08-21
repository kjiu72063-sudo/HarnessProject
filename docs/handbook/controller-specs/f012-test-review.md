# F012 Playwright DOM级端到端测试 — L3 独立测试审查 Controller Spec

## 任务定位

对 F012 编码产出（提交 a73c7dd，diff 锚点 c51eb33..a73c7dd，18 文件 +419/−3）做内容质量独立审查。你与 coder 无共享上下文，以 Spec 与设计文档为唯一依据独立验证。

**验证 diff 锚点**: `git diff c51eb33..a73c7dd`（其中 journal 70 + progress.txt 为 coder 配套记录，非审查对象本体；其后 6f1fdc0 为平台自动提交零差异，非审查对象）

## 审查对象

- 新增: playwright.config.ts · tests/e2e/{requirement,pipeline,constraints,artifacts}.spec.ts · tests/e2e/fixtures/harness.ts
- 修改: package.json · pnpm-lock.yaml · vitest.config.ts · eslint.config.mjs · .gitignore · scripts/verify.sh · AGENTS.md · docs/conventions/testing.md · docs/conventions/convention-to-rule-mapping.md

## 输入材料

- 本 Spec（12 项标准）
- 设计文档: docs/design/feature-f012-playwright-e2e.md（Status: Approved，含 4 项裁决注记）
- coder Spec: docs/handbook/controller-specs/f012-coder.md（含验收标准原文）
- 硬性规则: AGENTS.md（技术栈基线含 Playwright、单文件 ≤300 行、P008 版本一致性）

## 审查标准（12 项，独立验证）

1. **框架接入**: package.json devDependencies 含 @playwright/test ^1.49.0 语义版本；实际安装 1.62.1 与基线声明兼容（semver ^）；pnpm scripts 含 test:e2e 与 test:e2e:ui
2. **playwright.config.ts**: 34 行配置合法——testDir 指向 tests/e2e、projects 仅 chromium、webServer 双栈（后端 uvicorn:8000 + 前端 vite:5000）、超时与重试配置合理；≤300 行
3. **4 spec 文件场景**: 9 场景（R1-R3/P1-P3/C1-C3/A1-A3）与设计 §2 场景表逐一对应；页面 URL 正确；fixtures/harness.ts 复用合理
4. **裁决② 仅 Chromium**: projects 无 firefox/webkit；无多浏览器配置残留
5. **裁决③ 真实后端**: 无 route mock 拦截（page.route 零命中或仅标注网络故障模拟）；请求走真实 API
6. **裁决① 方案 C 第 15 项**: verify.sh 三级降级逻辑正确——浏览器可用检测方式（版本匹配探测）可靠性验证；skip+WARN 输出格式；skip 路径不产生 FAIL；**误 skip 风险**（有可用浏览器却被错误跳过）
7. **裁决④ 技术栈基线**: AGENTS.md 技术栈段 E2E 行与 package.json 实际版本一致（P008 交叉验证）；convention-mapping.md 对应行齐全
8. **测试排除互斥**: vitest.config.ts exclude 含 tests/e2e/**；ESLint 排除 tests/e2e/；两套测试体系无重叠执行
9. **E2E 断言质量**: 9 场景断言真实（DOM 元素选择器 + 可见性 + 交互后状态变化）——**警惕断言空洞**（F005 N1 先例：只 goto 不断言、伪等待、断言常量）；P1-P3 验证 SSE 接线后的 PipelinePage（F007 已闭环）
10. **.gitignore**: playwright-report/ 与 test-results/ 已排除；无遗漏产物目录
11. **verify.sh 独立复跑**: 15/15 PASS（第 15 项走 skip+WARN 为 P009 预期）+ uv.lock 零漂移 + 覆盖率 ≥80% 基线不变；**若你的环境浏览器可用，尝试真实执行 E2E 并记录结果**（skip 路径与执行路径至少验证其一）
12. **文档同步真实性**: testing.md E2E 段（15 行增量）与实现一致；AGENTS.md 3 行增量仅技术栈段无越权改动

## 歧义/自报核实

coder 报告"无自报歧义，4 项裁决全部机械执行"。如你在独立验证中发现 Spec 口径歧义、实现与设计偏差或自报与事实不符，列入裁定清单（可接受/需修复 + 理由），不默许。已知需重点核实项：coder 自报"#15 skip 原因=预装 chromium headless shell 版本不匹配"——验证该说法与检测代码逻辑一致。

## 输出要求

1. journal 71: `harness-journal/stage-04-coding/71-f012-test-review.md`（编号预留，禁占他用）
2. progress.txt 追加 1 行（[YYYY-MM-DDTHH:MMZ] 格式）
3. harness-journal/README.md 索引同步
4. 提交恰 3 文件（journal 71 + progress + README），P011 防护（git status --short + git diff --cached --stat 双向核对）
5. 结论格式: 12 项逐条 PASS/FAIL + 歧义裁定 + M/N 分级（M=必须修复，N=建议改进）+ 总结论

## 环境与防护

- 冷启动必读: AGENTS.md → progress.txt → feature_list.json → docs/plans/current-sprint.md → harness-journal/README.md 最近 3 条 → journal 69（裁决口径）
- P009: 先查 .venv 完好性与 uv 存在性；uv 缺失则 pip 装 uv（aliyun 镜像）；.venv 损坏才重建（UV_DEFAULT_INDEX 指镜像 + UV_FROZEN=1，journal 39 §9）；.venv 与 uv 均可被会话中途清除，verify.sh FAIL 先查环境再定性
- P010: 全程 UV_FROZEN=1，uv.lock 零漂移
- P011: 提交前双向核对，40 秒复查无平台自动提交混入（已有 11 例均 Coze-Commit-Type: user 零差异）
- 禁改: .coze / 设计文档 / journal 69/70 / controller-specs / launch-prompts / tests/e2e/**（审查只读不改代码）
