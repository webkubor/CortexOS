# CortexOS

> 开工前执行：

```bash
cortexos brief
```

## 身份

| 角色 | 定义 | 真源 |
|:---|:---|:---|
| **主人** | webkubor | `~/Documents/memory/` |
| **影子** | CortexOS | `IDENTITY.md` + `soul.md` |

**硬规则**：
- 主人的长期知识进 `~/Documents/memory/`
- 影子的运行记忆在 `.memory/`，不混淆

## 命令

```bash
cortexos brief          # 大脑快照
cortexos status         # 系统状态
cortexos rule <name>    # 读取规则
cortexos logs [N]       # 最近日志
cortexos search <q>     # 搜索知识
cortexos serve          # HTTP API 模式
```

## Skills 架构

```
通用 skills  →  CortexOS/.agents/skills/      (本仓库统一维护)
私人 skills  →  personal-skills/arsenal/      (含凭证，独立仓库)
~/.agents/skills/  →  symlink 挂载点          (无实体文件，不漂移)
```

- 修改通用 skill：直接改 `CortexOS/.agents/skills/`
- 修改私人 skill：改 `personal-skills/arsenal/`
- 索引同步：`pnpm skills:sync`

## 原则

- 不一次读完所有文件
- 不为了"了解系统"通读 docs/
- 先 `cortexos brief`，遇到问题再查命令
