# 🚀 CortexOS 上手指南（小白版）

这份指南给第一次接触 CortexOS 的同学使用，目标是 10 分钟内完成三件事：

1. 本地跑起来。  
2. 接进 AI 客户端。  
3. 学会扩展自己的外部大脑（知识、规则、技能、MCP）。  

如果你要看“完整功能清单（全部命令 + 全部 MCP Tool）”，直接看：  
👉 [CortexOS 功能总表](/guide/feature-matrix)

---

## 0. 你会得到什么

- 一个可被 AI 调用的本地外部大脑（不是云端黑盒）。
- 一套可沉淀的记忆系统（文档长期可追溯）。
- 多 AI 协作不撞车的调度机制（fleet）。

---

## 0.5 开工前先看这 4 条规则

如果你要改代码、配环境、做 review、装 Skill，不要先在目录里盲找，先看这 4 条：

- [工程基线](/rules/engineering_baseline)：编码、Review、提交、环境约束都在这里
- [安全边界](/rules/security_boundary)：秘钥、隐私、公开边界、红线都在这里
- [Agent 治理](/rules/agent_governance)：授权、记忆、协作、权限默认值都在这里
- [Skill 治理](/rules/skill_governance)：Skill 使用触发、安装前审查、风险裁决都在这里

完整规则入口：

- [规则中心](/rules/)

---

## 1. 前置准备（5 项）

请先确认本机具备以下环境：

- Node.js 20+（强烈建议 22）
- pnpm 9+
- Python 3.11+（强烈建议 3.12）
- uv（Python 包管理）
- Git

快速检查：

```bash
node -v
pnpm -v
python3 --version
uv --version
git --version
```

---

## 2. 第一次安装（复制即用）

```bash
git clone git@github.com:webkubor/CortexOS.git
cd CortexOS
pnpm install
uv sync
```

成功判定：

- 命令无报错。
- 项目目录下出现 `.venv`（Python 虚拟环境）。

## 2.1 初始化你的个人档案（必做）

CortexOS 安装后只要求一份**最小运行配置**，它保存在**本机私有目录**，不上传到 Git。

运行向导：

```bash
pnpm run init:profile
```

向导会生成 `~/Documents/memory/identity/owner_profile.md`，并分成两层：

### 必需层（运行必需）

- AI 如何称呼你
- 回复语言 / 注释语言
- 通知时段
- 大脑路径、用户记忆路径、秘钥路径

### 可选层（偏好，不强制）

- 工程风格与代码风格
- 常用编辑器
- 助手昵称与形象描述

> 关键原则：系统先是工具，再允许你把它调成有个性的工具。
> 如果跳过此步，AI 会默认称呼你为「用户」，其余字段使用通用默认值。

---

## 3. 挂载到 AI 客户端（MCP）

### 3.1 CortexOS MCP（必配）

以下是可直接复制的客户端配置示例。

#### Gemini CLI（`~/.gemini/settings.json`）

```json
{
  "mcpServers": {
    "cortexos-brain": {
      "command": "uv",
      "args": [
        "run",
        "/你的/CortexOS/mcp_server/server.py"
      ],
      "trust": true
    }
  }
}
```

#### Codex（`~/.codex/config.toml`）

```toml
[mcp_servers.cortexos-brain]
command = "uv"
args = [
  "run",
  "--project",
  "/你的/CortexOS",
  "/你的/CortexOS/mcp_server/server.py"
]
startup_timeout_sec = 45
```

说明：

- `Gemini CLI` 用 JSON 配置（`settings.json`）。
- `Codex` 用 TOML 配置（`config.toml`）。
- 两边都只需把 `/你的/CortexOS` 换成你本机实际路径。

### 3.2 Obsidian MCP（强烈建议，连接 memory 仓库）

配置示例（将路径替换成你的 memory 仓库路径）：

```toml
[mcp_servers.obsidian]
command = "npx"
args = ["-y", "@mauricio.wolff/mcp-obsidian@latest", "/你的/memory-vault-path"]
```

成功判定：

- 在 AI 客户端能看到 `cortexos-brain` 可用。
- 调用 `read_router` 能返回路由内容。
- 不确定自己用的 Agent 配置文件在哪时，直接看：`docs/agents/index.md`。

---

## 4. 日常只用这 6 条命令

先记住高频命令，其他命令先不用学：

| 命令 | 什么时候用 |
| :--- | :--- |
| `pnpm run dev` | 本地看文档站 |
| `pnpm run health:core` | 快速体检核心结构 |
| `pnpm run fleet:status` | 看 AI 队列和冲突风险 |
| `pnpm run fleet:claim -- --workspace "$PWD" --task "任务名" --agent "Codex" --alias "Codex" --role "后端"` | 开工前打卡并声明角色 |
| `pnpm run fleet:sync-dashboard` | 同步舰队看板 |
| `cp docs/secrets/_templates/github.md <memory-secrets-path>/github.md` | 从仓库模板生成外置秘钥文件 |

---

## 4.1 后台自动任务（必须知道）

你看到的“5 分钟自动同步、日志、舰队维护”都由后台进程 `brain-cortex-pilot` 负责。  
如果它没跑，系统就不会自动记录和同步。

后台任务的统一配置文件：`config/brain-runtime.json`  
其中包含 `brain-cortex-pilot` 的默认状态、调度表达式和用途说明。
如果你额外配置了 Lark/飞书 Webhook，通知发送实现统一在：`scripts/services/lark-service.mjs`；未配置时后台任务仍会正常运行。

### 什么时候启动

- **首次安装完成后**：启动一次并保存为开机自启。  
- **每天开工前**：先看状态是不是 `online`。  
- **你改了 `scripts/core/auto-pilot.js` 或相关脚本后**：重启一次进程。  

后台任务的初始化、PM2 运维、重启与验活命令统一收敛到：

- [运行命令总表（SSOT）](/ops/runtime-command-reference)

你在这里先记住判断标准即可：

- `pm2 ls` 里 `brain-cortex-pilot` 状态是 `online`
- 日志里能看到同步/维护输出，而不是持续报错重启

---

## 5. 目录怎么理解（用户视角）

路径说明（统一约定）：

- 本指南只写逻辑路径，不绑定你本机的绝对路径。
- `memory/*` 表示你的外部记忆仓库（由你自己的环境决定物理位置）。

- `docs/router.md`：总入口，AI 每次启动先看这里。
- `docs/rules/`：规则库。重点看 `engineering_baseline.md` 与 `security_boundary.md`。
- `memory/knowledge/`：长期知识库（复盘、方案、经验）。
- `memory/secrets/`：高敏凭证区（不进 Git）。
- `docs/secrets/_templates/`：仓库内模板区，只放占位模板，不放真实凭证。
- `$CODEX_HOME/.memory/logs/`：助手私有操作日志（不属于用户记忆）。

---

## 6. 如何扩展这个大脑（实操）

### 6.1 扩展知识库（最常用）

适合：新增经验、技术结论、复盘。

1. 把 Markdown 放到 `memory/knowledge/...`。  
2. 执行入库：`uv run ./scripts/ingest/chroma_ingest.py`。  
3. 用 `uv run ./scripts/ingest/query_brain.py "你的问题"` 验证是否可召回。  

建议：

- 一篇文档只讲一个主题。
- 标题明确写场景，便于检索。

### 6.2 扩展规则库

适合：团队新增约束、流程、标准。

1. 在 `docs/rules/` 新建规则文档。  
2. 在 `docs/router.md` 增加路由入口或触发描述。  
3. 通过 `load_rule` 做按需加载验证。  

### 6.3 扩展技能（Skill）

适合：沉淀可复用工作流（例如发版、运维、内容生成）。

1. 先走门禁：按 `docs/rules/skill_governance.md` 进行安装前审查。  
2. 填写审查单：`docs/checklists/skill_vetting_report.md`。  
3. 审查通过后，在本机 skills 目录（如 `~/Desktop/skills`）创建或安装技能。  
4. 打开 `docs/skills/management.md` 确认“初始化建议安装”和“本机已安装扫描”状态。  
5. 同步用户侧索引：`~/Documents/memory/skills/index.md`。  
6. 给出触发语句和输入输出格式。  

最小审查命令：

```bash
npx -y clawhub@latest inspect <slug> --json --no-input
npx -y clawhub@latest inspect <slug> --files --no-input
npx -y clawhub@latest inspect <slug> --file SKILL.md --no-input
```

### 6.4 扩展 MCP 能力

适合：连接外部系统（Obsidian、Figma、数据库等）。

1. 在客户端 MCP 配置新增 server。  
2. 先做最小可用调用（例如 list/read）。  
3. 通过规则文档定义“何时触发、谁能用、写入边界”。  

---

## 7. 秘钥与隐私（必须看）

- 凭证目录：`memory/secrets/`（物理位置由你的环境配置决定）。
- 不要把密钥写进仓库或 `docs/`。
- `docs/secrets/` 现在只允许保留模板与说明文件，不允许保留真实凭证文档。
- 强烈建议直接从项目模板复制后再填值：

```bash
export MEMORY_SECRETS_DIR="/你的/memory-secrets-path"
mkdir -p "$MEMORY_SECRETS_DIR"
cp docs/secrets/_templates/github.md "$MEMORY_SECRETS_DIR/github.md"
cp docs/secrets/_templates/gitlab.md "$MEMORY_SECRETS_DIR/gitlab.md"
```

规范文档：`docs/rules/security_boundary.md`

---

## 8. 常见报错速查

### `uv: command not found`

先安装 uv，再执行 `uv sync`。

### `ValueError: ollama package is not installed`

执行：

```bash
uv pip install ollama
```

### `fleet:claim` 冲突警告

表示同路径已有 Agent 在跑，不是致命错误。先 `pnpm run fleet:status` 看清当前占用，再决定并行还是切路径。

### `better-sqlite3` / `NODE_MODULE_VERSION` 不匹配

说明当前 Node 版本和本地原生模块编译版本不一致。先切到仓库基线 Node，再重编译：

```bash
nvm use
npm rebuild better-sqlite3
```

---

## 9. 下一步建议

完成上面后，建议你做一次最小闭环：

1. 新建一篇知识文档到 `memory/knowledge/`。  
2. 重新入库并查询验证。  
3. 新增一条你自己的规则到 `docs/rules/`。  
4. 让 AI 按新规则执行一次真实任务。  
