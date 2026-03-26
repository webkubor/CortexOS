# 关于 CortexOS

## 项目初衷

CortexOS (Core AI Operating System) 并非传统的操作系统，而是 `webkubor` 的 **AI Agent 中央大脑**。它的核心目标是解决 Agent 在跨会话、跨模型协作时的“失忆”与“逻辑漂移”问题。

## 核心设计哲学

- **中央大脑与执行分离**：CortexOS 负责存储规则、记忆、收件箱与逻辑路由；具体执行可以由任意外部客户端承担，但不属于 CortexOS 本体。
- **上下文极简 (Token Optimizer)**：不再向 Agent 注入全量文档，而是通过动态路由按需加载。
- **安全第一 (Safety First)**：通过 MCP 协议实现物理隔离，私钥与敏感资产永远留在本地 Memory 中。

## 职能边界

- ✅ **CortexOS (中央大脑)**: 提供 `router.md`、`knowledge.db`、`rules/`、`secrets/`。
- ✅ **Aether Muses (Persona)**: 提供 `relationship.md`、人格对齐、审美同步。
- ✅ **Cloud Brain (Extension)**: 提供 `notifications`、`memories`、`tasks` 的云端共享层。

## 发展现状

目前 CortexOS 已进化至 **v6.0.0 (Pure Brain Mode)**，全面去中心化，支持 Gemini CLI、Claude Desktop 和 Cursor 等多种主流 AI 客户端。
