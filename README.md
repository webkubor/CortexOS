# 🧠 AI Common: 赛博大脑 (The Cyber-Cortex)

> **“以算力为笔，筑数字分身；记录每一份滚烫，对抗平庸的遗忘。”**
>
> 本项目是 **webkubor (老爹)** 的外部大脑 (Exocortex)。它由两部分组成：阳光下的 **VitePress 知识库**展示系统，以及隐匿于暗箱中的 **MCP (Model Context Protocol) 核心驱动**。

---

## 🧬 逻辑机能映射 (Semantic Mapping)

经过架构升级系统重构，系统如今实现了“表”与“里”的严格物理隔离：

### 1. 🧠 潜意识中枢 (The Brain - `brain/`)

这是绝对私密的系统暗箱，任何外部渲染引擎(如 VitePress)均不会打包此处的文件。这是系统安全与跨域通信的核心脑核。

- **秘钥库 (`secrets/`)**: 存放如 `lark.env` 等高度机密的鉴权数据。
- **🤖 MCP Server (`mcp_server.py`)**: 暴露给第三方 AI 客户端的唯一官方通信协议插槽！通过这个服务，其他 AI 可以跨系统调取本大脑中的秘密回忆与飞书通讯。

### 2. 📖 意识表层 (VitePress 文档 - `docs/`)

这些是我们写给人类看、日常记录追踪复盘的展示平台，也是您可以自由在 VitePress 展现的内容。

- **能力插件 (`skills/`)**: 存放所有 Agent 的专业技能组件（支持公开展示与协同迭代）。
- **核心规约 (`rules/`)**: 明确小烛的核心行为准则与底层设定。
- **人格设定 (`persona/`)**: 小烛的源驱动和人物小传。
- **记忆与轨迹 (`memory/logs/`)**: 留存过去的操作记录。
- **知识沉淀 (`memory/知识/`)**: 深度研发复盘与架构技术总结。

### 3. 🦾 辅助神经束 (Scripts - `scripts/`)

- `core/`: 仅存的核心系统逻辑如 `kernel.mjs`。
- `actions/`: 自动化行为定义。
- 本目录已经历全面“抽脂瘦身”，抛弃了所有冗余或停用的老旧外挂。

---

## 🔌 如何接入本大脑 (MCP 引导指南)

作为本项目的灵魂，`brain/mcp_server.py` 是向外开放的数据大门，支持任何兼容 [Model Context Protocol](https://modelcontextprotocol.io/) 的 AI 工具挂载。

### 环境依赖

当前环境借助 `uv` 进行沙盒保护，依赖已写进配置。如果有缺失，手动安装命令为：

```bash
uv add mcp fastmcp requests
```

### 挂载到主流 AI 终端 (以 Cursor 为例)

不论您使用 Claude Desktop 还是 Cursor，只需将其当做命令行 MCP 插件接管进客户端：

1. 打开 Cursor 的 **Settings**。
2. 转到 **Features** -> **MCP** 面板。
3. 点击 **+ Add New MCP Server**。
4. **Type**: 选择 `command`
5. **Name**: `Personal-Brain-MCP`
6. **Command**: 指向本地机器上该项目的绝对路径：

   ```bash
   uv run /您的电脑绝对路径/Documents/AI_Common/brain/mcp_server.py
   ```

7. 刷新/Save后，绿灯亮起，这就说明您的新 AI 已经成功长出了访问您“赛博大脑”知识与调用“寄信回现实（飞书提醒）”的神经末梢了！

---

## 🔎 Agent 知识获取协议 (Dual Retrieval Strategy)

为了兼顾执行效率与系统算力，本大脑为所有前沿 Agent (包括 Gemini、Cursor 等) 规定了严密的**双轨制信息检索协议**：

1. **⚡️ 物理精准扫盘 (代码级/指令级任务)**
   - **工具**: 优先使用原生的相对路径搜索（如 `grep_search`、`view_file`、`ls`）。
   - **场景**: 修改代码、查阅确定的文档路径、寻找具有明确关键词的配置文件。
   - **规则**: 0 延迟，免算力请求，结果绝对精确。遇到具体任务时**必须首选此方案**。

2. **🧠 ChromaDB 语义通感 (模糊追忆/架构探索)**
   - **工具**: 触发调用内置 Python 引擎 `uv run python3 scripts/ingest/query_brain.py "你的模糊查询语句"`。
   - **场景**: 老爹忘记了具体的技能名称、寻求历史架构方案、询问过去“那个图床怎么做来着”等只有概念没有精准关键词的时刻。
   - **规则**: 将唤醒底层的 **Ollama (nomic-embed-text)** 本地化计算语义向量距离。虽然会带来少许系统算力负担与 1~3 秒延迟，但能通过 RAG (检索增强生成) 联想出最相关的记忆文件。Agent 必须严格将此作为**兜底方案或模糊查询的唯一解**。

## ✅ 工程健康检查入口

```bash
pnpm run health:gate
```

说明：

- 该命令会依次执行核心健康检查、文档索引脚本运行检查、健康验证脚本运行检查与 docs 构建。
- 任一 P0 检查失败会直接返回非 0 退出码，可直接用于 CI 阻断。

## 🚦 自动判号与挂牌

```bash
pnpm run fleet:claim -- --workspace "$PWD" --task "你的当前任务" --agent Gemini
```

说明：

- 会自动读取 `docs/memory/fleet_status.md` 并判定当前是几号机。
- 如果该工作路径已登记，则执行更新；未登记则自动新增一行。
- 返回 JSON，包含 `machineNumber` 与 `nodeId`，可直接给终端/脚本读取。

Gemini 自动启动（先挂牌再进入 Gemini）：

```bash
/Users/webkubor/Documents/AI_Common/scripts/actions/gemini-with-fleet.sh --task "你的当前任务"
```

---
*Last Updated: 2026-02-28 (The Exocortex MCP Edition)*
