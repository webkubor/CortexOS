#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/Users/webkubor/Documents/AI_Common"
TASK="${FLEET_TASK:-待分配任务}"
WORKSPACE="${PWD}"
USE_START=1
DRY_RUN=0
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
    --skip-start)
      USE_START=0
      shift
      ;;
    --dry-run)
      DRY_RUN=1
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

if ! command -v codex >/dev/null 2>&1; then
  echo "未找到 codex 命令，请先安装并确保在 PATH 中。"
  exit 1
fi

CLAIM_ARGS=(
  --workspace "$WORKSPACE"
  --task "$TASK"
  --agent "Codex"
  --alias "Codex"
)

if [[ "$DRY_RUN" == "1" ]]; then
  CLAIM_ARGS+=(--dry-run)
fi

CLAIM_JSON="$(node "$ROOT_DIR/scripts/actions/fleet-claim.mjs" "${CLAIM_ARGS[@]}")"
echo "$CLAIM_JSON"

MACHINE_NUMBER="$(echo "$CLAIM_JSON" | sed -n 's/.*"machineNumber":[[:space:]]*\([0-9][0-9]*\).*/\1/p' | head -n1)"
NODE_ID="$(echo "$CLAIM_JSON" | sed -n 's/.*"nodeId":[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)"
MACHINE_NUMBER="${MACHINE_NUMBER:-unknown}"
NODE_ID="${NODE_ID:-Codex-unknown}"

if [[ "$USE_START" == "1" ]]; then
  START_BLOCK='$start
请立即执行 start skill，先只读 router 并按懒加载机制继续。'
else
  START_BLOCK='(已跳过 $start 注入)'
fi

BOOTSTRAP_PROMPT="$(cat <<EOF
${START_BLOCK}

你正在接入 AI_Common 外部大脑，请先完成以下事项再进入常规任务：
1. 确认路由文件：/Users/webkubor/Documents/AI_Common/docs/router.md
2. 确认编排板登记：${NODE_ID}（机号：${MACHINE_NUMBER}）
3. 如与其他节点存在文件冲突风险，先给出冲突提示再执行
4. 首次回复请报告：已挂载路由 + 当前机号 + 当前工作路径
5. 若当前任务为“待分配任务”，一旦拿到明确需求，立即回填：
   node /Users/webkubor/Documents/AI_Common/scripts/actions/fleet-claim.mjs --workspace "${WORKSPACE}" --task "<明确任务>" --agent "Codex" --alias "Codex"
6. 用户称呼协议：默认称呼用户为“老爹”；若上一条遗漏称呼，下一条先纠正再继续任务。
EOF
)"

if [[ "$DRY_RUN" == "1" ]]; then
  echo
  echo "=== Bootstrap Prompt Preview ==="
  echo "$BOOTSTRAP_PROMPT"
  exit 0
fi

if [[ ${#PASS_ARGS[@]} -gt 0 ]]; then
  for arg in "${PASS_ARGS[@]}"; do
    if [[ "$arg" == "--help" || "$arg" == "-h" || "$arg" == "--version" || "$arg" == "-V" ]]; then
      exec codex "${PASS_ARGS[@]}"
    fi
  done
  exec codex "${PASS_ARGS[@]}" "$BOOTSTRAP_PROMPT"
fi

exec codex "$BOOTSTRAP_PROMPT"
