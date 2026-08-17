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

# 3. 前端分层依赖检查（等价于 ArchUnit）
run_check "Frontend Architecture (dependency-cruiser)" "npx depcruise src/ --config .dependency-cruiser.cjs"

# 4. 后端 Ruff Lint（等价于 Checkstyle）
run_check "Backend Ruff Lint" "uv run ruff check server/"

# 5. 后端 MyPy 类型检查
run_check "Backend MyPy Type Check" "uv run mypy server/ --config-file pyproject.toml"

# 6. 后端分层依赖检查（等价于 ArchUnit）
run_check "Backend Architecture (import-linter)" "uv run lint-imports"

# 7. 后端单元测试 + 覆盖率（等价于 JaCoCo ≥ 80%）
run_check "Backend Tests + Coverage >= 80%" "uv run pytest server/ --cov=server --cov-report=term-missing --cov-fail-under=80"

# 8. 文档新鲜度检查（PDF CI 中的 Doc Freshness step）
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
