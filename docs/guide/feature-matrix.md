# 🧭 CortexOS 功能总表（完整使用功能）

> 这页是 CortexOS 使用功能的总入口（命令 + MCP Tool）。  
> 目标：用户只看这一页，就知道大脑“能做什么、怎么用、何时用”。

---

## 1. CLI 命令总表（`package.json` 全量）

### 1.1 文档站

| 命令 | 用途 | 什么时候用 |
| :--- | :--- | :--- |
| `pnpm run dev` | 启动文档开发服务器 | 本地写文档、调界面 |
| `pnpm run docs:build` | 构建 VitePress 静态站点 | 发布前构建检查 |
| `pnpm run docs:preview` | 本地预览构建产物 | 验证构建后页面 |

### 1.2 健康检查

| 命令 | 用途 | 什么时候用 |
| :--- | :--- | :--- |
| `pnpm run health:core` | 核心结构严格体检 | 每日开工前 |
| `pnpm run health:docs-index` | 检查文档索引一致性 | 改目录、改路由后 |
| `pnpm run health:verify` | 汇总健康检查验证 | 批量改动后 |
| `pnpm run health:gate` | 作为门禁的总检查 | 提交前/发版前 |

### 1.3 AI Team（Fleet 编排）

| 命令 | 用途 | 什么时候用 |
| :--- | :--- | :--- |
| `pnpm run fleet:claim -- --workspace "$PWD" --task "任务" --agent "Codex" --alias "Codex"` | 入队挂牌、声明任务 | 开工前必须 |
| `pnpm run fleet:status` | 查看队列、队长、冲突风险 | 领任务前/冲突排查 |
| `pnpm run fleet:handover -- --to-node "节点名"` | 队长移交 | 需要切换指挥权 |
| `pnpm run fleet:cleanup` | 清理离线/超时僵尸节点 | 人工维护或排障 |
| `pnpm run fleet:checkin` | 节点心跳/状态回写 | 需要补报进度时 |
| `pnpm run fleet:sync-dashboard` | 同步舰队看板 JSON | 看板数据刷新 |

### 1.4 服务与 Agent 启动辅助

| 命令 | 用途 | 什么时候用 |
| :--- | :--- | :--- |
| `pnpm run feishu:bot` | 启动飞书机器人桥接服务 | 需要飞书桥接时 |
| `pnpm run gemini:auto` | Gemini 自动接入脚本（不注入 `$start`） | Gemini 端快速开工 |
| `pnpm run claude:auto` | Claude 自动接入脚本 | Claude 端快速开工 |
| `pnpm run codex:auto` | Codex 自动接入脚本 | Codex 端快速开工 |
| `pnpm run codex:setup` | 安装 Codex 快捷命令 | 新机器初始化 |

---

## 2. 后台任务（Auto-Pilot）

- 进程名：`brain-cortex-pilot`
- 脚本：`scripts/core/auto-pilot.js`
- 托管：PM2（5 分钟节奏）
- 统一配置：`config/brain-runtime.json`
- Lark 统一服务：`scripts/services/lark-service.mjs`

### 2.1 后台任务清单（来自配置）

| 任务名 | 默认状态 | 调度 | 作用 |
| :--- | :--- | :--- | :--- |
| `brain-cortex-pilot` | 开启 | `*/5 * * * *` | 自动同步、AI Team 态势记录、僵尸清理、看板刷新 |

修改 `config/brain-runtime.json` 后，执行以下命令使配置生效：

```bash
bash scripts/core/init-project.sh
```

常用操作：

```bash
pm2 ls
pm2 describe brain-cortex-pilot
pm2 restart brain-cortex-pilot
pm2 logs brain-cortex-pilot --lines 100
```

详细规则见：`docs/rules/auto-pilot.md`

---

## 3. MCP Tool 总表（`mcp_server/server.py` 全量 12 项）

| Tool | 用途 | 典型触发 |
| :--- | :--- | :--- |
| `read_router` | 读取大脑最高协议 | 冷启动第一步 |
| `get_fleet_status` | 获取全体节点状态 | 并行冲突判断 |
| `fleet_claim` | 节点挂牌登记 | 开工前声明任务 |
| `fleet_handover` | 移交队长 | 变更指挥节点 |
| `load_rule` | 懒加载单条规则 | 按需加载规范 |
| `list_rules` | 列出可用规则 | 不确定规则名时 |
| `log_task` | 写入操作日志 | 完工留档 |
| `fleet_sync` | 同步舰队状态到前端看板 | 需要看板刷新时 |
| `list_secrets` | 列出外置秘钥文件 | 检查秘钥清单 |
| `read_secret` | 读取指定秘钥文件 | 读取 token/env |
| `send_lark_notification` | 发送飞书通知（转调 Node 统一 Lark 服务） | 战报推送 |
| `search_knowledge` | 检索知识库文档 | 经验召回/复盘查询 |

---

## 4. 扩展能力入口

| 目标 | 入口路径 | 说明 |
| :--- | :--- | :--- |
| 扩展规则 | `docs/rules/` | 新增团队规范与 SOP |
| 扩展技能 | `docs/skills/`、`~/.codex/skills/` | 增加可复用工作流 |
| 扩展知识 | `memory/knowledge/` | 沉淀复盘、经验、方案 |
| Agent 配置 | `docs/agents/` | Gemini/Codex/Claude/OpenCode 配置位 |
| 隐私与秘钥 | `docs/rules/privacy_secret_protection_protocol.md` | 秘钥存放与安全边界 |

---

## 5. 使用顺序（新用户最短路径）

1. 读 [上手指南](/guide/) 完成安装和 MCP 挂载。  
2. 启动后台任务（`brain-cortex-pilot`）并确认 `pm2 ls` 为 `online`。  
3. 开工前执行 `fleet:claim`，完工后 `log_task` 留档。  
4. 需要扩展时，从“扩展能力入口”对应目录补文档/规则/技能。  
