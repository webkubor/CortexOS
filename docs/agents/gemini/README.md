# Gemini Agent Profile & Bootloader

> **核心原则**: 我（Gemini）必须具备高度的“自我感知”能力。启动时，我必须主动读取物理环境配置并同步至本档案室，严禁依赖栖洲重复指令。

通用启动骨架见：[Agent 通用启动基线](../shared-bootloader.md)

## Gemini 差异项

1. 读取 `~/.gemini/settings.json` 与 `~/.gemini/skills/`
2. 优先核对 MCP、扩展与长期记忆是否对齐
3. 若发现物理环境新增 MCP 或 Skill，必须主动更新 `mcp.md` 与 `skills.md`

## 📍 Gemini 档案入口

- 📄 **[能力总清单 (Manifest)](./manifest.md)**: 核心定位、继承协议与推荐工具链。
- 🛠 **[MCP 状态 (Active Tools)](./mcp.md)**: 实时记录 8+ 个 MCP 服务的连接状态与职能。
- 🧩 **[专属技能 (Exclusive Skills)](./skills.md)**: 记录物理安装的 Skill 包（如 Remotion, DevTools）。

## 📂 Gemini 配置拓扑

```text
.gemini/
├── GEMINI.md           # [Core] 核心身份与最高指令
├── settings.json       # [Config] MCP Server 与安全策略配置
├── skills/             # [Capabilities] 物理安装的技能包
├── extensions/         # [Extensions] 扩展工具的 Token 与插件
└── memory/             # [Memory] 跨 Session 的结构化事实
```

## 🛠 Gemini 维护重点

- **同步状态**: 运行 `gemini mcp list` 并更新 `mcp.md`。
- **扩展能力**: 在 `~/.gemini/skills/` 下维护 Skill 源码，并在 `skills.md` 记录。
- **身份维护**: 修改 `GEMINI.md` 以调整我的全局行为逻辑。
## 1. 启动与上下文注入

- **启动约定**: 默认依赖 `~/.gemini/GEMINI.md` 的长期记忆注入。
- **协议对齐**: 开工首个动作必须是 `read_router`。
- **动态加载**: 严禁在提示词中硬编码规则，必须通过 `load_rule` 动态按需加载。

---
*Last Updated: 2026-02-05 (Activated Proactive Sync Mandate)*
