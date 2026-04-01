# 运行命令总表（SSOT）

> 所有与后台任务、PM2 运维、初始化相关的命令统一收敛到本页。其他页面只保留使用场景，不再重复整块命令清单。

## 1. 初始化

```bash
cd CortexOS
pnpm bootstrap
```

用途：

- 首次安装后初始化后台任务
- 自动安装 `cortexos` / `cs` CLI 命令入口
- 自动拉起本地 `brain-api`（默认 `127.0.0.1:3679`）
- 修改运行时配置后重新应用默认状态

## 2. PM2 日常运维

```bash
pm2 ls
pm2 describe brain-cortex-pilot
pm2 logs brain-cortex-pilot --lines 100
pm2 restart brain-cortex-pilot
pm2 stop brain-cortex-pilot
pm2 save
pm2 startup
```

### 推荐命令

```bash
pnpm brain:up
pnpm brain:logs
pnpm brain:status
pnpm brain:watch
```

## 3. 判定标准

- `pm2 ls` 中 `brain-cortex-pilot` 为 `online`
- `pnpm brain:status` 中云端与后台在线
- `pm2 logs` 中能看到带类型标签的结构化输出
- 修改脚本后执行一次 `pm2 restart brain-cortex-pilot`
- `pnpm brain:tui` 可正常进入终端主脑控制台
