# 🟠 Claude Code Agent Profile

## 🚀 冷启动（必做）

```bash
cortexos brief    # 获取大脑快照（~25行）
```

## 📂 配置拓扑

```text
~/.claude/
├── CLAUDE.md             # [Config] 冷启动指令（已配置 cortexos brief）
├── settings.json         # [Config] 核心配置
└── skills/               # [Skills] 私有技能
```

## 🌸 身份

| 项目 | 内容 |
|------|------|
| **名称** | Claude Code（Anthropic 出的命令行 AI） |
| **运行平台** | Claude Code |
| **工作空间** | 任务对应的工作目录 |
| **配置文件** | `~/.claude/CLAUDE.md` |

## 🔧 维护重点

1. 读 `~/.claude/settings.json` 与 `~/.claude/skills/`
2. 优先确认 Playwright 与视觉审计能力是否在线
3. 遵循 cortexos CLI 协议访问大脑

---

*Last Updated: 2026-03-18 (MCP→CLI 迁移)*
