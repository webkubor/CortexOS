---
layout: home
hero:
  name: "CortexOS"
  text: "多 Agent 协同外部大脑"
  tagline: "让 Gemini、Claude、Codex 共享同一个大脑 —— 实时防碰撞、队长可移交、飞书实时播报。"
  image:
    src: /logo.svg
    alt: CortexOS
  actions:
    - theme: brand
      text: 🚀 快速开始
      link: /guide/

features:
  - icon: 🧠
    title: AI 记忆 vs 用户记忆，彻底分层
    details: AI 记忆（协议、规则、技能）存于开源仓库，用户记忆（称呼、审美、私钥）存于本机私有 Memory。运行 `pnpm init:profile` 建立专属档案，fork 后 3 分钟完成personalization。

  - icon: 🤖
    title: 多 Agent 舰队编排 + 队长移交
    details: Gemini / Claude / Codex 各自打卡挂牌，舰队编排板实时展示谁在哪个目录干什么。一句话即可移交队长：「队长切到 Codex」→ 自动触发 `fleet:handover`，老节点让位，新节点接管。

  - icon: 🔐
    title: 跨文件查询授权（MCP 权限隔离）
    details: 本地 CLI 跨目录访问受 MCP Server 网关管控。所有文件读写工具均经过 `read_file` / `write_file` MCP Tool 中转，Agent 无法直接越权访问未授权路径，私钥目录 `memory/secrets` 单独授权。

  - icon: 🔔
    title: 飞书 Lark Webhook 实时播报
    details: Auto-Pilot 守护进程每隔固定周期检测 git diff，自动提交并推送飞书战报：展示 AI Team 态势、本轮变更文件、任务进展摘要。工作时段（10:00–20:00）精准推送，其余时间静默。

  - icon: 🔌
    title: 一行配置，接入任意 AI 客户端
    details: 基于 Model Context Protocol（MCP），将 CortexOS 的 14 个工具（read_router / fleet_claim / log_task / task_handoff_check 等）挂载到 Claude Desktop、Gemini CLI、Cursor，任何客户端即开即用。

  - icon: 🛡️
    title: Pre-commit 安全门禁，防止私密信息泄漏
    details: 内置 git pre-commit hook，每次提交自动扫描硬编码绝对路径、API Key、个人称呼等敏感内容。Level 1 直接拦截提交，Level 2 警告提示，白名单精细配置。
---
