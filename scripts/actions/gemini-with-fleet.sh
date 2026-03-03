#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/Users/webkubor/Documents/CortexOS"
TASK="${FLEET_TASK:-待分配任务}"
ROLE="${FLEET_ROLE:-未分配}"
WORKSPACE="${PWD}"
DRY_RUN=0
FORCE_SWITCH=0
PASS_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --task)
      if [[ $# -ge 2 && "${2:-}" != --* ]]; then
        TASK="$2"
        shift 2
      else
        shift
      fi
      ;;
    --workspace)
      if [[ $# -ge 2 && "${2:-}" != --* ]]; then
        WORKSPACE="$2"
        shift 2
      else
        shift
      fi
      ;;
    --role)
      if [[ $# -ge 2 && "${2:-}" != --* ]]; then
        ROLE="$2"
        shift 2
      else
        shift
      fi
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --force-switch)
      FORCE_SWITCH=1
      shift
      ;;
    --)
      shift
      while [[ $# -gt 0 ]]; do
        PASS_ARGS+=("$1")
        shift
      done
      ;;
    *)
      PASS_ARGS+=("$1")
      shift
      ;;
  esac
done

if ! command -v gemini >/dev/null 2>&1; then
  echo "未找到 gemini 命令，请先安装并确保在 PATH 中。"
  exit 1
fi

CLAIM_ARGS=(
  --workspace "$WORKSPACE"
  --task "$TASK" \
  --agent "Gemini"
  --role "$ROLE"
)

if [[ "$DRY_RUN" == "1" ]]; then
  CLAIM_ARGS+=(--dry-run)
fi

if [[ "$FORCE_SWITCH" == "1" ]]; then
  CLAIM_ARGS+=(--force-switch)
fi

CLAIM_JSON="$(node "$ROOT_DIR/scripts/actions/fleet-claim.mjs" "${CLAIM_ARGS[@]}")"
echo "$CLAIM_JSON"

WARN_TEXT="$(echo "$CLAIM_JSON" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{try{const j=JSON.parse(d);const w=Array.isArray(j.warnings)?j.warnings:[];if(w.length)process.stdout.write(w.join("；"));}catch{}})' || true)"
if [[ -n "$WARN_TEXT" ]]; then
  echo "⚠️  $WARN_TEXT"
  if command -v osascript >/dev/null 2>&1; then
    _notif="${WARN_TEXT//\"/\\\"}"
    osascript -e "display notification \"${_notif}\" with title \"AI Team 冲突提示\"" >/dev/null 2>&1 || true
  fi
fi

MACHINE_NUMBER="$(echo "$CLAIM_JSON" | sed -n 's/.*"machineNumber":[[:space:]]*\([0-9][0-9]*\).*/\1/p' | head -n1)"
NODE_ID="$(echo "$CLAIM_JSON" | sed -n 's/.*"nodeId":[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)"
MACHINE_NUMBER="${MACHINE_NUMBER:-unknown}"
NODE_ID="${NODE_ID:-Gemini-unknown}"
QUEUE_PREFIX="[AI-TEAM][${NODE_ID}][#${MACHINE_NUMBER}]"

echo "✅ 已入队: ${QUEUE_PREFIX} workspace=${WORKSPACE} role=${ROLE} task=${TASK}"
echo "📍 入场前缀(参考): ${QUEUE_PREFIX}"
echo "🧠 启动模式: 直接进入 Gemini（不注入 \$start，默认依赖 ~/.gemini/GEMINI.md 长期记忆）"

if [[ "$DRY_RUN" == "1" ]]; then
  echo "=== Dry Run ==="
  echo "gemini 将直接启动，不注入额外启动提示。"
  exit 0
fi

if [[ ${#PASS_ARGS[@]} -gt 0 ]]; then
  for arg in "${PASS_ARGS[@]}"; do
    if [[ "$arg" == "--help" || "$arg" == "-h" || "$arg" == "--version" || "$arg" == "-V" ]]; then
      exec gemini "${PASS_ARGS[@]}"
    fi
  done
  exec gemini "${PASS_ARGS[@]}"
fi

exec gemini
