last_updated: 2026-08-17
status: active
owner: @K总

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

## P005 — dependency-cruiser v18 `message` 属性已改为 `comment`

| 字段 | 内容 |
|---|---|
| 阶段 | stage-02 / 约束层搭建 |
| 错误特征 | `data/forbidden/0 must NOT have additional properties` + `must have required property 'module'` |
| 根因 | dependency-cruiser v18 的 JSON schema 中，自定义规则的错误信息字段从 `message` 改为 `comment`；使用旧字段 `message` 会触发 schema 校验失败 |
| 修复方案 | 将配置中所有 `message:` 改为 `comment:`；comment 字段支持多行字符串，可包含 ❌/✅/📖 三要素公式 |
| 关联文件 | `.dependency-cruiser.cjs` |
| 预防规则 | 升级 dependency-cruiser 大版本后，先跑 `npx depcruise src/ --config .dependency-cruiser.cjs` 验证配置 schema |

## P006 — ESLint 扫描 `.dependency-cruiser.cjs` 报 `no-undef`

| 字段 | 内容 |
|---|---|
| 阶段 | stage-02 / 约束层搭建 |
| 错误特征 | ESLint 报 `no-undef`，指向 `.dependency-cruiser.cjs` 中的 `module` 变量 |
| 根因 | `.dependency-cruiser.cjs` 是 CommonJS 配置文件，使用了 `module.exports` 但不在 ESLint 的 globalIgnores 中 |
| 修复方案 | 在 `eslint.config.mjs` 的 `globalIgnores` 中添加 `.dependency-cruiser.cjs` 和 `vite.config.ts` |
| 关联文件 | `eslint.config.mjs` |
| 预防规则 | 新增 `.cjs`/`.mjs`/`.ts` 配置文件时，同步更新 ESLint `globalIgnores`；P002 的预防规则扩展为：globalIgnores 至少包含 `dist/**`、`node_modules/**`、`.venv/**`、`server/**`、所有 `.*.cjs`/`vite.config.ts` |

## P007 — import-linter 不支持独立 `.importlinter.toml` 文件

| 字段 | 内容 |
|---|---|
| 阶段 | stage-02 / 约束层搭建 |
| 错误特征 | `Could not find .importlinter.toml` 或 `section '' already exists` |
| 根因 | import-linter v2.x 的配置必须放在 `pyproject.toml` 的 `[tool.importlinter]` 段中，不支持独立 `.importlinter.toml` 文件；TOML 的 `[[importlinter.contracts]]` 语法在独立文件中无效 |
| 修复方案 | 将 import-linter 配置写入 `pyproject.toml`，使用 `[tool.importlinter]` 和 `[[tool.importlinter.contracts]]` 格式；运行命令为 `uv run lint-imports`（不带 `--config` 参数） |
| 关联文件 | `pyproject.toml` |
| 预防规则 | Python 工具链配置统一写入 `pyproject.toml`，不使用独立的 `.xxx.toml` 文件；参考 PDF 原文的 `pom.xml` 集中配置理念 |

## P008 — AGENTS.md 技术栈基线与实际安装版本不一致

| 字段 | 内容 |
|---|---|
| 阶段 | stage-02 / 第五轮 PDF 审计 |
| 错误特征 | AGENTS.md 声明 `React 18`，但 `package.json` 实际安装 `react: ^19.2.8`；AGENTS.md 声明 `Python 3.12`，但 `pyproject.toml` 为 `requires-python = ">=3.11"`，允许 3.11 |
| 根因 | 平台 Vite 模板默认安装 React 19，AGENTS.md 按原始设计写 React 18；五轮审计均聚焦 PDF 要求逐条对照，从未交叉验证声明基线与实际依赖是否一致。AGENTS.md 是 Agent 读取的权威信息源，声明版本与实际安装不一致会导致 Agent 编写不兼容的代码 |
| 修复方案 | (a) AGENTS.md `React 18` → `React 19`；(b) `src/App.tsx` UI 显示 `React 18` → `React 19`；(c) `pyproject.toml` `requires-python` 从 `>=3.11` 收紧为 `>=3.12`；(d) `convention-to-rule-mapping.md` `Python ≥ 3.11` → `≥ 3.12` |
| 关联文件 | `AGENTS.md`、`package.json`、`pyproject.toml`、`src/App.tsx`、`docs/conventions/convention-to-rule-mapping.md` |
| 预防规则 | AGENTS.md 技术栈基线必须与 `package.json`/`pyproject.toml` 实际安装版本交叉验证；每次审计必须包含"声明版本 vs 实际版本一致性检查"步骤；平台模板安装的版本可能与设计文档声明不同，初始化后必须同步基线 |

## P009 — 网络受限沙箱中 `uv sync` 卡死超时

| 字段 | 内容 |
|---|---|
| 阶段 | stage-04 / F002 验收与测试审查（journal 03/05） |
| 错误特征 | `uv sync` 长时间无输出（>6 分钟无进展），无报错、不退出；L1 会话与 test-reviewer 会话均复现。对照：同会话 `pip install` 走镜像源正常可用 |
| 根因 | `uv` 不继承 pip 的镜像配置（`pip.conf`/`PIP_INDEX_URL`），直连默认源 `pypi.org`；网络受限沙箱对该域直连被限速/阻断。且 `uv sync --frozen` 按 lock 文件中的原始 URL 下载，`UV_INDEX_URL` 等镜像变量对已锁定 URL 无效 |
| 修复方案 | 按 lock 钉版的等价环境构建法（test-reviewer 实测约 3 分钟）：`export UV_DEFAULT_INDEX=<镜像源>` → `uv venv` → `uv pip install -r <(uv export --frozen)` 或按 `uv.lock` 版本逐项 `uv pip install pkg==version`；或直接 `pip install` 镜像源可用时用系统 python 等效复跑并在记录中注明实际版本 |
| 关联文件 | `uv.lock`、`pyproject.toml`、`scripts/verify.sh`（后端 4 项硬依赖 `uv run`） |
| 预防规则 | 会话开始先探测：`command -v uv` 与镜像连通性，再决定验证路径；verify.sh 后端项在无 uv 会话不可直接复跑，用等效命令替代并如实记录环境；环境与版本必须写入 journal（各会话沙箱环境漂移，结论不得绑定单一会话环境） |

## P010 — `UV_DEFAULT_INDEX` 环境变量下 `uv run`/`uv sync` 重写已提交 lock（R2 污染机制）

| 字段 | 内容 |
|---|---|
| 阶段 | stage-04 / F002 R2-R3（journal 08/12） |
| 错误特征 | 复跑 verify.sh（内含 `uv run`）后 `git diff` 显示 uv.lock 大量 URL 变更（实测 1627 处官方 URL → 镜像 URL）；无报错，静默发生，文件自动进入暂存区后极易随下次 commit 混入（R2 的 1602 处 aliyun 残留即此机制产物） |
| 根因 | P009 替代法要求 export `UV_DEFAULT_INDEX=<镜像源>`；该变量残留于会话时，`uv run`/`uv sync` 会按当前环境 index 重写 lock 中的 registry/下载 URL（uv 默认行为，非 --frozen 模式下 lock 是"活文档"）。镜像变量与"保持已提交 lock 干净"存在隐性冲突 |
| 修复方案 | 涉及已提交 lock 的任何 uv 命令统一前置 `UV_FROZEN=1`（test-reviewer 实测可完全阻止重写）；lock 一旦被污染按 F002 R3 路径 B 处理（恢复干净基线 → URL 全局替换 → `uv lock --check` + 全量哈希/版本对比验证）；提交前必查 `git diff -- uv.lock` |
| 关联文件 | `uv.lock`、`scripts/verify.sh`、P009 |
| 预防规则 | P009 替代法用完即unset变量；验证 lock 干净的机械检查（grep 镜像域名计数 + `uv lock --check`）纳入涉及 lock 变更的验收标准 |

## P011 — 平台 git hookspath 导致文件修改后自动进入暂存区

| 字段 | 内容 |
|---|---|
| 阶段 | stage-04 / F002 R2-R3（coder journal 11 + test-reviewer journal 12 双方独立实证） |
| 错误特征 | Agent 未执行任何 `git add`，工作区文件修改后自动出现在暂存区（`git status` 显示 staged）；coder R2/R3 两次遇到，test-reviewer 全程未 add 也复现 |
| 根因 | 平台级 `core.hookspath=/source/git-hooks` 配置的自动 stage 行为，非 Agent 操作 |
| 修复方案 | 无需"修复"，属平台既定行为；提交前用 `git status` + `git diff --cached` 逐行核实暂存内容与预期改动一致，避免误判"有未提交改动被追踪"或把非预期文件一并提交 |
| 关联文件 | `.git/config`（平台托管，勿改） |
| 预防规则 | 所有 Agent 提交前强制执行 `git diff --cached --stat` 核对文件清单与 Controller Spec 范围一致；发现暂存区含范围外文件先unstage再提交 |
