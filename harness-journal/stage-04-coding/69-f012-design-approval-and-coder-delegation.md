# journal 69 — F012 设计审批落地 + coder 委派

- 日期: 2026-08-20（本会话沙箱时钟 2026-08-21T00:35Z 附近, 沿用主线日期口径）
- 角色: L1 项目管控
- 前序: journal 68（设计Draft L1流程验收通过, 4 开放问题转呈）

## 一、K总裁决（2026-08-20, "按 design-writer 建议全部采纳"）

| # | 开放问题 | 裁决 |
|---|---|---|
| ① | verify.sh 集成形态 | **方案 C 条件第 15 项**（浏览器可用→执行, 不可用→skip+WARN 非 FAIL） |
| ② | 浏览器范围 | **仅 Chromium** |
| ③ | 真实后端 vs route mock | **真实后端**（webServer 双栈拉起, API 闭环） |
| ④ | Playwright 纳入技术栈基线 | **纳入**（编码阶段同步 AGENTS.md, 版本与 package.json 一致） |

coder 自报歧义: 无。

## 二、本批次落地动作

1. 设计文档 `docs/design/feature-f012-playwright-e2e.md`: Status Draft → **Approved**, 头部插入裁决注记（4 项, 标注 journal 69）
2. `feature_list.json`: F012 status todo → **approved**, description 更新（设计 Approved + 4 裁决）
3. coder 委派三件套产出:
   - Controller Spec: `docs/handbook/controller-specs/f012-coder.md`（12 项验收标准, 裁决①②③④绑定为标准 4-7; 网络受限 P009 三级方案入硬性约束）
   - launch prompt: `docs/handbook/launch-prompts/f012-coder-launch.md`
   - journal 编号分配: **70 = coder / 71 = test-reviewer**（预留禁占）
4. 状态同步: AGENTS.md 下一步段 / progress.txt / harness-journal/README.md 索引

## 三、coder Spec 要点（转 coder）

- 12 项标准: 依赖接入 ^1.49.0 / config 六字段 / 4页面9场景 / 仅Chromium / 真实后端 webServer / verify.sh 方案C条件第15项 / AGENTS.md 技术栈基线更新（P008 交叉验证）/ pnpm script / 跨文档同步（testing.md + convention-mapping, api-spec 只消费零变动）/ E2E 实际可跑证据 / verify.sh 独立复跑 / lint+cruiser 对新目录不报错
- 预期 P 编号: P009（浏览器下载降级）/ P010 / P011
- 硬性约束: 禁改清单含 .coze / 设计文档 / journal 68/69/71 / Spec与prompt

## 四、验证

本批次纯文档配置（零代码零测试运行）, verify.sh 于验收批次复跑。

## 五、下一步

K总派生 F012 coder: 粘贴 `docs/handbook/launch-prompts/f012-coder-launch.md` 全文到新会话。报告回来后 L1 流程验收（四类行）→ 委派 test-reviewer（journal 71 预留）。
