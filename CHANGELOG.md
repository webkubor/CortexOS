# CHANGELOG

> 外部大脑 AI_Common 的版本演进记录。
> 格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

---

## [v5.0.0] — 2026-03-02 「MCP 接口层 · 大脑联网上线」

### 🚀 新增 (Added)

- **MCP Server 主体** (`mcp_server/server.py`)：基于 FastMCP，将大脑核心操作封装为 8 个原子级 Tool：
  - `read_router()` — 读取大脑宪法
  - `get_fleet_status()` — 获取舰队 JSON 状态
  - `fleet_claim()` — Agent 打卡挂牌
  - `fleet_handover()` — 队长移交
  - `load_rule()` / `list_rules()` — 按需懒加载规则（防上下文污染）
  - `log_task()` — 写入今日操作日志
  - `fleet_sync()` — 触发看板数据同步
- **Codex MCP 接入**：`~/.codex/config.toml` 新增 `[mcp_servers.ai-common-brain]` 条目，Codex 现可原生调用外脑。
- **FleetDashboard UI 重设计**：彻底重构 VitePress 看板组件，全面接入 VitePress CSS 变量，支持暗色模式，新增活跃节点呼吸灯、任务摘要、路径代码块等高级视觉元素。

### 🔧 变更 (Changed)

- `server.py` 移除 FastMCP 不兼容的 `description` 初始化参数，适配新版 API。

---

## [v4.7.0] — 2026-03-02 「多 Agent 编排 · 入队握手协议」

### 🚀 新增 (Added)

- `router.md` 新增「入队回执前缀强制协议」：Agent 完成 `fleet:claim` 后，第一条回复必须携带 `[AI-TEAM][nodeId][#machineNumber]` 格式前缀，用户无需追问机号与身份。
- 新增「AI 口令触发」机制：用户在对话中说「移交队长给 X」即自动触发 `fleet:handover`，无需手打命令。
- `fleet:handover` 新增 `--to-workspace` + `--to-agent` 参数，支持按路径移交。

### 🔧 变更 (Changed)

- 同路径并行检测从"拦截"改为"告警不拦截"，提升实际协作灵活性。

---

## [v4.0.0] — 2026-02-28 「全局技能系统 · 舰队防撞车」

### 🚀 新增 (Added)

- `fleet:claim` 脚本：Agent 开工前强制打卡挂牌，写入 `fleet_status.md`，并生成 `ai_team_status.json`。
- `fleet:sync` / `fleet:status` 快捷命令，支持终端一键查看全体 Agent 状态、模型分布、队长位置。
- `fleet:claim` 新增 `--force-switch` 参数，支持强制抢占队长位。
- `scripts/` 目录技能脚本体系化，支持 Gemini CLI 技能安装验证与健检。
- 新增 `multi-agent unique ID node badge` 逻辑（`feat(persona): add multi-agent unique ID node badge logic`）。
- 新增 Lark 推送通知（飞书战报日推）与 macOS 系统通知双通道。

### 🔧 变更 (Changed)

- Secrets 目录从项目根迁移至 `brain/secrets/`，统一隐私边界。
- 技能文档死链清理，移除废弃 `snippet_master` 和旧版 `playwright-mcp` 无用图片。

---

## [v3.9.0] — 2026-02-28 「自动驾驶协议升级」

### 🔧 变更 (Changed)

- 冷启动协议升级至 V3.9：`确认身份 → 继承部门规范 → 编排板挂牌并环视 → 启动执行` 四步标准化。
- 引导文档（router.md）重构，职能部门协议文档结构化分组。

---

## [v3.8.0] — 2026-02 「本地 RAG + 硬核通知引擎」

### 🚀 新增 (Added)

- **本地 RAG 检索**：ChromaDB（本地持久化）+ Ollama `nomic-embed-text`，支持 `query_brain.py "查询"` 语义检索大脑内容。
- **硬核通知引擎**：双通道（Lark 推送 + macOS native），Agent 关键操作实时通知老爹。
- `brain/secrets/lark.env` 统一管理飞书通讯配置。

### 🔧 变更 (Changed)

- 向量数据库从 Milvus 迁移至 ChromaDB，彻底铲除 Milvus 死链与相关架构说明。
- Python 脚本强制 `pathlib`，包管理强制 `uv`。

---

## 版本规划

| 版本 | 代号 | 目标 |
|------|------|------|
| v5.1.0 | 「看板写入」 | VitePress Dashboard 具备任务派发写入能力（本地 Express/Hono 小接口） |
| v5.2.0 | 「Gemini 接入」 | Gemini CLI MCP 配置落地，与 Codex 共享同一外脑 |
| v6.0.0 | 「全自动调度」 | 多 Agent 完全无需人工干预，自主协调、分工、汇报 |
