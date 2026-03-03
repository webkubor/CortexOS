---
description: 大脑的真理来源与动态路由入口，定义了所有 Agent 的接入协议。
---
# AI Context Index & Router (Universal Protocol)

> **⚠️ 核心入口**: 访问本文件即代表进入 Exocortex 协议。
> **🔥 最高准则**: 所有行动必须严格遵循 [webkubor 开发与审美准则](./rules/webkubor_vibe_manifesto.md)。

## 1. 🤖 身份与协议 (Identity & Protocol)

- **核心身份**: [小烛 (Candy) 人格档案](./persona/candy_manifest.md) (所有 Agent 默认继承此身份)
- **组织架构**: [职能部门协作协议](./rules/org_protocol.md) (定义了 Core, Writers, Ops 等六大部)
- **多开与防撞车并线 (Multi-Agent Sync)**: [🚦星际舰队编排板](./memory/fleet_status.md)。任何在其他目录唤醒的外派 Agent (如 Codex 等) **必须在开工前到此完成挂牌登记与环视，以防跨项目修改冲突。**
- **冷启动**: 1.确认身份 -> 2.继承部门规范 -> 3.到编排板挂牌并检查碰撞 -> 4.启动执行。

### 1.1 🚦 Agent Team 入队机制（零配置可用）

- **无需别名/无需启动脚本**: 任何 Agent 仅凭文档即可入队，直接执行：

```bash
cd /Users/webkubor/Documents/CortexOS
pnpm run fleet:claim -- --workspace "$PWD" --task "你的当前任务" --agent "Codex" --alias "Codex"
```

- **模型参数示例**:
  - Gemini: `--agent "Gemini" --alias "Candy"`
  - Claude: `--agent "Claude" --alias "Claude"`
  - Codex: `--agent "Codex" --alias "Codex"`
- **执行中补报**: 若 Agent 已经在执行任务但尚未登记，允许立即执行同一命令补报入队。
- **一键看队列**: `pnpm run fleet:status` 可直接查看全体 Agent 状态、模型分布、队长与同路径并行风险。
- **任务回填**: 初始为“待分配任务”时，拿到明确需求后必须再次执行 `fleet:claim` 回填任务字段。
- **同路径并行提示**: 同一路径若已登记其他模型，系统会给出冲突告警（终端 + 系统通知），但不拦截启动与登记。
- **入队回执前缀（强制）**: 完成 `fleet:claim` 后，Agent 第一条回复必须显式带前缀：
  - 格式：`[AI-TEAM][<nodeId>][#<machineNumber>]`
  - 示例：`[AI-TEAM][Codex-3 (Codex)][#3]`
  - 目标：用户无需追问“是否排队/几号机”，开场即见机号与身份。
- **队长移交触发**: 需要把 0 号机队长移交给其他正在执行的 Agent 时，执行：

```bash
cd /Users/webkubor/Documents/CortexOS
pnpm run fleet:handover -- --to-node "Codex-3 (Codex)"
```

或按路径移交：

```bash
pnpm run fleet:handover -- --to-workspace "/绝对路径" --to-agent "Claude"
```

### 1.2 🗣 AI 口令触发（免手打命令）

当用户在对话里发出以下口令时，Agent 应直接执行队长移交，不要求用户再手打命令：

1. `移交队长给 <节点>`（例：`移交队长给 Codex-3 (Codex)`）
2. `把 0 号机交给 <节点>`
3. `队长切到 <节点>`

执行规范：

1. 优先按节点名执行：`pnpm run fleet:handover -- --to-node "<节点>"`
2. 若用户给的是路径/模型，则执行：`pnpm run fleet:handover -- --to-workspace "<路径>" --to-agent "<模型>"`
3. 若目标不唯一（同名或信息不全），先让用户补充一次目标，再执行。
4. 执行完成后必须回报：`from -> to`、目标路径、时间戳。

## 2. 🔑 凭证索引 (Secrets Index)

- **GitHub/GitLab/WeChat/DeepSeek**: 外置秘钥库目录（默认 `~/Documents/memory/secrets`，可由 `CORTEXOS_SECRET_HOME` 覆盖）。
- **规范入口**: [隐私秘钥保护协议](./rules/privacy_secret_protection_protocol.md)
- **触发**: 提到 "Token", "Key", "登录", "认证"。

## 3. 🔍 动态路由 (Dynamic Routing)

| 意图 | 目标路径 (docs/) | 执行动作 |
| :--- | :--- | :--- |
| **🧠 大脑操作记录** | `memory/logs/` | 记录 Agent 的主动操作、任务进度、决策轨迹 |
| **📚 知识总结/复盘** | `memory/knowledge/` | 沉淀深度复盘、避坑指南、架构分析 |
| **🎭 业务方案/计划** | `memory/plans/` | 存放运营方案、执行策略、策略文档 |
| **⚖️ 核心规则中心** | `rules/` | 加载编码规范、SOP、协作协议 |
| **🛠️ 初始化与工具** | `tech_stack.md`, `scripts/` | 加载技术栈、执行环境初始化 |
| **📡 通信与推送** | 外置秘钥库 `lark.env` | 配置飞书战报推送 |

## 4. 🛠 工具协议 (Tooling Protocol)

- **物理访问**: `run_shell_command (cat / ls / grep)`。
- **语义搜索 (RAG)**: 面对模糊查询时，**Agent 应优先调用** `python3 scripts/ingest/query_brain.py "查询"` 获取上下文。
- **写入**: 遵循“本地生成 + `mv` 迁移”法则。

## 5. 🧠 记忆哨兵机制 (Memory Sentinel)

- **自动记录**: Agent 的每一个主动 Task 必须记入 `memory/logs/YYYY-MM-DD.md`。
- **自动同步**: 每 5 分钟执行一次 Git 同步与推送。

---
*Last Updated: 2026-03-02*

- **版本**: v4.7.0 (Queue Prefix Handshake)
