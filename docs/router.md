---
description: CortexOS 大脑路由（精简版）
---

# 🧠 CortexOS Brain Router

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
- AetherFleet 舰队调度系统
- 氛围壁纸工坊 https://wallpaper.webkubor.online/

关键资源:
- 私钥/凭证: ~/Documents/memory/secrets/ (chmod 600)
- 项目路径: ~/Documents/CortexOS/
- 舰队状态: AetherFleet/.memory/cache/
- 个人记忆: ~/Documents/memory/
- 助手日志: ~/clawd/memory/
```

## 📂 目录导航（按需读取）

| 路径 | 用途 | 何时读 |
|---|---|---|
| `docs/rules/` | 行为规范、安全红线 | 开始修改代码前 |
| `docs/sops/` | 具体操作步骤 | 发推/发小红书/发布前 |
| `.memory/persona/` | 用户偏好、助手人格 | 首次使用或忘了偏好时 |
| `.memory/logs/` | 过往执行记录 | 查历史问题 |
| `AetherFleet/` | AI 航队调度 | 有 AetherFleet 任务时 |

## 🏷️ 别名速查

| 别名 | 映射 | 用途 |
|---|---|---|
| `@fe/std` | `docs/rules/frontend/standard.md` | 前端规范 |
| `@fe/base` | `docs/rules/frontend/baseline.md` | Vue3/Vite/TS 基线 |
| `@core` | `docs/rules/engineering_baseline.md` | 核心工程准则 |

## 🔧 核心工具

- MCP Server: `mcp_server/server.py`（14 个工具）
- 舰队引擎: `AetherFleet`
- AI 舰队: Gemini / Codex / Claude / Kimi

## 🚫 红线

- 不直接操作舰队调度（交给 AetherFleet）
- 不把敏感信息写回公开配置
- 不一次读完所有规则（按需加载）
