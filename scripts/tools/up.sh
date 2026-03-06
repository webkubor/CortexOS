#!/bin/bash
# 🚀 Universal Image Uploader Wrapper
# Usage: up <local_path> [custom_name] [--r2]

LOCAL_PATH="$1"
CUSTOM_NAME="$2"
USE_R2=false

# Simple arg parsing
for arg in "$@"; do
    if [[ "$arg" == "--r2" || "$arg" == "-r" ]]; then
        USE_R2=true
        # Shift args to handle path/name correctly if needed, but for simplicity:
        if [[ "$LOCAL_PATH" == "$arg" ]]; then LOCAL_PATH="$2"; CUSTOM_NAME="$3"; fi
    fi
done

if [[ -z "$LOCAL_PATH" ]]; then
    echo "❌ Usage: up <file_path> [custom_name] [--r2]"
    exit 1
fi

if [[ "$USE_R2" == true ]]; then
    echo "🌩️  Routing to R2..."
    node /Users/webkubor/.agents/skills/r2-uploader/upload.js "$LOCAL_PATH" "$CUSTOM_NAME"
else
    echo "🐙 Routing to GitHub (Default)..."
    node /Users/webkubor/.agents/skills/github-uploader/upload.js "$LOCAL_PATH" "$CUSTOM_NAME"
fi
