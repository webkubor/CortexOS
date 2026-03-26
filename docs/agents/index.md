# Agent 接入总览

> 本页只说明：不同 Agent 如何接入 `CortexOS` 中央大脑。
> 它不是舰队编排页，也不是指挥链说明页。

---

## Agent 能力速查

| Agent | 模型 | 配置位置 | 独家能力 | 花钱? |
| :--- | :--- | :--- | :--- | :--- |
| **OpenClaw** | Claude Sonnet 4.6 | OpenClaw (`~/.openclaw/`) | 高强度执行 / 复杂上下文协作 | 💸 是 |
| **Codex** | gpt-5.3-codex | `~/.codex/config.toml` | 全自动执行(approval=never) | 🆓 免费 |
| **Gemini CLI** | Gemini 2.0 Flash | `~/.gemini/settings.json` | 图像生成(nanobanana-plus) | 🆓 免费 |
| **Claude Code** | Claude v2.1.12 | `~/.claude/settings.json` | frontend-design/think skill | 🆓 Antigravity额度 |
| **OpenCode** | — | `.opencode/` | 项目级执行 | — |

**推荐分工**: 图像→Gemini / 代码→Codex / 前端设计→Claude Code / 项目级执行→OpenClaw

---

## 大脑访问方式

所有 Agent 统一通过 `cortexos` CLI 访问大脑：

| Agent | 启动指令 |
| :--- | :--- |
| OpenClaw | `cortexos brief`（OpenClaw 内直接调用） |
| Gemini CLI | `cortexos brief`（GEMINI.md 配置） |
| Codex | `cortexos brief`（AGENTS.md 配置） |
| Claude Code | `cortexos brief`（CLAUDE.md 配置） |

> 其他 AI 工具也可通过 HTTP API 调用：`cortexos serve --port 3579`

---

## 详细档案

- [OpenClaw / 小龙虾手册](./qiyue/openclaw.md)
- CortexOS 身份真源：`IDENTITY.md`
- [Gemini 配置档案](./gemini/README.md)
- [Codex 配置档案](./codex/README.md)
- [Claude Code 配置档案](./claude/README.md)
- [OpenCode 配置档案](./opencode/README.md)

---

## 维护约定

- 新增 Agent 时在 `docs/agents/<agent>/` 建目录并补 `README.md`
- 各 Agent 的启动配置文件（GEMINI.md / AGENTS.md / CLAUDE.md）统一指向 `cortexos brief`
- 配置变更后必须同步更新本页"Agent 能力速查"表
