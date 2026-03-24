<div align="center">
  <img src="https://raw.githubusercontent.com/webkubor/CortexOS/main/docs/public/logo.svg" width="120" height="120" alt="CortexOS Logo">
  <h1>CortexOS</h1>
  <p><b>个人外部大脑操作系统 · 核心中枢 v6.0.0</b></p>
  <p>
    <img src="https://img.shields.io/badge/Version-v6.0.0-blue.svg?style=flat-square" alt="Version v6.0.0">
    <img src="https://img.shields.io/badge/CLI-cortexos-blue.svg?style=flat-square" alt="CortexOS CLI">
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
> CortexOS 是一套本地优先 (Local-first) 的个人外部大脑架构。它把规则、意志、项目轨迹与跨会话记忆，稳定落到你的本地磁盘与云端共享层上。

## 🪐 关联项目 (Related Projects)

- [CortexOS](https://github.com/webkubor/CortexOS): 本地优先的个人外部大脑与云端共享记忆入口。
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

这三层的边界必须非常清楚：

- `CortexOS` 是独立助手，有自己的 soul 与运行记忆
- `~/Documents/memory/` 是用户本人的唯一知识真源
- `CortexOS/.memory/` 不是用户资产库，只是 CortexOS 自己的私有运行层

## 💎 卓越能力

### 1. cortexos CLI（全能接口）
通过 `cortexos` 命令行工具，任何 AI 都能访问大脑：
```bash
cortexos brief          # 极简快照（~25行）
cortexos init           # 冷启动当前工作区（设计中）
cortexos router         # 完整路由
cortexos status         # 状态概览
cortexos rule <名>      # 加载具体规则
cortexos logs 5         # 最近5天日志
cortexos search 关键词  # 知识库搜索
cortexos serve          # HTTP API 模式（端口3579）
```

> 💡 **设计原则**：不依赖 MCP 协议。CLI 命令是通用接口，HTTP API 是补充，任何能跑 shell 或发 HTTP 请求的 AI 工具都能调用。

### 2. Cloud Brain API（云端共享记忆入口）

仓库内已经包含云端大脑接口服务，后续进入项目的 agent 不应忽略这层能力：

- 本地代码路径：`services/brain-api/`
- Cloud Run 服务名：`brain-api`
- 当前服务地址：[https://brain-api-675793533606.asia-southeast2.run.app](https://brain-api-675793533606.asia-southeast2.run.app)

当前最小接口：

- `GET /health`
- `POST /memories`
- `GET /memories`
- `POST /notifications`
- `GET /notifications`
- `POST /notifications/:id/triage`
- `POST /tasks`
- `GET /tasks`

这层的定位是：让**杭州本地节点**与**雅加达远端节点**共享同一份云端大脑主库，而不是替代本地 CortexOS 本体。

当前数据流已经收口为：

- `notifications`：远端汇报先进入 inbox
- `memories`：只沉淀重点知识
- `tasks`：需要后续动作的事项

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
├── services/brain-api       # 【云端扩展】Cloud Run 共享记忆服务
├── bin/cortexos             # 【接口层】CLI 工具入口（任何 AI 可调用）
├── scripts/                 # 【动力层】维护、检索与通知脚本
└── package.json             # 【基石】项目配置
```

## 🛠️ 快速冷启动

### 1. 添加 PATH（首次使用）
```bash
export PATH="$PATH:~/Documents/CortexOS/bin"
# 写入 ~/.zshrc 永久生效
echo 'export PATH="$PATH:~/Documents/CortexOS/bin"' >> ~/.zshrc
```

### 2. 获取大脑快照
```bash
cortexos brief    # 25 行状态快照
```

### 2.5 下一步：工作区冷启动

如果你希望 AI 在进入任意仓库时自动知道“当前是什么项目、该读哪份项目档案、推荐什么规则”，建议采用新的 `cortexos init` 协议设计：

- [CortexOS init 协议设计](./docs/guide/init-protocol.md)

### 3. HTTP API 模式（其他 AI 可调用）
```bash
cortexos serve --port 3579
# GET http://localhost:3579/api/brief
```

---

## 📅 版本与演进

- **当前版本**：`v5.8.0`（脑体物理解构 · 知识代谢协议落地）
- **变更日志**：[`CHANGELOG.md`](./CHANGELOG.md)

*"不战而屈人之兵，善之善者也。CortexOS 让 AI 协作于无形，沉淀于有根。"*


---

## ⚡️ 技术栈与架构 (Technical Stack & Architecture)

- **总架构图**：[`docs/ops/architecture.md`](./docs/ops/architecture.md)（只描述 CortexOS 这个 Brain Agent 本体）

CortexOS 的设计哲学是"纯本地、高自主、可进化"。整个系统被清晰地划分为三层，每一层都采用最适合其职责的工具链。

### 核心分层架构

```
┌──────────────────────────────────────────────────┐
│                  大脑层 (Brain)                    │
│  - 规则 (Rules): docs/rules/                     │
│  - 知识 (Knowledge): docs/ & ChromaDB            │
│  - 人格身份 (Identity): IDENTITY.md             │
│  - 灵魂协议 (Soul): soul.md                     │
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
| **cortexos CLI** | `Python`, `http.server` | 提供 Agent 与系统交互的通用接口，支持 CLI 和 HTTP API 两种调用方式。 |
| **自动化引擎** | `Node.js`, `pm2`, `Shell` | 负责 7x24 小时的后台任务，如 Git 自动提交、状态监控、记忆收割、任务调度。 |
| **语义记忆 (RAG)** | `ChromaDB`, `Ollama`, `nomic-embed-text` | 将 `docs/` 和外部知识库向量化，实现高效的自然语言语义搜索。 |
| **结构化记忆** | `SQLite` (规划中) | 用于存储结构化的代码模式、硬约束和决策逻辑，提供比语义搜索更精确的逻辑检索。 |
| **依赖管理** | `pnpm` (workspace), `uv` | 分别管理 `Node.js` 和 `Python` 的依赖，确保环境隔离与可复现性。 |
| **人格与规则** | `Markdown` | 所有的大脑规则、人格协议、进化蓝图都以人类可读的 Markdown 定义，便于理解和修改。 |

---
