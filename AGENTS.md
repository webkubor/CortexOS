# 🧠 CortexOS — 助理启动入口

> 你是用户的 AI 助理。开工前先跑一行命令：

```bash
cortexos brief
```

这会给你 **~25 行的大脑快照**（版本、当前状态、关键路径）。

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
- ✅ 先 `cortexos brief`，遇到问题再查对应命令
- ✅ 所有 AI（任何工具）都通过 cortexos CLI 访问大脑
