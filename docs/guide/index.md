# 🚀 CortexOS 上手指南（小白版）

这份指南给第一次接触 CortexOS 的同学使用，目标是 10 分钟内完成三件事：

1. 本地跑起来（大脑核心）。  
2. 接进 AI 客户端（MCP）。  
3. 学会扩展自己的外部大脑（知识、规则、秘钥）。  

如果你要看“完整功能清单（全部命令 + 全部 MCP Tool）”，直接看：  
👉 [CortexOS 功能总表](/guide/feature-matrix)

---

## 0. 你会得到什么

- 一个可被 AI 调用的本地外部大脑（基于 FastMCP）。
- 一套可沉淀的记忆系统（文档长期可追溯）。
- 纯净的规则分发与知识检索机制。

> 💡 **注意**: CortexOS 现在专注于“大脑”职能。如果你需要多 AI 协作调度（Fleet），请配合使用 `aetherfleet-engine`。

---

## 0.5 开工前先看这 3 条规则

如果你要改代码、配环境、做 review、写知识，不要先在目录里盲找，先看这 3 条：

- [工程基线](/rules/engineering_baseline)：编码、Review、提交、环境约束都在这里。
- [安全边界](/rules/security_boundary)：秘钥、隐私、公开边界、红线都在这里。
- [Agent 治理](/rules/agent_governance)：授权、记忆、协作原则都在这里。

---

## 1. 前置准备

请先确认本机具备以下环境：

- Node.js 20+
- pnpm 9+
- Python 3.11+
- uv (Python 包管理)

---

## 2. 第一次安装（复制即用）

```bash
git clone git@github.com:webkubor/CortexOS.git
cd CortexOS
pnpm install
uv sync
```

---

## 3. 挂载到 AI 客户端 (MCP)

### 3.1 CortexOS Brain MCP (核心大脑)

以下是可直接复制的客户端配置示例。

#### Gemini CLI (`~/.gemini/settings.json`)

```json
{
  "mcpServers": {
    "cortexos-brain": {
      "command": "uv",
      "args": ["run", "/你的/CortexOS/mcp_server/server.py"],
      "trust": true
    }
  }
}
```

#### Claude Desktop (macOS)

```json
{
  "mcpServers": {
    "cortexos-brain": {
      "command": "uv",
      "args": ["run", "/你的/CortexOS/mcp_server/server.py"]
    }
  }
}
```

---

## 4. 日常高频命令

| 命令 | 什么时候用 |
| :--- | :--- |
| `pnpm run dev` | 本地启动文档/规则预览站 |
| `pnpm run memory:query` | 在终端直接检索你的知识库 |
| `pnpm run memory:index` | 知识库更新后刷新语义索引 |

---

## 5. 目录怎么理解

- `docs/router.md`：总入口，AI 每次启动先看这里。
- `docs/rules/`：规则库。定义 AI 的行为准则。
- `memory/knowledge/`：长期知识库（复盘、方案、经验）。
- `memory/secrets/`：高敏凭证区（外置，不进 Git）。
- `.memory/logs/`：助手私有操作日志。

---

## 6. 如何扩展这个大脑

### 6.1 扩展知识库

1. 把 Markdown 放到 `memory/knowledge/...`。  
2. 执行入库：`pnpm run memory:index`。  
3. 验证检索：`pnpm run memory:query "你的问题"`。

### 6.2 扩展规则库

1. 在 `docs/rules/` 新建 `.md` 文档。
2. 在 `docs/router.md` 登记新规则。
3. 让 Agent 通过 `load_rule` 加载并执行。

### 6.3 扩展秘钥

1. 在 `memory/secrets/` 新建文件。
2. 使用 `read_secret` 或 `write_secret` 工具进行安全访问。
