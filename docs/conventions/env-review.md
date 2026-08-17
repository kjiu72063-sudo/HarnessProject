last_updated: 2026-08-17
status: active

# 环境审查

PDF 原文: "过度依赖 Agent，忘了'审查环境'" 是常见踩坑之一。

## 频率

每周一次，30 分钟。

## 检查清单

1. **CI 失败率是否上升**：最近一周 verify.sh 的通过率是否下降，失败原因集中在哪些规则上
2. **约束规则是否覆盖新 bad pattern**：Code Review 中是否发现了 Linter 未拦截的问题，如果是，按 `docs/conventions/convention-to-rule-mapping.md` 流程新增规则
3. **AGENTS.md 和 docs/ 是否与代码库一致**：技术栈版本、目录结构、硬性规则是否反映当前实际状态
4. **是否有人试图升级技术栈主版本**：React 19→20、Python 12→13、Vite 7→8 等，技术栈基线是否被违反

## 执行方式

人工执行，检查结果记录在 `progress.txt` 中，格式：
```
[timestamp] audit | env-review | done | 环境审查: 通过/问题描述
```

如果发现需要修复的问题，按正常开发流程修复后通过 verify.sh 验证。
