---
name: wechat-publisher-skill
description: 微信公众号自动化发布技能（基于宝玉老师版本深度适配）。支持 Markdown 转换、API 极速发布及 Chrome CDP 模拟浏览器发布。
---

# 微信公众号发布技能 (Production-Grade)

此技能是您微信公众号资产（文章、图文、贴图）的自动化发布中枢。

当用户要求执行以下操作时使用：
- **发布文章**：将 Markdown 或 HTML 内容同步至公众号草稿箱或直接群发。
- **图文混排**：处理带图片的复杂 Markdown 转换，自动生成适配微信的引用格式。
- **多模式切换**：支持 API 模式（稳定高效）和 Browser/CDP 模式（模拟真人）。

## 核心执行脚本

位于母库中的 `scripts/` 目录：
- `scripts/wechat-api.ts`: API 模式发布。
- `scripts/wechat-browser.ts`: 模拟浏览器发布。
- `scripts/md-to-wechat.ts`: Markdown 转微信格式。

## 核心工作流

### 1. 内容预处理
- 自动将外部链接转换为底部参考文献，以适配微信环境。
- 自动检测并处理图片占位符。

### 2. 发布通道选择
- 默认优先尝试 API 模式。
- 如果涉及复杂样式或需要扫码/预览，可切换至 Browser 模式。

### 3. 验证与预览
- 发布后提供预览链接或草稿箱状态反馈。

## 维护守则
- **单源真理**：本目录（`Desktop/skills/arsenal/wechat-publisher-skill`）是公众号发布资产的母库。
- **软链接同步**：`~/.agents/skills/baoyu-post-to-wechat` 已软链接至此，确保全局 Agent 调用一致。
- **自定义适配**：所有针对宝玉老师原版脚本的本地微调（如 API Token 注入、模板优化）均应在此母库中维护。
