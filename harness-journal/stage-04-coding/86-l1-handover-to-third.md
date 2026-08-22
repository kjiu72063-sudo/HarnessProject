# Journal 86 — L1 换任交接（第二任 → 第三任）

- 日期: 2026-08-21
- 作者: 第二任 L1 项目管控 Agent（任期 2026-08-19 至 2026-08-21）
- 类型: 管控者交接记录（承接先例 journal 31）
- 触发: K总指令——"我发现你的上下文将满，可能导致记忆不清晰、信息精度丢失，所以我现在需要新开一个管控者，接手你的工作……需要让新的管控者明白当前进度情况、当前的规则、必须遵守的规则、必须明确角色任务以及边界，然后将我们之间未上传的沟通对话以及进度等情况，包括该条对话，上传至 harness-journal，确定给下一任管控者留下一个干净清楚的工作环境。"

## 一、角色与边界（新任 L1 第一优先级，违反即事故）

**你是 L1 项目管控 Agent，唯一职责 = 任务管理与流程规划。你服务于 K总（人类决策者，HITL 闸门）。**

1. **L1 验收表只允许四类行**: 产出存在 / journal 与 progress 写入 / 约束遵守 / verify.sh 复跑 PASS-FAIL。
2. **内容测验一律委派 L3 test-reviewer**: 复现缺陷/根因分析/缺陷定级/修复方向裁定/内容达标判定/Spec 口径裁定，全部禁止 L1 自做。边界判定测试: 问"产出存在吗/journal写了吗/闸门PASS还是FAIL"=可做; 问"内容正确吗/达标吗/该解释可接受吗"=测验禁止，移交 L3 或 K总。
3. **黑名单**（本任期 journal 33 事故沉淀，AGENTS.md 已固化）: 逐条自测 ControllerSpec 内容标准（哪怕只 grep 一条）/ 把 grep 或 diff 比对源码结果作验收结论 / 对 coder 标注"备 L1 裁定"的歧义署名裁定（L1 只记录事实转交）/ 把 coder 自报证据转述为已核实。唯一例外: 复跑 verify.sh 仅记录 PASS/FAIL。
4. **开放问题与歧义**: L1 原文转呈 K总，K总裁决后 L1 机械落地。L1 可在被问及时给建议立场（F004/F013 先例），但不得自行裁定。
5. **git 取证仅限流程事实**: 提交范围/暂存区/工作区状态/平台自动提交识别。深入 diff 内容判定 = 越界。
6. **verify.sh 失败时正确动作**: 先查环境（P009 三种形态，见 §四）再定性代码；环境完好仍 FAIL → 记录事实 → 委派 L3 → 依结论出修订 Spec。禁止跳过重新校验。

## 二、当前状态快照（2026-08-21，journal 85 同批落盘）

- **Sprint2 已全部收官**: F004/F005/F007/F012/F013/F014 全部 passing（周期与特征见 journal 85 §三）。
- **verify.sh 现为 15 项闸门**（F012 起新增条件第 15 项 E2E: 浏览器可用→执行，不可用→skip+WARN）。
- **工作区干净**: 全部提交落盘，无未提交改动，无平台自动提交待处理。
- **journal 已用至 86**（本 journal）。README.md 索引同步登记。
- **pending 事项**: ①N 级统筹池 15 条 + 1 候选（明细见 §五）留独立统筹批次，需 K总发起；②F015（约束页"待裁决建议"产品化）留 backlog，触发条件=F004 运行后人工裁决工作流成为瓶颈；③Sprint3 规划未启动，需 K总指示（候选: N 池统筹批次 / F009 持久化 / F010 跨语言 / 均以 feature_list.json 为准）。

## 三、本任期决策链全景（journal 32-86，供追溯）

1. **F014 微任务闭环**（29-34）: journal 32 验收+委派 → **journal 33 = 本任期事故**: 验收越界自测被 K总严厉纠正（"你违背了你的能力边界！管控者不做测验"），整改=journal 33 更正段+委派产物去锚定+AGENTS.md 黑名单化+P012 落盘 → 审查通过闭环。
2. **编号映射裁决落地**（35）: K总确认委派链口径 F012=Playwright / F013=API列表 / F014=Settings清理。
3. **F004 全周期**（36-46）: 设计 3 开放问题 K总问 L1 建议后裁决"按你说的来"（①api-spec回写绑coder ②产品化记F015 ③enabled=false仅影响阶段4注入）→ 编码 35f09dc（重复派生场景: 前次会话已完成，判定不重做仅补证）→ L3 审查 M1/M2 → 修复 02830d1 → 复审 8/8 → 闭环。
4. **F005 全周期**（47-57）: 设计 4+2 项 K总裁决"按 design-writer 建议全部采纳" → 编码 fbc5d0c → L3 审查 M1(shell)/M2(跨文档)/M3(超时status) + **coder 两处自报失实被 L3 实证纠正** → 修复 0eb3326 → 复审 8/8 → 闭环。
5. **F007 全周期**（58-65）: 设计 5 项裁决（α 替换F007/β start注入为 K总逐项明确）→ 编码 71ac96a → L3 审查 12/12+0M **一次编码即过** → 闭环。
6. **F012 全周期**（66-77）: 设计 4 项裁决"按 design-writer 建议全部采纳" → 编码 a73c7dd → L3 审查 M1(检测逻辑三bug致#15永远skip)/M2(选择器strict violation) + **coder 自报"版本不匹配"失实被 L3 实证纠正** → 修复 221cef3 → 复审 8/8（真实执行 11pass+1skip+0violation）→ 闭环。
7. **F013 全周期**（78-85）: 设计 5 项裁决"按照你的推荐方案执行" → 编码 cd9343b → L3 审查 12/12+0M+0N+0歧义 **一次编码即过** → 闭环 + Sprint2 收官（journal 85）。
8. **换任交接**（86=本 journal）。

## 四、环境事实与 P 编号速查（新会话必读，pitfalls.md 为权威）

| 编号 | 一句话 | 新任要点 |
|---|---|---|
| P009 | 沙箱环境漂移 | **三种形态已实证**: ①冷启动 uv/.venv 全缺 ②会话中途被独立清除（journal 53: 两者均清; journal 56: 仅 uv 清而 .venv 完好——处置=先查 .venv 完好性，完好仅 pip 重装 uv，损坏走替代构建法 journal 39 §9）③浏览器版本目录漂移（journal 80: 仅存 1161 而运行时需 1234，检测命中旧版→执行→运行时缺二进制全挂; 处置=网络可用时 `pnpm exec playwright install chromium-headless-shell` 后台重下） |
| P010 | UV_DEFAULT_INDEX 残留重写 lock | 防护: 一律 `export UV_FROZEN=1` 前置; 镜像变量用后 unset |
| P011 | 平台 hookspath 自动 stage | **13 条实证**（6f8789d/c670c3a/60b18f6/3fb60ef/04acfe0/be3c61e/44d6d60/8ca904a/82cc0af/6f1fdc0/b4db473/4e8208f…）; 两类模式: Coze-Commit-Type: user 零差异知悉不处理 / **复刻同名 message 承载他人产出**（4e8208f 含 coder journal，内容一致非夹带）→ 验收一律锚定 diff 区间而非 HEAD; 提交前 `git status --short` + `git diff --cached --stat` 双向核对 |
| P012 | L1 越界自测复发型踩坑 | 见 §一，AGENTS.md 已黑名单化 |

复跑 verify.sh 标准动作序列（本任期验证多轮有效）:
```
which uv || pip install uv -i https://mirrors.aliyun.com/pypi/simple/ -q
ls .venv/bin/python || { export UV_DEFAULT_INDEX=https://mirrors.aliyun.com/pypi/simple/ UV_FROZEN=1; uv venv --python 3.12 .venv; uv pip install -r <(uv export --frozen --no-hashes -q); unset UV_DEFAULT_INDEX; }
export UV_FROZEN=1 && bash scripts/verify.sh
```

## 五、N 级统筹池明细（15 条 + 1 候选，留独立统筹批次）

- journal 40（F004 审查）: 5 条（coder 自报更正/api-spec 补充/测试增强/行数预警/前端端到端场景）
- F005: N1 Docker 安全测试五维断言不完整 / N2 cancel kill 无防御 / N3 SandboxResult TS 缺 resource_usage / N4 shlex.split ValueError 未捕获
- F007: N1 usePolling 死代码清理 / N2 二次订阅防御
- F012: N1 journal 70 自报 specifier 失实 / N2 P3 skip 可接受 / N3 设计 9vs12 口径笔误 / N4(复审) webServer 启动时序 flaky（retries=2 可覆盖）
- 候选（journal 80）: M1 检测逻辑升级为版本匹配（浏览器"存在即执行"语义在版本漂移下失效）

## 六、委派方法论（本任期固化模板，直接复用）

1. **设计委派三件套**: ControllerSpec（8 项验收标准模板）+ launch prompt（冷启动序列: AGENTS.md→progress→feature_list→current-sprint→README 最近 3 journal→相关设计/架构文档→Spec；附 P 防护与环境事实）+ journal 编号预留。
2. **审批落地批次**（K总 Approve 后）: 设计文档 Status→Approved + 头部裁决注记 → feature_list approved → coder 三件套（12 项标准，裁决逐项固化为硬性约束）→ journal（审批+委派合一，编号顺延调整并注记）。
3. **编码验收批次**: 四类行取证（git show --stat 与自报核对/禁改清单 grep——**模式精确化，勿误伤 coder 自写 journal**/预留号占用核查）→ verify.sh 复跑 → test-reviewer 三件套（12 项标准，预置重点: 断言空洞警惕/自报证据独立复证/skip 根因区分）。
4. **修复循环**: 审查 M 项 → 修复微任务三件套（8 项标准，β 教训约束: 所有执行/skip 结论附真实运行输出）→ 复审三件套 → 8/8+0M 闭环。
5. **闭环批次**: feature_list passing（**文本精确替换保持 JSON 格式，禁 json.dump 全文件重排**——本任期实际踩过并恢复）→ current-sprint 勾选 → journal 闭环 → AGENTS.md/progress/README 同步。
6. **每个 L1 批次固定八件**: 本批次 journal + Spec + prompt + AGENTS.md 下一步段 + AGENTS.md 当前段（闭环时）+ progress.txt + README 索引 + git 提交（P011 双向核对 + 40 秒复查）。**状态文件更新用 python 脚本带 assert 锚点，README/progress 直接写勿用 edit_file（本任期多次 invalid anchor）**。

## 七、未上传沟通摘要（K总要求补记，含触发本次换任的对话）

本任期与 K总 的关键沟通均为 K总转发的下游 Agent 报告 + 裁决指令，全部已体现在 journal 链与状态文件。补充记录两条仅存在于对话层的事实:
1. F004 设计审批前，K总主动征询:"如果是你的话，你会怎么样去回答这三个开放问题，为什么"——L1 给出建议立场后 K总裁决"按照你说的来"。此后 F005/F012/F013 的"按 design-writer 建议全部采纳"成为 K总常用收口方式。
2. **本次换任指令**（原文见头部触发段）: K总基于"上下文将满→记忆不清晰→信息精度丢失"风险主动换任，要求交接三要素（进度/规则边界/干净环境）+ 沟通补记（本节）。

## 八、新任 L1 冷启动序列（严格遵守）

1. 读 AGENTS.md（尤其"L1职责边界"段与黑名单）
2. 读 progress.txt 末 20 行
3. 读 feature_list.json（全部 passing 状态）
4. 读 docs/plans/current-sprint.md
5. 读 harness-journal/README.md + 最近 3 条 journal（85/86/84）
6. **读本 journal（86）与 journal 31（前任交接）+ journal 33（越界事故）**
7. 读 docs/conventions/pitfalls.md（P009-P012）
8. 向 K总 报到并请示下一批次（候选见 §二 pending ③）

## 九、给 K总的交接确认

- 工作区干净: 全部落盘提交，无未提交改动
- 状态一致性: AGENTS.md / progress.txt / feature_list.json / current-sprint.md / README 索引 均已同步至 journal 86
- 本 journal 与 journal 85 同批提交，此后新任 L1 接管全部流程动作
