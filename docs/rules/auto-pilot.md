# 大脑自动运转系统 (Auto-Pilot)

> **目标**: 明确后台任务由谁跑、何时跑、怎么启停与验活。

## 1. 真正运行的后台任务

- **进程名**: `brain-cortex-pilot`
- **脚本**: `scripts/core/auto-pilot.js`
- **托管器**: PM2
- **调度节奏**: `--cron-restart "*/5 * * * *"`（每 5 分钟触发一次）

## 2. 自动运转内容（当前实现）

每次触发会执行：

1. 自动维护：`fleet-cleanup`（清理僵尸节点）+ `fleet-sync`（同步舰队看板）
2. 收集 AI Team 态势：在线/排队/离线/僵尸、队长、任务清单、进度
3. 汇总本轮改动文件（按路由意图分组）
4. 写入 `docs/memory/logs/YYYY-MM-DD.md`
5. 若有文件变更则自动提交，并执行知识入库
6. 发送飞书与本地通知（受通知时段限制）

## 3. 启动时机（必须执行）

- **首次安装后**: 必须启动一次后台任务
- **每天开工前**: 检查进程是 `online`
- **修改 auto-pilot 或相关脚本后**: 重启进程使新逻辑生效

## 4. 启动与管理命令

### 4.1 一键初始化（推荐）

```bash
cd CortexOS
bash scripts/core/init-project.sh
```

### 4.2 手动启动

```bash
cd CortexOS
pm2 start scripts/core/auto-pilot.js --name brain-cortex-pilot --cron-restart "*/5 * * * *" --no-autorestart
pm2 save
```

### 4.3 验活 / 日志 / 重启 / 停止

```bash
pm2 ls
pm2 describe brain-cortex-pilot
pm2 logs brain-cortex-pilot --lines 100
pm2 restart brain-cortex-pilot
pm2 stop brain-cortex-pilot
```

## 5. 开机自启（建议一次配置）

```bash
pm2 startup
pm2 save
```

## 6. 故障排查

- `status=stopped`：先 `pm2 restart brain-cortex-pilot`
- 高频重启：查看 `pm2 logs brain-cortex-pilot` 定位报错
- 日志无新增：检查 `docs/memory/logs/` 当天文件是否更新，确认当前目录是项目根
