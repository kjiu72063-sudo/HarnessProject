last_updated: 2026-08-22
status: sprint3-started（2026-08-22 规划裁决落地, M1 前置微任务 + F009 设计委派中, journal 87）
owner: @K总

# 当前迭代计划

## Sprint 1: 最小闭环 (已收官, K总最终验收通过 2026-08-19, journal 27)
- [x] F001 项目初始化与骨架搭建
- [x] F002 LangGraph 编排引擎 (passing, commit 1d54504, 审查链 05→08→12)
- [x] F003 可插拔 LLM 提供商层 (passing, commit a775554, 审查 journal 16)
- [x] F006 前端平台 UI (passing, commit 00eed47, 审查 journal 20)
- [x] Task 5 集成验证 (done, journal 23/24 双通过, 零代码变更)
- [x] F014 Settings 死配置清理 (passing, commit 5e736d2, 审查链 29→32→33→30, 闭环journal 34)

## Sprint 2: 约束与反馈
- [x] F004 约束管理层 (passing, 编码35f09dc + M1/M2修复02830d1, 审查链 39→40→43→44, 闭环journal 46)
- [x] F005 代码执行沙箱（编码 fbc5d0c + 修复 0eb3326，审查链 50→51→54→55，闭环 journal 57）
- [x] F007 SSE 实时状态推送（编码 71ac96a，审查链 59→63，一次编码即过，闭环 journal 65）
- [x] F012 Playwright DOM级端到端测试（编码 a73c7dd + 修复 221cef3，审查链 67→75，闭环 journal 77）
- [x] F013 API 会话列表端点（编码 cd9343b，审查链 79→83，一次编码即过，闭环 journal 85）

## Sprint 3: 持久化与熵管理（K总裁决 2026-08-22: F009 先于 F008, journal 87）
- [ ] M1 前置微任务: verify.sh E2E 检测逻辑版本匹配升级（N 池候选拆出先行, 不占 F 编号; journal 87 委派, 88=coder/89=复审预留）
- [ ] F009 持久化记忆系统（PostgreSQL + LangGraph Checkpointer; 设计委派 journal 87, 90=design-writer 预留）
- [ ] F008 熵管理后台任务（F009 之后）

N 池统筹: 其余 15 条挂账留独立统筹批次; F015 维持 backlog 不评估（K总裁决 2026-08-22）

## Sprint 4: 可插拔扩展
- [ ] F010 多技术栈可插拔
