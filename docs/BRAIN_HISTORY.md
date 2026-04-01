# 演化史

> 记录 CortexOS 从"笔记仓库"演进为"影子系统"的完整决策轨迹。
> 保留问题、思考、修复方式——过程比结果更重要。

---

## v7.0.0 — 影子系统（2026-04-01 · 当前）

### 问题

v6.0.0 确立了中央大脑身份，但随着 Harness Engineering 范式在 2026 年 Q1 成为行业共识，我重新审视了 CortexOS 的本地架构，发现三类结构性负担：

1. **前端过度工程化**：`docs/.vitepress/theme/components/` 下 4400+ 行 Vue 组件（FleetDashboard、AgentNode、MissionCard 等）构建了一个复杂的本地 AI Team 控制台，依赖 18790 端口的 Bridge 服务和 SSE 实时同步。这套系统在 Harness Engineering 视角下属于"用户可见的复杂度"——Manus 重建 4 次的教训证明，这类表面功能会拖累核心基础设施的演进。

2. **双系统架构的维护成本**：本地 SQLite + 云端 Firestore 的双轨制让状态同步成为负担。SQLite 主库需要本地进程维护、Bridge 服务需要端口监听、Vue 组件需要状态桥接——这些链路在模型能力持续进化的背景下，成为了" harness 瓶颈"。

3. **概念复杂度失控**：AetherFleet、AI Team、舰队、Bridge、SQLite 主库... 新用户需要理解太多概念才能使用 CortexOS。这与 Harness Engineering 的"简化 harness，专注模型能力"原则相悖。

### 思考

> "每次发现 Agent 犯了一个错误，你就花时间设计一个方案，让 Agent 再也不会犯同样的错误。" —— Mitchell Hashimoto

Harness Engineering 的核心不是增加功能，而是**构建让模型可靠运行的环境**。我之前在本地构建的复杂控制台，本质上是**模型之上的 UI**，而非**模型周围的系统**。

Vercel 的实验表明：将 Agent 工具从 15 个减少到 2 个，准确率从 80% 提升到 100%，token 消耗下降 37%，速度提升 3.5 倍。

这让我意识到：4400 行 Vue 代码不是资产，是负债。

### 修复方式

- **前端大瘦身**：彻底删除 `docs/.vitepress/theme/components/*.vue`（4400+ 行），文档站回归纯文档本位。复杂的状态看板让位于 Cloud Brain 的 REST API 和极简 CLI 输出。

- **本地状态层退役**：`.memory/sqlite/` 目录从架构中移除，本地仅保留轻量级缓存（`.memory/cache/`）。项目索引、任务状态、通知收件箱统一收口到 Cloud Brain（Firestore），本地 CLI 仅作离线降级。

- **18790 Bridge 服务废弃**：SSE 实时同步、本地 Bridge 端口、PM2 进程托管全部退役。Agent 与 CortexOS 的交互从"本地桥接"模式切换为"API 优先"模式。

- **概念简化**：从"AI Team / AetherFleet / 舰队 / 中央大脑"简化为"主人 + 影子"。没有团队，没有舰队，只有主人（webkubor）和影子（CortexOS）。

- **Harness Engineering 对齐**：
  - 遵循 "Fewer, general-purpose tools" 原则：CLI 工具精简为核心原子操作
  - 遵循 "Filesystem-as-memory" 原则：`.memory/` 只保留纯文本策略文件，结构化数据上云
  - 遵循 "Context discipline" 原则：文档站不再承载动态状态，只保留静态规则与协议

### 解决了什么

- **维护负担**：从 ~4500 行前端代码 + 本地数据库 + Bridge 服务，压缩为纯 CLI + Cloud API 的极简架构。
- **认知噪音**：新用户不再需要理解 AetherFleet、Bridge、SQLite 主库等历史概念，CortexOS = CLI + Cloud Brain + 规则文档。
- **可靠性**：去除本地进程依赖后，CortexOS 的核心功能（记忆、任务、通知）不再受本地服务状态影响。
- **Harness 纯度**：与 OpenAI、Anthropic、Manus 等行业最佳实践对齐，专注"模型周围的系统"而非"模型之上的 UI"。

### 思考沉淀

这次割舍让我认识到：**当模型能力持续进化时，" harness 复杂度"才是瓶颈。**

4400 行 Vue 代码的删除，不是功能倒退，而是承认一个事实——我提前两年就在构建 Harness，但被"用户可见的功能"分散了注意力。现在回归纯粹：影子只负责记忆主人的偏好，通过最简单的接口被召唤。

---

## v6.0.0 — 中央大脑（2026-03-26）

### 问题

v5.8.0 完成了规则系统收口和 MCP 热路径的 Python 化，但 CortexOS 的系统身份仍然存在三类根问题：

1. **角色叙事混杂**：仓库里长期混着 `AI Team`、`AetherFleet`、执行编排、主脑前台等多种叙事。系统既像主脑、又像调度台、又像团队看板，导致用户自己都很难用一句话定义 CortexOS 到底是什么。

2. **入口很多但中心不稳**：CLI、MCP、HTTP API、Cloud Brain、主脑页面都已经有雏形，但这些入口还没有统一收束到"中央大脑"的单一定位，外部 subagent 和内部能力协议的边界也不够清楚。

3. **变更复杂度开始超出聊天驱动**：Cloud Brain、subagent、skills 母库、前台页面、后台轮询器都已经成型，单靠聊天推进重要改动，容易让协议、SSOT 边界和长期文档脱节。

### 思考

我意识到 CortexOS 需要一个**单一、清晰、可描述**的身份。它不能同时是团队、看板、主脑——它必须是一个东西。

"中央大脑"这个定位让我明确：
- CortexOS 不执行，它决定谁执行
- CortexOS 不展示，它记住该记住的
- CortexOS 是协议层，不是应用层

### 修复方式

- **身份重新定型**：正式将 CortexOS 定义为 `webkubor` 的 **AI Agent 中央大脑**，对内以 `MCP` 组织能力，对外通过 `CLI + HTTP API` 接收信息、分发任务，并与各类 subagent 持续互动。

- **外部系统退位**：把 `AetherFleet`、`AI Team` 等执行编排/看板系统明确降级为外部或后台系统，不再写进 CortexOS 主叙事、主架构和主入口说明。

- **Cloud Brain 成型**：`services/brain-api` 作为云端主脑扩展上线，形成 `notifications / tasks / memories / triage` 四层接口，Cloud Run + Firestore 成为低成本、可持续的云端大脑底座。

- **本地主脑收件箱落地**：建立 `brain-inbox` 轮询与本地收件箱文件，主脑开始具备"接收通知 -> 自动分诊 -> 落为 memory/task/archive"的完整处理链。

- **OpenSpec 接入**：在仓库根目录引入 `openspec/`，将重大变更纳入 proposal / design / specs / tasks 的正式流程，让 CortexOS 进入"规范先行、实现后置"的产品化阶段。

### 解决了什么

- **身份统一**：CortexOS 不再是"看板、舰队、团队、主脑"的混合体，而是一个边界明确的中央大脑。
- **协议统一**：内部能力访问、外部入口和 subagent 上报开始围绕同一套模型工作：`MCP` 负责内部能力总线，`CLI/API` 负责外部接入。
- **主脑闭环形成**：通知进入收件箱，经过分诊后沉淀成记忆或任务，Cloud Brain 与本地主脑开始形成清晰的信息回流路径。

### 思考沉淀

v6.0.0 是一次**产品身份重构**。我学会了：当系统复杂度增长时，不要继续平铺叠加，而要找到那个"单核定义"，让所有增长围绕它展开。

---

## v5.8.0 — 规则系统收口（2026-03-12）

### 问题

v5.7.2 解决了 AI Team 本地控制台的可用性，但大脑本体还存在四类结构性问题：

1. **规则边界重复且难以注入**：`docs/rules/` 下长期混杂编码规范、Review 规范、隐私协议、人格合同、专题说明与模板文件。文件很多，但边界不清，Agent 冷启动后不知道该优先读哪份，用户也难以从主入口看清开发规则。

2. **文档与历史残留仍在制造第二真相**：`mcp-console.md`、`tooling_inventory.md`、旧 onboarding、历史审查报告、零散迁移说明与人格/声音绑定素材仍散落仓库，系统已经切换到新结构，但旧文件还在暗中提供过期认知。

3. **MCP 热路径过度依赖 Node CLI**：`get_fleet_status()`、`fleet_claim()`、`fleet_handover()` 等核心 MCP Tool 仍通过 `pnpm run ...` 触发 Node 脚本再落到 SQLite。链路长、跨 runtime、多一层 shell/文本输出解析，导致 `better-sqlite3` ABI 漂移时直接表现为 `Transport closed`，排障成本过高。

4. **试错经验没有升级协议**：开发中虽然已经有日志、`retry_patterns`、`retros`、`memory/knowledge` 四层存储，但没有一份清晰规则告诉 Agent "什么只记日志，什么要升格成可复用经验"，导致 AI 容易要么过度保守，要么每次都从零再试。

### 思考

规则系统的混乱反映了一个深层问题：**我不知道如何让经验积累**。每次试错都是一次性的，没有升级路径。

我需要：
- 规则少而精，入口清晰
- 热路径短而稳，减少跨 runtime
- 试错有明确的"升级漏斗"

### 修复方式

- **规则系统收口**：将 `docs/rules/` 收敛为四个稳定主规则文件：`engineering_baseline.md`、`agent_governance.md`、`security_boundary.md`、`skill_governance.md`。

- **文档与记忆边界清理**：删除历史控制台、旧工具清单、旧 onboarding、历史审查报告和不再承担系统职责的文档。

- **MCP 热路径 Python 化**：`get_fleet_status()` 改为 Python 直接读取 `.memory/sqlite/ai-team.db`；`fleet_claim()` 与 `fleet_handover()` 改为 Python 直写。

- **试错与复盘升级协议**：在 `engineering_baseline.md`、`.memory/memory_formula.md` 中写入统一分流规则，明确"日志 / retry / retros / knowledge"四层升级与回注机制。

### 解决了什么

- **规则可读性**：大脑从"规则很多但难定位"变成"规则少而稳定，入口清楚，按场景注入"。
- **运行时稳态**：MCP 的核心状态读取、挂牌与队长移交不再依赖 Node CLI 文本输出。
- **经验资产化**：AI 不需要因为怕错而保守，试错现在有了明确升级路径。

### 思考沉淀

这次升级让我理解了**系统化的试错**：不是不犯错，而是让错误有价值，能积累。

---

## v5.7.1 — 状态主库收口（2026-03-11）

### 问题

v5.7.0 完成了项目自动登记，但 AI Team 的运行态仍有三类根问题：

1. **状态链路过长**：`fleet_status.md -> ai_team_status.json -> 前端轮询` 仍是主路径，队长切换和节点上下线存在延迟，页面看到的是投影，不是真实状态。

2. **运行态与产品边界冲突**：AI Team 本质上是本地中枢服务，却还把状态投影进 `docs/public/`，等于把本地运行态和线上静态文档混在一起。

3. **队长与人格识别不稳定**：队长切换时 `member_id` 会变化，cleanup 还会按最新心跳把人工移交抢回；同模型不同人格在同一路径下也可能被错误合并。

### 思考

文件投影太慢，我需要数据库。但 SQLite 本地数据库意味着新的维护负担——这是一个权衡。

### 修复方式

- **状态主库收口**：将 AI Team 的运行态统一收口到 `.memory/sqlite/ai-team.db`。
- **稳定身份键**：为 `agents` 增加 `identity_key`，身份由 `agentName + alias + workspace` 构成。
- **本地服务边界强化**：`FleetDashboard.vue` 改为只读本地 bridge。

### 解决了什么

- **实时性**：AI Team 页面主链路从"文件投影"改为"SQLite -> bridge -> 本地页面"。
- **一致性**：队长、节点、心跳、操作记录统一落库。

---

## v5.6.0 — 记忆统一（2026-03-05）

### 问题

v5.5.0 解决了内部效率，但舰队仍有三个短板：

1. **记忆割裂**：各 Agent 的 obsidian MCP 指向混乱（Gemini 指向 CortexOS 而非栖洲知识库），Agent 之间无法共享同一份记忆源。

2. **栖月没有存在感**：作为新任指挥官，栖月在大脑的文档体系里完全没有记录。

3. **生图能力被锁死**：Gemini CLI 的 nanobanana 扩展无法在运行时切换模型。

### 修复方式

- **记忆统一**：确立两层分离原则——`~/Documents/memory/` 为栖洲知识资产（所有 Agent 可读），`CortexOS/.memory/` 为小烛私有运行记忆（隔离）。

- **栖月入档**：新建 `docs/agents/qiyue/`，栖月正式成为文档体系的一部分。

- **nanobanana-plus**：Fork nanobanana，新增 per-call 模型切换。

### 思考沉淀

记忆分层是关键架构决策：主人的记忆和影子的记忆必须分开。

---

## v5.5.0 — Token 效率治理（2026-03-05）

### 问题

大脑运行了几周后暴露出三个系统性问题：

1. **自我诊断失效**：`error-retro.mjs` 正则太宽，把"✅ 无新增错误事件"里的"error"当错误捕获，每5分钟产生3条假报警。

2. **语义搜索挂空档**：ChromaDB + nomic-embed-text 早已装好，255条向量也在，但 `search_knowledge()` 还在用字符串 `in` 匹配。

3. **Token 持续浪费**：Agent 冷启动每次全量读 router.md（~800 token），实际需要的信息不超过 100 字。

### 修复方式

- **error-retro**：正则加负向前瞻 `(?!.*✅)`，清空历史噪音。
- **语义搜索**：`search_knowledge()` 接入 ChromaDB 向量查询。
- **Token 治理**：新增 `get_context_brief()` MCP 工具（~100 token）。

### 解决了什么

- 每次 Agent 冷启动节约 **~700 token（85%）**。

---

## v5.0.0 — MCP 化（2026-03-02）

### 问题

CortexOS 之前是"文档系统"，Agent 需要手动阅读和理解。没有标准化接口，不同 Agent 接入方式各异。

### 修复方式

- **MCP Server 上线**：以 FastMCP 暴露核心工具。
- **工具合约化**：通过结构化 Tool 输入输出降低幻觉调用。

### 思考沉淀

MCP 是标准化接入的关键。从"读文档"到"调工具"是一次质变。

---

## v4.7.0 — 多 Agent 编排协议（2026-03-02）

### 问题

多 Agent 并行时，节点之间无法识别彼此，容易产生冲突和重复劳动。

### 修复方式

- **入队握手前缀**：统一 `[AI-TEAM][nodeId][#No]`，实现机位可识别。
- **口令移交**：支持自然语言触发队长切换与任务移交。

---

## v4.0.0 — 防撞车与凭证隔离（2026-02-28）

### 问题

1. **并行冲突**：多 Agent 同时处理同一任务时容易撞车。
2. **凭证安全**：API Key 等敏感信息散落在各处。

### 修复方式

- **Fleet Guard**：引入 `fleet:claim` 作为并行任务打卡闸门。
- **凭证隔离**：建立高敏资产外置原则，`~/Documents/memory/secrets/`。

---

## v3.8.0 — 技能云端化（2026-02-28）

### 问题

主仓越来越臃肿，SCM、XHS 等技能与核心代码耦合。

### 修复方式

- **技能解耦**：拆分为独立仓库。
- **本地 RAG**：从远程 Milvus 迁移到 ChromaDB + Ollama。

---

## v3.0.0 — 协议成形（2026-02-20）

### 问题

Agent 冷启动时没有统一入口，不知道先读什么。

### 修复方式

- **SSOT 确立**：`router.md` 成为唯一入口。
- **部门化协作**：Core、Writers、Ops 等职责首次明确。

---

## v2.0.0 — 基础设施期（2026-02-02）

### 核心变化

- **哨兵机制**：建立任务日志与定时同步雏形。
- **VitePress 成型**：知识可视化标准建立。

---

## v1.0.0 — 仓库锚定（2025-12）

### 核心变化

- **仓库建立**：CortexOS（原 AI_Common）完成物理落盘。
- **目录骨架**：`docs/` 结构确立，摆脱零散笔记模式。

---

## v0.5.0 — 外部大脑雏形（2025-11）

### 核心变化

- **长期记忆意识**：开始把"经验"当作可复用资产管理。
- **早期规则集**：最初的编码与协作规范写入文档。

---

## v0.1.0 — 原生笔记期（2025-10）

### 起点

- **单机记录**：以 Markdown 记事为主，尚无多 Agent 协作。
- **问题意识**：开始思考"如何让 AI 记住我教它的东西"。

---

*最新：v7.0.0 影子系统 —— 从 4400 行代码到 0 行，从复杂到纯粹。*
