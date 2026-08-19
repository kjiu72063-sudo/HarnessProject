# Journal 38 — F004 设计审批通过（HITL 闸门）与三条开放问题裁决落地

- 日期: 2026-08-20（沙箱时钟 2026-08-19T19:04Z）
- 记录者: L1 管控 Agent（本记录为流程与裁决事实记录，不构成内容测验）
- 关联: journal 36（设计产出）/ journal 37（L1 流程验收 + 开放问题转呈）

## 一、设计审批裁决

K总于 2026-08-20 对 `docs/design/feature-f004-constraint-management.md`（282 行）作出裁决：**Approve**（设计审批 HITL 闸门通过）。

裁决前 K总征询 L1 对三条开放问题的意见，L1 以"建议 + 权衡"形式作答（未做内容测验，属授权咨询）；K总裁决"按照你说的来"，三条建议全部采纳为裁决。

## 二、三条开放问题裁决（正式口径）

| # | 问题 | 裁决 | 落地方式 |
|---|---|---|---|
| ① | api-spec.md 细化口径是否回写 | **不在设计阶段回写，绑定为 F004 coder 显式验收标准**（实现 + Pydantic schema + api-spec.md 回写同一提交落地，原子性防漂移窗口） | 写入 F004 coder ControllerSpec 验收标准第 10 项 |
| ② | 规则更新建议产品化是否排期 | **F004 范围维持 feedback_log + journal 止；可视化登记 feature_list.json backlog（F015），不进 Sprint2**，触发条件为 F004 运行后人工裁决工作流成为瓶颈 | feature_list.json 新增 F015 条目（priority=9, status=backlog, dependencies=[F004]） |
| ③ | agents_md 条目 enabled=false 运行时效力 | **采纳现设计（仅影响阶段 4 注入，不影响 verify.sh 实际执行）；「禁用即跳过闸门」方向性拒绝，不进 backlog**（防绕过闸门通道，与"AGENTS.md 权威文档 + verify.sh 唯一执行器"双裁决冲突） | 语义写入 F004 coder ControllerSpec 验收标准第 11 项（convention-to-rule-mapping.md 同步） |

裁决理由完整记录于 L1 呈报原文（对话存档），核心依据：①原子性提交是最强一致性保证，Sprint1 跨文档同步批次 (a) 的漂移债教训；②建议产生量当前 unknowable，预支排期违背"先走通第一版再迭代"方针，但闭环本身无缺口；③运行时开关跳闸门会使数据库状态权力高于人类权威文档，与设计自身两条已定裁决矛盾，且规则过时的正确路径（人工裁决修订 AGENTS.md）已存在。

## 三、裁决落地动作

1. 设计文档 Status: Draft → **Approved**，头部附三条裁决注记（docs/design/feature-f004-constraint-management.md）
2. feature_list.json：F004 status todo → **approved**（description 附审批信息）；新增 **F015 约束建议裁决可视化**（backlog）
3. 本 journal（38）记录裁决事实

## 四、F004 coder 委派（三件套产出）

- Controller Spec: `docs/handbook/controller-specs/f004-coder.md`
- 启动提示词: `docs/handbook/launch-prompts/f004-coder-launch.md`
- journal 预留：**39 = coder 执行记录（coder 自写）**，**40 = test-reviewer 审查记录（预留）**
- 设计文档（已 Approved）+ Controller Spec 为 coder 唯一输入权威；L1 无先在内容结论，coder 全部按设计文档与 Spec 执行
- 微任务豁免规则不适用（F004 为正式 feature，test-reviewer 审查为必经环节）

## 五、状态推进汇总

| 对象 | 变更 |
|---|---|
| docs/design/feature-f004-constraint-management.md | Draft → Approved（+裁决注记） |
| feature_list.json F004 | todo → approved |
| feature_list.json F015 | 新增（backlog） |
| AGENTS.md | 下一步指向 coder 派生 |
| progress.txt | 追加 design-approved 行 |

## 六、下一步

1. K总开新会话，粘贴 `docs/handbook/launch-prompts/f004-coder-launch.md` 全文派生 F004 coder
2. coder 报告回来后 L1 流程验收（仅四类行）→ 委派 test-reviewer（journal 40 预留）
