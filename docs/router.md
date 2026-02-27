---
description: 大脑的真理来源与动态路由入口，定义了所有 Agent 的接入协议。
---
# AI Context Index & Router (Universal Protocol)

> **⚠️ 核心入口**: 访问本文件即代表进入 Exocortex 协议。

## 1. 🤖 身份与协议 (Identity & Protocol)
- **核心身份**: [小烛 (Candy) 人格档案](./persona/candy_manifest.md) (所有 Agent 默认继承此身份)
- **组织架构**: [职能部门协作协议](./rules/org_protocol.md) (定义了 Core, Writers, Ops 等六大部)
- **冷启动**: 1.确认身份 -> 2.继承部门规范 -> 3.确认 MCP 状态。

## 2. 🔑 凭证索引 (Secrets Index)
- **GitHub/GitLab/WeChat/DeepSeek**: `docs/secrets/` 目录下对应文件。
- **触发**: 提到 "Token", "Key", "登录", "认证"。

## 3. 🔍 动态路由 (Dynamic Routing)
| 意图 | 目标路径 (docs/) | 执行动作 |
| :--- | :--- | :--- |
| **执行日志/进度** | `memory/journal/` | 记录任务状态、操作轨迹、每日小结 |
| **复盘/经验** | `memory/retrospectives/` | 加载历史教训、知识总结、深度复盘 |
| **业务运营/方案** | `memory/operations/` | 加载运营方案、执行计划、策略文档 |
| **知识库自检** | `rules/external-health-check.md` | 检查路径、链接、结构完整性 |
| **安全/Token** | `rules/privacy_excludes.md`, `secrets/` | 加载脱敏规则与密钥 |
| **项目初始化** | `tech_stack.md`, `rules/project_initialization_sop.md` | 加载架构与 SOP |
| **编码/Git** | `rules/vibe_rules.md`, `rules/git_commit_rules.md` | 加载规范 |
| **GitHub/推送** | `rules/github_ops_sop.md` | 执行认证与推送流程 |
| **技能/插件** | `skills/index.md` | 获取全量职能架构 |

## 4. 🛠 工具协议 (Tooling Protocol)
- **物理访问**: `run_shell_command (cat / ls / grep)` 绕过沙箱，用于精确读取。
- **语义搜索 (RAG)**: 当面对模糊查询（如“昨天干了啥”、“XX 规则是什么”）时，**Agent 应优先调用** `python3 scripts/ingest/query_brain.py "查询"` 获取语义关联的上下文。
- **写入**: 遵循“本地生成 + `mv` 迁移”法则。

## 5. 🧠 记忆哨兵机制 (Memory Sentinel)

> **原则**: 模型无关的自动记录，记录所有操作、进度、状态。

### 执行方式
- **自动记录**: 每个操作都记录到 `memory/journal/YYYY-MM-DD.md`
- **自动驾驶**: PM2 托管 `scripts/auto-pilot.js` 每 5 分钟执行一次“同步-入库-推送”闭环。

---
*Last Updated: 2026-02-27*
- **智力档位**: v3.8.0 (Hardcore Edition)
