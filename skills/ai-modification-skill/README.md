# 🤖 AI Modification Expert

[![Gemini CLI](https://img.shields.io/badge/Gemini--CLI-Skill-blueviolet)](https://github.com/google-gemini/gemini-cli)

**AI Modification Expert** 是一个专注于将任何项目改造为“AI 原生工作空间”的专业技能。它集成了文档索引自动化 (llms.txt) 与 WebMCP v2.0 协议注入，让您的网页具备全自动探测与 AI 操作性。

## 🛠 目录结构
- `SKILL.md`: 技能核心逻辑（AI 大脑）。
- `references/`: 专家内核（llms.txt 专家、WebMCP 专家）。
- `scripts/`: 物理同步与注入脚本。
- `assets/`: WebMCP 元数据模板。

## 🚀 安装指南
确保您已安装 [Gemini CLI](https://github.com/google-gemini/gemini-cli)，执行：

```bash
gemini skills install https://github.com/webkubor/gemini-skill-ai-native
```

## 🔄 更新与维护
本技能内置版本哨兵，支持一键巡检与升级：

- **检查更新**: `npm run check-update` (对比 GitHub 最新版本)
- **一键升级**: `npm run update` (自动拉取并重新安装)
- **手动打包**: `npm run package` (生成新的 .skill 安装包)

## 📖 使用场景
1. **llms.txt 改造**: 为项目生成 AI 友好的文档索引，提升 RAG 效率。
2. **WebMCP 注入**: 为网页注入 `window.mcp` 接口，实现 AI 自动化控制。

---
Created by [webkubor](https://github.com/webkubor)
"Bridging Humans and AI Agents" - Made with ❤️ by Candle.
