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

## 3. 动态路由（按需读，不全量读）

### 核心路由

| 场景 | 路径 | 用途 |
| :--- | :--- | :--- |
| 助手运行日志 | `.memory/logs/` | 仅助手轨迹，不进用户记忆 |
| 助手私有记忆 | `.memory/` | 调教、偏好、重试模式 |
| 记忆法则 | `.memory/memory_formula.md` | 规定“何时读写” |
| 用户知识库 | `~/Documents/memory/knowledge/` | 复盘、经验、方案 |
| 用户项目索引 | `~/Documents/memory/projects/index.md` | 项目档案入口 |
| 用户技能索引 | `~/Documents/memory/skills/index.md` | 本地 skills 目录资产 |
| 协作指挥中心 | `~/Documents/memory/plans/projects/*-command-center.md` | 多 Agent 项目沟通中枢 |
| 高敏凭证 | `~/Documents/memory/secrets/` | 私钥/Token（不进 Git） |

### 项目文档路由

| 类型 | 路径 |
| :--- | :--- |
| 规则（约束） | `docs/rules/` |
| SOP（操作步骤） | `docs/sops/` |
| 运维手册 | `docs/ops/` |
| 技能文档 | `docs/skills/` |
| 技术协议 | `docs/tech/` |

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

- 每次任务完成后写留痕（`log_task`）
- 拿到明确任务后，不允许长期保留“待分配任务/未分配角色”
- 同路径并行目前是“告警不拦截”，执行前先看 `fleet:status`

---
*Last Updated: 2026-03-04*

- 版本：v5.4.1（Router Density Refactor）
