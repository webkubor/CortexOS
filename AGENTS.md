# 🧠 CortexOS 助理接入指南 (Assistant Guide)

> **CortexOS 核心定位**: 这是一个专门为老爹（Father / webkubor）量身定制的 **“大脑知识库”** 与 **“任务执行规则集”**。
> 所有的 Agent (Gemini, Codex, Claude) 都应将此处视为 **SSOT (唯一真理源)**。

---

## 🚀 助理冷启动协议 (Cold Start Protocol)

作为老爹的助理，你在任何时候开工前，**必须且仅须** 执行以下三步：

1.  **读取路由**: `get_context_brief()` (极简摘要) -> `read_router()` (全量协议)。
2.  **对齐状态**: 了解当前大脑的版本、老爹的最新战略意图。
3.  **获取任务**: 如果你支持多 Agent 协同，请从外部调度引擎（如 `aetherfleet-engine`）获取你的具体 `task_id`。

---

## 📚 知识分层架构 (Knowledge Layers)

| 目录 | 角色 | 用途 |
| :--- | :--- | :--- |
| **`docs/rules/`** | **律法 (Laws)** | 绝对禁止的行为、工程规范、安全边界。 |
| **`docs/sops/`** | **教条 (SOPs)** | 具体的任务执行步骤（如何发推、如何发布）。 |
| **`.memory/persona/`** | **灵魂 (Soul)** | 助理的人格调教、老爹的个人偏好、重试模式。 |
| **`.memory/logs/`** | **轨迹 (Traces)** | 过去执行的详细记录，用于提取进化经验。 |

---

## 🛠 核心工具链 (Core Toolsets)

CortexOS 通过 MCP (Model Context Protocol) 暴露以下核心能力：

-   **`read_router()`**: 读取最高协议。
-   **`get_context_brief()`**: 快速同步当前大脑状态。
-   **`search_knowledge()`**: 在老爹的本地知识库中进行语义检索。
-   **`load_rule("<name>")`**: 按需加载特定规则文件（省 Token）。
-   **`log_task()`**: 记录你当下的工程轨迹。

---

## ⚠️ 禁令与红线 (The Red Lines)

-   ❌ **禁止直接操作舰队调度**: 任务认领、状态上报已剥离至 `aetherfleet-engine`。
-   ❌ **禁止污染用户记忆**: 任何非资产性的日志，严禁进入 `~/Documents/memory/`。
-   ✅ **优先使用共享技能**: 所有跨 Agent 通用工具，必须存放在 `~/.agents/skills/`。

---
*Last Updated: 2026-03-17 | 大脑版本: v6.0.0 (Pure Brain Mode)*
