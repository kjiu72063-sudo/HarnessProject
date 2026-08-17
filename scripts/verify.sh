#!/usr/bin/env bash
# Harness Platform - Verify 闸门
# 等价于 PDF 中的 `mvn -B clean verify` 全链路
# 编译检查 + 分层依赖检查 + Lint + 类型检查 + 覆盖率 ≥ 80%
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
