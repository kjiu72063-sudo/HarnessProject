#!/usr/bin/env bash
# Harness Platform - Verify 闸门
# 等价于 PDF 中的 `mvn -B clean verify` 全链路
# 14 项: 类型检查 + Lint + CSS Lint + 单元测试 + 分层依赖 + 覆盖率 ≥ 80% + 文档新鲜度 + 文件大小 + 技术栈基线一致性 + Git 追踪 + 端口一致性
# 任何一项失败即整体失败，阻止代码合并

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

run_check() {
  local name="$1"
  local cmd="$2"
  echo -e "${YELLOW}[VERIFY] Running: ${name}${NC}"
  if eval "$cmd" 2>&1; then
    echo -e "${GREEN}[VERIFY] PASS: ${name}${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}[VERIFY] FAIL: ${name}${NC}"
    FAIL=$((FAIL + 1))
  fi
  echo "---"
}

echo "=========================================="
echo "  Harness Verify Gate"
echo "  等价于 mvn -B clean verify"
echo "=========================================="
echo ""

# 1. 前端 TypeScript 类型检查（等价于编译检查）
run_check "Frontend TypeScript Check" "pnpm ts-check"

# 2. 前端 ESLint（等价于 Checkstyle）
run_check "Frontend ESLint" "pnpm lint"

# 3. 前端单元测试（等价于 JUnit）— passWithNoTests 直到前端测试文件存在
run_check "Frontend Unit Tests (Vitest)" "pnpm vitest run --passWithNoTests"

# 4. 前端 CSS Lint（等价于 Checkstyle for CSS）
run_check "Frontend CSS Lint (Stylelint)" "pnpm lint:style"

# 5. 前端分层依赖检查（等价于 ArchUnit）
run_check "Frontend Architecture (dependency-cruiser)" "npx depcruise src/ --config .dependency-cruiser.cjs"

# 6. 后端 Ruff Lint（等价于 Checkstyle）
run_check "Backend Ruff Lint" "uv run ruff check server/"

# 7. 后端 MyPy 类型检查
run_check "Backend MyPy Type Check" "uv run mypy server/ --config-file pyproject.toml"

# 8. 后端分层依赖检查（等价于 ArchUnit）+ 三要素错误信息
check_import_linter() {
  local output
  output=$(uv run lint-imports 2>&1)
  local rc=$?
  echo "$output"
  if [ $rc -ne 0 ]; then
    echo ""
    echo "$output" | grep 'BROKEN' | while IFS= read -r line; do
      local contract_name
      contract_name=$(echo "$line" | sed 's/ BROKEN.*//' | sed 's/^.*\. //')
      case "$contract_name" in
        "Routes cannot import models directly")
          echo "  ❌ Routes 直接 import 了 Models（绕过 Service 层）"
          echo "  ✅ FIX: 在 Service 层编排数据访问，Routes 只持有 Service 引用"
          echo "  📖 See: docs/architecture/boundaries.md"
          ;;
        "Nodes cannot import routes")
          echo "  ❌ Nodes 直接 import 了 Routes（Node 应只返回 State）"
          echo "  ✅ FIX: Node 只返回 State，HTTP 响应由 routes 层处理"
          echo "  📖 See: docs/architecture/boundaries.md"
          ;;
        *)
          echo "  ❌ 分层依赖违规: $contract_name"
          echo "  ✅ FIX: 参阅 docs/architecture/boundaries.md 依赖方向规则"
          echo "  📖 See: docs/architecture/boundaries.md"
          ;;
      esac
    done
    return 1
  fi
  return 0
}
run_check "Backend Architecture (import-linter)" "check_import_linter"

# 9. 后端单元测试 + 覆盖率（等价于 JaCoCo ≥ 80%）
run_check "Backend Tests + Coverage >= 80%" "uv run pytest server/ --cov=server --cov-report=term-missing --cov-fail-under=80"

# 10. 文档新鲜度检查（PDF CI 中的 Doc Freshness step）
check_doc_freshness() {
  local max_days=60
  local found_stale=0
  for f in $(find docs/ -name '*.md' -not -name '_template.md'); do
    if [ -d .git ]; then
      last_mod=$(git log -1 --format=%ct -- "$f" 2>/dev/null)
      if [ -z "$last_mod" ]; then
        echo "  ⚠️  $f 无 git 历史（新文件），跳过"
        continue
      fi
      now=$(date +%s)
      days_old=$(( (now - last_mod) / 86400 ))
      if [ "$days_old" -gt "$max_days" ]; then
        echo "  ❌ $f 已 ${days_old} 天未更新，可能已过期"
        echo "  ✅ FIX: 检查内容是否与代码一致，更新后提交"
        echo "  📖 See: docs/conventions/pitfalls.md"
        found_stale=1
      fi
    fi
  done
  return $found_stale
}
run_check "Doc Freshness (max 60 days)" "check_doc_freshness"

# 11. 文件大小 + Python 函数长度检查（PDF: 单文件 ≤ 300 行, 单方法 ≤ 50 行）
check_file_size() {
  local max_file=300
  local max_func=50
  local found_violation=0

  for f in $(find src/ -name '*.ts' -o -name '*.tsx' 2>/dev/null) $(find server/ -name '*.py' -not -path '*/__pycache__/*' -not -path '*/tests/*' 2>/dev/null); do
    lines=$(wc -l < "$f")
    if [ "$lines" -gt "$max_file" ]; then
      echo "  ❌ $f: ${lines} 行 (上限 ${max_file})"
      echo "  ✅ FIX: 拆分为更小的模块/组件"
      echo "  📖 See: docs/conventions/coding.md"
      found_violation=1
    fi
  done

  python3 -c "
import ast, os, sys
max_func = ${max_func}
violations = []
for root, dirs, files in os.walk('server'):
    dirs[:] = [d for d in dirs if d not in ('__pycache__', 'tests', '.venv')]
    for fname in files:
        if not fname.endswith('.py'): continue
        fpath = os.path.join(root, fname)
        with open(fpath) as f:
            source = f.read()
        try:
            tree = ast.parse(source)
        except SyntaxError:
            continue
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                end = getattr(node, 'end_lineno', node.lineno)
                func_lines = end - node.lineno + 1
                if func_lines > max_func:
                    violations.append(f'  ❌ {fpath}:{node.lineno} {node.name} ({func_lines} 行, 上限 {max_func})')
if violations:
    print('\n'.join(violations))
    print('  ✅ FIX: 抽取私有方法或将职责下沉到 Service / Domain')
    print('  📖 See: docs/conventions/coding.md')
    sys.exit(1)
" || found_violation=1

  return $found_violation
}
run_check "File & Function Size (max 300 lines / 50 lines per function)" "check_file_size"

# 12. 技术栈基线一致性检查（P008: AGENTS.md 声明版本 vs 实际安装版本）
check_tech_stack_alignment() {
  local found_mismatch=0

  local agents_react pkg_react
  agents_react=$(grep -oE 'React [0-9]+' AGENTS.md | head -1 | grep -oE '[0-9]+')
  pkg_react=$(grep '"react":' package.json | head -1 | grep -oE '\^?[0-9]+' | head -1 | tr -d '^')
  if [ -n "$agents_react" ] && [ -n "$pkg_react" ] && [ "$agents_react" != "$pkg_react" ]; then
    echo "  ❌ AGENTS.md 声明 React $agents_react，但 package.json 实际安装 React $pkg_react"
    echo "  ✅ FIX: 统一 AGENTS.md 基线与 package.json 实际版本"
    echo "  📖 See: docs/conventions/pitfalls.md (P008)"
    found_mismatch=1
  fi

  local agents_python pyproject_python
  agents_python=$(grep -oE 'Python [0-9.]+' AGENTS.md | head -1 | grep -oE '[0-9.]+')
  pyproject_python=$(grep 'requires-python' pyproject.toml | grep -oE '[0-9.]+')
  if [ -n "$agents_python" ] && [ -n "$pyproject_python" ] && [ "$agents_python" != "$pyproject_python" ]; then
    echo "  ❌ AGENTS.md 声明 Python $agents_python，但 pyproject.toml requires-python >= $pyproject_python"
    echo "  ✅ FIX: 统一 AGENTS.md 基线与 pyproject.toml requires-python 版本"
    echo "  📖 See: docs/conventions/pitfalls.md (P008)"
    found_mismatch=1
  fi

  local agents_vite pkg_vite
  agents_vite=$(grep -oE 'Vite [0-9]+' AGENTS.md | head -1 | grep -oE '[0-9]+')
  pkg_vite=$(grep '"vite":' package.json | head -1 | grep -oE '\^?[0-9]+' | head -1 | tr -d '^')
  if [ -n "$agents_vite" ] && [ -n "$pkg_vite" ] && [ "$agents_vite" != "$pkg_vite" ]; then
    echo "  ❌ AGENTS.md 声明 Vite $agents_vite，但 package.json 实际安装 Vite $pkg_vite"
    echo "  ✅ FIX: 统一 AGENTS.md 基线与 package.json 实际版本"
    echo "  📖 See: docs/conventions/pitfalls.md (P008)"
    found_mismatch=1
  fi

  if [ $found_mismatch -eq 0 ]; then
    echo "  技术栈基线一致: React $agents_react / Python $agents_python / Vite $agents_vite"
  fi

  return $found_mismatch
}
run_check "Tech Stack Baseline Alignment (AGENTS.md vs actual)" "check_tech_stack_alignment"

# ---------- Check 13: Git Tracking ----------
check_git_tracking() {
  local missing=0
  for f in progress.txt feature_list.json; do
    if ! git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
      echo "  ❌ $f 未被 Git 追踪"
      echo "  ✅ FIX: git add $f"
      echo "  📖 See: docs/conventions/pitfalls.md (P004)"
      missing=1
    fi
  done
  if [ $missing -eq 0 ]; then
    echo "  progress.txt 和 feature_list.json 均已被 Git 追踪"
  fi
  return $missing
}
run_check "Git Tracking (progress.txt + feature_list.json)" "check_git_tracking"

# ---------- Check 14: Port Consistency ----------
check_port_consistency() {
  local preview_port vite_port
  preview_port=$(awk -F '[ =]+' '/^expose_port/ {print $2; exit}' .preview 2>/dev/null)
  vite_port=$(grep -oE 'port:[[:space:]]*[0-9]+' vite.config.ts | head -1 | grep -oE '[0-9]+')
  if [ -z "$preview_port" ] || [ -z "$vite_port" ]; then
    echo "  ⚠️ 无法读取端口配置（.preview=$preview_port, vite=$vite_port），跳过"
    return 0
  fi
  if [ "$preview_port" != "$vite_port" ]; then
    echo "  ❌ .preview expose_port=$preview_port 与 vite.config.ts port=$vite_port 不一致"
    echo "  ✅ FIX: 统一两个文件中的端口配置"
    echo "  📖 See: docs/architecture/boundaries.md"
    return 1
  fi
  echo "  端口一致: .preview=$preview_port vite.config.ts=$vite_port"
  return 0
}
run_check "Port Consistency (.preview vs vite.config.ts)" "check_port_consistency"

echo ""
echo "=========================================="
echo "  Results: ${PASS} passed, ${FAIL} failed"
if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}  ❌ VERIFY FAILED - 代码不允许合并${NC}"
  echo "  修复所有失败项后重新运行 scripts/verify.sh"
  exit 1
else
  echo -e "${GREEN}  ✅ VERIFY PASSED - 代码通过所有闸门${NC}"
  exit 0
fi
