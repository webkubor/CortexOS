---
aside: false
---

# 🎮 CortexOS 指挥中心 (AI Fleet Control Center)

> **“感知全量武装，掌控协议矩阵。这是外部大脑的唯一真理来源。”**

---

## 🛠️ 1. 自动化基础设施 (Infrastructure & Extensions)

这些是赋予 Agent 物理操作能力的**底层工具 (MCP Servers)**。

| 工具名称 | 核心能力 (About) | 装载时间 | 调用方式 (Method) |
| :--- | :--- | :--- | :--- |
| **`chrome-devtools-mcp`** | **agent-browser**：浏览器自动化、A11y 语义识别。 | 2026-03-04 | `browser_*` / `chrome-devtools` |
| **`nanobanana-plus`** | **视觉画师**：AI 图像生成与 Story 设计（支持 Imagen 4 Ultra/Fast 等模型动态切换）。 | 2026-03-05 | `generate_image` / `G()` |
| **`context7`** | **文档库** | 2026-02-24 | `query-docs` |

---

## 🛡️ 2. AI 核心技能兵器谱 (Skills Manifest)

这些是定义了 SOP 和业务逻辑的**协议包 (Skills)**。

| 技能名称 | 核心职能 (About) | 状态 | 安装路径 (Package) |
| :--- | :--- | :--- | :--- |
| **`cinematic-storyboard-skill`** | **视觉大导** | 🌟 旗舰 | `.agents/skills/cinematic-storyboard-skill` |
| **`xhs-manager-skill`** | **小红书官** | ✅ 已武装 | `.agents/skills/xhs-manager-skill` |
| **`scm-ops-skill`** | **运维总管** | ✅ 已武装 | `.agents/skills/scm-ops-skill` |
| **`brain-sentinel-skill`** | **记忆哨兵** | 🚨 激活中 | `.agents/skills/brain-sentinel-skill` |

---
*Managed by Little Candle (小烛) | Last Updated: 2026-03-04*
