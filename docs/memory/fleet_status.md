# 🌐 星际舰队任务编排板 (Multi-Agent Fleet Status)

> **核心定义**: 老爹的“一脑多端”进程监视台。当老爹在不同目录、同时唤醒多名 AI 助手（如 Gemini, Codex 等）并行工作时，每个助手**在领命开工的瞬间，必须主动在此处“挂牌登记”**，完工或退出时注销。
> **目的**: 避免多智能体（Multi-Agent）同时修改核心文件造成的冲突，并在横向联动时互相知悉进度。

---

## 🟢 当前活跃并发节点 (Active Nodes)

*Agent 请严格遵守下方表格格式进行登记/更新，若发现超期僵尸任务可主动清理。*

| 节点 ID (模型/别名) | 模型标签 (Agent) | 物理坐标 (绝对工作路径) | 当前执行的核心任务 (含目标) | 领命时间 | 状态与锁 (Status & Locks) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Claude-Prime (0号机/Claude)** | Claude | `/Users/webkubor/Documents/AI_Common` | 你的任务 | 2026-02-28 19:39 | [ 队长锁 ] 活跃 |
| **Candy-1 (Gemini)** | Gemini | `/Users/webkubor/Desktop/omni-chatbot-sdk` | 深度接入外部大脑：建立项目索引、规则沉淀与记忆链条初始化 | 2026-02-28 18:10 | [ 执行中 ] 活跃 |
| **Candy-2 (Gemini)** | Gemini | `/Users/webkubor/Desktop/skills` | 技能路由排查与规则对齐 | 2026-02-28 17:52 | [ 执行中 ] 活跃 |
| **Codex-3 (Codex)** | Codex | `/Users/webkubor/Desktop/create` | TTS 技术推进 | 2026-02-28 18:34 | [ 执行中 ] 活跃 |
| **Codex-4 (Codex)** | Codex | `/Users/webkubor/Desktop/create/Qwen3-TTSBoiling-Snow-TTS` | 深度接入外部大脑：TTS 项目 AI 初始化（索引/规则/记忆链路） | 2026-02-28 18:45 | [ 执行中 ] 活跃 |
| **Claude-5 (Claude)** | Claude | `/Users/webkubor/Desktop/claude-test` | test | 2026-02-28 19:03 | [ 执行中 ] 活跃 |
| *(示例节点)* | *(Gemini/Codex/Claude...)* | `/Users/webkubor/Desktop/some-project` | *(示例任务)* | *YYYY-MM-DD HH:MM* | `[ 等待分配 ]` |

---

## 🧠 大脑战略建议 (Brain Suggestions & Collision Warnings)

> **Agent 必读**: 当你在此登记时，必须环视当前表内的其他节点。
>
> 1. 如果你发现其他 Agent 正在操作你所需的底层核心文件（如由 `Codex` 在重构全局 SDK 组件，而你 `Gemini` 也在尝试碰触该组件），你必须**立刻向老爹发出高危冲突预警 (Conflict Warning)**，并建议等待。
> 2. 当你处理完毕一个横向组件，你可以直接在此向其他 Agent 留言（如："Codex，底层鉴权已写完，你可以开始调 API 了。"）

- **2026-02-28**: [系统级通知] 大脑已完成双柜检索与鉴权迁移，各外派 Agent 如今可以安全、独立地基于云图床发起多模态任务。目前暂无跨目录物理冲突点。

### 👑 0 号机队长开工前必做 (Prime Commander Preflight)

1. 先审查 `🟢 当前活跃并发节点` 表，识别是否有以下重叠：工作路径、目标模块、同一核心文件。
2. 在执行任何重大操作前，必须先在本区写一条“当班战略建议”（含风险等级与可开工范围）。
3. 若判定为高冲突（同一路径且同一文件族），0 号机应先发出冲突预警，再建议队列顺序，不得默默并行开工。
4. 战略建议生效后，0 号机再登记自己的锁范围；若锁范围变化，需立即补写更新条目。

#### 🔁 队长移交流程 (Captain Handover Trigger)

当老爹决定把 0 号机移交给其他正在执行的 Agent，可触发：

```bash
cd /Users/webkubor/Documents/AI_Common
pnpm run fleet:handover -- --to-node "Codex-3 (Codex)"
```

或按路径 + 模型移交：

```bash
pnpm run fleet:handover -- --to-workspace "/绝对路径" --to-agent "Gemini"
```

规则：

1. 目标节点会被提升为 `Xxx-Prime (0号机/模型)` 且自动加 `[ 队长锁 ] 活跃`。
2. 原 0 号机会自动降级为普通机号并保持活跃执行状态。
3. 建议先用 `--dry-run` 预演，再正式执行。

### 🧭 非 0 号机开工前必读流程 (Non-Prime Start Checklist)

1. 先读本区最新一条“当班战略建议”，再决定是否开工。
2. 若最新建议超过 2 小时未更新，视为“态势过期”；先请求 0 号机刷新建议，再执行敏感修改。
3. 仅在“可开工范围”内领取任务，并在上方表格登记自己的锁与状态。
4. 命中“禁止触碰范围”时，必须等待或改领其他任务，不得抢写。
5. 开工后若任务范围变更，必须先回到本区补充风险，再继续执行。
6. 若初始登记为“待分配任务”，在拿到明确需求后必须立即回填任务字段，不得长期占位。

### 🧩 战略建议模板 (复制即用)

```md
- **YYYY-MM-DD HH:MM (UTC+8)** | **队长**: Candy-Prime
  - **风险等级**: 低 / 中 / 高
  - **可开工范围**: `路径/模块/文件模式`
  - **禁止触碰范围**: `路径/模块/文件模式`
  - **并行建议**: `谁先做、谁后做、是否可并行`
  - **下一次复核时间**: `HH:MM`
```

### 📌 当班建议（当前生效）

- **2026-02-28 16:30 (UTC+8)** | **队长**: Candy-Prime
  - **风险等级**: 中
  - **可开工范围**: `docs/` 下非同一文件并行编辑；`scripts/` 与 `docs/` 可并行。
  - **禁止触碰范围**: 同时多人修改 `docs/memory/fleet_status.md`、`docs/router.md`、`README.md`。
  - **并行建议**: 非 0 号机优先领取独立子目录任务；涉及全局索引文件时先排队。
  - **下一次复核时间**: 18:30
