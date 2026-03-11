# CHANGELOG

> 外部大脑 CortexOS 的版本演进记录。
> 格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

---

## [Unreleased] — 2026-03-11 「AI Team 运行态数据库化（计划归入 v5.7.1）」

### 🎯 迁移原因 (Why)

- **实时状态不应继续依赖 Markdown/JSON 链路**：原链路为 `fleet_status.md -> ai_team_status.json -> 前端轮询`，人工切换队长和节点上下线存在明显延迟。
- **AI Team 后续要承接对话、日志和审计**：这些状态需要稳定主库，不适合继续散落在 `md/json` 文件里。
- **多 Agent 协作需要更强的一致性**：队长、心跳、节点状态、操作记录需要统一存放，避免状态源分裂。

### 🔧 变更 (Changed)

- **AI Team 运行态主源切换到 SQLite**：当前主源改为 `.memory/sqlite/ai-team.db`，队长、节点、心跳、操作记录统一落库。
- **旧 fleet 文件退出运行链路**：`fleet_status.md / fleet_meta.json` 不再作为运行态主源；相关 claim/checkin/handover/status/cleanup/bridge 逻辑已切库。
- **MCP 摘要与任务认领检测切库**：`get_context_brief()` 与任务认领判断不再直接读取旧舰队文件，而是统一读取 `get_fleet_status()`。

### 📝 文档 (Docs)

- **迁移说明落地**：`docs/ops/fleet-dashboard.md` 现在明确记录“本次迁移计划归入 v5.7.1”及迁移原因。

---

## [v5.7.0] — 2026-03-10 「项目自动登记 · 文档版本对齐」

### 🚀 新增 (Added)

- **项目自动登记机制**：新增 `scripts/actions/project-registry.mjs`，AI Team 在执行 `fleet:claim` / `fleet:checkin` 时会自动检查项目是否已登记，未登记则补录并生成 command center。
- **项目注册数据源**：新增 `.memory/projects/registry.json`，作为项目索引的机器可维护源。
- **稳定命名指挥中心**：新增 `.memory/plans/projects/<project>-command-center.md` 体系，替代仅按日期命名的临时指挥中心。

### 🔧 变更 (Changed)

- **fleet 入口联动项目索引**：`scripts/actions/fleet-claim.mjs` 与 `scripts/actions/fleet-checkin.mjs` 已接入项目登记与刷新流程。
- **README 升级**：根 `README.md` 由宣传页升级为可操作说明文档，补齐架构、目录、接入方式、项目落地机制与当前版本信息。
- **版本线对齐**：README、CHANGELOG、Git tag 统一对齐至 `v5.7.0`，消除文档版本与仓库标签脱节问题。

---

## [v5.6.1] — 2026-03-05 「调度鲁棒性升级 · 根目录瘦身」

### 🚀 新增 (Added)

- **根目录遗留文档归档索引**：新增 `docs/archive/root-legacy/README.md`，记录根目录遗留文档迁移策略与回迁原则。

### 🔧 变更 (Changed)

- **任务调度识别增强**：`mcp_server/server.py` 统一任务文件识别规则，兼容 `task-*` 与 `TASK-*` 命名，修复新任务命名漏检。
- **任务反馈链路增强**：`task_handoff_check()` 增加高优任务统计与未认领预览中的优先级信息，提升任务分流可见性。
- **上下文摘要增强**：`get_context_brief()` 改为基于统一任务队列生成待办摘要，避免冷启动状态与任务池视图不一致。
- **根目录文档瘦身**：`CortexOS_Control_Center.md` 与 `temp_gemini_brain_v2.md` 迁移至 `docs/archive/root-legacy/`，降低入口噪音。

---

## [v5.6.0] — 2026-03-05 「舰队协同成熟 · 记忆统一 · 生态扩张」

### 🚀 新增 (Added)

- **栖月档案上线**：`docs/agents/qiyue/` 目录（README.md + mcp.md），栖月正式进入大脑文档体系，身份、职责、协作协议完整记录。
- **舰队能力速查表**：`docs/agents/index.md` 全面升级，新增每个 Agent 的独家能力、花费标注与派单规则。
- **nanobanana-plus 发布**：Fork nanobanana，新增 per-call 模型切换 + 宽高比控制 + OAuth fallback + setup.sh 一键配置。GitHub: https://github.com/webkubor/nanobanana-plus
- **Task Handoff 机制**：Codex 新增 Tool 14 `task_handoff_check()`，任务完工自动标记与未认领扫描。

### 🔧 变更 (Changed)

- **记忆统一**：确立两层分离原则，`~/Documents/memory/` 为王爷知识资产（所有 Agent 可读），`CortexOS/.memory/` 为小烛私有。统一修正各 Agent obsidian MCP 指向 `~/Documents/memory/`。
- **`router.md` §3**：新增记忆分层原则表，明确各层归属与访问权限。
- **`memory_formula.md` §6**：新增全舰队记忆访问规则，固化为大脑宪法。
- **`docs/agents/index.md`**：从"配置在哪里"升级为"舰队能力速查表"。

---

## [v5.5.0] — 2026-03-05 「指挥官升级 · Token 效率治理 · 语义引擎激活」

### 🚀 新增 (Added)

- **栖月-Prime 接管指挥权**：Claude Sonnet 4.6 (via OpenClaw) 成为新任 0 号机队长，确立「栖月=战略层 / Codex+Gemini=执行层」双层协作架构。
- **Agent 能力分工矩阵**：写入 `fleet_status.md`，明确每个 Agent 的能力边界与独家武器（Gemini=图像生成，Codex=全自动工程执行），派单不再靠经验。
- **任务书系统上线**：建立 `.memory/tasks/` 目录，栖月以结构化任务书（含问题/修法/验收标准）向 Codex/Gemini 派单，取代口头指令。
- **`get_context_brief()` MCP Tool（Task#003）**：新增轻量状态快照工具，冷启动 token 消耗从 ~800 降至 ~100，节约 85%。

### 🔧 变更 (Changed)

- **`search_knowledge()` 升级为真语义搜索（Task#002）**：接入 ChromaDB + nomic-embed-text，从字符串匹配升级为向量相似度召回，全文检索保留作兜底。
- **`error-retro.mjs` 误报修复（Task#001）**：ERROR_REGEX 加负向前瞻 `(?!.*✅)`，消除每5分钟3条假报警的噪音风暴，大脑自我诊断恢复可信。
- **`fastmcp` 升级至 3.1.0**：修复上游 bug，消除启动警告。
- **密钥库权限统一收紧**：`~/Documents/memory/secrets/` 和 `docs/secrets/` 下所有文件统一 `chmod 600`，消除旁路读取风险。
- **`router.md` Token 节约约束**：新增 §2.5 强制约束，禁止冷启动全量读 rules/，强制 `load_rule()` 懒加载。
- **冷启动协议升级**：`CLAUDE.md` / `GEMINI.md` Step 1 改为先调 `get_context_brief()`，只在必要时才 `read_router()`。

### 🐛 修复 (Fixed)

- 清空 `.memory/retros/2026-03-error-retro.md` 历史噪音条目（全部为假阳性）。
- 清理 fleet_status.md 中的僵尸节点（Candy-2 / Candy-Prime 旧任务）。

---

## [v5.0.0] — 2026-03-02 「MCP 接口层 · 大脑联网上线」

### 🚀 新增 (Added)

- **MCP Server 主体** (`mcp_server/server.py`)：基于 FastMCP，将大脑核心操作封装为 12 个原子级 Tool：
  - `read_router()` — 读取大脑宪法
  - `get_fleet_status()` — 获取舰队 JSON 状态
  - `fleet_claim()` — Agent 打卡挂牌
  - `fleet_handover()` — 队长移交
  - `load_rule()` / `list_rules()` — 按需懒加载规则（防上下文污染）
  - `log_task()` — 写入今日操作日志
  - `fleet_sync()` — 触发看板数据同步
  - `list_secrets()` / `read_secret()` — 外置密钥库访问（含路径穿越防护）
  - `send_lark_notification()` — 飞书 Webhook 通知
  - `search_knowledge()` — 知识库全文检索（递归扫描子目录）
- **Codex MCP 接入**：`~/.codex/config.toml` 新增 `[mcp_servers.cortexos-brain-brain]` 条目，Codex 现可原生调用外脑。
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
