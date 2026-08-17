# 原型图开发执行

## 步骤名称
原型图 HTML 原型生成（design-canvas）

## 执行时间
2026-08-17

## 前置条件
- 05-prototype-planning.md 规划完成
- DESIGN.md 设计体系已定义
- 骨架模板 + 公共设计规范已读取
- 5 步入口流程已执行，基线确认通过

## 执行内容

### 1. 骨架生成
- 复制 skeleton-web.html 到 `.cozeproj/prototype/web/_skeleton.html`
- 填入 DESIGN.md 对应的 Design Token 真实值:
  - background: #0F1115 (深炭灰)
  - surface: #1A1D24 (石墨灰)
  - primary: #3B82F6 (工程蓝)
  - success: #10B981 / warning: #F59E0B / error: #EF4444
  - font-sans: Inter + Noto Sans SC
  - font-mono: JetBrains Mono
  - 圆角: 0.25rem ~ 1rem (工程级精准，直角为主)
- 生成侧边栏 + 顶栏导航组件（4 个页面链接）
- 骨架检查通过: 0 错误 0 警告

### 2. 画板配置
- gen_canvas.js 创建 `.cozeproj/prototype/web/.canvas.json`
- 4 个页面: requirement / pipeline / constraints / artifacts

### 3. 页面生成

#### requirement.html — 需求输入页
- 需求描述 textarea（字数统计 0/500）
- 技术栈模板 2x2 grid: React+FastAPI / Next.js+Prisma / Taro小程序 / 自定义
- 约束预配置 toggle: 自动生成 AGENTS.md / Linter注入 / 覆盖率≥80%
- 启动生成 + 保存草稿按钮
- 近期生成列表（3条，状态灯 + 时间戳）

#### pipeline.html — 流程监控页（核心）
- 左侧: Harness 8 阶段完整拓扑（垂直流程线 + 节点 + 菱形决策点）
  - 阶段0-3: 通过(绿) + 阶段4: 进行中(琥珀+进度条60%) + 阶段5-8: 待执行(灰)
  - 2 个菱形决策点: 原型确认(通过) / 测试结果(待执行)
  - 进行中节点有扫描线动画
- 右侧: 实时日志面板（等宽字体逐行追加，琥珀色=进行中）
- 底部状态摘要: verify 14/14 / 当前功能 F002 / 耗时

#### constraints.html — 约束配置页
- AGENTS.md 硬性规则表（8条示例，三级状态: 已机械化/人工审查）
- Linter 规则引擎列表（dependency-cruiser / import-linter / ruff / ESLint，含版本和规则描述）
- 最近一次全闸门校验结果（14项网格 + 通过率 + 耗时）

#### artifacts.html — 产物管理页
- 统计卡片: 总文件数 47 / 代码行数 2831 / 测试覆盖率 100%
- 文件树（缩进层级 + Lucide 文件夹/文件图标 + 行数）
- verify.sh 闸门结果详情（9类检查项 + 通过/耗时）
- 下载全部 + 部署按钮

### 4. 验证
- check_page.js 对 4 个页面全量检查: 0 错误 0 警告

## 产出物
- `.cozeproj/prototype/web/_skeleton.html` — 骨架
- `.cozeproj/prototype/web/.canvas.json` — 画板配置
- `.cozeproj/prototype/web/requirement.html` — 需求输入页
- `.cozeproj/prototype/web/pipeline.html` — 流程监控页
- `.cozeproj/prototype/web/constraints.html` — 约束配置页
- `.cozeproj/prototype/web/artifacts.html` — 产物管理页

## 验证结果
- 骨架检查: ✅ 通过
- 页面检查: ✅ 4 页面全部通过（0 错误 0 警告）
- 视觉一致性: ✅ 所有页面共享同一 Design Token，导航组件一致
- ⬜ 用户原型确认（待 K总审核）

## 备注
- 原型产出是确认用途，不进入 git 主分支
- pipeline.html 是核心页面，8阶段拓扑含菱形决策点、进度条、扫描线动画
- 状态灯三色编码(琥珀/绿/红) + Lucide 图标双重编码已实现
- 遵循 DESIGN.md 全部禁忌: 无装饰性图片/无emoji/无蓝紫渐变/无毛玻璃
