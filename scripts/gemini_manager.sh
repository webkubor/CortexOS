#!/bin/bash
# Gemini Profile Manager & Failover Helper
# Path: /Users/webkubor/Documents/AI_Common/docs/scripts/gemini_manager.sh

GEMINI_DIR="$HOME/.gemini"
PROFILE_STORE="$HOME/Documents/AI_Common/docs/secrets/gemini_profiles"
LOGGER="$HOME/Documents/AI_Common/docs/scripts/log.sh"

# Ensure profile store exists
mkdir -p "$PROFILE_STORE"

function show_help() {
    echo "🤖 Gemini Profile Manager"
    echo "Usage: $0 {save|switch|list|status} [profile_name]"
}

function log() {
    if [ -x "$LOGGER" ]; then
        $LOGGER "$1" "$2" "$3"
    fi
}

function save_profile() {
    NAME=$1
    if [ -z "$NAME" ]; then echo "❌ Error: Please provide a profile name. (e.g., $0 save work)"; return 1; fi
    
    TARGET="$PROFILE_STORE/$NAME"
    mkdir -p "$TARGET"
    
    if [ ! -f "$GEMINI_DIR/oauth_creds.json" ]; then
        echo "⚠️  Warning: No active 'oauth_creds.json' found in ~/.gemini/"
        return 1
    fi

    cp "$GEMINI_DIR/oauth_creds.json" "$TARGET/" 2>/dev/null
    cp "$GEMINI_DIR/google_accounts.json" "$TARGET/" 2>/dev/null
    
    # Extract email for logging
    ACCOUNT=$(grep '"active":' "$TARGET/google_accounts.json" | cut -d: -f2 | tr -d ' ",')
    
    echo "✅ Current session saved as: '$NAME'"
    log "AUTH" "Saved profile: $NAME" "$ACCOUNT"
}

function switch_profile() {
    NAME=$1
    if [ -z "$NAME" ]; then echo "❌ Error: Please provide a profile name."; return 1; fi
    
    TARGET="$PROFILE_STORE/$NAME"
    if [ ! -d "$TARGET" ]; then 
        echo "❌ Profile '$NAME' not found in $PROFILE_STORE"
        return 1
    fi
    
    echo "🔄 Switching to profile: '$NAME'..."
    cp "$TARGET/oauth_creds.json" "$GEMINI_DIR/" 2>/dev/null
    cp "$TARGET/google_accounts.json" "$GEMINI_DIR/" 2>/dev/null
    
    # Extract email for logging
    ACCOUNT=$(grep '"active":' "$TARGET/google_accounts.json" | cut -d: -f2 | tr -d ' ",')
    
    echo "🎉 Switched! You are now using '$NAME' identity."
    log "AUTH" "Switched to profile: $NAME" "$ACCOUNT"
}

function list_profiles() {
    echo "📂 Stored Profiles:"
    if [ -d "$PROFILE_STORE" ]; then
        ls -1 "$PROFILE_STORE"
    else
        echo "No profiles found."
    fi
}

function check_status() {
    if [ ! -f "$GEMINI_DIR/google_accounts.json" ]; then
        echo "❌ No active session found (Not logged in)."
        return
    fi

    CURRENT_ACCOUNT=$(grep '"active":' "$GEMINI_DIR/google_accounts.json" | cut -d: -f2 | tr -d ' ",')
    
    if [ -z "$CURRENT_ACCOUNT" ]; then
        echo "❌ No active account detected in ~/.gemini/google_accounts.json"
        return
    fi

    FOUND=0
    for profile_path in "$PROFILE_STORE"/*; do
        if [ -d "$profile_path" ]; then
            P_NAME=$(basename "$profile_path")
            P_ACCOUNT=$(grep '"active":' "$profile_path/google_accounts.json" | cut -d: -f2 | tr -d ' ",')
            
            if [ "$CURRENT_ACCOUNT" == "$P_ACCOUNT" ]; then
                echo "✅ Active Profile: $P_NAME ($CURRENT_ACCOUNT)"
                FOUND=1
                break
            fi
        fi
    done
    
    if [ "$FOUND" -eq 0 ]; then
        echo "⚠️  Active session ($CURRENT_ACCOUNT) is UNKNOWN (not saved in any profile)."
        echo "👉 Suggest running: $0 save <name>"
    fi
}

# Main Dispatch
CMD=$1
ARG=$2

case $CMD in
    save) save_profile "$ARG" ;;
    switch) switch_profile "$ARG" ;;
    list) list_profiles ;;
    status) check_status ;;
    *) show_help ;;
esac
