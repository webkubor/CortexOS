#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANAGER="$DIR/gemini_manager.sh"
LOGGER="$DIR/log.sh"

# 直接提取 Profile 名字
P=$($MANAGER status | grep "Active Profile" | sed 's/.*Active Profile: \([^ ]*\).*/\1/')
echo -e "\033[1;30m[$P]\033[0m"

if [[ "$*" == *"-p"* ]] || [[ "$*" == *"--prompt"* ]]; then
    TMP_LOG=$(mktemp)
    gemini "$@" 2>&1 | tee "$TMP_LOG"
    if grep -iqE "Quota exceeded|429|Too Many Requests" "$TMP_LOG"; then
        echo -e "\n\033[1;33m⚠️  Quota Limit! Switching...\033[0m"
        
        # Log failover event
        if [ -x "$LOGGER" ]; then
            $LOGGER "FAILOVER" "Quota exceeded on profile $P. Initiating switch."
        fi

        [ "$P" == "primary" ] && $MANAGER switch secondary || $MANAGER switch primary
        
        echo -e "\033[1;32m🔄 Retrying...\033[0m\n"
        gemini "$@"
    fi
    rm "$TMP_LOG"
else
    gemini "$@"
fi
