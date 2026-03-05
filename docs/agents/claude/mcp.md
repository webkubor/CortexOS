# Claude MCP Servers（实配状态）

> 定义：Claude Code 在本机当前可用的 MCP 服务清单与排障结果。

## 当前状态（2026-03-05）

| Server ID | Command | 状态 |
| :--- | :--- | :--- |
| `chrome-devtools` | `npx -y chrome-devtools-mcp@latest` | ✓ Connected |
| `playwright` | `npx @playwright/mcp@latest` | ✓ Connected |
| `cortexos-brain` | `uv run --project <CORTEXOS_ROOT> <CORTEXOS_ROOT>/mcp_server/server.py` | ✓ Connected |
| `context7` | `npx -y @upstash/context7-mcp --api-key ****` | ✓ Connected |

## 已处理问题

1. `pencil` 已从 Claude 用户配置移除  
原因：原二进制路径不存在，命令执行报 `no such file or directory`，会导致启动时持续报错。

2. `cortexos-brain` 已全局挂载  
用途：让 Claude 在任意项目都能调用 CortexOS MCP。

3. `context7` 已全局挂载  
用途：补齐实时文档查询能力。

## 关键命令

```bash
claude mcp list
claude mcp get cortexos-brain
claude mcp get context7
```

## 配置位置

- Claude 实际用户配置：`~/.claude.json`
- 本地兼容配置镜像：`~/.claude/settings.json`
