last_updated: 2026-08-18
status: active
owner: @K总

# Harness 8 阶段流程（阶段 0-7）

## 阶段0: 初始化 Agent (Initializer)
建立项目环境: init.sh + progress.txt + feature_list.json + Git 初始提交

## 阶段1: 需求与架构规划 (Information Layer)
- 需求完善 → 需求文档
- 架构分析 → 架构文档 → 并行产出: 知识库框架/硬性规则/提交规范
- 页面规划 → 原型图开发 → 原型确认(菱形)
- AGENTS.md 按需检索: Tier1 常驻 → Tier2 按需 → Tier3 持久化

## 阶段2: 功能拆分与设计
- 功能拆分 → 功能开发文档
- 前端/后端功能列表 → 文档设计 → 设计文档审批(菱形)

## 阶段3: 编码 Agent 启动 (Anthropic 两阶段模型)
- 读取 git log + progress.txt
- 读取 feature_list.json → 选定功能
- 执行 init.sh → 基础端到端测试

## 阶段4: 编码实现 (约束层接入)
- 上游背压: AGENTS.md + 规则文档 + boundaries.md → 约束注入
- Git Worktree 隔离开发
- 写代码 → mvn verify 全闸门

## 阶段5: 自校验与反馈循环
- 测试结果?(菱形) → 通过/失败
- 失败 → 问题分类(老/新) → 查询文档/尝试解决 → 解决成功?(菱形)
- 文档反馈循环: 更新 AGENTS.md + Linter 规则 + progress.txt
- 虚线回路回到写代码

## 阶段6: 合并与部署
- 审查通过?(菱形) → 代码合并 → CI/CD → 部署

## 阶段7: 可观测性验证
- Agent 查看日志/指标 → 验收通过?(菱形)
- DRR 长循环: 失败 → 修正环境 → 回到写代码

## 横切: 熵管理（事件驱动，非线性阶段）
- mvn verify 通过后 → 后台清理 Agent
- 文档反馈后 → Doc-Gardening Agent
- 功能完成后 → 质量基线更新
