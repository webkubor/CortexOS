# 自动巡航 (Auto-Pilot)

## 1. 定义与目标

Auto-Pilot 是 `CortexOS` 主脑的后台维护层，不是外部执行系统。

它的职责只有一件事：

> 保证主脑自己的收件箱、索引、日志、安全与记忆收割保持健康。

## 2. 当前核心任务

| 任务 | 脚本 | 职能 |
| :--- | :--- | :--- |
| `brain-inbox` | `scripts/maintenance/brain-inbox.mjs` | 拉取 Cloud Brain 通知、生成本地 inbox、执行自动分诊。 |
| `mcp-guard` | `scripts/maintenance/mcp-guard.mjs` | 检查本地 MCP 相关链路与运行状态。 |
| `memory-index` | `scripts/ingest/build_memory_index.py` | 更新本地语义索引。 |
| `error-retro` | `scripts/maintenance/error-retro.mjs` | 归档错误、生成复盘候选。 |
| `memory-harvest` | `scripts/maintenance/memory-harvest.mjs` | 从运行记录中收割高价值记忆。 |

## 3. 明确不再负责什么

`Auto-Pilot` 不再负责：

- `AetherFleet` 节点清理
- `fleet sync` 看板同步
- AI Team / 舰队运行态纠偏
- 任何外部执行编排系统的维护任务

这些能力如果存在，也应留在 `AetherFleet` 自己的后台体系里。

## 4. 运行模式

- **CLI 模式**: 手动执行相关维护脚本。
- **PM2 模式**: `brain-cortex-pilot` 常驻托管，持续维护主脑收件箱与运行健康。
- **Git Hook 模式**: 仅保留与 CortexOS 自身安全相关的检查。

## 5. 设计原则

1. `Auto-Pilot` 只维护 CortexOS 自己
2. 不承担外部编排系统的后台职责
3. 不再把舰队/执行态逻辑混进主脑自动巡航
