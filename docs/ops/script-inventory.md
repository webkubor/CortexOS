# 脚本工具清单 (Script Inventory)

> 🛠️ **定义**: `scripts/` 存放 CortexOS 大脑的核心驱动脚本与自动化工具。

## 1. 核心大脑驱动 (`scripts/core/`)

| 脚本 | 职能说明 |
| :--- | :--- |
| `switch_brain.py` | 动态切换当前活跃大脑（CortexOS / Project-Specific）。 |
| `sync_router.py` | 确保本地 `router.md` 与大脑逻辑索引同步。 |
| `query_logic.py` | 提供基于 SQLite 的结构化逻辑检索。 |

## 2. 身份与安全 (`scripts/auth/`)

| 脚本 | 职能说明 |
| :--- | :--- |
| `gemini_manager.sh` | 管理 Gemini Profile (OAuth/Accounts) 的多身份切换。 |
| `secret_validator.py` | 扫描仓库中的硬编码敏感信息（Pre-commit 核心）。 |

## 3. 自动化运维 (`scripts/ops/`)

| 脚本 | 职能说明 |
| :--- | :--- |
| `auto_pilot.py` | 负责后台日志清理、心跳维护与自愈逻辑。 |
| `health_check.sh` | 检查 MCP Server、Lark Webhook 等外部服务连通性。 |

## 4. 资产管理 (`scripts/assets/`)

| 脚本 | 职能说明 |
| :--- | :--- |
| `ingest_knowledge.py` | 将 Markdown 文档转化为 ChromaDB 向量索引。 |
| `export_changelog.py` | 根据 `log_task` 生成版本发布记录。 |

---
*注意：已废弃的舰队调度脚本（fleet-*.mjs）已迁移至 aetherfleet-engine 独立维护。*
