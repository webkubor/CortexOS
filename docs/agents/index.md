# 影子接入

> 任何 AI 工具都可以通过以下方式接入 CortexOS：

## 方式一：CLI（推荐）

```bash
cortexos brief
```

所有 AI 工具统一通过这个命令获取上下文。

## 方式二：HTTP API

```bash
cortexos serve --port 3579
curl http://127.0.0.1:3579/api/brief
```

## 支持的 AI 工具

| 工具 | 启动方式 |
|:---|:---|
| Gemini CLI | `cortexos brief` |
| Claude Code | `cortexos brief` |
| Codex | `cortexos brief` |
| Kimi Code | `cortexos brief` |
| 任何支持 MCP 的工具 | HTTP API |

---

**核心原则**：没有"Agent 团队"，只有**主人**和**影子**。

- 主人：webkubor
- 影子：CortexOS（通过任何 AI 工具呈现）
