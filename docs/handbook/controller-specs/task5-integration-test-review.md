# Controller Spec: Task5 集成验证 test-reviewer 审查

## 任务
对 Task5 集成验证产出（journal 23 报告，基线代码 00eed47）做独立测试审查，核实报告结论的真实性与可复现性。

## 角色
test-reviewer（docs/handbook/prompts/test-reviewer.md）

## 审查对象
- 报告: harness-journal/stage-04-coding/23-task5-integration.md（commit 156f966）
- 代码基线: 00eed47（Task5 声明零代码变更，审查须核实此声明）
- 对照 Controller Spec: docs/handbook/controller-specs/task5-integration-coder.md（8 验收标准）

## 审查重点（6 项）
1. **端到端主路径可复现性**（核心）: 你自己启动双栈（后端 .venv/bin/python -m uvicorn server.main:app --host 0.0.0.0 --port 8000；前端 pnpm dev 端口 5000，或按 dev.sh 等效），实测 start → state 轮询 → 三闸门依次 resume → status=completed、verify_result.pass=true 全链路。报告中的 session 数据不可引用，须你自己的实测输出。
2. **API 契约一致性抽查**: coder 报告 294 字段级断言，你至少抽样 5 组（start 响应字段、state 快照 24 字段名、resume 请求体 kebab-case、404/409 错误路径 detail 格式、SSE 事件类型）独立复测。
3. **验证边界评估**（建议级）: coder 如实声明"无浏览器交互能力，DOM 级交互验证未做"。评估该边界是否构成验收缺口，给事实描述与建议，是否补验的裁决属 L1/K总，不计入 coder 缺陷。
4. **零代码变更核实**: git diff 00eed47 HEAD -- src/ server/ package.json pnpm-lock.yaml uv.lock pyproject.toml 须为空。
5. **verify.sh 复跑**: UV_FROZEN=1 前置，14/14 全 PASS，uv.lock 零漂移。
6. **报告质量**: journal 23 的验证环境表、逐标准证据、问题清单、结论四要素是否齐全且与你的实测一致。

## 输出
- journal: harness-journal/stage-04-coding/24-task5-integration-review.md
- progress.txt 追加一行
- harness-journal/README.md 索引更新（24 落位）
- 结论四要素: 通过 / 需改进后重审 + 问题清单（分级: 必须修复/建议改进/信息）+ 独立验证证据 + 逐项核实矩阵

## 验收标准
- 上述 6 项审查重点逐项给出独立验证证据（不引用 coder/L1 自报）
- 端到端主路径为你本会话实测，含完整命令与输出摘要
- 问题清单有明确分级；结论清晰可执行

## 禁止
- 不得修改任何被审代码/文档（src/ server/ journal 23/ uv.lock/ pyproject.toml）
- 不得调用 skill 产出内容
- 不得跳过 journal 24 记录
- 不得修改 sub_id / AGENTS.md 硬性规则 / verify.sh / .coze
- 不得占用编号 25

## 环境提示（L1 沉淀）
- P009: 本沙箱 uv 直连受限，用 UV_DEFAULT_INDEX=https://mirrors.aliyun.com/pypi/simple/ + uv export --frozen + uv pip install 重建 lock 等价 .venv（若工作区 .venv 可用则直接复用）
- P010: 一切 uv 命令前置 UV_FROZEN=1，防 lock 重写；收尾时 git diff uv.lock 须为零
- P011: 平台 hookspath 自动 stage，提交前 git diff --cached --stat 逐文件核对
- coder 会话可能有双栈进程驻留（8000/5000）。若端口占用，先探测属主（curl 探活），能复用则复用并声明，不能则用空闲端口等效验证（报告注明实际端口）
- 9000 端口为系统保留，任何情况下不使用、不 kill
