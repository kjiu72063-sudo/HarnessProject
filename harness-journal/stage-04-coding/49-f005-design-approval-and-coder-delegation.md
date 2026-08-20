# Journal 49 — F005 设计审批通过（HITL 闸门）与 6 项裁决全部采纳落地 + coder 委派

- 日期: 2026-08-20（沙箱时钟见 progress.txt 时间戳）
- 记录者: L1 管控 Agent（本记录为流程与裁决事实记录，不构成内容测验）
- 关联: journal 47（设计产出）/ journal 48（L1 流程验收 + 6 项待裁决转呈）

## 一、设计审批裁决

K总于 2026-08-20 对 `docs/design/feature-f005-execution-sandbox.md`（250 行）作出裁决：**Approve**（设计审批 HITL 闸门通过）。

裁决方式：K总裁决"按 design-writer 建议全部采纳"——4 项开放问题与 2 项自报歧义一次性收口，均以设计文档内 design-writer 附带建议为正式口径。

## 二、6 项裁决正式口径

| # | 问题 | 裁决（=design-writer 建议） | 落地方式 |
|---|---|---|---|
| 开放① | 跨语言产物支持范围 | **首版不含 Java/mvn，排期 F010 协同交付**；白名单预留 mvn 匹配位但不启用 | 设计注记 + F005 coder Spec 验收标准 2 + feature_list.json F005 描述修正（原描述含 "mvn verify"） |
| 开放② | 沙箱镜像策略 | **方案 B（按 TechStackSpec 动态选择）**，映射表内置 2 条（python:3.12-slim / node:20-slim），对齐 F003 Provider 注册先例 | 设计注记 + F005 coder Spec 验收标准 6 |
| 开放③ | 并发执行上限 | **首版不限**（单会话场景），并发控制留 F009；单实例隔离由 Docker 资源限制提供 | 设计注记 + F005 coder Spec 验收标准 12（不引入并发信号量） |
| 开放④ | Artifact 检索 | **首版不支持**，沙箱仅执行验证命令；后续可增 artifact_paths 字段 | 设计注记 + F005 coder Spec 验收标准 12（不引入 artifact_paths） |
| 歧义α | TechStackSpec.build_test_commands() 归属 | **F005 编码阶段补入，默认实现返回空列表；F002 既有定义零改动** | 设计注记 + F005 coder Spec 验收标准 5 |
| 歧义β | npm 白名单双重出现 | **有意设计保留**（平台栈用 pnpm）：npm 命中危险模式即拒绝，与白名单其他条目不冲突 | 设计注记（无编码动作，白名单按设计原文实现） |

## 三、裁决落地动作

1. 设计文档 Status: Draft → **Approved**，头部附 6 项裁决注记（docs/design/feature-f005-execution-sandbox.md）
2. feature_list.json：F005 status todo → **approved**（description 附审批信息并按裁决①修正 "mvn verify" 表述）
3. 本 journal（49）记录裁决事实

## 四、journal 编号调整说明

原 AGENTS.md 下一步段预留 "journal 49 = F005 coder 执行记录"。本批次（审批+裁决+委派）需要 L1 记录，参照 journal 42 编号调整先例：**49 = 本记录（L1 审批落地+委派）**，**50 = coder 执行记录（coder 自写）**，**51 = test-reviewer 审查记录（预留）**。已在 Controller Spec 与启动提示词中同步。

## 五、F005 coder 委派（三件套产出）

- Controller Spec: `docs/handbook/controller-specs/f005-coder.md`（验收标准 12 项，含裁决①②③④歧义α共 5 项绑定）
- 启动提示词: `docs/handbook/launch-prompts/f005-coder-launch.md`
- journal 预留：50 = coder，51 = test-reviewer（禁占）
- 设计文档（已 Approved）+ Controller Spec 为 coder 唯一输入权威；L1 无先在内容结论
- 环境预提醒（写入 Spec 约束第 7 条）：沙箱环境 Docker daemon 可能不可用（P009 同源环境漂移），测试不得依赖真实 Docker——DockerExecutor 用 mock client（设计测试策略既定），Tier 2/3 降级路径正是为此设计

## 六、状态推进汇总

| 对象 | 变更 |
|---|---|
| docs/design/feature-f005-execution-sandbox.md | Draft → Approved（+6 项裁决注记） |
| feature_list.json F005 | todo → approved（描述修正） |
| AGENTS.md | 下一步指向 coder 派生（journal 50/51 口径） |
| progress.txt | 追加 design-approved + 委派行 |

## 七、下一步

1. K总开新会话，粘贴 `docs/handbook/launch-prompts/f005-coder-launch.md` 全文派生 F005 coder
2. coder 报告回来后 L1 流程验收（仅四类行）→ 委派 test-reviewer（journal 51 预留）
