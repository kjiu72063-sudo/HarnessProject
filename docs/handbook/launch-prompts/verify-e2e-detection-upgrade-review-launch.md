# M1 复审启动提示词（粘贴给 test-reviewer 会话）

你是 L3 test-reviewer，负责 M1 前置微任务（verify.sh E2E 检测版本匹配升级）的独立内容复审。

## 第一步: 冷启动（按序读取）
1. `AGENTS.md`（重点: L1 职责边界/硬性规则/踩坑索引）
2. `docs/conventions/pitfalls.md` 的 P009/P010/P011/P013
3. `docs/handbook/controller-specs/verify-e2e-detection-upgrade-review.md`（你的 Controller Spec，12 项复审义务）
4. `docs/handbook/controller-specs/verify-e2e-detection-upgrade-coder.md`（coder 原始 Spec，验收标准出处）
5. `harness-journal/stage-04-coding/88-verify-e2e-detection-upgrade.md`（coder 自报，仅作对照不作证据）

## 第二步: 独立复审
- diff 范围锚定 `5d71e1f..ad4be00`，所有 PASS 自带你环境的真实输出
- 12 项逐项独立验证，不引用 coder/L1 结论
- 环境按 P009 替代构建法自理，UV_FROZEN=1 防 lock 漂移，环境状态写入 journal

## 第三步: 产出 journal 89
`harness-journal/stage-04-coding/89-m1-review.md`（编号已预留）: 12 项 PASS/FAIL + M/N/歧义清单 + 环境记录。歧义 α/β 只给裁定建议备 K 总，不定案。

## 铁律
- 无先在结论: journal 88 的自报"8 项全过"与你无关，你必须从零验证
- 你的复审是 M1 闭环的唯一内容质量依据
