---
description: CortexOS 中央大脑路由（精简版）
---

# 🧠 CortexOS 中央大脑路由

> `CortexOS` 是 `webkubor` 的 AI Agent 中央大脑。
> 对内以 `MCP` 组织能力，对外通过 `CLI` 与 `HTTP API` 接收信息、分发任务，并与各类 `subagent` 持续互动。

## 🧠 快照区（每次必读，约 25 行）

```
大脑版本: v6.0.0 (Pure Brain Mode)
用户: 王爷 | 对外 ID: webkubor
时区: Asia/Shanghai (UTC+8)
工作时间: ~10:00-20:00

当前重点:
- 沸腾之雪 AI 武侠微电影（正片 1-9 集完结）
- 小红书运营：司南烛(主号 654 粉) + 小烛(新号)
- nanobanana-plus v1.5.0 已发布（HTTP API 模式）
- Cloud Brain 收件箱与分诊链路
- 氛围壁纸工坊 https://wallpaper.webkubor.online/

关键资源:
- 私钥/凭证: ~/Documents/memory/secrets/ (chmod 600)
- 项目路径: ~/Documents/CortexOS/
- 个人记忆: ~/Documents/memory/
- 助手日志: ~/clawd/memory/
- Cloud Brain 代码: services/brain-api/
- Cloud Brain URL: https://brain-api-675793533606.asia-southeast2.run.app
```

## 🧭 身份与记忆边界（必守）

- `CortexOS` 是独立助手，不是用户知识真源
- `IDENTITY.md` 是 CortexOS 当前称谓与身份的唯一真源
- `~/Documents/memory/` 是用户长期资产与知识真源
- `CortexOS/.memory/` 只保留 CortexOS 自己的运行态、私有策略、人格连续性

默认写入规则：

1. 用户知识、项目档案、复盘、分享文稿 -> `~/Documents/memory/`
2. CortexOS 自己的日志、私有偏好、控制状态 -> `CortexOS/.memory/`
3. 云端共享通知、任务、记忆 -> `services/brain-api/` 对应的 Cloud Brain 主库

## 📂 目录导航（按需读取）

| 路径 | 用途 | 何时读 |
|---|---|---|
| `docs/rules/` | 行为规范、安全红线 | 开始修改代码前 |
| `docs/sops/` | 具体操作步骤 | 发推/发小红书/发布前 |
| `.memory/persona/` | 用户偏好、助手人格 | 首次使用或忘了偏好时 |
| `.memory/logs/` | 过往执行记录 | 查历史问题 |
| `services/brain-api/` | 云端共享记忆服务 | 需要跨设备/跨地区共享记忆时 |

## 🏷️ 别名速查

| 别名 | 映射 | 用途 |
|---|---|---|
| `@fe/std` | `docs/rules/frontend/standard.md` | 前端规范 |
| `@fe/base` | `docs/rules/frontend/baseline.md` | Vue3/Vite/TS 基线 |
| `@core` | `docs/rules/engineering_baseline.md` | 核心工程准则 |

## 🔧 核心工具

- MCP Server: `mcp_server/server.py`（主脑内部能力协议）
- 本地客户端: Gemini / Codex / Claude / 其他 Agent
- Cloud Brain API: `services/brain-api/` -> Cloud Run (`/health`, `/memories`, `/notifications`, `/tasks`)

## 🚫 红线

- 不把敏感信息写回公开配置
- 不一次读完所有规则（按需加载）
