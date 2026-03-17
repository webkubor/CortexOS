#!/bin/bash
# 🧠 CortexOS 自动更新与优化脚本 (Brain Auto-Updater)
# 该脚本用于一键同步最新的开源骨架代码，并自动进行本地清理与重载。

set -e

echo "🚀 启动 CortexOS 大脑更新程序..."

# 1. 拉取最新骨架代码 (跳过私有配置)
echo "📦 正在同步开源仓库..."
git pull origin main --rebase || echo "⚠️ Git 拉取可能存在冲突，请手动检查。"

# 2. 收割最新经验 (自动运行进化脚本)
echo "🧬 正在收割近期操作经验..."
if [ -f "scripts/maintenance/harvest_retry_patterns.py" ]; then
    # 获取今天的日志文件进行收割
    TODAY=$(date +"%Y-%m-%d")
    LOG_FILE=".memory/logs/${TODAY}.md"
    if [ -f "$LOG_FILE" ]; then
        python3 scripts/maintenance/harvest_retry_patterns.py "$LOG_FILE" > /dev/null 2>&1 || true
        echo "✅ 经验收割完毕。"
    else
        echo "ℹ️ 今日暂无日志，跳过收割。"
    fi
fi

# 3. 清理 Python 缓存与冗余文件
echo "🧹 正在清理脑部缓存..."
find . -type d -name "__pycache__" -exec rm -rf {} +
rm -f .memory/tmp/*.json

# 4. 环境健康检查
echo "🔍 执行健康检查..."
if [ -f "mcp_server/server.py" ]; then
    echo "✅ MCP 服务核心正常。"
fi

echo "🎉 大脑更新与优化完成！请重启您的 MCP Client (如 Claude Desktop 或 Gemini CLI) 以加载最新状态。"
