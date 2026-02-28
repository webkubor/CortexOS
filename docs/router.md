---
description: 大脑的真理来源与动态路由入口，定义了所有 Agent 的接入协议。
---
# AI Context Index & Router (Universal Protocol)

> **⚠️ 核心入口**: 访问本文件即代表进入 Exocortex 协议。
> **🔥 最高准则**: 所有行动必须严格遵循 [webkubor 开发与审美准则](./rules/webkubor_vibe_manifesto.md)。

## 1. 🤖 身份与协议 (Identity & Protocol)
- **核心身份**: [小烛 (Candy) 人格档案](./persona/candy_manifest.md) (所有 Agent 默认继承此身份)
- **组织架构**: [职能部门协作协议](./rules/org_protocol.md) (定义了 Core, Writers, Ops 等六大部)
- **冷启动**: 1.确认身份 -> 2.继承部门规范 -> 3.确认 MCP 状态。

## 2. 🔑 凭证索引 (Secrets Index)
- **GitHub/GitLab/WeChat/DeepSeek**: `brain/secrets/` 目录下对应文件。
- **触发**: 提到 "Token", "Key", "登录", "认证"。

## 3. 🔍 动态路由 (Dynamic Routing)
| 意图 | 目标路径 (docs/) | 执行动作 |
| :--- | :--- | :--- |
| **🧠 大脑操作记录** | `memory/logs/` | 记录 Agent 的主动操作、任务进度、决策轨迹 |
| **📚 知识总结/复盘** | `memory/knowledge/` | 沉淀深度复盘、避坑指南、架构分析 |
| **🎭 业务方案/计划** | `memory/plans/` | 存放运营方案、执行策略、策略文档 |
| **⚖️ 核心规则中心** | `rules/` | 加载编码规范、SOP、协作协议 |
| **🛠️ 初始化与工具** | `tech_stack.md`, `scripts/` | 加载技术栈、执行环境初始化 |
| **📡 通信与推送** | `brain/secrets/lark.env` | 配置飞书战报推送 |

## 4. 🛠 工具协议 (Tooling Protocol)
- **物理访问**: `run_shell_command (cat / ls / grep)`。
- **语义搜索 (RAG)**: 面对模糊查询时，**Agent 应优先调用** `python3 scripts/ingest/query_brain.py "查询"` 获取上下文。
- **写入**: 遵循“本地生成 + `mv` 迁移”法则。

## 5. 🧠 记忆哨兵机制 (Memory Sentinel)
- **自动记录**: Agent 的每一个主动 Task 必须记入 `memory/logs/YYYY-MM-DD.md`。
- **自动同步**: 每 5 分钟执行一次 Git 同步与推送。

---
*Last Updated: 2026-02-27*
- **版本**: v4.5.0 (Intelligence Isolation)
