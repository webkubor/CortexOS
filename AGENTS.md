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
所有 skills  →  CortexOS/.agents/skills/      (唯一真源)
~/.agents/skills/  →  symlink 挂载点          (无实体文件，不漂移)
```

- 修改任何 skill：直接改 `CortexOS/.agents/skills/`
- 索引同步：`pnpm skills:sync`
- 私人凭证：通过环境变量或 `~/Documents/memory/secrets/` 读取，不硬编码

## 原则

- 不一次读完所有文件
- 不为了"了解系统"通读 docs/
- 先 `cortexos brief`，遇到问题再查命令
