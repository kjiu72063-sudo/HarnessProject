last_updated: 2026-08-17
status: active
owner: @K总

# 环境审查

PDF 原文: "过度依赖 Agent，忘了'审查环境'" 是常见踩坑之一。

## 频率

每周一次，30 分钟。

## 检查清单

1. **CI 失败率是否上升**：最近一周 verify.sh 的通过率是否下降，失败原因集中在哪些规则上
2. **约束规则是否覆盖新 bad pattern**：Code Review 中是否发现了 Linter 未拦截的问题，如果是，按 `docs/conventions/convention-to-rule-mapping.md` 流程新增规则
3. **AGENTS.md 和 docs/ 是否与代码库一致**：技术栈版本、目录结构、硬性规则是否反映当前实际状态
4. **是否有人试图升级技术栈主版本**：React 19→20、Python 12→13、Vite 7→8 等，技术栈基线是否被违反
5. **技术栈基线与实际安装版本交叉验证** [P008]：逐项比对 AGENTS.md 声明版本与 `package.json`/`pyproject.toml` 实际安装版本是否一致，不一致立即修正
6. **规则→执行闭合校验**：遍历 AGENTS.md 每条硬性规则，确认 `convention-to-rule-mapping.md` 有对应行，且「实现方式」真实存在于代码库。任何 ⬜ 行必须标注功能 ID 和原因

## 执行方式

人工执行，检查结果记录在 `progress.txt` 中，格式：
```
[timestamp] audit | env-review | done | 环境审查: 通过/问题描述
```

如果发现需要修复的问题，按正常开发流程修复后通过 verify.sh 验证。

## 每月规则回顾

PDF 原文: "每月回顾并更新 ArchUnit / Checkstyle 规则"。

每月一次（建议每月第一周），在每周环境审查基础上额外执行：

1. **回顾上月新增规则**：新增的 Linter 规则是否有效拦截了目标问题，是否有误报
2. **检查规则冲突**：是否有规则互相冲突或产生死循环（PDF 踩坑指南: "Agent 修了一个错误又触发另一个"）
3. **评估新 bad pattern**：是否有新的需要新增规则的问题（按 `convention-to-rule-mapping.md` 流程）
4. **更新对照表**：确认 `convention-to-rule-mapping.md` 所有规则状态正确，无遗漏

执行结果记录在 `progress.txt` 中，格式：
```
[timestamp] audit | monthly-rule-review | done | 月度规则回顾: 通过/问题描述
```
