# 🌟 Gemini Agent Profile

## 🚀 冷启动（必做）

> 开工前**只读这一步**：

```bash
cortexos brief    # 获取大脑快照（~25行）
```

如需更多：
```bash
cortexos status        # 状态概览
cortexos search 关键词  # 知识搜索
cortexos logs 3        # 最近3天日志
```

## 📂 配置拓扑

```text
~/.gemini/
├── GEMINI.md            # [Config] 冷启动指令（已配置 cortexos brief）
├── settings.json        # [Config] MCP Server 与安全策略
├── extensions/          # [Extensions] Gemini CLI 扩展
└── skills/              # [Skills] 私有技能模块
```

## 🌸 身份

| 项目 | 内容 |
|------|------|
| **名称** | Gemini（谷歌出的命令行 AI） |
| **运行平台** | Gemini CLI |
| **工作空间** | 任务对应的工作目录 |
| **配置文件** | `~/.gemini/GEMINI.md` |

## 🔧 维护重点

1. 读 `~/.gemini/settings.json` 与 `~/.gemini/skills/`
2. 优先确认浏览器自动化与图片生成能力是否在线
3. 遵循 cortexos CLI 协议访问大脑

## 📍 参考入口

- **大脑入口**: 仓库根目录 `AGENTS.md`，所有 Agent 开工先读
- **[路由协议](../../router.md)**: 规则、路径、别名
- **[规则中心](../../rules/index.md)**: 行为约束

---

*Last Updated: 2026-03-18 (MCP→CLI 迁移)*
