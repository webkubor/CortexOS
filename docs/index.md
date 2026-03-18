---
layout: home
hero:
  name: "CortexOS"
  text: "多 Agent 协同外部大脑"
  tagline: "让 Gemini、Claude、Codex 共享同一个大脑 —— 动态路由注入、上下文极简、多模型逻辑对齐。"
  image:
    src: /logo.svg
    alt: CortexOS
  actions:
    - theme: brand
      text: 🚀 快速开始
      link: /guide/
    - theme: alt
      text: 📏 开发规则
      link: /rules/

features:
  - icon: 🧠
    title: AI 记忆 vs 用户记忆，彻底分层
    details: AI 记忆（协议、规则、技能）存于开源仓库，用户记忆（称呼、审美、私钥）存于本机私有 Memory。运行 `pnpm init:profile` 建立专属档案，fork 后 3 分钟完成 personalization。

  - icon: 🛰️
    title: 动态大脑路由 (Pure Brain Mode)
    details: 基于 `router.md` 的轻量化逻辑路由，彻底解耦调度逻辑。Gemini / Claude / Codex 共享同一套逻辑索引（SQLite）与语义资产（ChromaDB），按需加载规则文件，实现跨模型的高效对齐。

  - icon: 🔐
    title: 跨文件查询授权（MCP 权限隔离）
    details: 本地 CLI 跨目录访问受 MCP Server 网关管控。所有文件读写工具均经过 `read_file` / `write_file` MCP Tool 中转，Agent 无法直接越权访问未授权路径，私钥目录 `memory/secrets` 单独授权。

  - icon: 🔌
    title: 一行配置，接入任意 AI 客户端
    details: 基于 Model Context Protocol（MCP），将核心协议工具（read_router / search_knowledge / log_relationship / load_rule 等）挂载到 Claude Desktop、Gemini CLI、Cursor，实现工具栈的全局统一。

  - icon: 🛡️
    title: Pre-commit 安全门禁，防止私密信息泄漏

    details: 内置 git pre-commit hook，每次提交自动扫描硬编码绝对路径、API Key、个人称呼等敏感内容。Level 1 直接拦截提交，Level 2 警告提示，白名单精细配置。

  - icon: 📏
    title: 开发规则直接暴露，不藏在深目录
    details: 工程基线、安全边界、Agent 治理、Skill 治理直接挂到首页、导航和侧边栏。用户与 Agent 不需要猜规则在哪，打开文档就能看到主入口。
---
