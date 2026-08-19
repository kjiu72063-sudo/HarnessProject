# Controller Spec: settings 死配置清理（微任务）

## 任务
删除 server/config/settings.py 中零消费方的 F001 存量占位配置，消除命名风格混搭残留。跨文档同步批次 (e) 的清理执行部分，规范裁决已落 coding.md（journal 28）。

## 角色
coder

## 前置条件
- Sprint 1 最终验收已通过（journal 27，2026-08-20）

## 背景
- F003 审查（journal 16）裁决带回：settings 存在大小写混搭 + 死配置
- L1 裁决（journal 28）：新增字段统一大写；F001 存量小写有真实消费方保留；死配置删除（本任务）
- 实证（L1 grep，2026-08-20）：
  - `openai_api_key`：全仓零消费方（纯死配置）
  - `openai_model`：仅 server/tests/test_settings.py 的默认值断言消费（测试锁定死配置，非业务消费）
  - 大写 5 字段（LLM_PROVIDER/LLM_MODEL/LLM_TEMPERATURE/LLM_MAX_TOKENS/LLM_TIMEOUT）：被 F003 设计 + 实现 + 14 项测试锁定，**本任务不得触碰**

## 输入
- 文件: server/config/settings.py, server/tests/test_settings.py
- 参考: docs/conventions/coding.md「后端 (Python)」settings 命名条目

## 输出
- server/config/settings.py — 删除 openai_api_key、openai_model 两个字段
- server/tests/test_settings.py — 同步删除对 openai_model 默认值的断言（如存在对 openai_api_key 的断言一并删除）
- harness-journal/stage-04-coding/29-settings-cleanup.md — 编码 journal（含删陈权衡与环境防护记录）

## 验收标准
1. server/config/settings.py 不再含 openai_api_key / openai_model
2. 大写 5 字段（LLM_*）逐字不变
3. F001 其余存量小写字段（app_name/api_prefix/database_url/backend_port）逐字不变
4. test_settings.py 无对已删字段的残留断言；若删除后该文件仅剩 1-2 个断言，保持文件存在即可（不为凑数添加新测试）
5. 全仓 grep `openai_api_key|openai_model`（排除 .venv）零命中
6. verify.sh 14/14 通过（UV_FROZEN=1 前置，uv.lock 零漂移）
7. 提交范围恰 3 文件（settings.py + test_settings.py + journal 29），progress.txt 追加一行
8. 行为影响说明：此删除不改变任何运行时行为（零消费方），journal 中如实声明

## 禁止
- 不得触碰 LLM_* 大写字段与 F001 存量小写字段
- 不得修改 AGENTS.md / verify.sh / .coze / 设计文档 / feature_list.json
- 不得占用 journal 编号 28
- 不得为"顺手统一命名"扩大改动范围
