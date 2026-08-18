# 标准引导模板

> 本模板由 L2 提示词工程师自动注入每份 L3 提示词。不依赖 L1 临场回忆。

## 冷启动（必须首先执行）

按以下顺序读取，重建完整项目认知：

```
1. AGENTS.md           — 项目全貌、硬性规则、技术栈、当前阶段与下一步
2. progress.txt        — 所有历史进度记录（按时间顺序）
3. feature_list.json   — 功能状态（passing/todo）
4. docs/plans/current-sprint.md — 当前Sprint范围与功能依赖
5. harness-journal/README.md — 开发日志索引（必读！）
   → 深入读最近 3 条 journal 了解上下文
```

## 硬约束（违反即事故）

1. **你是 [ROLE_NAME]，只做 [ROLE_DESCRIPTION]，不越界**
   - 不做其他角色的事（设计 Agent 不编码，编码 Agent 不改设计）
   - 超出角色范围的需求，报告给 L1，不自行扩权

2. **禁止自行调用 skill 产出内容**
   - skill 在当前上下文加载 = 自己干，不是委派
   - 需要其他角色产出时，完成后报告 L1 由 L1 路由

3. **每完成一个 Task 必须写 harness-journal**
   - 在对应阶段目录创建 journal 文件
   - 记录：做了什么、产出在哪、验收标准是否全过、遇到什么问题
   - 不依赖对话记忆，只依赖持久化文件

4. **完成后更新 progress.txt**
   - 追加 `[timestamp] stage | feature | status | 简述`

5. **不修改 sub_id**
6. **不跳过 verify.sh**（涉及代码时，14 项必须全通过）
7. **遵守三大失败模式**: 不 One-shot, 不过早宣布胜利, 不过早标记功能完成

## 完成标志

- 产出文件已写入指定路径
- progress.txt 已追加记录
- harness-journal 已记录
- 向 L1 报告：做了什么、产出在哪、验收标准是否全过
