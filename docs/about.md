# CortexOS

> 将规则、记忆、状态和协作协议落在本地的外部大脑系统。

**CortexOS** 是一套面向个人使用的本地外部大脑与多 Agent 协作中枢。
它的目标不是把更多资料堆进仓库，而是把真正影响长期协作的东西收敛成稳定系统：

- 规则放在仓库里，任何 Agent 可按协议读取。
- 用户长期知识放在 `~/Documents/memory/`，不和项目运行态混写。
- 运行状态放在本地主库里，由系统统一管理，不再依赖零散 Markdown 文件。
- 多 Agent 协作通过 MCP 与 Fleet 协议完成，不靠口头同步。

---

## 核心原则

### 1. 上下文主权
规则、知识、凭证、运行态分层存放，避免云端绑定和路径混乱。

### 2. 单一事实源
任务、舰队状态、项目索引必须有明确主源；展示层和历史记录不承担主状态职责。

### 3. 协议优先
Agent 启动、挂牌、交接、留痕都走统一协议，不靠临时约定。

### 4. 项目维护而非任务拼接
CortexOS 关注长期可维护性：边界清楚、状态收敛、技术债可控。

---

## 当前能力边界

- **规则系统**：`docs/rules/`
- **操作与运维**：`docs/ops/`、`docs/sops/`
- **功能总表**：`docs/guide/feature-matrix.md`
- **多 Agent 编排**：Fleet + MCP Tool
- **知识检索**：本地索引 + ChromaDB
- **历史记录**：`.memory/` 与 `docs/BRAIN_HISTORY.md`

---

## 外部链接

- [webkubor.online](https://www.webkubor.online/home)
- [掘金主页](https://juejin.cn/user/2119514149631870)
- [GitHub](https://github.com/webkubor)
