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
- [Prompt Lab](https://github.com/webkubor/prompt-lab): AI 影像工作流指南与创意参考库。
- [nanobanana-plus](https://github.com/webkubor/nanobanana-plus): 强化型 Gemini 绘图扩展，支持逐调用模型切换。
- [Bloom](https://github.com/webkubor/typora-Bloom-theme): 专注长文书写的 Typora 主题，承载静谧的排版艺术。

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

> 💡 **Fleet 调度说明**: 原有的 `fleet_claim`, `get_fleet_status` 等工具已迁移至独立的 `aetherfleet-engine` 服务，实现“大脑”与“肢体”的物理解构。

## 📂 目录结构 (Directory Structure)

```text
CortexOS/
├── docs/                    # 【协议层】宪法、规则、VitePress 站点库
│   ├── rules/               # 行为约束 (security, coding, habits)
│   ├── sops/                # 标准作业程序
│   └── ops/                 # 运维手册
├── .memory/                 # 【记忆层】助手私有运行态数据
│   └── logs/                # 进化记忆轨迹
├── mcp_server/              # 【接口层】专注于知识检索与分发的 FastMCP 服务
├── scripts/                 # 【动力层】维护、检索与通知脚本
└── package.json             # 【基石】项目配置与基础脚本入口
```

## 🛠️ 快速冷启动

### 1. 激活大脑 (Start Brain MCP)
```bash
uv run mcp_server/server.py
```

### 2. 调度接入 (Fleet Access)
请确保同时运行 `aetherfleet-engine` 以获得完整的 Agent 挂牌与状态感知能力。

---

## 📅 版本与演进

- **当前版本**：`v5.8.0`（规则系统收口 · MCP Python 化）
- **变更日志**：[`CHANGELOG.md`](./CHANGELOG.md)

*“不战而屈人之兵，善之善者也。CortexOS 让 AI 协作于无形，沉淀于有根。”*
��态分层

现在文档与运行态已经分开：
- `docs/` 只承载 DOC
- `docs/team/` 是 AI Team 本地独立大面板入口
- `.memory/` 承载真实运行数据，不再和文档混写

## 目录结构

```text
CortexOS/
├── docs/                    # 文档、规则、VitePress 站点
├── .memory/                 # 小烛私有运行记忆
│   ├── logs/                # 每日日志
│   ├── tasks/               # 任务池
│   ├── projects/            # 项目索引
│   └── plans/projects/      # 各项目指挥中心
├── mcp_server/              # MCP Server 实现
├── scripts/actions/         # fleet / project registry 等动作脚本
└── scripts/tools/           # 同步、扫描、治理脚本
```

## 快速接入

### 1. 启动 MCP Server

```bash
uv run /你的物理路径/CortexOS/mcp_server/server.py
```

AI Team 本地状态库会在 bridge 启动时自动初始化，不需要先手动执行 `pnpm run team:db:init`。
`AI Team` 页面只在本地启动文档站时显示，运行态数据不会发布到线上文档站。

### 1.5 一条命令启动本地 AI Team

```bash
pnpm run team:local
```

它会自动：
- 启动本地 bridge
- 启动带本地菜单的 VitePress
- 直接打开 `/CortexOS/team/`

用户不需要再单独理解 `fleet:bridge`、`team:db:init` 或文档站启动细节。

### 2. 在客户端挂载外脑

```json
{
  "mcpServers": {
    "cortexos-brain": {
      "command": "uv",
      "args": ["run", "/你的物理路径/CortexOS/mcp_server/server.py"]
    }
  }
}
```

### 3. 让 AI Team 自动登记项目

```bash
pnpm fleet:claim --workspace "$PWD" --task "开始开发" --agent Codex --alias Codex --role 后端
```

或手动补录：

```bash
pnpm projects:sync --workspace "$PWD" --agent Codex --role 后端 --task "补录项目"
```

## 当前版本与发布信息

- 当前文档版本：`v5.7.0`
- 变更记录：[`CHANGELOG.md`](./CHANGELOG.md)
- Git 版本标签：`v5.7.0`

## 适用场景

- 你同时使用多个 AI 客户端，需要共享统一规则与记忆
- 你手头有多个项目，希望 AI 进入项目时自动知道自己在哪、做过什么、接下来做什么
- 你希望日志、任务、项目索引都落在本地，可审计、可迁移、可恢复
- 你已经在用小龙虾这类强单兵 Agent，但想把它升级成带项目记忆和协同能力的工作体系

## 约束

- 秘钥不入仓库，统一外置
- 项目索引属于运行态，不是长期知识正文
- Agent 不能跳过 `fleet_claim` 直接改核心文件
- 文档变更、版本变更、标签发布要保持一致
