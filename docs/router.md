---
description: 大脑最高入口与动态路由。先看这里，再做任何任务。
---
# AI Context Index & Router (Universal Protocol)

> ⚠️ 本文件是 CortexOS 的总入口。任何 Agent 开工前先读此页。

## 0. 30 秒上手

1. 读取路由：`read_router()`
2. 查看队列：`get_fleet_status()`
3. 挂牌开工：`fleet_claim(workspace="$PWD", task="你的任务", agent="Codex", alias="Codex", role="后端")`

首次回复必须带前缀：`[AI-TEAM][<nodeId>][#<machineNumber>]`

> 🏴 **当前指挥官**: 栖月-Prime（Claude Sonnet 4.6）| 接管时间: 2026-03-05
> **架构说明**: 栖月（OpenClaw/Claude）= 战略层，负责任务拆解与质量把关；Codex / Gemini = 执行层，接收栖月指令干活。
> **非 0 号机注意**: 若栖月在线（可通过飞书/OpenClaw 对话确认），重大决策须等栖月批准后再执行。
> **别名提醒**: 用户若提到 `小龙虾`，默认指向 OpenClaw 队长环境；路径、重启、排障入口见 [小龙虾作战手册](./agents/qiyue/openclaw.md)。

## 1. 冷启动协议（必做）

- **核心身份**: 小烛 (Candy) 人格档案为大脑自带资产，路径：`.memory/persona/candy_manifest.md`（所有 Agent 默认继承此身份）
- 私有记忆法则：`.memory/memory_formula.md`
- 组织规则：[org_protocol](./rules/org_protocol)

### 入队命令（示例）

```bash
cd ~/Documents/CortexOS
pnpm run fleet:claim -- --workspace "$PWD" --task "你的当前任务" --agent "Codex" --alias "Codex" --role "后端"
```

### 常用协作命令

```bash
pnpm run fleet:status
pnpm run fleet:handover -- --to-node "Codex-3 (Codex)"
pnpm run fleet:handover -- --to-workspace "<路径>" --to-agent "Claude"
```

## 2. 口令触发（免手打）

以下口令可直接触发队长移交：

- `移交队长给 <节点>`
- `把 0 号机交给 <节点>`
- `队长切到 <节点>`

执行规则：

1. 优先 `--to-node`
2. 不唯一时，先让用户补充目标
3. 完成后回报 `from -> to`、路径、时间

## 2.5 Token 节约强制约束 ⚠️

> **所有 Agent 必须遵守，违反视为严重失误**

- ❌ **严禁冷启动时全量读取 `docs/rules/`**，必须用 `load_rule("<name>")` 按需加载
- ❌ **严禁一次性 `cat` 多个规则/文档文件**，每次最多读 1 个
- ✅ **冷启动优先调 `get_context_brief()`**，只在真正需要全貌时才调 `read_router()`
- ✅ **`get_fleet_status()` 替代读 fleet_status.md**，不要直接 cat 文件

> 💡 Token 分级原则：`get_context_brief()` (~100 token) → `read_router()` (~800 token) → 按需 `load_rule()` (~200 token/条)

## 3. 动态路由（按需读，不全量读）

### ⚡ 记忆分层原则（所有 Agent 必须遵守）

| 层级 | 路径 | 归属 | 谁可以读写 |
| :--- | :--- | :--- | :--- |
| **王爷知识资产** | `~/Documents/memory/` | 王爷所有 | ✅ 所有 Agent 均可读取 |
| **小烛私有记忆** | `CortexOS/.memory/` | CortexOS 专属 | ⚠️ 仅 CortexOS Agent 写入 |
| **高敏凭证** | `~/Documents/memory/secrets/` | 王爷所有 | 🔒 仅通过 `read_secret()` 访问 |

**通过 obsidian MCP 读取王爷知识库：**
所有 Agent 的 obsidian MCP 均已指向 `~/Documents/memory/`，可直接语义搜索王爷的知识、项目、复盘内容。

### 核心路由

| 场景 | 路径 | 用途 |
| :--- | :--- | :--- |
| 助手运行日志 | `.memory/logs/` | 仅助手轨迹，不进用户记忆 |
| 助手私有记忆 | `.memory/` | 调教、偏好、重试模式 |
| 记忆法则 | `.memory/memory_formula.md` | 规定“何时读写” |
| 用户知识库 | `~/Documents/memory/knowledge/` | 复盘、经验、方案 |
| 助手项目索引 | `$CODEX_HOME/.memory/projects/index.md` | 小烛维护的项目索引（不写入用户 memory） |
| 助手技能索引 | `$CODEX_HOME/.memory/skills/index.md` | 小烛维护的 skills 索引 |
| 协作指挥中心 | `$CODEX_HOME/.memory/plans/projects/*-command-center.md` | 多 Agent 项目沟通中枢 |
| 高敏凭证 | `~/Documents/memory/secrets/` | 私钥/Token（不进 Git） |

### 项目文档路由

| 类型 | 路径 |
| :--- | :--- |
| 规则（约束） | `docs/rules/` |
| SOP（操作步骤） | `docs/sops/` |
| 运维手册 | `docs/ops/` |
| 技能文档 | `docs/skills/` |
| 全量工具清单 | `docs/intel/tooling_inventory.md` |
| 技术协议 | `docs/tech/` |
| 资产托管 SOP | `docs/sops/asset_hosting_sop.md` |
| 工具发现 SOP | `docs/sops/tool_discovery_sop.md` |

## 4. 工具协议

- 物理读取：`cat / ls / rg`
- 越界读取：优先 MCP（`read_router` / `get_fleet_status`）
- 语义检索：

```bash
python3 scripts/ingest/query_brain.py "查询" --mode lite
python3 scripts/ingest/query_brain.py "查询" --mode balanced
python3 scripts/ingest/query_brain.py "查询" --mode deep --budget 3200
```

- 检索范围配置：`scripts/ingest/retrieval_scope.json`
- 分级注入配置：`scripts/ingest/injection_policy.json`

## 5. 安全与边界

- 凭证协议：[privacy_secret_protection_protocol](./rules/privacy_secret_protection_protocol)
- SOUL 合同：[soul_contract_standard](./rules/soul_contract_standard)
- Skill 门禁：[skill_vetting_gate](./rules/skill_vetting_gate)

## 6. 运行要求

- **私有 Skill 动态治理协议 (必做)**:
  - **实时身份审计**: 凡遇到插件 (path 含 `extensions` / `skills`) 报错或性能低下，Agent **必须** 先执行 `Active Audit`。审计准则：
    1. 检查 `package.json` 的 `author` 或 `repository` 是否包含 `webkubor`。
    2. 检查 `.git/config` 远程地址。
    3. 若审计通过（确认为自研），则进入 `[[task-YYYYMMDD-SKILL-NAME]]` 治理流。
  - **大上下文深度重构**: 利用大上下文与低成本 Token 优势，对 Skill 执行**全量代码审计**（而非局部 patch）。在 `.memory/tasks/` 下记录包含 Root Cause、Verified Command 以及符合未来标准的“全流程重构路径”。
  - **拒绝零碎修改**: 倡导优雅的、结构化的重构，不保留临时的、不优雅的 Hack 方案。
- 每次任务完成后写留痕（`log_task`）
- 每次任务完成后必须执行 `pnpm run fleet:post-task`，触发进化记忆收割与看板同步。
- 每次任务完成后必须执行 `task_handoff_check(task_id="<task-id>", agent="<Agent>", summary="<一句话结果>")`，同步完成状态并检查未认领任务
- 拿到明确任务后，不允许长期保留“待分配任务/未分配角色”
- 同路径并行目前是“告警不拦截”，执行前先看 `fleet:status`

### Metadata

*Last Updated: 2026-03-06*

- **版本**: v5.6.0（Intelligence Interface & Asset Hosting）
- **变更日志**: [查看进化史](./intel/evolution.md)
