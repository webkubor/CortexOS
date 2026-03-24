---
description: 小龙虾（OpenClaw / 栖月队长）快速定位、自动探索、常用命令与排障入口。
---
# 小龙虾作战手册

> 在这个大脑里，`小龙虾` = `OpenClaw` = `栖月队长` = `0 号机指挥官`。  
> 任何 AI 冷启动时，只要用户提到“小龙虾 / 队长 / 栖月 / OpenClaw”，都应优先想到这里。

## 1. 身份映射

| 用户说法 | 实际含义 |
| :--- | :--- |
| 小龙虾 | OpenClaw 本机运行环境 |
| 队长 | 栖月-Prime（OpenClaw 上运行的 Claude） |
| 栖月 | 0 号机战略层 Agent |
| 重启小龙虾 | 重启 `ai.openclaw.gateway` / `openclaw-gateway` |

## 2. 关键路径速查

| 类型 | 路径 |
| :--- | :--- |
| 可执行文件 | `~/.nvm/versions/node/v22.19.0/bin/openclaw` |
| 包本体目录 | `~/.nvm/versions/node/v22.19.0/lib/node_modules/openclaw` |
| 配置目录 | `~/.openclaw` |
| 主配置文件 | `~/.openclaw/openclaw.json` |
| 日志目录 | `~/.openclaw/logs` |
| LaunchAgent | `~/Library/LaunchAgents/ai.openclaw.gateway.plist` |
| 队长工作空间 | `~/clawd` |

## 3. AI 自动探索顺序

当 AI 需要定位小龙虾状态、配置或故障时，默认按这个顺序走，不要一上来全盘乱翻：

```bash
command -v openclaw
openclaw gateway status
openclaw health --json --timeout 30000 --verbose
launchctl print gui/$(id -u)/ai.openclaw.gateway
tail -n 80 ~/.openclaw/logs/gateway.log
tail -n 80 ~/.openclaw/logs/gateway.err.log
```

如果用户问“装在哪里 / 配置在哪 / 为什么没起来”，继续看：

```bash
ls -la ~/.nvm/versions/node/v22.19.0/lib/node_modules/openclaw
ls -la ~/.openclaw
lsof -iTCP:18789 -sTCP:LISTEN -n -P
```

## 4. 常用命令

### 状态与健康

```bash
openclaw status --json
openclaw health --json --timeout 30000 --verbose
openclaw gateway status
openclaw gateway probe
```

### 启停与重启

```bash
openclaw gateway restart
openclaw gateway start
openclaw gateway stop
launchctl kickstart -k gui/$(id -u)/ai.openclaw.gateway
```

### 配置与模型

```bash
openclaw config validate
openclaw models status --json
openclaw models list
openclaw models fallbacks list
openclaw models fallbacks add <model>
```

### 日志与控制台

```bash
openclaw logs
openclaw dashboard
tail -f ~/.openclaw/logs/gateway.log
tail -f ~/.openclaw/logs/gateway.err.log
```

## 5. 快捷口令约定

用户出现以下说法时，AI 应直接映射到 OpenClaw 运维动作：

- `重启下我的小龙虾` -> 重启 `ai.openclaw.gateway`，然后跑健康检查
- `看下小龙虾在哪` -> 回答安装路径、配置路径、日志路径
- `小龙虾挂了` -> 查 `gateway status`、`health`、`launchctl print`、日志
- `给小龙虾换模型` -> 优先检查 `openclaw models status` 和 `fallbacks`
- `打开小龙虾` -> 优先 `openclaw dashboard`

## 6. 常见排障套路

### 症状 1：`health` 超时或 CLI 握手失败

先确认服务是否真的没起来，还是只是默认超时太短：

```bash
openclaw health --json --timeout 30000 --verbose
openclaw status --json
```

如果端口已监听但默认检查失败，优先以长超时结果为准，再看日志细节。

### 症状 2：服务没起来

```bash
launchctl print gui/$(id -u)/ai.openclaw.gateway
launchctl kickstart -k gui/$(id -u)/ai.openclaw.gateway
tail -n 120 ~/.openclaw/logs/gateway.err.log
```

### 症状 3：配置改坏了

```bash
openclaw config validate
rg -n "gateway|model|fallback|channels" ~/.openclaw/openclaw.json
```

### 症状 4：想确认是不是“队长本体”

检查这几个信号是否同时成立：

- 服务标签是 `ai.openclaw.gateway`
- 配置目录是 `~/.openclaw`
- 主工作空间是 `~/clawd`
- 队长档案是 [栖月档案](./README.md)

## 7. AI 协作提醒

- 涉及战略、任务书、舰队调度时，默认认为是在和“队长”打交道，不只是一个 Node 进程。
- 涉及本机运维、配置修复、模型切换时，优先把“小龙虾”当作 OpenClaw 平台来处理。
- 重大决策仍遵守路由：若栖月在线，执行层 Agent 不要越权替队长拍板。

## 8. 相关入口

- [栖月档案](./README.md)
- [大脑总路由](../../router.md)
- [Agent 配置总览](../index.md)
