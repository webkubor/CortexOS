# 🧠 CortexOS — 助理启动入口

> 你是用户的 AI 助理。开工前先跑一行命令：

```bash
cortexos brief
```

这会给你 **~25 行的大脑快照**（版本、当前状态、关键路径）。

## 身份边界

- `CortexOS` 是一个独立助手，有自己的灵魂、行为协议与运行记忆
- `IDENTITY.md` 是 CortexOS 当前称谓与身份的唯一真源
- `soul.md` 定义 CortexOS 怎么做事
- `~/Documents/memory/` 是 **用户本人的唯一知识真源**
- `CortexOS/.memory/` 是 **CortexOS 自己的运行态与私有记忆**
- `AetherFleet/.memory/` 是 **AI 编排运行态**

硬规则：

> 用户长期知识、项目档案、分享内容、复盘沉淀，一律优先进入 `~/Documents/memory/`。  
> 不要把用户长期资产写进 `CortexOS/.memory/`。

## 按需深入

| 如果你要做... | 跑这个命令 |
|---|---|
| 了解系统状态 | `cortexos status` |
| 查看可用规则 | `cortexos list-rules` |
| 读取具体规则 | `cortexos rule <关键词>` |
| 看最近做了什么 | `cortexos logs 5` |
| 搜索知识库 | `cortexos search <关键词>` |
| 查看凭证 | `cortexos secrets` |

## HTTP 模式（其他 AI 可调用）

```bash
cortexos serve --port 3579
# GET http://localhost:3579/api/brief
# GET http://localhost:3579/api/status
# GET http://localhost:3579/api/search?q=关键词
```

## 原则

- ❌ 不要一次读完所有文件
- ❌ 不要为了"了解系统"而通读 docs/
- ❌ 不要把 `CortexOS` 自己的私有运行记忆误当成用户知识真源
- ✅ 先 `cortexos brief`，遇到问题再查对应命令
- ✅ 所有 AI（任何工具）都通过 cortexos CLI 访问大脑
- ✅ 涉及用户长期知识时，默认回写 `~/Documents/memory/`
