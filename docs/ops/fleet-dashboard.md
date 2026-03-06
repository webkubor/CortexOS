# 🚦 舰队态势板（运行态）

舰队实时状态不再存放在 `docs/memory`，统一存放到助手私有目录：

- `.memory/fleet/fleet_status.md`
- `.memory/fleet/fleet_meta.json`

独立可视化大面板入口：

- `/team/`
- 本地开发时访问 `http://localhost:5173/CortexOS/team/`

可通过环境变量覆盖：

- `CORTEXOS_ASSISTANT_MEMORY_HOME=/你的路径/.memory`

常用命令：

```bash
pnpm run fleet:status
pnpm run fleet:claim -- --workspace "$PWD" --task "你的任务" --agent "Codex" --alias "Codex" --role "后端"
pnpm run fleet:sync-dashboard
```

说明：

- 文档站看板数据来自 `docs/public/data/ai_team_status.json`。
- 该 JSON 由 `pnpm run fleet:sync-dashboard` 从 `.memory/fleet/fleet_status.md` 生成。
