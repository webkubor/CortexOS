# Brain TUI

`brain-tui` 是 CortexOS 的终端主脑控制台。

第一版目标：
- 一屏看清 Cloud Brain、PM2、通知、任务、skills、agents、MCP、端口占用
- 用键盘优先、实时刷新的 TUI 代替零散命令

## 启动

在仓库根目录执行：

```bash
pnpm brain:tui
```

## 当前数据源

- Cloud Brain: `/health`、`/notifications`、`/tasks`
- PM2: `pm2 jlist`
- Skills:
  - `CortexOS/.agents/skills/`
  - `~/.agents/skills`
  - `~/.agent/skills`
  - `~/.codex/skills`
- Agent 文档: `docs/agents/`
- MCP:
  - 服务器数量：`mcp_server/mcp_config.json` + `~/.gemini/settings.json`
  - 工具数量：`mcp_server/server.py` 中 `@mcp.tool()`
- 端口：`lsof -nP -iTCP -sTCP:LISTEN`

## 设计原则

- 先做运行态总控，不先做复杂交互
- 只读，不直接改系统
- 保持对现有 CLI / API / MCP 的兼容
