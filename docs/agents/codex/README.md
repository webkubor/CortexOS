# 🔵 Codex Agent Profile

## 🚀 冷启动（必做）

```bash
cortexos brief    # 获取大脑快照（~25行）
```

## 📂 配置拓扑

```text
~/.codex/
├── AGENTS.md             # [Config] 冷启动指令（已配置 cortexos brief）
├── config.toml           # [Config] 核心配置
└── .memory/              # [Memory] 私有运行态
```

## 🌸 身份

| 项目 | 内容 |
|------|------|
| **名称** | Codex（OpenAI 出的命令行 AI） |
| **运行平台** | Codex CLI |
| **工作空间** | 任务对应的工作目录 |
| **配置文件** | `~/.codex/AGENTS.md` |

## 🔧 维护重点

1. 读 `~/.codex/config.toml` 确认配置
2. 同步工程环境
3. 遵循 cortexos CLI 协议访问大脑

---

*Last Updated: 2026-03-18 (MCP→CLI 迁移)*
