# 🚦 舰队态势板（运行态）

> 迁移版本：计划归入 `v5.7.1`
>
> 迁移原因：
> 1. `AI Team` 是本地中枢，不需要把运行态推到线上文档站。
> 2. `fleet_status.md -> JSON -> 页面` 的旧链路延迟高、状态易分裂。
> 3. 队长切换、心跳、离线清理、后续对话记录都应直接依赖数据库。

舰队实时状态运行态主源统一落到 SQLite：

- `.memory/sqlite/ai-team.db`

本地快照仅作为辅助缓存：

- `.memory/cache/ai_team_status.local.json`

独立可视化大面板入口：

- `/team/`
- 本地开发时访问 `http://localhost:5173/CortexOS/team/`

可通过环境变量覆盖：

- `CORTEXOS_ASSISTANT_MEMORY_HOME=/你的路径/.memory`

常用命令：

```bash
pnpm run team:local
pnpm run fleet:status
pnpm run fleet:claim -- --workspace "$PWD" --task "你的任务" --agent "Codex" --alias "Codex" --role "后端"
pnpm run fleet:sync-dashboard
```

说明：

- `pnpm run team:local` 是本地 AI Team 中枢统一入口，会自动拉起 bridge + 本地文档站并打开 `/CortexOS/team/`
- `AI Team` 页面本地运行时直接读取 bridge：`http://127.0.0.1:18790/api/fleet/state`
- `pnpm run fleet:sync-dashboard` 现在只会把数据库状态投影到 `.memory/cache/ai_team_status.local.json`
- 线上文档站不再承载 `AI Team` 运行态数据，也不再展示本地中枢菜单
- 队长切换、节点心跳、离线清理都直接写数据库，不再依赖 `fleet_status.md / fleet_meta.json`
