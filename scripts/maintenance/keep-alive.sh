#!/bin/bash
# CortexOS Daemon Keep-Alive
# Author: Candle (Xiao Zhu)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ASSISTANT_MEMORY_HOME="${CORTEXOS_ASSISTANT_MEMORY_HOME:-$PROJECT_ROOT/.memory}"
LOG_FILE="$ASSISTANT_MEMORY_HOME/logs/daemon-status.log"
mkdir -p "$(dirname "$LOG_FILE")"

# 进程检查与自动拉起函数
# $1: 进程友好名称, $2: 匹配正则, $3: 启动命令
check_process() {
    NAME=$1
    PATTERN=$2
    CMD=$3
    
    if ! ps aux | grep "$PATTERN" | grep -v grep > /dev/null; then
        echo "[$(date)] ⚠️  $NAME (Pattern: $PATTERN) is DOWN. Restarting..." >> "$LOG_FILE"
        $CMD &
    else
        echo "[$(date)] ✅ $NAME is running." >> "$LOG_FILE"
    fi
}

# 1. Auto-Pilot (Brain Sync)
# Note: auto-pilot.js is usually long-running or interval-based. 
# Current check focuses on its presence in ps.
check_process "Auto-Pilot" "scripts/core/auto-pilot.js" "node $PROJECT_ROOT/scripts/core/auto-pilot.js"
