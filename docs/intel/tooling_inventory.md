# 🗃️ Tooling & MCP Inventory (Intelligence SSOT)

> **“一次读取，全局锁定。”** 本页定义了当前 AI 节点可调用的所有核心能力及其物理位置。

## 1. 原生技能 (Native Skills - JS/CLI)

这些技能直接运行在 Termianl 或 Node.js 环境中。

| 技能名称 (Skill) | 物理路径 | 来源 (Provenance) | 核心职能 |
| :--- | :--- | :--- | :--- |
| **`r2-uploader`** | `~/.agents/skills/r2-uploader` | **Private** | 21:9 电影资产 R2 托管 |
| **`github-uploader`** | `~/.agents/skills/github-uploader` | **Private** | 图片/文档 GitHub CDN 托管 |
| **`up.sh` (Wrapper)** | `CortexOS/scripts/tools/up.sh` | **Private** | 智能分发上传入口 |
| **`omni-publisher`** | `~/.agents/skills/omni-publisher-skill` | **Public** | 多平台内容发布 |
| **`xhs-manager`** | `~/.agents/skills/xhs-manager-skill` | **Public** | 小红书账号管理 |
| **`find-skills`** | `~/.agents/skills/find-skills` | **Public** | 实时技能探测 |

## 2. MCP 扩展工具 (Model Context Protocol)

这些工具通过 MCP 协议暴露为特定的工具指令。

| 扩展 (MCP Server) | 关键指令 (Tools) | 接入点 (Entry) | 职能 |
| :--- | :--- | :---: | :--- |
| **`nanobanana-plus`** | `generate_image`, `edit_image` | MCP | 摄影级视觉生成 |
| **`chrome-devtools`** | `browser_click`, `browser_snapshot` | MCP | 底层浏览器控制 |
| **`agent-browser`** | `read_browser_page`, `open_browser_url` | MCP | 语义化网页分析 |
| **`mcp-obsidian`** | `write_note`, `patch_note` | MCP | 知识库与长期记忆 |
| **`github`** | `create_repository`, `list_issues` | MCP | GitHub 全量 Ops |

## 3. 查找与发现策略 (Discovery Logic)

1. **先查 Inventory**: AI 收到任何“工具”或“技能”需求时，**必须** 先检索本表。
2. **区分私有/公开**: 若同时存在私有与公开脚本（如上传），优先采用 **Private** 逻辑。
3. **定位命令**: 详细配置与环境变量引用 `docs/mcp-console.md`。

### Metadata

*Generated: 2026-03-06 | CortexOS Intelligence Unit*
