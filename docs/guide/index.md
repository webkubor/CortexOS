# 🚀 CortexOS 上手指南（小白版）

这份指南给第一次接触 CortexOS 的同学使用，目标是 10 分钟内完成三件事：

1. 本地跑起来（大脑核心）。
2. 配好 cortexos CLI（任何 AI 都能调用）。
3. 学会扩展自己的外部大脑（知识、规则、秘钥）。

如果你要看"完整功能清单"，直接看：
👉 [CortexOS 功能总表](/guide/feature-matrix)

---

## 0. 你会得到什么

- 一个可被任何 AI 调用的本地外部大脑（CLI 命令 + HTTP API）。
- 一套可沉淀的记忆系统（文档长期可追溯）。
- 纯净的规则分发与知识检索机制。

> 💡 **核心架构**: CortexOS 已进化为 **Pure Brain Mode**。逻辑路由、记忆资产与工程规则完全分层，支持毫秒级的上下文对齐。

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

## 3. 配置 cortexos CLI（让 AI 能调用大脑）

### 3.1 添加 PATH

```bash
echo 'export PATH="$PATH:$HOME/Documents/CortexOS/bin"' >> ~/.zshrc
source ~/.zshrc
```

### 3.2 验证

```bash
cortexos brief
```

看到 ~25 行的大脑快照就成功了。

### 3.3 每个 AI 怎么配

其实不用配。每个 Agent 的配置文件已经写好了：

- **Gemini** → `~/.gemini/GEMINI.md`（已经告诉它跑 `cortexos brief`）
- **Claude** → `~/.claude/CLAUDE.md`（同上）
- **Codex** → `~/.codex/AGENTS.md`（同上）
- **Kimi** → 环境变量 `KIMI_AGENTS_MD`（同上）

打开任意一个 AI，直接问它 `cortexos brief`，它就知道怎么做了。

### 3.4 HTTP API（可选，给 Web 应用或不支持 shell 的 AI）

```bash
cortexos serve --port 3579
# 然后任何能发 HTTP 请求的应用都可以调用
# http://localhost:3579/api/brief
# http://localhost:3579/api/status
# http://localhost:3579/api/search?q=关键词
```

---

## 4. 日常高频命令

| 命令 | 什么时候用 |
| :--- | :--- |
| `cortexos brief` | 开工第一步，获取大脑状态 |
| `cortexos init` | 工作区冷启动入口（设计中） |
| `cortexos status` | 快速看系统状态 |
| `cortexos search <关键词>` | 检索知识库 |
| `cortexos logs 3` | 看最近3天日志 |
| `pnpm run dev` | 本地启动文档/规则预览站 |

如果你希望 AI 自动识别当前工作区、命中项目索引并挂载项目文档，请继续看：

👉 [CortexOS init 协议设计](/guide/init-protocol)

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
2. 验证检索：`cortexos search "你的问题"`。

### 6.2 扩展规则库

1. 在 `docs/rules/` 新建 `.md` 文档。
2. 在 `docs/router.md` 登记新规则。
3. Agent 通过 `cortexos rule <名>` 按需加载。

### 6.3 扩展秘钥

1. 在 `memory/secrets/` 新建文件。
2. 使用 `cortexos secrets` 查看凭证清单。
