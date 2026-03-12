# CortexOS Memory Formula（记忆法则）

> 定义助手私有记忆（`.memory`）与用户长期记忆（`~/Documents/memory`）的边界，避免混写、误读和历史残留回流。

## 1. 当前目录结构

```text
$CODEX_HOME/.memory/
├─ memory_formula.md                # 本规则
├─ cache/                           # 本地快照与缓存
├─ identity/                        # 用户偏好与称呼规则
├─ index/                           # 检索索引状态
├─ logs/                            # 助手操作日志
├─ meta/                            # 守护与复盘元信息
├─ persona/                         # 助手私有策略文件（历史目录名，非公开人格绑定）
├─ plans/                           # 项目计划与指挥中心
├─ projects/                        # 项目索引
├─ retros/                          # 错误复盘
└─ sqlite/                          # 本地主库
```

## 2. 存放边界

| 内容类型 | 存放路径 | 说明 |
| :--- | :--- | :--- |
| 助手私有策略、提示策略、失败重试模式 | `$CODEX_HOME/.memory/persona/` | 仅助手使用，不是项目公开人格定义 |
| 运行日志 | `$CODEX_HOME/.memory/logs/` | 仅记录操作轨迹，不写密钥 |
| 项目索引与协作计划 | `$CODEX_HOME/.memory/{projects,plans}/` | 作为控制层入口 |
| 系统运行状态 | `$CODEX_HOME/.memory/sqlite/`、`$CODEX_HOME/.memory/cache/` | 主库与本地快照 |
| 用户技术知识、复盘、方案、素材 | `~/Documents/memory/{knowledge,shares,publish}/` | 属于用户资产，不写入 `.memory` |
| 与 CortexOS 运行无关的个人资料、脚本、素材、项目备忘 | `~/Documents/memory/` | 属于用户个人资产 |
| 用户高敏凭证 | `~/Documents/memory/secrets/` | 永不进入 Git 仓库 |

## 3. 读取触发矩阵

| 触发场景 | 必读文件 / 工具 | 读取策略 |
| :--- | :--- | :--- |
| 会话冷启动 | `docs/router.md` | 强制读取 |
| 多 Agent 开工前 | `get_fleet_status()` | 强制读取 |
| 需要对齐用户称呼/节奏 | `.memory/identity/owner_profile.md` | 按需懒加载 |
| 输出质量下降、重复犯错 | `.memory/persona/retry_patterns.md` | 按需懒加载 |
| 需要统一私有提示策略 | `.memory/persona/prompt_strategy.md` | 按需懒加载 |
| 查询项目历史计划 | `.memory/plans/`、`.memory/projects/` | 按需懒加载 |

## 4. 写入触发矩阵

| 触发场景 | 写入位置 | 规则 |
| :--- | :--- | :--- |
| 每次完成一个明确任务 | `.memory/logs/YYYY-MM-DD.md` | 1-5 句，记录动作与结果 |
| 发现稳定可复用的提示策略 | `.memory/persona/prompt_strategy.md` | 只写可复用规则，不写项目私密 |
| 出现可复现失败并找到解法 | `.memory/persona/retry_patterns.md` | 记录“症状-原因-重试步骤” |
| 用户偏好变化 | `.memory/identity/owner_profile.md` | 只维护偏好与称呼，不写密钥 |
| AI Team 进入项目执行任务 | `.memory/projects/index.md` + `.memory/plans/projects/*-command-center.md` | 自动登记或刷新 |

## 5. 防污染规则

- 禁止把用户长期知识写进 `.memory`
- 禁止把与 CortexOS 运行无关的个人内容写进 `.memory`
- 禁止把助手运行日志写进 `~/Documents/memory/`
- 禁止在 `.memory` 根目录散落临时碎片文件
- 任何密钥一律只进 `~/Documents/memory/secrets/`

## 6. 访问边界

| 记忆类型 | 路径 | 所有 Agent 可读 | 只有 CortexOS 写 |
| :--- | :--- | :--- | :--- |
| 用户知识 / 复盘 / 素材 | `~/Documents/memory/` | ✅ | — |
| 助手运行日志 | `.memory/logs/` | — | ✅ |
| 助手私有策略 | `.memory/persona/` | — | ✅ |
| 项目索引与计划 | `.memory/projects/`、`.memory/plans/` | — | ✅ |
| 系统运行状态 | `.memory/sqlite/`、`.memory/cache/` | — | ✅ |

**Obsidian MCP 统一指向 `~/Documents/memory/`**：
- Gemini CLI: `~/.gemini/settings.json`
- Codex: `~/.codex/config.toml`
- Claude Code: `~/.claude/settings.json`
