# AI 舰队 Agent 配置总览

> 🏴 **当前指挥官**: 栖月-Prime（Claude Sonnet 4.6 / OpenClaw）| 接管: 2026-03-05
> **架构**: 栖月 = 战略层 / Codex + Gemini + Claude Code = 执行层

---

## 舰队能力速查

| Agent | 模型 | 配置位置 | 独家能力 | 花钱? |
| :--- | :--- | :--- | :--- | :--- |
| **🌸 栖月** (队长) | Claude Sonnet 4.6 | OpenClaw (`~/.openclaw/`) | 战略/任务书/质量把关 | 💸 是 |
| **Codex** | gpt-5.3-codex | `~/.codex/config.toml` | 全自动执行(approval=never) | 🆓 免费 |
| **Gemini CLI** | Gemini 2.0 Flash | `~/.gemini/settings.json` | 图像生成(nanobanana-plus) | 🆓 免费 |
| **Claude Code** | Claude v2.1.12 | `~/.claude/settings.json` | frontend-design/think skill | 🆓 Antigravity额度 |
| **OpenCode** | — | `.opencode/` | 项目级执行 | — |

**派单原则**: 图像→Gemini / 代码→Codex / 前端设计→Claude Code / 战略→栖月

---

## MCP 配置位置

| Agent | MCP 配置文件 |
| :--- | :--- |
| 栖月 | OpenClaw 平台管理，无需手动配 |
| Gemini CLI | `~/.gemini/settings.json` → `mcpServers` |
| Codex | `~/.codex/config.toml` → `[mcp_servers]` |
| Claude Code | `~/.claude/settings.json` → `mcpServers` |

---

## 详细档案

- 🌸 [栖月档案](./qiyue/README.md) | [栖月 MCP](./qiyue/mcp.md)
- [Gemini 配置档案](./gemini/README.md) | [Gemini MCP 清单](./gemini/mcp.md)
- [Codex 配置档案](./codex/README.md) | [Codex MCP 清单](./codex/mcp.md)
- [Claude Code 配置档案](./claude/README.md) | [Claude MCP 清单](./claude/mcp.md)
- [OpenCode 配置档案](./opencode/README.md)

---

## 维护约定

- 新增 Agent 时在 `docs/agents/<agent>/` 建目录并补 `README.md` 与 `mcp.md`
- 配置变更后必须同步更新本页"舰队能力速查"表
- 指挥官变更时更新页面顶部的"当前指挥官"字段
