# CortexOS Memory Formula (记忆法则)

> 定义助手私有记忆（`.memory`）与用户长期记忆（`~/Documents/memory`）的边界，避免混写与误读。

## 1. 目录结构（Assistant Private Memory）

```text
$CODEX_HOME/.memory/
├─ memory_formula.md                # 本规则（必读）
├─ fleet/
│  ├─ fleet_status.md               # 多 Agent 运行态
│  └─ fleet_meta.json               # 看板元数据
├─ logs/
│  └─ YYYY-MM-DD*.md                # 助手操作日志
├─ persona/
│  ├─ candy_manifest.md             # 人格主定义（冷启动读）
│  ├─ prompt_strategy.md            # 提示策略与输出偏好
│  └─ retry_patterns.md             # 失败重试模式
└─ identity/
   └─ owner_profile.md              # 用户偏好（称呼/语言/节奏）
```

## 2. 存放边界（放哪里）

| 内容类型 | 存放路径 | 说明 |
| :--- | :--- | :--- |
| 助手偏好、提示策略、思维习惯、失败重试 | `$CODEX_HOME/.memory/persona/` | 仅助手可用，不写入用户长期记忆 |
| 运行日志 | `$CODEX_HOME/.memory/logs/` | 仅记录操作轨迹，不写密钥 |
| 舰队协作状态 | `$CODEX_HOME/.memory/fleet/` | 多 Agent 协同运行态 |
| 用户技术知识/复盘/分享素材 | `~/Documents/memory/{knowledge,shares,publish}/` | 属于用户资产，不写入 `.memory` |
| 项目索引/协作计划索引 | `$CODEX_HOME/.memory/{projects,plans}/` | 由小烛维护，作为控制层入口 |
| 用户高敏凭证 | `~/Documents/memory/secrets/` | 永不进入 Git 仓库 |

## 3. 读取触发矩阵（什么时候读）

| 触发场景 | 必读文件 | 读取策略 |
| :--- | :--- | :--- |
| 会话冷启动 | `docs/router.md` + `.memory/persona/candy_manifest.md` | 强制读取 |
| 多 Agent 开工前 | `.memory/fleet/fleet_status.md` | 强制读取（防冲突） |
| 需要对齐用户称呼/风格 | `.memory/identity/owner_profile.md` | 按需懒加载 |
| 输出质量下降、重复犯错 | `.memory/persona/retry_patterns.md` | 按需懒加载 |
| 需要统一提示策略 | `.memory/persona/prompt_strategy.md` | 按需懒加载 |
| 写日志前 | 当日日志文件（不存在则新建） | 只追加，不全量回读 |

## 4. 写入触发矩阵（什么时候写）

| 触发场景 | 写入位置 | 规则 |
| :--- | :--- | :--- |
| 每次完成一个明确任务 | `.memory/logs/YYYY-MM-DD.md` | 1-5 句，记录动作与结果 |
| 发现稳定可复用的提示策略 | `.memory/persona/prompt_strategy.md` | 只写可复用规则，不写项目私密 |
| 出现可复现失败并找到解法 | `.memory/persona/retry_patterns.md` | 记录“症状-原因-重试步骤” |
| 用户偏好发生变化 | `.memory/identity/owner_profile.md` | 仅维护偏好，不写隐私密钥 |

## 5. 防污染规则

- 禁止把用户长期知识写进 `.memory`。
- 禁止把助手运行日志写进 `~/Documents/memory/`。
- 禁止在 `.memory` 根目录散落临时碎片文件。
- 任何密钥一律只进 `~/Documents/memory/secrets/`。

## 6. 全舰队记忆访问规则（2026-03-05 新增）

| 记忆类型 | 路径 | 所有 Agent 可读 | 只有 CortexOS 写 |
| :--- | :--- | :--- | :--- |
| 王爷知识/复盘/素材 | `~/Documents/memory/` | ✅ | — |
| 小烛运行日志 | `.memory/logs/` | — | ✅ |
| 小烛舰队状态 | `.memory/fleet/` | — | ✅ |
| 小烛人格/策略 | `.memory/persona/` | — | ✅ |

**obsidian MCP 统一指向 `~/Documents/memory/`**：
- Gemini CLI: `~/.gemini/settings.json` obsidian → `~/Documents/memory/`
- Codex: `~/.codex/config.toml` obsidian → `~/Documents/memory/`
- Claude Code: `~/.claude/settings.json` obsidian → `~/Documents/memory/`
