<div align="center">
  <img src="https://raw.githubusercontent.com/webkubor/CortexOS/main/docs/public/logo.svg" width="120" height="120" alt="CortexOS Logo">
  <h1>CortexOS</h1>
  <p><b>个人外部大脑操作系统 · 当前版本 v5.7.0</b></p>
  <p>
    <img src="https://img.shields.io/badge/Release-v5.7.0-111111.svg?style=flat-square" alt="Release v5.7.0">
    <img src="https://img.shields.io/badge/MCP-v1.0-blue.svg?style=flat-square" alt="MCP v1.0">
    <img src="https://img.shields.io/badge/License-MIT-d4a017.svg?style=flat-square" alt="License MIT">
  </p>
  <p>
    <img src="https://img.shields.io/badge/Codex-supported-111827.svg?style=flat-square&logo=openai&logoColor=white" alt="Codex supported">
    <img src="https://img.shields.io/badge/Gemini_CLI-supported-1a73e8.svg?style=flat-square&logo=google-gemini&logoColor=white" alt="Gemini CLI supported">
    <img src="https://img.shields.io/badge/Claude-supported-b5651d.svg?style=flat-square" alt="Claude supported">
    <img src="https://img.shields.io/badge/OpenClaw-supported-7c3aed.svg?style=flat-square" alt="OpenClaw supported">
    <img src="https://img.shields.io/badge/AI_Team-local_control_plane-0f766e.svg?style=flat-square" alt="AI Team local control plane">
  </p>
</div>

> CortexOS 不是聊天壳子，而是一套把规则、项目、日志、协作状态锚定在本地磁盘上的个人外部大脑。

## 它解决什么问题

- AI 上下文易失：会话结束后，规则、决策、待办容易蒸发。
- 多模型协作失控：Gemini、Claude、Codex 并行工作时，容易撞车、重复劳动、状态不一致。
- 项目记忆断裂：AI 能回答局部问题，但对你手头有哪些项目、项目状态如何、上次做到哪一步并不稳定。

CortexOS 的做法是把这三类信息落在本地：
- `docs/`：协议、规则、公开文档
- `.memory/`：小烛私有运行态记忆、任务池、项目索引、日志
- `~/Documents/memory/`：用户长期知识资产，通过 Obsidian MCP 跨项目复用

## 如果你已经在用小龙虾

如果你已经在用小龙虾或 OpenClaw 这一类强单兵 Agent，这个项目就是给你下一步升级用的。

- 单兵模式擅长一次把一个问题干穿
- CortexOS 解决的是多个 Agent、多个项目、多个会话之间的持续协同
- 小龙虾负责打穿单点任务，CortexOS 负责把任务、记忆、规则、项目索引和协作状态接起来

换句话说：
- 如果你的小龙虾还只是单兵作战，CortexOS 很适合你
- 它不是替代单兵 Agent，而是把单兵能力接入一个可持续运行的外部大脑
- 你可以继续保留小龙虾的执行力，但把项目级上下文、任务流转和多 Agent 配合沉淀到 CortexOS

## 核心能力

### 1. MCP 外脑接口

`mcp_server/server.py` 暴露统一工具，把“读宪法、看舰队、登记任务、记录日志、查知识库”变成标准动作。

关键工具包括：
- `read_router()`：读取大脑宪法
- `get_fleet_status()`：查看舰队态势
- `fleet_claim()`：开工登记
- `task_handoff_check()`：完工回写与待办扫描
- `log_task()`：写入每日操作日志
- `search_knowledge()`：跨知识库检索

### 2. AI Team 舰队协同

所有 Agent 在进入项目前都要先看路由、看舰队、打卡挂牌。这样可以实现：
- 同路径并行告警
- 队长移交
- 当前任务、工作路径、角色可视化
- 任务完成后自动回写状态

<div align="center">
  <img src="https://cdn.jsdelivr.net/gh/webkubor/upic-images@main/assets/img_1773212700.png" width="800" alt="AI Team 面板与小龙虾接入状态">
  <p><i>▲ 实时展示当前项目的工作 Agent 流转，现已完整支持 <b>小龙虾 (Lobster) / 栖月</b> 接入本地中枢。</i></p>
</div>

CortexOS 的 AI Team 面板不仅支持多常见大语言模型引擎，更具备对**「小龙虾」**架构的深度结合。你可以在这个大面板里清楚看到小龙虾的实时攻坚进展、它的打卡任务和并行协作节点流转。

### 3. 项目自动落地

这是这次补强的重点。现在 AI Team 在任意项目路径执行 `fleet:claim` 或 `fleet:checkin` 时，会自动：
- 检查项目是否已登记
- 未登记则补录项目
- 已登记则刷新最近任务、最近 Agent、最近工作路径、最后触达时间
- 生成或刷新项目 command center

项目索引位置：
- [`.memory/projects/index.md`](./.memory/projects/index.md)
- [`.memory/projects/registry.json`](./.memory/projects/registry.json)
- `./.memory/plans/projects/`

### 4. 文档与运行态分层

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
