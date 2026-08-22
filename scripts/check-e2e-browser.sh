#!/usr/bin/env bash
# E2E 浏览器版本匹配检测
# 语义: 从 playwright-core 元数据读取所需 revision, 与本地缓存比对
# 输出: 第一行 MATCHED 或 SKIP, 后续行为诊断信息
# 匹配→调用方执行 E2E; 不匹配→调用方 skip+WARN; 始终 exit 0

set -euo pipefail

# ---------- 定位 browsers.json ----------
BROWSERS_JSON=""
for f in \
  node_modules/.pnpm/playwright-core@*/node_modules/playwright-core/browsers.json \
  node_modules/playwright-core/browsers.json; do
  # shellcheck disable=SC2086
  if [ -f "$f" ]; then
    BROWSERS_JSON="$f"
    break
  fi
done

if [ -z "$BROWSERS_JSON" ]; then
  echo "SKIP"
  echo "  ⚠️ E2E skipped: playwright-core browsers.json not found"
  echo "  💡 Install: pnpm install"
  exit 0
fi

# ---------- 提取所需 revision ----------
# chromium 与 chromium-headless-shell 共用同一 revision (playwright 设计),
# 但分别读取以保持正确性
REVISIONS=$(node -e "
  const data = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
  const c = data.browsers.find(b => b.name === 'chromium');
  const s = data.browsers.find(b => b.name === 'chromium-headless-shell');
  process.stdout.write((c ? c.revision : '') + ' ' + (s ? s.revision : ''));
" "$BROWSERS_JSON")
read -r REQUIRED_CHROMIUM_REV REQUIRED_SHELL_REV <<< "$REVISIONS"

if [ -z "$REQUIRED_CHROMIUM_REV" ] || [ -z "$REQUIRED_SHELL_REV" ]; then
  echo "SKIP"
  echo "  ⚠️ E2E skipped: cannot determine required revision from browsers.json"
  exit 0
fi

# ---------- PLAYWRIGHT_BROWSERS_PATH=0: 系统 chromium ----------
if [ "${PLAYWRIGHT_BROWSERS_PATH:-}" = "0" ]; then
  if command -v chromium >/dev/null 2>&1 || command -v chromium-browser >/dev/null 2>&1 || command -v google-chrome >/dev/null 2>&1; then
    echo "MATCHED"
    echo "  System Chromium detected (PLAYWRIGHT_BROWSERS_PATH=0, version unverifiable)"
    exit 0
  fi
  echo "SKIP"
  echo "  ⚠️ E2E skipped: no system Chromium found (PLAYWRIGHT_BROWSERS_PATH=0)"
  exit 0
fi

# ---------- 缓存目录版本匹配 ----------
CACHE_DIR="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}"

if [ ! -d "$CACHE_DIR" ]; then
  echo "SKIP"
  echo "  ⚠️ E2E skipped: browser cache dir not found ($CACHE_DIR)"
  echo "  Required: chromium-${REQUIRED_CHROMIUM_REV} + chromium_headless_shell-${REQUIRED_SHELL_REV}"
  echo "  💡 Install: pnpm exec playwright install chromium"
  exit 0
fi

has_chromium=0
has_shell=0

# 仅在所需 revision 目录内查找, 保持 F012 M1 三处修正语义:
# maxdepth 3 / chrome-linux64 路径 / headless_shell 双命名兼容
if [ -d "$CACHE_DIR/chromium-${REQUIRED_CHROMIUM_REV}" ]; then
  chromium_count=$(find "$CACHE_DIR/chromium-${REQUIRED_CHROMIUM_REV}" -maxdepth 3 -name 'chrome' \( -path '*/chrome-linux64/*' -o -path '*/chrome-linux/*' \) 2>/dev/null | wc -l)
  if [ "$chromium_count" -gt 0 ]; then
    has_chromium=1
  fi
fi

if [ -d "$CACHE_DIR/chromium_headless_shell-${REQUIRED_SHELL_REV}" ]; then
  shell_count=$(find "$CACHE_DIR/chromium_headless_shell-${REQUIRED_SHELL_REV}" -maxdepth 3 \( -name 'headless_shell' -o -name 'chrome-headless-shell' \) \( -path '*/chrome-headless-shell-linux64/*' -o -path '*/chrome-linux/*' \) 2>/dev/null | wc -l)
  if [ "$shell_count" -gt 0 ]; then
    has_shell=1
  fi
fi

if [ "$has_chromium" -eq 1 ] && [ "$has_shell" -eq 1 ]; then
  echo "MATCHED"
  echo "  Browser version matched: chromium-${REQUIRED_CHROMIUM_REV} + chromium_headless_shell-${REQUIRED_SHELL_REV}"
  exit 0
fi

# ---------- 版本不匹配: skip + WARN + 证据 ----------
echo "SKIP"
echo "  ⚠️ E2E skipped: browser version mismatch"
echo "  Required (from browsers.json):"
echo "    chromium revision: ${REQUIRED_CHROMIUM_REV}"
echo "    chromium-headless-shell revision: ${REQUIRED_SHELL_REV}"
echo "  Found in cache:"
existing=$(find "$CACHE_DIR" -maxdepth 1 -type d \( -name 'chromium-*' -o -name 'chromium_headless_shell-*' \) 2>/dev/null | sort)
if [ -z "$existing" ]; then
  echo "    (none)"
else
  echo "$existing" | while IFS= read -r d; do
    echo "    $(basename "$d")"
  done
fi
echo "  💡 Install: pnpm exec playwright install chromium"
exit 0
