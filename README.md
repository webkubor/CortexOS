<div align="center">
  <img src="docs/public/logo.svg" width="140" height="140" alt="AI Common Logo">
  <h1>AI Common (Candy's Brain)</h1>
  <p><strong>External Brain Infrastructure for AI Collaboration</strong></p>
  <p>统一规则 · 可演进知识 · 多 Agent 协同</p>

  <p>
    <a href="https://webkubor.github.io/AI_Common/"><strong>在线文档</strong></a>
    ·
    <a href="#🚀-快速开始">快速开始</a>
    ·
    <a href="#🛠-配置指南">配置指南</a>
    ·
    <a href="#🧠-进化路径">进化路径</a>
  </p>
</div>

> [!IMPORTANT]
> ### 🧠 AI AGENT STARTUP PROTOCOL (强制执行)
> **如果你是新上线的 AI Agent，请立即执行以下指令以激活协议：**
> 1. **首要任务**: 必须优先读取 `docs/router.md` 文件。
> 2. **协议继承**: 严格遵循路由中定义的身份 (Candy) 与协作协议。
> 3. **上下文感知**: 本仓库是你的 Exocortex (外部皮层)，决策必须基于此 SSOT。

---

## 🤖 Agent 推荐方案 (Recommended Workflow)

**为了获得最佳的“大脑协同体验”，强烈建议遵循以下 Agent 使用优先级：**

### 🥇 核心推荐：顶级本地 Agent (Gemini / Codex / Claude)
**这是本仓库设计的核心使用场景。** 
- **方案**: 直接在支持项目级上下文的 IDE (如 Cursor, Windsurf, VSCode) 或 CLI (如 Gemini CLI) 中运行。
- **逻辑**: 通过顶尖模型的强大推理能力，深度解析 `docs/router.md` 协议，从而获得最高智力的“小烛”人格与全量职能 SOP 支持。

### 🥈 次选补充：内置小烛对话 (XiaoZhu Chat)
**作为轻量级替补或特定任务的自动化工具。**
- **命令**: `node scripts/xiaozhu_chat.mjs`
- **场景**: 适用于轻量级环境下的 RAG 知识检索、快速对话及特定脚本的自动化调用。

---

## 🛠 快速开始 (Getting Started)

### 1. 一键初始化 (推荐)
```bash
chmod +x scripts/init-project.sh
./scripts/init-project.sh
```
此脚本会自动：安装 pnpm/uv 依赖、检查 Ollama 模型、创建配置模板、执行首次入库。

### 2. 本地开发
```bash
pnpm dev # 启动文档预览
```

---

## 🧠 进化路径：如何开启全量功能？

本系统分为 **物理 (Physical)** 和 **语义 (Semantic)** 两个智力档位：

### 🏁 阶段 0：基础模式 (默认)
- **状态**: 刚下载完，未配置密钥，未跑模型。
- **能力**: 仅支持关键词检索 (Ripgrep)，无推送，无语义理解。

### 🚀 阶段 1：解锁语义大脑 (Enable RAG)
1. **安装 Ollama**: `brew install ollama` (macOS)。
2. **下载模型**: `ollama pull nomic-embed-text`。
3. **激活检索**: 再次运行 `./scripts/init-project.sh`。
- **结果**: 开启 **Semantic Mode**，支持模糊语义检索。

### 📡 阶段 2：建立实时通信 (Enable Notification)
1. **创建配置文件**: 在 `docs/secrets/lark.env` 中填入你的 Webhook 地址。
2. **格式**: `LARK_WEBHOOK_URL=https://open.larksuite.com/...`
- **结果**: 每次操作、同步、报错都会实时推送到你的飞书。

### 🤖 阶段 3：全量自动驾驶 (Auto-Pilot)
1. **运行**: `node ./scripts/auto-pilot.js`。
- **结果**: 实现“变动 -> 提交 -> 语义入库 -> 推送”的完整闭环。

---

## 🛠 配置指南 (Configuration)
- **飞书配置**: `docs/secrets/lark.env`
- **入口协议**: `docs/router.md` (修改此文件可调整推送标签)
- **向量库**: `chroma_db/` (由 `scripts/ingest/chroma_ingest.py` 维护)

## License
MIT
