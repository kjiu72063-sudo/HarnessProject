# 阶段4 — 编码实现

> 状态：⬜ 待执行

## 前置条件
- 阶段3 设计审批通过
- 需求已分发到前端/后端

## 计划步骤

### 01 - 编码 Agent 会话启动
对应 Anthropic 两阶段模型的编码 Agent：
1. 运行 pwd 确认工作目录
2. 读取 git log + progress.txt
3. 读取 feature_list.json
4. 选择最高优先级未完成功能
5. 执行 init.sh 启动开发服务器
6. 运行基础端到端测试确认环境正常

### 02 - 约束层接入（上游背压）
- AGENTS.md 硬性规则注入
- 规则文档加载
- boundaries.md 分层边界约束
- 技术栈版本约束

### 03 - Git Worktree 隔离开发
- 前端/后端各创建独立 worktree 分支
- 互不干扰并行开发
- 状态隔离，失败可回退

### 04 - 写代码
- 前端：页面/组件
- 后端：API/逻辑
- + 对应单元测试

### 05 - mvn verify 全闸门（下游背压）
- 编译检查
- ArchUnit 分层依赖检查
- Checkstyle 编码规范
- SpotBugs 静态分析
- JaCoCo 覆盖率 ≥ 80%
- 单元测试

## 对应 feature_list.json
按优先级顺序开发 F002 → F003 → F004 → ...

## 产出物
- 源代码（src/ + server/）
- 单元测试
- Git 提交记录

## 验证结果
（开发时补充）
