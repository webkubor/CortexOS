# 🚀 快速上手指南

本指南将协助你快速安装 CortexOS 并将其“挂载”到你的 AI 工作流中。

---

## 1. 物理部署 (Local Setup)

CortexOS 基于 `uv` (Python) 和 `pnpm` (Node.js) 运行。

```bash
# 克隆仓库
git clone git@github.com:webkubor/CortexOS.git
cd CortexOS

# 安装依赖
pnpm install
```

## 2. 接入 AI 客户端 (MCP Config)

CortexOS 是一个标准的 **MCP Server**。你可以将它接入任何支持该协议的工具：

### Claude Desktop
修改 `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "cortexos-brain": {
      "command": "uv",
      "args": ["run", "/你的路径/CortexOS/mcp_server/server.py"]
    }
  }
}
```

### Gemini CLI
修改 `~/.gemini/settings.json`:
```json
{
  "mcpServers": {
    "cortexos-brain": {
      "command": "uv",
      "args": ["run", "/你的路径/CortexOS/mcp_server/server.py"]
    }
  }
}
```

---

## 3. 常用操作命令

| 命令 | 作用 |
| :--- | :--- |
| `pnpm run fleet:claim` | Agent 任务打卡，防碰撞 |
| `pnpm run fleet:sync-dashboard` | 刷新首页看板数据与进度 |
| `pnpm run health:gate` | 扫描大脑结构完整性 |
| `node scripts/actions/fleet-cleanup.mjs` | 清理 2 小时以上不活跃的僵尸节点 |

---

## 4. 进度管理规范

CortexOS 采用 **“客观进度感知”**。
- 请在任务根目录下创建 `TODO.md`。
- 使用 `- [ ]` 和 `- [x]` 记录子任务。
- 系统同步时会自动计算勾选比例，并在首页显示动态加载条。
