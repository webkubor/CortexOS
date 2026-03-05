#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TASK="${FLEET_TASK:-待分配任务}"
ROLE="${FLEET_ROLE:-未分配}"
WORKSPACE="${PWD}"
USE_START=1
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
    --skip-start)
      USE_START=0
      shift
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

LAUNCHER=()
if command -v claude >/dev/null 2>&1; then
  LAUNCHER=(claude)
else
  echo "未找到 claude 命令，请先安装并确保在 PATH 中。"
  exit 1
fi

CLAIM_ARGS=(
  --workspace "$WORKSPACE"
  --task "$TASK"
  --agent "Claude"
  --alias "Claude"
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
NODE_ID="${NODE_ID:-Claude-unknown}"
QUEUE_PREFIX="[AI-TEAM][${NODE_ID}][#${MACHINE_NUMBER}]"

echo "✅ 已入队: ${QUEUE_PREFIX} workspace=${WORKSPACE} role=${ROLE} task=${TASK}"
echo "📍 入场前缀: ${QUEUE_PREFIX}"

if [[ "$USE_START" == "1" ]]; then
  START_BLOCK='$start
请立即执行 start skill，先只读 router 并按懒加载机制继续。'
else
  START_BLOCK='(已跳过 $start 注入)'
fi

BOOTSTRAP_PROMPT="$(cat <<EOF
${START_BLOCK}

你正在接入 CortexOS 外部大脑，请先完成以下事项再进入常规任务：
1. 确认路由文件：$ROOT_DIR/docs/router.md
2. 确认编排板登记：${NODE_ID}（机号：${MACHINE_NUMBER}）
3. 如与其他节点存在文件冲突风险，先给出冲突提示再执行
4. 首次回复必须以此前缀开头：${QUEUE_PREFIX}
5. 首次回复请报告：已挂载路由 + 当前机号 + 当前工作路径
6. 若当前任务为“待分配任务”或角色为“未分配”，一旦拿到明确需求，立即回填：
   node "$ROOT_DIR/scripts/actions/fleet-claim.mjs" --workspace "${WORKSPACE}" --task "<明确任务>" --agent "Claude" --alias "Claude" --role "<前端|后端>"
7. 用户称呼协议：默认称呼用户为“老爹”；若上一条遗漏称呼，下一条先纠正再继续任务。
8. 若用户说“移交队长给 XXX / 把0号机交给 XXX / 队长切到 XXX”，直接触发：
   cd "$ROOT_DIR" && pnpm run fleet:handover -- --to-node "XXX"
9. 语言协议：默认且全程使用中文回复；仅在代码、命令、路径、专有名词场景保留英文。
10. 每次任务完成后，必须调用 MCP Tool：
    task_handoff_check(task_id="<task-id>", agent="Claude", summary="<一句话结果>")
    用于标记任务完成并检查是否有未认领任务。
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
      exec "${LAUNCHER[@]}" "${PASS_ARGS[@]}"
    fi
  done
  exec "${LAUNCHER[@]}" "${PASS_ARGS[@]}" "$BOOTSTRAP_PROMPT"
fi

exec "${LAUNCHER[@]}" "$BOOTSTRAP_PROMPT"
