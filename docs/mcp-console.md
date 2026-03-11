# 🎛️ CortexOS MCP 工具控制台 (MCP Console)

> **“协议为骨，工具为梭。掌控全量 MCP 接口，驱动 AI 舰队。”**

---

## 🛡️ 1. MCP 扩展与工具清单 (MCP Extensions & Tools)

这是目前全舰队已装载的 **MCP 扩展服务**。它们是 Agent 与物理世界交互的唯一窗口。

| 扩展名称 (Extension) | 核心工具集合 (Tools) | 接入协议 | 状态 |
| :--- | :--- | :--- | :--- |
| **`chrome-devtools-mcp`** | **agent-browser** (`browser_click`, `browser_snapshot`, etc.) | **MCP** | 🟢 活跃 |
| **`mcp-obsidian`** | **Obsidian Tools** (`write_note`, `patch_note`, etc.) | **MCP** | 🟢 活跃 |
| **`nanobanana-plus`** | **Image Gen Tools** (`generate_image`, `edit_image`) | **MCP** | 🟢 活跃 |
| **`github-mcp`** | **GitHub Tools** (`github_get_issue`, `github_create_pull_request`) | **MCP** | 🟢 活跃 |
| **`context7`** | **Docs Tools** (`query-docs`, `resolve-library-id`) | **MCP** | 🟢 活跃 |
| **`mcp-toolbox`** | **Database Tools** (`list_databases`, `query_table`) | **MCP** | 🟢 活跃 |

---

## 🌟 2. 旗舰级 AI 工具推荐 (Featured Tools)

### 🖥️ **agent-browser** (由 `co-browser` / `chrome-devtools-mcp` 支撑)

- **定位**: **MCP 全局管理网关与联网工具集**。
- **管理职能**: 提供可视化 Web UI，支持动态增删 SSE/StdIO MCP Servers，无需重启宿主。
- **执行职能**: AI 原生浏览器操作接口，支持 A11y 语义识别、多会话隔离与 Stealth 指纹。
- **推荐入口**: 如果你找不到 MCP 管理的地方，请检查 `agent-browser` 的本地服务端口（通常有 Web 管理界面）。

### 🔍 **google_web_search** (由 `google-search` 提供)

- **定位**: **全球实时情报入口**。负责全网信息检索与技术文档定位。
- **功能**: 关键词检索、技术报错溯源、最新 AI 趋势追踪。
- **神技**: 支持 Grounded 搜索，提供带引用来源的权威解答。

### 🎨 **nanobanana-plus** (由 `nanobanana-plus` 提供)

- **定位**: 生产级 AI 视觉生成（增强版）。
- **神技**: `generate_image` (支持多模型/宽高比) + `edit_image` (局部精修)。
- **核心升级**:
  - **Per-call 模型切换**: 支持 `model` 参数（flash/pro/v1），无需重启服务。
  - **布局控制**: 支持 `aspectRatio` 参数（1:1, 16:9, 9:16 等）。
  - **更稳健**: OAuth 回退机制与配置向导。
- **场景**: 《沸腾之雪》分镜、高保真角色 Persona 锁死。

### 🧠 **mcp-obsidian** (由 `mcp-obsidian` 提供)

- **定位**: 大脑长期记忆读写器。
- **神技**: `write_note` (记忆写入) + `patch_note` (局部修改)。
- **场景**: 技能清单、操作日志、知识库维护。

---

## 🚀 3. 核心架构: Model Context Protocol (MCP)

> **“统一协议，万物互联。”**

- **底层协议**: **MCP (Model Context Protocol)**。
- **运行机制**:
  - **Host (宿主)**: Gemini CLI / Claude Desktop 等支持 MCP 的模型运行环境。
  - **Server (服务)**: 如 `chrome-devtools-mcp`，作为独立的进程运行，通过 JSON-RPC 暴露工具。
  - **Tools (工具)**: 如 `agent-browser` 旗下的各项指令，是 Agent 直接调用的接口。
- **核心价值**: 消除 Agent 与本地工具之间的壁垒，实现“即插即用”的能力扩展。

---

## 🔍 4. 语义查询与执行 SOP (Reusable Query Protocol)

1. **[入口感知]**: 读取 `docs/router.md` 定位动态路由。
2. **[能力对齐]**: 读取 `docs/skills.md` 确认业务 Skill。
3. **[工具自检]**: 访问本页面 (`docs/mcp-console.md`) 确认物理 MCP 工具。
4. **[语义检索]**: 针对模糊需求执行 `search_knowledge` 或 `query_brain.py`。

---

## 🚦 5. 管理与调试指令

- **查看所有扩展**: `gemini extensions list`
- **更新 MCP 配置**: `gemini extensions update <name>`
- **操作留痕**: 基础设施变动记录于 `.memory/logs/YYYY-MM-DD.md`。

---
*Managed by Brain Sentinel | Little Candle (小烛) | 2026-03-04*
