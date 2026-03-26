# OpenSpec 规范流

> `OpenSpec` 在 `CortexOS` 里不是大脑本体，而是**重要变更的规范层**。
> 它用来约束：主脑应该怎么提案、怎么设计、怎么拆任务、怎么归档。

## 1. 角色定位

在 `CortexOS` 里：

- `docs/`：长期规则、架构、运维文档真源
- `openspec/`：每一次重要变更的过程产物
- `services/brain-api/`：主脑对外 API
- `.memory/`：CortexOS 私有运行态
- `~/Documents/memory/`：用户长期知识真源

一句话：

> `OpenSpec` 记录“这次为什么改、准备怎么改、拆成哪些任务”，不替代主脑长期文档体系。

## 2. 什么时候必须走 OpenSpec

以下改动建议强制走 `OpenSpec`：

1. 新增或变更 Cloud Brain API
2. 调整 `notifications / tasks / memories` 数据流
3. 变更 CLI / MCP / HTTP API 的职责边界
4. 调整 subagent 上报协议
5. 重做主脑前台的信息架构
6. 引入新的长期 SSOT 规则

以下改动可以不走：

1. 小文案修正
2. 不改变行为的小重构
3. 局部样式微调
4. 单文件热修复

## 3. 当前 OpenSpec 目录

```text
openspec/
├── config.yaml
└── changes/
```

说明：

- `config.yaml`：CortexOS 专用上下文与约束
- `changes/`：每个变更的 proposal / design / tasks

## 4. 推荐命令

初始化已经完成，后续直接使用：

```bash
openspec list
openspec status
openspec show <change-name>
```

如果通过 AI 工具调用，优先使用：

```text
/opsx:propose
/opsx:apply
/opsx:archive
```

## 5. CortexOS 里的使用原则

1. 重大改动先提案，再写代码
2. Proposal 要说清楚为什么改，而不是只说怎么改
3. Design 要写清楚 SSOT 和数据流
4. Tasks 要能被 subagent 直接执行
5. 完成后再决定哪些内容回写到 `docs/` 成为长期真源

## 6. 与主脑文档的关系

推荐工作流：

1. 在 `openspec/changes/...` 里完成提案、设计、任务
2. 实施并验证
3. 把稳定结论回写到：
   - `docs/ops/*`
   - `docs/router.md`
   - `README.md`
   - `~/Documents/memory/`

这样可以避免把“变更过程稿”直接混进长期文档。
