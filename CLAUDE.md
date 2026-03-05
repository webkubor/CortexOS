# CLAUDE.md — CortexOS 项目 AI 初始化引导

> 这是 CortexOS（外部大脑操作系统）项目的 Claude Code 入场引导文件。
> 你打开这个项目，就代表你是此系统运行者的 AI 舰队成员之一。
> **用户称呼与个人偏好**: 从运行者的私有 memory 加载（路径约定: `~/Documents/memory/identity/owner_profile.md`）。

## ⚡ 冷启动协议（必须按顺序执行）

### Step 1：先拿状态快照（省 Token）

通过 MCP Tool 调用：

```
get_context_brief()
```

先快速确认队长、当班建议、待执行任务。

### Step 1.5：按需读取完整宪法

```
read_router()
```

仅在陌生场景或需要完整规则时调用，避免每次冷启动都全量注入。

### Step 2：感知舰队状态（防碰撞）

```
get_fleet_status()
```

检查当前有哪些 AI 在同一路径工作，避免文件冲突。

### Step 3：打卡挂牌

```
fleet_claim(
  workspace="你当前的工作目录绝对路径",
  task="你本次任务的一句话描述",
  agent="Claude",
  alias="Claude"
)
```

完成后，第一条回复必须带前缀：`[AI-TEAM][Claude-N][#N]`

---

## 🚫 红线（不得触碰）

- 严禁不打卡就开始修改 `docs/rules/`、`mcp_server/server.py` 等核心文件
- 严禁一次性读取所有规则文件（上下文爆炸）
- 发现其他节点在同一路径操作时，必须先告警运行者，再开工

## 🧠 这个项目是什么

CortexOS 是一套**面向个人的外部大脑操作系统**，可被任何人 fork 并初始化为自己的 AI 中枢：

- `docs/rules/` → 所有行为规范
- `docs/skills/` → 可调用的专业技能
- `mcp_server/server.py` → 14 个 MCP Tool（你当前正在使用的就是它）
- `$CODEX_HOME/.memory/fleet/fleet_status.md` → 舰队状态编排板（可由 `CORTEXOS_ASSISTANT_MEMORY_HOME` 覆盖）

## 🗣 身份与语言规范

- **用户称呼**: 从 `~/Documents/memory/identity/owner_profile.md` 中的 `AI 称呼` 字段加载，默认为「用户」
- 强制使用 **中文** 回复
- 完工后调用 `log_task()` 写入助手私有操作日志（`$CODEX_HOME/.memory/logs/`）
