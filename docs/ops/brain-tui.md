---
description: CortexOS 终端主脑控制台（Textual TUI）说明，展示 Cloud Brain、PM2、skills、agents、MCP、端口与日志总览。
---

# Brain TUI

> `brain-tui` 是 CortexOS 的终端主脑控制台。  
> 它不是新的后端，也不是新的 API，而是给你自己用来观察主脑运行态的 TUI 前台。

## 定位

`brain-tui` 负责把下面这些分散状态收成一屏可读：

- Cloud Brain 在线状态
- 收件箱 / 任务数量
- `brain-cortex-pilot` 状态
- skills 数量
- agent 文档档案数量
- MCP server / MCP tools 数量
- 本地端口监听情况
- 主脑最近日志
- 对外 API 总表

## 启动

在仓库根目录运行：

```bash
pnpm brain:tui
```

## 当前快捷键

- `r`：刷新一次
- `n`：聚焦通知表
- `t`：聚焦任务表
- `q`：退出

当光标位于通知或任务表时，移动选中行会自动更新右侧详情面板。

## 当前数据源

第一版为只读控制台，主要读取：

- Cloud Brain:
  - `GET /health`
  - `GET /notifications`
  - `GET /tasks`
- PM2:
  - `pm2 jlist`
- skills:
  - `~/Desktop/skills/**/SKILL.md`
- agents:
  - `docs/agents/*/README.md`
- MCP:
  - `mcp_server/mcp_config.json`
  - `mcp_server/server.py`
- ports:
  - `lsof -nP -iTCP -sTCP:LISTEN`

## 为什么用 TUI

这层不是替代 GUI，而是承担：

- 键盘优先
- 高密度信息
- 运行态总控
- 快速巡检

也就是说：

- GUI 更适合文档、解释、长内容、对外展示
- TUI 更适合主脑运行态、日志、进程、端口、通知、任务的快速监控

## 当前边界

第一版先做：

- 真实数据接入
- 状态总览
- 终端可视化

暂时不做：

- 直接改系统状态
- 终端内任务编辑
- 终端内通知分诊交互

这些会在后续版本慢慢加。
