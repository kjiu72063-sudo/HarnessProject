# 04 - 踩坑知识库建立

## 步骤名称
踩坑记录机制 + 知识库文档

## 执行时间
2026-08-17

## 前置条件
- 阶段0 初始化过程中的 4 个踩坑已修复
- AGENTS.md 和 docs/ 已就绪

## 执行内容

### 问题诊断
初始化阶段（stage-00）中遇到的 4 个踩坑记录散落在对话和 harness-journal 文档中，没有系统化沉淀：
- P001: @vitejs/plugin-react 版本不兼容
- P002: ESLint 扫描 .venv
- P003: FastAPI POST 422
- P004: progress.txt 被 .gitignore 误排除

无统一查找入口，无保存机制，无法追溯。

### 建立的机制

**1. 知识库文件**：`docs/conventions/pitfalls.md`
- 每条记录有唯一编号（P001, P002, ...）
- 结构化字段：错误特征、根因、修复方案、关联文件、预防规则
- 支持按错误关键词搜索

**2. AGENTS.md 联动**：
- 硬性规则新增第 8、9 条（标注 `[P003]`、`[P004]`）
- 新增「常见问题和预防」段，含踩坑索引表
- 快速导航表新增 pitfalls.md 入口

**3. 保存规则**（写入 coding.md）：
- 修复非平凡问题后必须在 pitfalls.md 新增记录
- 高危踩坑的预防规则同步写入 AGENTS.md 硬性规则
- progress.txt 追加 pitfall 类型记录
- 对应 harness-journal 文档引用踩坑编号

### 查找流程
```
遇到报错 → 用错误关键词搜索 pitfalls.md → 匹配"错误特征"字段 → 获取根因和修复方案
```

## 产出物
- `docs/conventions/pitfalls.md` — 踩坑知识库（P001-P004）
- `docs/conventions/coding.md` — 新增「踩坑记录规则」段
- `AGENTS.md` — 新增硬性规则 8/9 + 常见问题和预防段 + 导航条目
- `progress.txt` — 追加踩坑知识库建立记录

## 验证结果
- pitfalls.md 包含 4 条完整记录
- AGENTS.md 硬性规则从 7 条增至 9 条
- coding.md 含踩坑记录规则的完整流程定义
