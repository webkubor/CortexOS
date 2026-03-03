# 隐私秘钥保护协议

## 1. 目标

本协议用于替代项目内 `brain/secrets/` 存储方式。  
从现在开始，CortexOS 仓库**不再承载真实私钥文件**，只保留本协议作为规范入口。

## 2. 存储策略（外置）

- 默认外置目录：`~/Documents/memory/secrets`
- 可覆盖环境变量：`CORTEXOS_SECRET_HOME=/你的私有路径`
- 原则：
  - 私钥只存在外置目录，不进入 Git 仓库
  - 允许放模板文件，禁止放真实密钥到 `docs/`、`scripts/`、`brain/`
  - 外置目录建议单独备份、独立权限（`chmod 700` 目录，`chmod 600` 文件）

## 3. 与 MCP-Obsidian 协同

参考官方安装页：[MCP-Obsidian Install](https://mcp-obsidian.org/install/)

推荐做法：

1. 主工程 Vault：`/Users/webkubor/Documents/CortexOS`
2. 私钥 Vault：`/Users/webkubor/Documents/memory/secrets`
3. 在 MCP 客户端为两个 Vault 分别配置独立 server（按需启用）

Codex 示例（`~/.codex/config.toml`）：

```toml
[mcp_servers.obsidian-main]
command = "npx"
args = [ "-y", "@mauricio.wolff/mcp-obsidian@latest", "/Users/webkubor/Documents/CortexOS" ]

[mcp_servers.obsidian-secrets]
command = "npx"
args = [ "-y", "@mauricio.wolff/mcp-obsidian@latest", "/Users/webkubor/Documents/memory/secrets" ]
```

## 4. 模板生成

执行命令自动生成 GitHub / GitLab / WeChat / DeepSeek / Lark 等模板：

```bash
pnpm run secrets:init -- --target ~/Documents/memory/secrets/_templates
```

可选覆盖：

```bash
pnpm run secrets:init -- --target ~/Documents/memory/secrets/_templates --force
```

## 5. 最低模板要求

- `github.md`：`GITHUB_TOKEN` / `GITHUB_USERNAME` / `GITHUB_EMAIL`
- `gitlab.md`：`GITLAB_TOKEN` / `GITLAB_HOST` / `GITLAB_USERNAME`
- `deepseek.md`：`AI_UPSTREAM_API_KEY`
- `openrouter_token.md`：`API Key`
- `wechat.md`：`AppID` / `AppSecret`
- `lark.env`：`LARK_WEBHOOK_URL`
- `feishu_bot.env`：飞书双向机器人参数

## 6. 红线

- 严禁提交真实秘钥到 Git（包括 issue、日志、截图）
- 严禁把秘钥写进仓库任何 `*.md`、`*.json`、`*.env`
- 严禁在对话中明文回显完整 Token（最多展示前后各 4 位）
