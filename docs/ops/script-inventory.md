# 脚本清单与输出地图

## 目标

这份文档只回答当前态问题：
1. 哪些脚本目录仍属于 CortexOS 主链
2. 它们分别负责什么
3. 它们的主要输出写到哪里

不再记录历史迁移建议、冻结计划或个人工具说明。

## 当前主线脚本目录

| 目录 | 作用 | 主要输出 |
| --- | --- | --- |
| `scripts/actions/` | Fleet、任务、项目索引、看板同步入口 | `.memory/sqlite/ai-team.db`、`.memory/projects/*`、`.memory/cache/ai_team_status.local.json` |
| `scripts/lib/` | AI Team 状态与数据库访问内核 | `.memory/sqlite/ai-team.db` |
| `scripts/services/` | 本地 bridge、飞书/Lark 通知、外部服务桥接 | HTTP JSON、`.last_notif.json` |
| `scripts/core/` | 自动驾驶、运行总控、系统级写入 | `.memory/logs/*`、`.memory/cache/*` |
| `scripts/maintenance/` | 健康检查、守护、自我复盘 | 控制台报告、`.memory/retros/*`、`.memory/meta/*` |
| `scripts/ingest/` | 记忆索引、语义检索、向量入库 | `chroma_db/`、索引与查询输出 |
| `scripts/tools/` | 核心运维工具 | 健康报告、上传输出、探针日志 |
| `scripts/wechat/` | 微信发布链路 | 远端草稿、`tmp/wechat_preview.html` |

## 关键主线脚本

### `scripts/actions/`
- `fleet-claim.mjs`
- `fleet-checkin.mjs`
- `fleet-status.mjs`
- `fleet-handover.mjs`
- `fleet-cleanup.mjs`
- `fleet-post-task.mjs`
- `project-registry.mjs`
- `sync-fleet-dashboard.mjs`
- `init-ai-team-db.mjs`

### `scripts/lib/`
- `ai-team-db.mjs`
- `ai-team-state.mjs`

### `scripts/services/`
- `fleet-control-bridge.mjs`
- `feishu-bot-bridge.mjs`
- `lark-service.mjs`

### `scripts/core/`
- `auto-pilot.js`
- `sentinel.js`

### `scripts/maintenance/`
- `verify-health.js`
- `health-gate.js`
- `error-retro.mjs`
- `check-docs-index.js`
- `check-skill-paths.mjs`
- `mcp-guard.mjs`
- `verify-clean.js`

### `scripts/ingest/`
- `chroma_ingest.py`
- `build_memory_index.py`
- `query_brain.py`
- `retrieval_scope.json`
- `injection_policy.json`

### `scripts/tools/`
- `health-check.js`
- `sync-skills-management.mjs`
- `rag_probe.sh`
- `up.sh`

### `scripts/wechat/`
- `push.mjs`
- `push-boiling-snow.mjs`
- `preview.mjs`
- `utils.mjs`

## 主线输出路径

### AI Team 状态
- `.memory/sqlite/ai-team.db`
- `.memory/cache/ai_team_status.local.json`

### 项目索引
- `.memory/projects/registry.json`
- `.memory/projects/index.md`
- `.memory/projects/README.md`
- `.memory/plans/projects/*-command-center.md`

### 运行日志与复盘
- `.memory/logs/YYYY-MM-DD.md`
- `.memory/retros/YYYY-MM-error-retro.md`
- `.memory/meta/error-retro-seen.json`

### 检索与索引
- `chroma_db/`
- `.memory/index/*`
- `.memory/rag_logs/*`（如启用探针）

### 发布与通知
- `.last_notif.json`
- `tmp/wechat_preview.html`
- 远端草稿与外部通知结果
