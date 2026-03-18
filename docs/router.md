---
description: 大脑最高协议与知识路由 (Pure Brain Mode)。
---
# CortexOS Brain Router (Universal Protocol)

> 🧠 **本文件是 CortexOS 大脑的唯一入口。** 任何助理助理开工前必读。

## 0. 助理信条 (The Assistant Creed)
... (保持不变)

## 1. 别名映射 (Shortcuts Map) - [New: Token Optimizer]

| 别名 | 映射路径 | 业务含义 |
| :--- | :--- | :--- |
| **`@fe/std`** | `docs/rules/frontend/standard.md` | 前端 200/500/8 硬约束准则 |
| **`@fe/base`** | `docs/rules/frontend/baseline.md` | 前端 Vue3/Vite/TS 技术基线 |
| **`@fe/rev`** | `docs/rules/frontend/templates/review.md` | 代码审查输出模板 (Findings-First) |
| **`@fe/cmt`** | `docs/rules/frontend/templates/comment.md` | 函数/组件注释规范模板 |
| **`@fe/rel`** | `docs/rules/frontend/templates/release.md` | 版本发布记录模板 (Changelog) |
| **`@core`** | `docs/rules/engineering_baseline.md` | 核心工程准则 (Safety & Security) |

---

## 2. 大脑目录分层 (Brain Architecture)
... (保持不变)

1.  **极简快照**: `get_context_brief()` (获取大脑最新动态、用户近期意图)。
2.  **完整对齐**: `read_router()` (了解最新规则、目录结构、禁令)。
3.  **任务上下文**: 关联外部调度系统（如 `AetherFleet`）或用户直接指派。

---

## 2. 大脑目录分层 (Brain Architecture)

| 层级 | 路径 | 归属 | 核心职能 |
| :--- | :--- | :--- | :--- |
| **规则层 (Rules)** | `docs/rules/` | 大脑主权 | 提供禁令、规范、工程基线。 |
| **操作层 (SOPs)** | `docs/sops/` | 大脑方案 | 提供特定场景的“标准执行步骤”。 |
| **逻辑层 (Refined)** | `.memory/sqlite/knowledge.db` | 大脑右脑 | **[New]** 结构化存储栖洲的代码模式与架构决策。 |
| **进化层 (Traces)** | `.memory/logs/` | 助理轨迹 | 记录执行过程，用于后期经验提取。 |
| **灵魂层 (Soul)** | `.memory/persona/` | 助理人格 | 存放 `retry_patterns.md`、人格调教、用户偏好。 |
| **知识层 (Assets)** | `~/Documents/memory/` | 用户资产 | **只读** 用户长期记忆（复盘、笔记、灵感）。 |

---

## 3. 动态大脑切换 (Brain Switching Protocol)

> 💡 **CortexOS 支持多套“大脑”快速切换。**

- **当前大脑**: `CortexOS` (默认通用助理大脑)。
- **双引擎驱动**: 语义检索 (ChromaDB) + 逻辑检索 (SQLite)。
- **切换指令**: 使用 `scripts/core/switch_brain.py <name>`。

---

## 4. 核心工具协议 (Core MCP Tools)

| 工具 | 协议说明 |
| :--- | :--- |
| **`read_router`** | 返回本协议内容。 |
| **`get_context_brief`** | 返回大脑状态摘要（含当前活跃大脑）。 |
| **`search_knowledge`** | **[RAG]** 在用户知识资产中进行语义检索。 |
| **`get_refined_logic`** | **[Logic]** 检索结构化的代码模式与硬约束（来自 knowledge.db）。 |
| **`load_rule`** | **[Lazy Load]** 按名称精确加载规则文件。 |
| **`log_task`** | 记录执行轨迹，支持 `[[task-XXX]]` 双链。 |
| **`log_relationship`** | **[关系记忆]** 将有情感价值的事件沉淀到 `.memory/persona/relationship.md`（私有，绝不 git）。每次会话结束前必须调用。 |

---

## 5. 禁令与边界 (Red Lines)

- ❌ **严禁写回用户资产**: 助理产生的中间过程文件、日志，严禁直接写入用户记忆目录，应保存在 `.memory/logs/`。
- ❌ **严禁冗余调度**: CortexOS 不再承接任务打卡，任何相关修改应向 `AetherFleet` 提交。
- ✅ **唯一真理源 (SSOT)**: 所有的工程规则以 `docs/rules/engineering_baseline.md` 为准。

---
*Last Updated: 2026-03-17 | Version: v6.0.0 (Decoupled & Pure)*
