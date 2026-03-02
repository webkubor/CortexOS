---
layout: home
hero:
  name: "小烛的外部大脑"
  text: "Candle Cortex · v5.0"
  tagline: "不是聊天框，是接口标准。我是老爹的外挂硬盘，MCP 是我们之间的 USB-C。"
  image:
    src: https://raw.githubusercontent.com/webkubor/upic-images/main/uPic/2026/02/Create_different_action_2k_202602081819%20(1).jpeg
    alt: Candle Persona
  actions:
    - theme: brand
      text: 🚀 激活大脑 (Router)
      link: /router
    - theme: alt
      text: 📚 查阅规则 (Rules)
      link: /rules/
    - theme: alt
      text: 🧩 调用技能 (Skills)
      link: /skills/

features:
  - icon: 💾
    title: 外部硬盘 (Exocortex)
    details: AI_Common 是老爹的外接大脑硬盘——所有规则、记忆、角色设定、项目上下文，统一存储在这里，任何 AI 插上就能读取。
  - icon: 🔌
    title: USB-C 标准接口 (MCP)
    details: MCP Server 是硬盘的接口层。它把"读规则、打卡挂牌、写日志"等操作封装成强类型 Tool，AI 不靠猜——遵守合约。
  - icon: 🚦
    title: 舰队防碰撞 (Fleet Guard)
    details: 多个 AI 同时在线，fleet:claim 打卡挂牌机制确保它们能互相感知、防止抢占同一文件造成冲突。
  - icon: 🔄
    title: 持续进化 (Auto-Evolution)
    details: 每次对话的操作都被记入 memory/logs，深度复盘机制形成闭环，让每一次任务都在给大脑添砖加瓦。

---

## ⚡ 这个系统的本质

> **老爹，你不是在用一个 AI，你在管理一套 AI 操作系统。**

把它想象成一套标准接口体系：

| 角色 | 类比 | 实体 |
| :--- | :--- | :--- |
| **老爹** | 决定插哪台设备的人 | 你 |
| **外部大脑** | USB 外接硬盘（知识 + 规则） | `AI_Common/` 目录 |
| **MCP Server** | USB-C 接口（标准通信协议） | `mcp_server/server.py` |
| **Codex / Gemini** | 接收插入的电脑 | 各 AI Agent |
| **Fleet Dashboard** | 硬盘状态指示灯 | [AI Team 看板](/ai-team) |

> MCP 的核心价值是**合约**。每个 Tool 有明确的函数签名、参数类型和返回格式，AI 不靠猜——遵守的是和你之间定好的接口协议。你说意图，它调 Tool，大脑文件系统按规则响应，整个链路没有模糊地带。

---

## 🏛️ 组织架构 (Organizational Structure)

小烛的外部大脑不仅仅是文档，它是一套 **多 Agent 协同系统 (Multi-Agent Collaboration System)**。

不仅仅是写代码，任何与互联网相关的事项（运营、创作、管理）都能处理。**老爹只需要做决策和指明方向**，剩下的交给我们。

<div class="dept-grid">

### 🧠 核心参谋部 (Core)
>
> **"定义大脑的思考方式"**
负责制定通用协议、孵化新技能以及深度思考任务。

- **关键职能**: 深度思考 (Think), 技能孵化 (Skill Creator), 协议管理 (Manifest)

### ✍️ 内容创作部 (Writers)
>
> **"笔耕不辍，高效输出"**
负责多平台的内容生产与文案打磨。

- **关键职能**: 掘金专栏, 微信公众号, 飞书文档, 内部通讯

### 📢 账号运营部 (Ops)
>
> **"连接世界，分发价值"**
负责跨平台的账号管理、内容分发与自动化运营。

- **关键职能**: 小红书矩阵 (XHS), GitHub/GitLab 运维, 掘金发布

### 🛠️ 工程与自动化 (Eng)
>
> **"构建基石，稳如磐石"**
负责基础设施建设、全栈开发支持与质量保证。

- **关键职能**: Web 应用测试, PWA 方案, 图片托管, 架构初始化

### 🎨 视觉与设计 (Visual)
>
> **"所见即所得，美学驱动"**
负责所有视觉资产的生成、UI/UX 设计及视频创作。

- **关键职能**: 智能绘图 (XHS Style), 电影分镜, 前端设计, Remotion 视频

### 📚 知识管理 (Knowledge)
>
> **"不仅记录，更是智慧"**
负责向量数据库维护、碎片知识整理及自动复盘。

- **关键职能**: ChromaDB RAG, 自动复盘 (GC), 知识碎片管理

</div>

---

## 🚀 核心价值

### 1. 对 AI (Agents)

- **SSOT (唯一真理源)**：不再猜测用户偏好，一切规则都在 `docs/rules` 中强制定义。
- **MCP Tool (原子操作)**：打卡、读规、写日志、看队列，全部封装为强类型函数，可靠调用。
- **Shared Memory (共享记忆)**：上一秒 Codex 打的卡，下一秒 Gemini 在看板上就能看见。

### 2. 对老爹 (User)

- **Context Injection (上下文注入)**：一键加载项目背景，零样本启动任务。
- **Fleet Anti-Collision (防撞车)**：多 AI 同时跑，打卡挂牌机制防止相互覆盖代码。
- **Asset Accumulation (资产沉淀)**：每一次对话都在为外部大脑增加新的神经元。

---

## 🗺️ 快速导航

| 想要做什么？ | 推荐路径 |
| :--- | :--- |
| **开始一个新项目** | [项目初始化 SOP](/rules/project_initialization_sop) |
| **查询代码规范** | [规则中心](/rules/) |
| **运营小红书** | [小红书矩阵运营](/skills/ops/xhs) |
| **复盘技术难题** | [深度复盘](/retrospectives/) |
| **查看 AI 舰队状态** | [AI Team 看板](/ai-team) |
| **版本更新历史** | [CHANGELOG](https://github.com/webkubor/AI_Common/blob/main/CHANGELOG.md) |

---

<style>
.dept-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}
.dept-grid h3 {
  margin-top: 0 !important;
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 0.5rem;
}
</style>
