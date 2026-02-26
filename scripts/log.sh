#!/bin/bash
# Universal Logger for AI Agent Operations
# Path: /Users/webkubor/Documents/AI_Common/docs/scripts/log.sh

LOG_DIR="$HOME/Documents/AI_Common/docs/operation-logs"
DATE=$(date +%Y-%m-%d)
TIME=$(date "+%H:%M:%S")
LOG_FILE="$LOG_DIR/$DATE.md"

mkdir -p "$LOG_DIR"

# Ensure header exists
if [ ! -f "$LOG_FILE" ]; then
    echo "# Operation Log: $DATE" > "$LOG_FILE"
    echo "| Time | Type | Action | Identity |
| :--- | :--- | :--- | :--- |
" >> "$LOG_FILE"
fi

TYPE=$1   # e.g., AUTH, GIT, DEPLOY
ACTION=$2 # e.g., "Switched to secondary"
IDENTITY=$3 # Optional: current account

# If identity is not provided, try to detect it
if [ -z "$IDENTITY" ]; then
    # Try to reuse the logic from gemini_manager.sh if available, otherwise just say "System"
    MANAGER="$HOME/Documents/AI_Common/docs/scripts/gemini_manager.sh"
    if [ -x "$MANAGER" ]; then
        IDENTITY=$($MANAGER status | grep "Active Profile" | sed 's/.*Active Profile: \([^ ]*\).*/\1/')
    fi
    IDENTITY=${IDENTITY:-"System"}
fi

# Append to table
echo "| $TIME | **$TYPE** | $ACTION | \`$IDENTITY\` |" >> "$LOG_FILE"
