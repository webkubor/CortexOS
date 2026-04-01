#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit scripts/verify-ai-init.sh scripts/setup-git-hooks.sh

echo "✅ Git hooks 已启用 (core.hooksPath=.githooks)"
