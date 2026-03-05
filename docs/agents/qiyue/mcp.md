# 栖月 MCP 接入说明

> 栖月运行在 OpenClaw 平台，**不通过传统 MCP 客户端配置接入**，而是直接操作文件系统与调用 CortexOS MCP Server。

## 接入方式

| 能力 | 实现方式 |
| :--- | :--- |
| 读写 CortexOS 大脑文件 | 直接 exec / read / write / edit 工具 |
| 调用 CortexOS MCP Tools | 通过 exec 运行 `uv run mcp_server/server.py` |
| 跨 Agent 通信 | sessions_send / sessions_list |
| 记忆检索 | memory_search / memory_get |

## 对 CortexOS MCP Server 的调用

栖月可直接读写大脑文件，以下 MCP Tool 供参考（Codex/Gemini 用，栖月直接操作文件）：

| MCP Tool | 用途 |
| :--- | :--- |
| `read_router()` | 读大脑宪法（栖月直接读文件） |
| `get_fleet_status()` | 获取舰队状态 |
| `get_context_brief()` | 轻量冷启动摘要（~100 token） |
| `fleet_claim()` | Agent 打卡挂牌 |
| `log_task()` | 写操作日志 |
| `task_handoff_check()` | 任务完工标记 |
| `list_secrets()` | 列出密钥文件 |

## 配置位置

栖月的 OpenClaw 配置位于 `~/.openclaw/openclaw.json`，由 OpenClaw 平台管理，无需手动配置 MCP。
