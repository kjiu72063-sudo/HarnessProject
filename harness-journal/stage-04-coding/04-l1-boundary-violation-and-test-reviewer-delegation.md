# Journal: L1 越界事故纠正（K总）+ 教训固化 + test-reviewer 校验委派

**时间**: 2026-08-19T07:26Z
**阶段**: stage-04-coding
**类型**: K总 决策记录 + L1 复盘 + 委派
**触发**: K总 纠正——"你违背了你的能力边界！管控者不做测验，只做任务管理与流程规划，需要重开一个校验 agent 进行校验"

## 事故经过

F002 首轮验收（journal 03）中，L1 的行为分两段：

**属流程验收范围（保留有效）**：
- 复跑 verify.sh 记录 10 passed / 4 failed
- 检查产出文件存在性、journal/progress 写入、改动范围、单文件行数
- 验收清单第 4 项（verify.sh 14 项全通过）不成立的**流程事实**

**越界为内容测验（本次纠正对象）**：
- 用系统 python3 深度复跑 pytest 复现失败清单（9 failed + 8 errors）
- 安装 import-linter / uv、尝试重建 .venv 复现环境
- 根因判定（"langgraph 1.2.x API 与 >=0.2.50 声明不匹配"）
- 缺陷定级（致命/轻微）
- 修复方向裁定（方案 A/B），并据此产出修订 R1 Controller Spec + 启动提示词

以上为内容质量判定，是 L3 校验 Agent 的职责。L1 抢了校验的活——形式上是"验收取证"，本质是 L1 重新变成"自己审自己"的单体 Agent 反模式（教训 #5 的变种：不调 skill 但自己跑测试判定质量）。

## K总 决策

1. L1 违背能力边界，管控者不做测验，只做任务管理与流程规划
2. 重开校验 Agent 对 F002 产出做校验
3. 教训必须持久化，保证下一次任务、下一个管控者不再犯

## 处理决定

1. **journal 03 部分作废**：验收表（流程事实，verify.sh 复跑 10/14）保留；「缺陷证据链」「处理决定」段的内容判定与修订委派作废，以本 journal 为准。历史文件不改写，以本条声明为准。
2. **修订 R1 委派产物作废**（文件头已加作废标记，保留审计痕迹）：
   - docs/handbook/controller-specs/f002-coder-revision-r1.md
   - docs/handbook/launch-prompts/f002-coding-revision-r1-launch.md
   - 原 04 号 journal 预留（coder 修订自写）一并释放
3. **委派 L3 test-reviewer 独立校验** F002 首轮产出（commit e1ba981）。L1 复跑时的观察仅作为"现象线索"转交（明确标注非结论），必须由 test-reviewer 独立验证后自行判定。
4. **教训持久化**（保证下一个管控者冷启动即见）：
   - AGENTS.md「L1职责边界」段补充边界细则
   - AGENTS.md「当前阶段与下一步」更新事故与流程状态
   - progress.txt 追加记录
   - 本 journal（冷启动必读最近 3-5 条范围内）

## 边界细则（固化为规则）

L1 流程验收允许：
- 复跑 verify.sh / 跑测试命令，**只记录 PASS/FAIL 与原始输出摘要**
- 检查产出存在、journal/progress 写入、禁止清单遵守、行数等机械项

L1 禁止（内容测验，一律委派 L3 校验 Agent）：
- 深度复现缺陷、搭建/重建复现环境
- 根因分析、缺陷定级（致命/轻微）
- 修复方向裁定与修订方案设计
- 以"取证""验收需要"为由的任何上述行为

L1 发现 verify.sh 失败时的正确动作：记录流程事实（哪几项失败）→ 流程验收不通过 → 委派 L3 校验 Agent 独立校验 → 基于 L3 校验结论产出修订 Controller Spec。

## journal 编号分配

- 04 = 本 journal（L1 物理创建）
- 05 = test-reviewer 校验自写 journal（预留）

## 委派产物

- docs/handbook/controller-specs/f002-test-review.md
- docs/handbook/launch-prompts/f002-test-review-launch.md
