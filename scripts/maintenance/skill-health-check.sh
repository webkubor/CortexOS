#!/bin/bash

# AI Common Skill Health Check & Auto-Installer (Bash 3.2 Compat)
# Author: Candle (Xiao Zhu)
# Description: Verifies if required skills are installed in Gemini CLI. Auto-installs from GitHub if missing.

echo "🔍 正在进行技能健康检查 (XiaoZhu Skill Sentinel)..."
echo "=================================================="

# 定义核心技能及其 GitHub 仓库 (Format: "name|url")
CORE_SKILLS=(
    "visual-studio|https://github.com/webkubor/visual-studio-skill"
    "cinematic-storyboard|https://github.com/webkubor/cinematic-storyboard-skill"
    "ai-music-engineer|https://github.com/webkubor/audio-music-engineer-skill"
    "vitepress-init|https://github.com/webkubor/vitepress-init-skill"
    "pwa-master|https://github.com/webkubor/pwa-master-skill"
    "ai-modification|https://github.com/webkubor/gemini-skill-ai-native"
    "omni-publisher|https://github.com/webkubor/omni-publisher-skill"
)

# 获取当前已安装技能列表
INSTALLED_SKILLS=$(gemini skills list)

MISSING_COUNT=0
INSTALLED_COUNT=0

for SKILL_PAIR in "${CORE_SKILLS[@]}"; do
    SKILL_NAME=$(echo "$SKILL_PAIR" | cut -d'|' -f1)
    REPO_URL=$(echo "$SKILL_PAIR" | cut -d'|' -f2)

    # 检查技能名是否匹配
    if echo "$INSTALLED_SKILLS" | grep -E "^$SKILL_NAME " > /dev/null; then
        echo "✅ [已就绪] $SKILL_NAME"
        ((INSTALLED_COUNT++))
    else
        echo "❌ [缺失] $SKILL_NAME"
        echo "   🚀 正在从 GitHub 自动安装: $REPO_URL ..."
        # 使用 --consent 跳过确认
        gemini skills install "$REPO_URL" --consent
        if [ $? -eq 0 ]; then
            echo "   ✨ $SKILL_NAME 安装成功！"
            ((INSTALLED_COUNT++))
        else
            echo "   ⚠️  $SKILL_NAME 安装失败，请检查网络或仓库权限。"
            ((MISSING_COUNT++))
        fi
    fi
done

echo "=================================================="
echo "📊 自检完成: $INSTALLED_COUNT 个已就绪, $MISSING_COUNT 个待修复。"
if [ $MISSING_COUNT -eq 0 ]; then
    echo "🎉 所有核心技能已武装完毕，老爹请放心使用！"
else
    echo "💡 提示: 部分技能安装失败，请手动运行 'gh auth login' 确认权限，或联系小烛排查。"
fi
