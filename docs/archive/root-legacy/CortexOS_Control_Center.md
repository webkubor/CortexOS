# 🎮 CortexOS 指挥中心 (AI Fleet Control Center)

> **“感知全量武装，掌控协议矩阵。这是外部大脑的唯一真理来源。”**

---

## 🛠️ 1. 自动化基础设施 (Infrastructure & Extensions)
这些是赋予 Agent 物理操作能力的**底层工具 (MCP Servers & CLI)**。

| 工具名称 | 核心能力 (About) | 装载时间 | 调用方式 (Method) |
| :--- | :--- | :--- | :--- |
| **`agent-browser`** | **SSOT 浏览器**：高级自动化、A11y 语义快照、官方文档深度检索。 | 2026-03-05 | `agent-browser` (CLI) |
| **`chrome-devtools`** | **底层驱动**：浏览器控制、性能分析、A11y 审计 (MCP)。 | 2026-03-04 | `browser_*` |
| **`nanobanana-plus`** | **旗舰画师**：AI 图像生成、编辑、视觉故事、SVG 图标 (Upgraded)。 | 2026-03-05 | `generate_image` / `G()` |
| **`huggingface-skills`**| **模型工厂**：HF 模型训练、数据集管理、Gradio UI 开发 (New)。 | 2026-03-05 | `hugging-face-*` |
| **`github`** | **代码协作**：仓库管理、Issue/PR 操作、代码审查。 | 2026-03-05 | `github_*` |
| **`obsidian`** | **记忆读写**：知识库精准修改 (patch_note)、双链管理。 | 2026-03-05 | `obsidian.*` |

---

## 🛡️ 2. AI 核心技能兵器谱 (Skills Manifest)
这些是定义了 SOP 和业务逻辑的**协议包 (Skills)**。

| 技能名称 | 核心职能 (About) | 状态 | 安装路径 (Package) |
| :--- | :--- | :--- | :--- |
| **`huggingface-skills`** | **模型工程**：涵盖从训练 (TRL)、评估到部署的全流程。 | 🚀 新锐 | `.gemini/extensions/huggingface-skills` |
| **`cinematic-storyboard`**| **视觉大导**：写实武侠逻辑、15s 分镜、AI 视频 Prompt。 | 🌟 旗舰 | `.agents/skills/cinematic-storyboard-skill` |
| **`xhs-manager-skill`** | **小红书官**：agent-browser 驱动、矩阵发布、账号隔离。 | ✅ 已武装 | `.agents/skills/xhs-manager-skill` |
| **`scm-ops-skill`** | **运维总管**：Git/GitHub 自动化、Release 循环。 | ✅ 已武装 | `.agents/skills/scm-ops-skill` |
| **`brain-sentinel-skill`** | **记忆哨兵**：Obsidian 协同日志、双链追踪、审计。 | 🚨 激活中 | `.agents/skills/brain-sentinel-skill` |
| **`file-hosting-master`** | **云端存储**：R2/GitHub 资产自动上传与分发 (v1.2.2)。 | ✅ 已更新 | `.agents/skills/file-hosting-master-skill` |


---

## 🚦 3. 执行与维护协议 (Management SOP)

### 📥 技能安装与更新
- **安装新技能**: `gemini skills install <URL>`
- **安装新工具**: `gemini extensions install <URL>`

### 🔄 技能管理
- **激活/切换**: `activate_skill(name)`
- **状态巡检**: `pnpm run fleet:status` (来自 `CortexOS` 根目录)

### 📝 记忆同步
- **操作留痕**: 每一项基础设施变动现统一记入 `.memory/logs/YYYY-MM-DD.md`。
- **兵器谱同步**: 每次安装/卸载后必须更新本指挥中心文档。

---
*Managed by Little Candle (小烛) | Last Updated: 2026-03-04*
