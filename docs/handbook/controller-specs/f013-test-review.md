# F013 test-reviewer 审查 ControllerSpec（L3 独立测试审查）

> 委派链: K总 → L1(journal 84) → test-reviewer(journal 83)
> 审查对象: F013 编码产出 commit cd9343b（17 产出文件 +388/-180, 含 journal 82 + progress 共 19 文件）
> 设计依据: docs/design/feature-f013-session-list-api.md（Approved, journal 81 五项裁决）
> 编码 Spec: docs/handbook/controller-specs/f013-coder.md

## 角色与边界

你是 L3 独立测试审查者。对 12 项标准**独立验证**（不采信 coder journal 82 自报），产出 journal 83。
黑名单: 不得把 coder 自报当已核实; 所有 PASS 须有独立证据锚点（文件:行 / 命令输出 / git diff）。

## 12 项审查标准

1. **裁决① stub 删除完整性**: agent_sessions.py 已删; main.py 注册与 import 清除零残留; test_api.py 引用替换; 全仓 grep agent-sessions 零命中（api-spec.md 历史注记除外——设计 §3 已说明更新方案, 编码是否同步更新该注记须核实并如实报告）
2. **裁决② localStorage 完全移除**: recentSessions.ts/.test.ts 已删; RequirementPage 0 处 addRecentSession; App 0 处 getRecentSessions; 全仓 src/ grep localStorage 与会话相关逻辑零残留
3. **裁决③ 首版无分页**: GET /api/harness/sessions 无 limit/offset/cursor 参数; 前端 slice(0,6) 客户端截取
4. **裁决④ _session_meta 增量**: SessionMeta 含 requirement+started_at; start_harness 写入; 空会话/缺失 meta 容错行为核验
5. **裁决⑤ 方案 A 证据**: harness.py 中 start/status/stream/resume 四端点函数体 diff=0——独立 git diff 验证（对照 3c7a256..cd9343b 中 harness.py 变更仅限 _session_meta 相关新增与 sessions 端点新增, 不触碰四端点逻辑）
6. **Pydantic + TS 镜像**: SessionListItem/SessionListResponse 字段逐一对齐（6 字段: session_id/status/project_id/current_stage/requirement_summary/started_at）
7. **倒序排序**: sorted by started_at desc 真实性——多会话场景测试断言顺序非偶然
8. **前端消费**: fetchSessions 接线; RequirementPage 最近会话区域渲染来自 API; 加载/空态/失败态处理
9. **E2E R3 修正真实性**: API intercept 替换 localStorage 断言; requirement.spec.ts 3 用例真实执行结果
10. **后端测试质量**: test_harness_list.py 5 场景断言非空洞（警惕 F005 N1 断言空洞先例——逐用例检查断言是否验证行为而非仅无异常）
11. **api-spec.md 回写**: GET /api/harness/sessions 条目与实现一致; 死端点 agent-sessions 条目处置与设计 §3 口径一致
12. **verify.sh 独立复跑**: 15/15 PASS; uv.lock 零漂移; E2E 真实执行非 skip（浏览器版本匹配——P009 journal 80 新形态: 若 #15 走 skip 须核实是检测逻辑版本匹配问题还是环境真缺浏览器, 如实区分报告）

## 重点提示（历史教训输入）

- **断言空洞警惕**（F005 N1 / F012 M2 先例）: 标准 10 逐用例核断言实质
- **自报核实**（F012 β 教训）: journal 82 所有 ✅ 逐一对得上; "4 端点 diff=0"必须独立 git diff 复证
- **flaky 区分**: L1 验收时首轮 14/15 一次 E2E flaky 复跑消失（F012 N1 已知时序竞争）; 你若复现须区分 flaky 与稳定失败并如实报告
- **文档口径**: 设计文档 217 行的 api-spec 回写要求与实现是否完全一致

## 产出要求

- harness-journal/stage-04-coding/83-f013-test-review.md（编号 83 已预留禁占他号）
- progress.txt 追加一行: [YYYY-MM-DDTHH:MMZ] stage-04 | F013 | test-review-done | ...
- README.md journal 索引登记 83
- M/N 分级: M=必须修复(阻塞passing), N=建议改进(留统筹池)
- 歧义裁定: Spec 口径歧义由你独立裁定并给理由; 无法裁定的列"待K总"转呈
- 提交恰 3 文件（journal 83 + progress + README）, P011 防护: git status --short + git diff --cached --stat 双向核对
- 环境受限时（P009）: 先查 pitfalls.md P009 与 journal 39 §9 替代构建法; uv 二进制单独缺失时仅重装 uv; 浏览器版本漂移按 journal 80 §三处置
