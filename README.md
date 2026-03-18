<div align="center">
  <img src="https://raw.githubusercontent.com/webkubor/CortexOS/main/docs/public/logo.svg" width="120" height="120" alt="CortexOS Logo">
  <h1>CortexOS</h1>
  <p><b>个人外部大脑操作系统 · 核心中枢 v5.8.0</b></p>
  <p>
    <img src="https://img.shields.io/badge/Version-v5.8.0-blue.svg?style=flat-square" alt="Version v5.8.0">
    <img src="https://img.shields.io/badge/MCP-Python_Core-blue.svg?style=flat-square" alt="MCP Python Core">
    <img src="https://img.shields.io/badge/License-MIT-111111.svg?style=flat-square" alt="License MIT">
  </p>
  <p>
    <img src="https://img.shields.io/badge/Codex-supported-111827.svg?style=flat-square&logo=openai&logoColor=white" alt="Codex supported">
    <img src="https://img.shields.io/badge/Gemini_CLI-supported-1a73e8.svg?style=flat-square&logo=google-gemini&logoColor=white" alt="Gemini CLI supported">
    <img src="https://img.shields.io/badge/Claude-supported-b5651d.svg?style=flat-square" alt="Claude supported">
    <img src="https://img.shields.io/badge/Lobster-integrated-7c3aed.svg?style=flat-square" alt="Lobster integrated">
  </p>
</div>

> **【CortexOS · Codex 02】**
>
> CortexOS 是一套本地第一 (Local-first) 的多 Agent 协作架构。它将规则、意志、项目轨迹与跨会话记忆，持久化在你的本地磁盘之上。

## 🪐 宇宙图谱 (Project Map)

- [CortexOS](https://github.com/webkubor/CortexOS): 本地优先的 AI 记忆系统与多 Agent 协作中枢。
- [AetherFleet](https://github.com/webkubor/AetherFleet): 实时、可视化、沉浸式的 AI Team 协作引擎。
- [Prompt Lab](https://github.com/webkubor/prompt-lab): AI 影像工作流指南与创意参考库。
- [nanobanana-plus](https://github.com/webkubor/nanobanana-plus): 强化型 Gemini 绘图扩展，支持逐调用模型切换。

## ⚔️ 核心架构：对抗混乱

在 AI 协作中，我们面临三大熵增：
1. **上下文易失**：会话结束，规则即刻蒸发。
2. **多机协作失控**：多模型并行时的状态冲突与重复劳动。
3. **项目记忆断裂**：AI 对项目全局与历史进度缺乏稳定认知。

**CortexOS 通过三层防御体系锁定秩序：**
- `docs/`：**至高协议层**。沉淀法则、SOP 与公开文档。
- `.memory/`：**运行态核心**。存放助手私有日志、任务池、项目注册表。
- `~/Documents/memory/`：**永恒知识库**。用户私人资产，通过 Obsidian MCP 实现跨项目语义召回。

## 💎 卓越能力

### 1. MCP 全能接口 (Universal Interface)
通过 `mcp_server/server.py`（Python 核心），专注于知识检索与规则分发：
- `read_router()`：读取大脑至高宪法。
- `search_knowledge()`：基于语义或全文检索永恒知识库。
- `load_rule()`：按需加载特定规则，节省上下文。
- `log_task()`：刻录每日操作轨迹，增强 Obsidian 协同。

> 💡 **Fleet 调度说明**: 运行态调度已迁移至独立的 [AetherFleet](https://github.com/webkubor/AetherFleet) 服务，实现“大脑”与“肢体”的物理解构。

## 📂 目录结构 (Directory Structure)

```text
CortexOS/
├── docs/                    # 【协议层】宪法、规则、VitePress 站点库
│   ├── rules/               # 行为约束 (security, coding, habits)
│   ├── sops/                # 标准作业程序
│   └── ops/                 # 运维手册
├── .memory/                 # 【记忆层】助手私有运行态数据
│   ├── identity/            # 用户习惯与设备画像 (Local-only)
│   └── logs/                # 进化记忆轨迹
├── mcp_server/              # 【接口层】专注于知识检索与分发的 FastMCP 服务
├── scripts/                 # 【动力层】维护、检索与通知脚本
└── package.json             # 【基石】项目配置
```

## 🛠️ 快速冷启动

### 1. 激活大脑 (Start Brain MCP)
```bash
uv run mcp_server/server.py
```

### 2. 调度接入 (Fleet Access)
请确保同时运行 `aetherfleet-engine` 以获得完整的 Agent 状态感知能力。

---

## 📅 版本与演进

- **当前版本**：`v5.8.0`（脑体物理解构 · 知识代谢协议落地）
- **变更日志**：[`CHANGELOG.md`](./CHANGELOG.md)

*“不战而屈人之兵，善之善者也。CortexOS 让 AI 协作于无形，沉淀于有根。”*


---

## ⚡️ 技术栈与架构 (Technical Stack & Architecture)

CortexOS 的设计哲学是“纯本地、高自主、可进化”。整个系统被清晰地划分为三层，每一层都采用最适合其职责的工具链。

### 核心分层架构

```
┌──────────────────────────────────────────────────┐
│                  大脑层 (Brain)                    │
│  - 规则 (Rules): docs/rules/                     │
│  - 知识 (Knowledge): docs/ & ChromaDB            │
│  - 人格 (Persona): soul.md                       │
│  - 进化蓝图 (Evolution): .memory/persona/evolution.md│
└──────────────────────────────────────────────────┘
                 ▲ │
                 │ │ (通过 MCP 工具协议交互)
                 ▼ │
┌──────────────────────────────────────────────────┐
│                  内核层 (Kernel)                   │
│  - MCP Server (Python/FastMCP): mcp_server/      │
│  - 自动化引擎 (Node.js/pm2): scripts/core/        │
│  - 调度与哨兵 (kernel.mjs/sentinel.js)         │
└──────────────────────────────────────────────────┘
                 ▲ │
                 │ │ (读写私有数据/记忆)
                 ▼ │
┌──────────────────────────────────────────────────┐
│                  记忆层 (Memory)                   │
│  - 私有记忆 (.memory/): 关系、日志、配置          │
│  - 长期资产 (~/Documents/memory/): 外部知识库    │
│  - 向量数据 (chroma_db/): 语义搜索索引         │
└──────────────────────────────────────────────────┘
```

### 技术栈详解

| 模块 | 主要技术 | 职责与目的 |
| :--- | :--- | :--- |
| **MCP 工具协议** | `Python`, `uv`, `FastMCP` | 提供 Agent 与系统交互的稳定 API，如文件操作、知识搜索、关系记忆写入。 |
| **自动化引擎** | `Node.js`, `pm2`, `Shell` | 负责 7x24 小时的后台任务，如 Git 自动提交、状态监控、记忆收割、任务调度。 |
| **语义记忆 (RAG)** | `ChromaDB`, `Ollama`, `nomic-embed-text` | 将 `docs/` 和外部知识库向量化，实现高效的自然语言语义搜索。 |
| **结构化记忆** | `SQLite` (规划中) | 用于存储结构化的代码模式、硬约束和决策逻辑，提供比语义搜索更精确的逻辑检索。 |
| **依赖管理** | `pnpm` (workspace), `uv` | 分别管理 `Node.js` 和 `Python` 的依赖，确保环境隔离与可复现性。 |
| **人格与规则** | `Markdown` | 所有的大脑规则、人格协议、进化蓝图都以人类可读的 Markdown 定义，便于理解和修改。 |

---
