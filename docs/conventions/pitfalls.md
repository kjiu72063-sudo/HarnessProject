last_updated: 2026-08-17
status: active

# 踩坑知识库

## 使用说明

- **查找**：遇到报错时，按错误关键词（如 `ERR_PACKAGE_PATH_NOT_EXPORTED`、`422`）在本文件搜索
- **保存**：每次修复一个非平凡问题后，必须在此新增一条记录（见 coding.md「踩坑记录规则」）
- **编号**：`P` + 三位递增序号（P001, P002, ...），不复用
- **每条记录必须包含**：错误特征、根因、修复方案、关联文件、预防规则
- **AGENTS.md 联动**：高危踩坑的预防规则同步写入 AGENTS.md 硬性规则，并在该规则后标注 `[P0xx]`

---

## P001 — @vitejs/plugin-react 6.x 与 Vite 7 不兼容

| 字段 | 内容 |
|---|---|
| 阶段 | stage-00-init-agent / 依赖配置 |
| 错误特征 | `ERR_PACKAGE_PATH_NOT_EXPORTED`，Vite dev server 启动即崩溃 |
| 根因 | `@vitejs/plugin-react@6.0.5` 的 `exports` 字段不包含 Vite 7 所需的入口路径，版本不匹配 |
| 修复方案 | 降级到 `@vitejs/plugin-react@4.3.4`，该版本兼容 Vite 7 |
| 关联文件 | `package.json`（`devDependencies["@vitejs/plugin-react"]`） |
| 预防规则 | 安装 Vite 插件前检查 `peerDependencies` 中的 `vite` 版本范围；升级 Vite 大版本时同步验证插件兼容性 |

## P002 — ESLint 扫描 .venv 目录导致 no-undef 报错

| 字段 | 内容 |
|---|---|
| 阶段 | stage-00-init-agent / 依赖配置 |
| 错误特征 | `pnpm lint` 报 6 个 `no-undef` 错误，全部指向 `.venv/` 下的 JS 文件 |
| 根因 | ESLint 默认递归扫描项目根目录下所有 `.js`/`.mjs` 文件，`.venv/` 内的第三方包代码不符合 lint 规则 |
| 修复方案 | 在 `eslint.config.mjs` 的 `globalIgnores` 中添加 `.venv/**` 和 `server/**`（后端 Python 目录无需 ESLint 检查） |
| 关联文件 | `eslint.config.mjs`（`globalIgnores` 数组） |
| 预防规则 | 新增非前端目录时，同步更新 ESLint `globalIgnores`；`globalIgnores` 至少包含 `dist/**`、`node_modules/**`、`.venv/**`、`server/**` |

## P003 — FastAPI POST 路由参数被解析为 query param 导致 422

| 字段 | 内容 |
|---|---|
| 阶段 | stage-00-init-agent / 项目路由 |
| 错误特征 | `POST /api/projects` 返回 `422 Unprocessable Entity`，响应体含 `missing` field 错误 |
| 根因 | FastAPI 路由函数参数若未标注为 Pydantic Body 模型，默认按 query parameter 解析；POST 请求体中的 JSON 字段不会被自动绑定 |
| 修复方案 | 创建 Pydantic 请求体模型 `CreateProjectRequest(BaseModel)`，路由函数参数标注为 `req: CreateProjectRequest`，FastAPI 自动按 body 解析 |
| 关联文件 | `server/routes/projects.py`、`server/schemas/project.py` |
| 预防规则 | POST/PUT/PATCH 路由的请求体参数必须使用 Pydantic BaseModel，禁止裸 `str`/`dict` 参数 |

## P004 — 模板 .gitignore 误排除 progress.txt

| 字段 | 内容 |
|---|---|
| 阶段 | stage-00-init-agent / Git 初始化 |
| 错误特征 | `progress.txt` 不出现在 `git status` 中，无法提交 |
| 根因 | Vite 模板自带的 `.gitignore` 中有通配规则 `*.txt`（或类似），误匹配了 `progress.txt` |
| 修复方案 | 从 `.gitignore` 中移除匹配 `progress.txt` 的规则；确认 `git status` 能看到该文件 |
| 关联文件 | `.gitignore` |
| 预防规则 | `progress.txt`、`feature_list.json` 是 Harness 持久化记忆文件，必须纳入版本控制；初始化后检查 `git status` 确认这两个文件未被忽略 |
