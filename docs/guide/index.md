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

CortexOS 是一个**通用框架**，你的个人偏好（称呼、审美、通知时段等）需要单独初始化，保存在**本机私有目录**，不上传到 Git。

运行向导：

```bash
pnpm run init:profile
```

向导会依次询问以下信息并生成 `~/Documents/memory/identity/owner_profile.md`：

- 你希望 AI 如何称呼你
- 回复语言偏好
- UI/工程审美偏好
- 有效通知时段
- 项目坐标路径

> 如果跳过此步，AI 会默认称呼你为「用户」，其余偏好也会使用通用默认值。

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
| `cp docs/secrets/_templates/github.md <memory-secrets-path>/github.md` | 从项目模板复制一份到外置秘钥目录 |

---

## 4.1 后台自动任务（必须知道）

你看到的“5 分钟自动同步、日志、舰队维护”都由后台进程 `brain-cortex-pilot` 负责。  
如果它没跑，系统就不会自动记录和同步。

后台任务的统一配置文件：`config/brain-runtime.json`  
其中包含 `brain-cortex-pilot` 的默认状态、调度表达式和用途说明。
Lark 战报发送实现统一在：`scripts/services/lark-service.mjs`。

### 什么时候启动

- **首次安装完成后**：启动一次并保存为开机自启。  
- **每天开工前**：先看状态是不是 `online`。  
- **你改了 `scripts/core/auto-pilot.js` 或相关脚本后**：重启一次进程。  

### 怎么启动（推荐）

```bash
cd CortexOS
bash scripts/core/init-project.sh
```

这个初始化脚本会自动启动 PM2 里的 `brain-cortex-pilot`。

### 已安装环境下的手动启动

```bash
cd CortexOS
pm2 start scripts/core/auto-pilot.js --name brain-cortex-pilot --cron-restart "*/5 * * * *" --no-autorestart
pm2 save
```

### 怎么确认它在跑

```bash
pm2 ls
pm2 describe brain-cortex-pilot
pm2 logs brain-cortex-pilot --lines 80
```

判定标准：

- `pm2 ls` 里 `brain-cortex-pilot` 状态是 `online`。  
- 日志里能看到同步/维护输出，而不是持续报错重启。  

### 改完代码后怎么生效

```bash
pm2 restart brain-cortex-pilot
```

### 开机自动恢复（只需配置一次）

```bash
pm2 startup
pm2 save
```

---

## 5. 目录怎么理解（用户视角）

路径说明（统一约定）：

- 本指南只写逻辑路径，不绑定你本机的绝对路径。
- `memory/*` 表示你的外部记忆仓库（由你自己的环境决定物理位置）。

- `docs/router.md`：总入口，AI 每次启动先看这里。
- `docs/rules/`：规则库（工程规范、协作协议、隐私协议）。重点看 `coding_rules.md` 与 `review_rules.md`。
- `memory/knowledge/`：长期知识库（复盘、方案、经验）。
- `memory/secrets/`：高敏凭证区（不进 Git）。
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

1. 先走门禁：按 `docs/rules/skill_vetting_gate.md` 进行安装前审查。  
2. 填写审查单：`docs/checklists/skill_vetting_report.md`。  
3. 审查通过后，再在本地 `skills` 目录创建或安装技能。  
4. 在对应 Agent 技能索引里登记。  
5. 给出触发语句和输入输出格式。  

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
- 强烈建议直接从项目模板复制后再填值：

```bash
export MEMORY_SECRETS_DIR="/你的/memory-secrets-path"
mkdir -p "$MEMORY_SECRETS_DIR"
cp docs/secrets/_templates/github.md "$MEMORY_SECRETS_DIR/github.md"
cp docs/secrets/_templates/gitlab.md "$MEMORY_SECRETS_DIR/gitlab.md"
```

规范文档：`docs/rules/privacy_secret_protection_protocol.md`

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

---

## 9. 下一步建议

完成上面后，建议你做一次最小闭环：

1. 新建一篇知识文档到 `memory/knowledge/`。  
2. 重新入库并查询验证。  
3. 新增一条你自己的规则到 `docs/rules/`。  
4. 让 AI 按新规则执行一次真实任务。  
