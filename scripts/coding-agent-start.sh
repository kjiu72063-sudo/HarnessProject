#!/usr/bin/env bash
# Harness Platform - 编码 Agent 会话启动脚本
# 对应 PDF 中 Anthropic 两阶段模型的编码 Agent 启动流程
#
# PDF 原文规定的 5 步:
# 1. 运行 pwd 确认工作目录
# 2. 读取 git log 和进度文件，了解最近的工作
# 3. 读取 feature list 文件，选择最高优先级的未完成功能
# 4. 启动开发服务器，运行基础端到端测试
# 5. 确认基本功能正常后，开始新功能开发

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Coding Agent Session Startup${NC}"
echo -e "${YELLOW}  Anthropic 两阶段模型 - 编码 Agent${NC}"
echo -e "${YELLOW}========================================${NC}"

# Step 1: 确认工作目录
echo ""
echo -e "${GREEN}[Step 1/5] 工作目录确认${NC}"
cd "$PROJECT_DIR"
pwd
echo ""

# Step 2: 读取 git log + 进度文件
echo -e "${GREEN}[Step 2/5] 最近工作进展${NC}"
echo "--- git log (最近5条) ---"
git log --oneline -5 2>/dev/null || echo "(no git history yet)"
echo ""
echo "--- progress.txt (最后5条) ---"
tail -5 progress.txt 2>/dev/null || echo "(no progress.txt)"
echo ""

# Step 3: 读取 feature_list.json，选择最高优先级未完成功能
echo -e "${GREEN}[Step 3/5] 待开发功能列表${NC}"
if [ -f feature_list.json ]; then
  # 输出所有非 passing 的功能，按 priority 排序
  python3 -c "
import json, sys
with open('feature_list.json') as f:
    features = json.load(f)
todo = [f for f in features if f['status'] != 'passing']
todo.sort(key=lambda x: x['priority'])
if todo:
    print(f'  共 {len(todo)} 个待开发功能:')
    for f in todo:
        deps = ', '.join(f.get('dependencies', [])) or 'none'
        print(f'  [{f[\"id\"]}] P{f[\"priority\"]} {f[\"name\"]} ({f[\"status\"]}) deps: {deps}')
    print(f'\n  → 建议从 [{todo[0][\"id\"]}] {todo[0][\"name\"]} 开始')
else:
    print('  所有功能已完成!')
" 2>/dev/null || echo "  (无法解析 feature_list.json)"
else
echo "  feature_list.json 不存在!"
fi
echo ""

# Step 4: 启动开发服务器 + 运行基础端到端测试
echo -e "${GREEN}[Step 4/5] 环境验证${NC}"
echo "运行 verify 闸门..."
if bash "$SCRIPT_DIR/verify.sh"; then
echo -e "${GREEN}  ✅ 闸门通过${NC}"
else
echo -e "${RED}  ❌ 闸门未通过 - 请先修复上述问题${NC}"
echo "  提示: 查阅 docs/conventions/pitfalls.md 搜索错误关键词"
exit 1
fi
echo ""

# Step 5: 确认正常，开始开发
echo -e "${GREEN}[Step 5/5] 环境就绪，开始开发${NC}"
echo ""
echo "提醒 (PDF 三大失败模式):"
echo "  1. 不要试图一步到位 (One-shotting)"
echo "  2. 不要过早宣布胜利"
echo "  3. 标记 passing 前必须运行完整测试"
echo ""
echo -e "${GREEN}Ready. 选择一个功能开始开发。${NC}"
