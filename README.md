<div align="center">
  <img src="docs/public/logo.svg" width="140" height="140" alt="AI Common Logo">
  <h1>AI Common (Candy's Brain)</h1>
  <p><strong>External Brain Infrastructure for AI Collaboration</strong></p>
  <p>统一规则 · 可演进知识 · 多 Agent 协同</p>

  <p>
    <a href="https://webkubor.github.io/AI_Common/"><strong>在线文档</strong></a>
    ·
    <a href="#🌟-项目亮点">项目亮点</a>
    ·
    <a href="#🚀-快速开始">快速开始</a>
    ·
    <a href="#🧠-进化路径">进化路径</a>
  </p>
</div>

> [!IMPORTANT]
> ### 🧠 AI AGENT STARTUP PROTOCOL (强制执行)
> **如果你是新上线的 AI Agent，请立即执行以下指令以激活协议：**
> 1. **首要任务**: 必须优先读取 `docs/router.md` 文件。
> 2. **协议继承**: 严格遵循路由中定义的身份 (Candy) 与协作协议。
> 3. **智力外挂**: 面对模糊概念时，**必须优先调用** `python3 scripts/ingest/query_brain.py` 进行语义检索。

---

## 🤖 Agent 推荐方案 (Recommended Workflow)

**为了获得最佳的“大脑协同体验”，强烈建议遵循以下 Agent 使用优先级：**

### 🥇 核心推荐：顶级本地 Agent (Gemini / Codex / Claude)
**这是本仓库设计的核心场景。** 
- **方案**: 直接在支持项目级上下文的 IDE (如 Cursor, Windsurf, VSCode) 或 CLI (如 Gemini CLI) 中运行。
- **智力感应**: 顶尖模型应主动利用 **RAG (ChromaDB)** 实现语义级的上下文感知，而非仅依赖物理搜索 (Grep)。
- **逻辑**: 通过深度解析 `docs/router.md` 协议，获得最高智力的“小烛”人格与全量职能 SOP。

### 🥈 次选补充：内置小烛对话 (XiaoZhu Chat)
**作为轻量级替补或特定任务的自动化工具。**
- **命令**: `node scripts/xiaozhu_chat.mjs`
- **场景**: 适用于轻量级环境下的 RAG 知识检索、快速对话及特定脚本的自动化调用。

---

## 🌟 项目亮点 (Project Highlights)

### 💓 1. 大脑自动驾驶仪 (Autonomous Heartbeat)
- **PM2 托管**: 通过 `brain-cortex-pilot` 提供持久化心跳，每 5 分钟自动扫描、入库并同步。
- **零负担记录**: 无论是老爹的操作还是 Agent 的改动，系统都会静默捕获并自动执行 Git Commit。

### 📡 2. 飞书硬核实时战报 (Lark Notification Engine)
- **意图感应**: 基于 `router.md` 的语义映射，自动识别改动是属于“小红书运营”还是“核心协议”。
- **文字快照**: 推送中直接包含 Markdown 的变动摘要，手机即可掌握大脑动态。

### 🧠 3. 跨模型协作协议 (Exocortex Protocol)
- **SSOT 唯一真理源**: 通过 `router.md` 定义全量路由，确保不同 Agent 在同一频道工作。

---

## 🛠 快速开始 (Getting Started)

### 1. 安装 PM2 (全局)
如果你想启用自动驾驶和实时推送功能：
```bash
npm install -g pm2
```

### 2. 一键初始化
```bash
chmod +x scripts/init-project.sh
./scripts/init-project.sh
```

### 3. 即刻体验大脑智力 (How to Experience)
- **对话体验**: 运行 `node scripts/xiaozhu_chat.mjs` 测试语义检索。
- **通知体验**: 在 `docs/secrets/lark.env` 填入 Webhook 后改动文档，查看飞书推送。

---

## 🧠 进化路径：如何开启全量功能？
### 🏁 阶段 0：基础模式 (默认) | 🚀 阶段 1：解锁语义大脑 | 📡 阶段 2：实时通信 | 🤖 阶段 3：全量自动驾驶

## License
MIT
