# Journal 35: 功能编号映射裁决落地 + Sprint2 委派循环启动

- 日期: 2026-08-19T18:37Z (沙箱时钟; 项目日历 2026-08-20)
- 作者: L1 项目管控 Agent
- 类型: 流程裁决执行 + 迭代状态推进
- 关联: journal 34 §6, AGENTS.md「当前阶段与下一步」, feature_list.json, docs/plans/current-sprint.md

## 一、裁决背景

journal 34 §6 呈报功能编号映射不一致：feature_list.json/current-sprint.md 与 AGENTS.md/journal 28/委派链口径在 F012/F013/F014 三编号上互换错位（详见 journal 32 §5 首次发现）。L1 建议以委派链口径为准修正两个活文档。**K总 2026-08-20 确认**（消息原文："确认"），裁决生效。

## 二、执行明细（仅两个活文档，journal 不可变不回改）

| 条目 | 修正前（feature_list.json 错位口径） | 修正后（委派链口径，最终） |
|---|---|---|
| Settings 死配置清理 | F012 | **F014**（passing） |
| Playwright DOM级端到端测试 | F013 | **F012**（todo） |
| API 会话列表端点 | F014 | **F013**（todo） |

- feature_list.json：三条目 id 互换，其余字段（name/priority/status/description/dependencies）原样保留；Settings 条目 description 中"编号映射待K总裁决"更新为"已裁决(2026-08-20 K总确认以委派链口径为准, journal 35)"
- current-sprint.md：Sprint1 勾选行 F012→F014（附注简化为闭环链）；Sprint2 两行 F013→F012、F014→F013；status: sprint1-closed→sprint2-active（K总确认进入委派循环的状态推进）
- F004/F005/F007/F008-F010 编号无争议，未动

## 三、口径收束声明

自本 journal 起，**功能编号以 feature_list.json 修正后口径为准**（与 AGENTS.md/委派链一致）。历史 journal（28/32/34）中的错位表述为不可变历史记录，不回改，以本 journal 为更正锚点（沿用 journal 28(f) 立更正段先例）。后续所有委派链、Controller Spec、启动提示词统一使用最终口径：F012=Playwright / F013=API会话列表端点 / F014=Settings死配置清理。

## 四、Sprint2 委派循环启动依据

- K总同消息确认 Sprint2 排序（current-sprint.md）：F004 约束管理层 → F005 代码执行沙箱 → F007 SSE 实时状态推送 → F012 Playwright → F013 API会话列表端点
- **流程事实**：F004/F005/F007/F012/F013 均无设计文档（docs/design/ 现有 F002/F003/F006/F011 四份，均 Sprint1 已 Approved）。Sprint1 先例为「设计文档 → K总 Approve → 编码委派」（设计审批 HITL 闸门，AGENTS.md）
- 因此 Sprint2 首个委派对象为 **F004 设计 Agent**（产出 docs/design/feature-f004-constraint-layer.md），设计经 K总 approve 后再委派 coder。L1 将产出设计阶段 ControllerSpec + 启动提示词（下一动作，单独批次提交）

## 五、journal 预留

- 36: F004 设计 Agent 产出记录（预留）
- 37: F004 设计审查记录（预留，按需）
- 编码阶段 journal 按设计闭环后另行预留

## 六、本批次变更清单

- feature_list.json（id 互换 ×3 + Settings description 更新）
- docs/plans/current-sprint.md（编号互换 ×3 + last_updated + status）
- 本 journal + progress.txt 追加 + harness-journal/README.md 索引 + AGENTS.md「当前阶段与下一步」更新

## 七、验证

- feature_list.json 互换后 `json.loads` 解析通过（结构合法）
- 本批次为纯文档状态变更，无代码改动，不触发 verify.sh（前一批次 41299e3 复跑 14/14 PASS 基线仍有效）
