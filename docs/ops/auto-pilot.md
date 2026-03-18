# 自动巡航 (Auto-Pilot)

## 1. 定义与目标

Auto-Pilot 并不是指 Agent 自动写代码，而是指 CortexOS 大脑的**后台自我维护机制**。其目标是确保本地稳态、缓存同步与安全审计。

## 2. 核心任务清单

| 任务 | 周期 | 脚本 | 职能 |
| :--- | :--- | :--- | :--- |
| **安全巡检** | 提交前 | `scripts/auth/secret_validator.py` | 扫描硬编码密钥与敏感路径。 |
| **逻辑同步** | 每日 | `scripts/core/sync_router.py` | 确保 `router.md` 与数据库别名映射一致。 |
| **日志清理** | 每周 | `scripts/ops/auto_pilot.py --cleanup` | 归档并压缩过期的运行时日志。 |
| **健康自愈** | 实时/按需 | `scripts/ops/health_check.sh` | 自动重启异常挂掉的本地 MCP Server。 |

## 3. 运行模式

- **CLI 模式**: 手动执行 `pnpm run ops:auto-pilot`。
- **Git Hook 模式**: 挂载在 `pre-commit`，拦截风险操作。
- **后台模式**: 通过 `pm2` 或 `systemd` 托管，持续维护本地稳态。
