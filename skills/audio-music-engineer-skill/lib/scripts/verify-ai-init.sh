#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

required_files=(
  ".agent/PROJECT.md"
  ".agent/MODULE_INDEX.md"
  ".agent/DESIGN_SYSTEM.md"
  ".agent/plans/README.md"
  ".agent/reviews/README.md"
)

missing=()
for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    missing+=("$file")
  fi
done

if [[ ! -f "README.md" ]]; then
  missing+=("README.md")
fi

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "❌ [AI 初始化检查失败] 缺少必备文件:"
  for file in "${missing[@]}"; do
    echo "  - $file"
  done
  exit 1
fi

readme_head="$(head -n 20 README.md)"
if ! grep -q "^# AI Context" <<<"$readme_head"; then
  echo "❌ [AI 初始化检查失败] README 头部缺少 '# AI Context' 导航。"
  exit 1
fi

if ! grep -q "\.agent/PROJECT\.md" <<<"$readme_head"; then
  echo "❌ [AI 初始化检查失败] README 头部缺少 '.agent/PROJECT.md' 导航链接。"
  exit 1
fi

echo "✅ AI 初始化检查通过。"
