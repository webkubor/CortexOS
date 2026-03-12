# Gemini MCP Servers (Active Configuration)

> **定义**: 当前 Gemini Agent 环境中已配置并在线的 Model Context Protocol (MCP) 服务。

## 🛠 已连接的服务 (Active MCP Servers)

| Server ID | 关联扩展 | 核心职能 | 状态 |
| :--- | :--- | :--- | :--- |
| **chrome-devtools** | chrome-devtools-mcp | 浏览器底层控制、A11y 审计、性能分析与调试。 | ✓ Connected |
| **agent-browser** | (Global CLI) | **(NEW)** 独立的高级浏览器自动化工具，用于语义快照与深度文档检索。 | ✓ Available |
| **github** | github | GitHub 仓库管理、Issue/PR 操作与代码审查。 | ✓ Connected |
| **huggingface-skills** | huggingface-skills | **(NEW)** HF 模型训练、数据集管理与 Gradio UI 开发。 | ✓ Connected |
| **nanobanana-plus** | nanobanana-plus | **(UPGRADED)** 增强型 AI 图像生成，支持 per-call 模型切换（Imagen 4 Ultra/Fast, Nano Banana 2）与宽高比控制。 | ✓ Connected |
| **figma** | (Built-in/MCP) | Figma 设计稿像素级读取与组件解析。 | ✓ Connected |
| **browser-use** | (Built-in/MCP) | 基于自然语言的自主浏览器代理操作。 | ✓ Connected |

## 🔗 配置路径

所有 MCP 配置均由 `~/.gemini/settings.json` 管理，扩展目录位于 `~/.gemini/extensions`。

---
*Last Sync: 2026-03-05*
