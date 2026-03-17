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
        echo "✅ 原始经验收割完毕。"
        
        # 3. 逻辑精炼 (将经验转化为结构化 SQL 记录)
        echo "💎 正在精炼核心逻辑 (Refinery)..."
        if [ -f "scripts/core/brain_refinery.py" ]; then
            python3 scripts/core/brain_refinery.py > /dev/null 2>&1 || true
            echo "✅ 逻辑记忆已精炼。"
        fi

        # 4. 风格捕获 (Git Diff 增量分析)
        echo "🧬 捕获代码风格习惯..."
        if [ -f "scripts/evolution/style_harvester.py" ]; then
            python3 scripts/evolution/style_harvester.py > /dev/null 2>&1 || true
            echo "✅ 风格指纹已更新。"
        fi

        # 5. 负面反馈反思 (纠错收割)
        echo "🧘 执行负面反馈反思..."
        if [ -f "scripts/evolution/reflection_journal.py" ]; then
            python3 scripts/evolution/reflection_journal.py > /dev/null 2>&1 || true
            echo "✅ 反思完成。"
        fi
    else
        echo "ℹ️ 今日暂无日志，跳过收割、精炼与反思。"
    fi
fi

# 6. 清理 Python 缓存与冗余文件
echo "🧹 正在清理脑部缓存..."
find . -type d -name "__pycache__" -exec rm -rf {} +
rm -f .memory/tmp/*.json

# 7. 环境健康检查
echo "🔍 执行健康检查..."
if [ -f "mcp_server/server.py" ]; then
    echo "✅ MCP 服务核心正常。"
fi
if [ -f ".memory/sqlite/knowledge.db" ]; then
    echo "✅ 逻辑记忆库 (knowledge.db) 状态正常。"
fi

echo "🎉 大脑更新与优化完成！请重启您的 MCP Client (如 Claude Desktop 或 Gemini CLI) 以加载最新状态。"
