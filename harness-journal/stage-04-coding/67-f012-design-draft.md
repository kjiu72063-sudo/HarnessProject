# Journal 67 — F012 Playwright E2E 设计 Draft

**会话系统时钟**: 2026-08-20 (沙箱时钟可能漂移, 以下时间戳沿用 [YYYY-MM-DDTHH:MMZ] 格式)
**角色**: design-writer (F012)
**功能**: F012 Playwright DOM级端到端测试
**前置**: journal 66 (F012 设计委派三件套)

---

## §1 任务执行

按 ControllerSpec 冷启动序列完成上下文读取后，产出设计文档 `docs/design/feature-f012-playwright-e2e.md`（Status: Draft）。

### 设计决策记录

| # | 决策点 | 选项 | 选定 | 理由 |
|---|---|---|---|---|
| D1 | 目录位置 | tests/e2e/ vs src/e2e/ vs e2e/ | tests/e2e/ | Playwright 约定项目根 tests/ 目录; 与 src/ 同级表明非前端源码一部分 |
| D2 | 浏览器范围 | 仅 chromium vs 全家桶 | 仅 chromium | 4 理由(§3.2): React+Tailwind 无浏览器特异/单浏览器省时省体积/DOM级关注结构非引擎差异/后续仅需追加配置 |
| D3 | verify.sh 集成 | A(无条件)/B(独立)/C(条件) | 推荐 C | 单闸门哲学保持+环境安全+P009先例对齐+渐进收紧 |
| D4 | 选择器策略 | role/text优先 vs data-testid优先 | role/text优先 | Playwright 官方最佳实践; 最接近用户心智模型; data-testid 仅动态内容后备 |
| D5 | 真实后端 vs route mock | 真实后端 vs mock | 默认真实后端 | 完整API闭环验证; 开放问题③提交K总裁决 |
| D6 | 覆盖率计入 | 计入80%基线 vs 排除 | 排除 | 3理由(§7): V8不采集E2E路径/正交维度/插桩复杂度远超收益 |
| D7 | 降级语义 | no-browser→FAIL vs skip+WARN | skip+WARN(exit 0) | P009先例; 不阻塞受限环境开发; CI预装浏览器后自然收紧 |

### 8 项验收标准逐条对照

| # | 验收标准 | 覆盖位置 | 状态 |
|---|---|---|---|
| 1 | 框架接入设计 | §1 (版本/config 6字段/目录/script) | ✅ |
| 2 | 四页面E2E场景设计 | §2 (9场景表+分界原则6条) | ✅ |
| 3 | 运行环境策略 | §3 (webServer双栈/Chromium+4理由/三级行为表) | ✅ |
| 4 | verify.sh集成方案 | §4 (3候选比较+推荐C+4理由) | ✅ |
| 5 | 网络受限可行性 | §5 (三级方案/P009关联/安装流程) | ✅ |
| 6 | 数据契约 | §6 (5端点消费表/testing.md口径/convention-mapping行) | ✅ |
| 7 | 测试策略自反 | §7 (选择器3级/超时4维/flake4条/覆盖率排除+3理由) | ✅ |
| 8 | 文档自身 | §8 (~210行≤300/模板骨架/开放问题4项) | ✅ |

---

## §2 开放问题清单

1. **verify.sh 集成形态**: 方案 A/B/C, 推荐 C
2. **浏览器范围**: 仅 Chromium(推荐) vs Chromium+Firefox
3. **真实后端 vs route mock**: 默认真实后端, mock 为备选
4. **Playwright 纳入技术栈基线**: 需 K总 审批时确认

---

## §3 自报歧义清单

无。所有设计决策均有明确理由, 开放问题已显式列出提交 K总。

---

## §4 约束遵守

- 零代码产出 ✅
- 设计文档 ~210 行 ≤ 300 行 ✅
- 不修改既有 14 项闸门语义 ✅ (集成方案属设计决策, 实施绑编码阶段)
- 端口 5000/8000 不变 ✅
- 技术栈基线标注"需 K总 审批时确认" ✅

---

## §5 产出文件

| 文件 | 行数 | 状态 |
|---|---|---|
| docs/design/feature-f012-playwright-e2e.md | ~200 | Draft |
| harness-journal/stage-04-coding/67-f012-design-draft.md | 本文件 | — |
| progress.txt | +1 行 | — |
