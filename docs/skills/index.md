---
description: CortexOS 主脑技能库统一索引。所有项目 skills 真源统一在 skills/。
---
# Skills 总览

> 所有项目 skills 真源统一在 `skills/`。

## 当前主脑技能库

- Skills 目录：`/Users/webkubor/Documents/CortexOS/skills/`
- 最近提交：`b59ea10 2026-04-01 auto: 基础架构 at 2026/4/1 20:05:00`
- 同步命令：`pnpm skills:sync`

## 架构原则

1. **项目内 skills 单目录收敛**：所有 skills 统一放在 `CortexOS/skills/`。
2. **skills 的 SSOT 在项目内**：原文档、脚本、references 直接收进 `CortexOS/skills/`，不要再用软链接或隐藏目录冒充真源。
3. **修改 skill**：直接改 `CortexOS/skills/`。
4. **私人凭证隔离**：含 Token/Key 的 skill 内部通过环境变量或 `~/Documents/memory/secrets/` 读取，不硬编码。

## 当前技能清单

| 名称 | 分类 | 描述 | 最近提交 | 目录 |
| --- | --- | --- | --- | --- |
| `agent-reach` | `integration` | > | `2026-04-01` | `skills/agent-reach` |
| `ai-modification-skill` | `engineering` | AI-Native Workspace Transformation Protocol. Optimized for Gemini 2.x Context-Native Reasoning and Multi-Agent orchestration. | `2026-04-01` | `skills/ai-modification-skill` |
| `audio-music-engineer-skill` | `media` | 音频创作与工程处理技能。包含语音设计 SOP、音频后期脚本及自动化渲染流程，支持《沸腾之雪》等影视级别的音频工程。 | `2026-04-01` | `skills/audio-music-engineer-skill` |
| `chrome-native-debug` | `engineering` | 接管原生 Chrome 浏览器进行自动化操作（共享登录态）。使用 Chrome 144+ 新方式：chrome://inspect 远程调试 + Chrome DevTools MCP --autoConnect。无需重启 Chrome，无需独立 profile，直接操控用户当前浏览器。当用户要求"打开网页"、"操控浏览器"、"接管浏览器"、"用原生浏览器"、"共享登录态"、"在当前浏览器里操作"时使用此 Skill。 | `2026-04-01` | `skills/chrome-native-debug` |
| `cinematic-storyboard-skill` | `creative` | 影视分镜与脚本策划技能。专注于武侠剧集（如《沸腾之雪》）的视觉叙事、镜头设计、角色动线及分镜脚本自动生成。 | `2026-04-01` | `skills/cinematic-storyboard-skill` |
| `code-standards-skill` | `engineering` | 代码质量与可维护性护栏。当用户要求进行代码审查、制定重构标准、降低复杂度、拆分文件、清理命名或强化工程规范时使用。 | `2026-04-01` | `skills/code-standards-skill` |
| `github-uploader-skill` | `integration` | 生产级 GitHub 图床上传与 jsDelivr CDN 分发技能。用于将项目文档插图同步至 webkubor/upic-images，并生成极速 CDN 直链。 | `2026-04-01` | `skills/github-uploader-skill` |
| `logo-designer` | `creative` | Vector Aesthetics Protocol for generating high-quality, proportionally-coordinated, modern aesthetic SVG logos. Does not depend on external drawing libraries - uses AI's SVG coding capabilities directly to output production-ready vector graphics. Use for website logos, App icons, Favicons, and brand identities. | `2026-04-01` | `skills/logo-designer` |
| `obsidian` | `integration` | > | `2026-04-01` | `skills/obsidian` |
| `openspec-apply-change` | `workflow` | Implement tasks from an OpenSpec change. Use when the user wants to start implementing, continue implementation, or work through tasks. | `2026-04-01` | `skills/openspec-apply-change` |
| `openspec-archive-change` | `workflow` | Archive a completed change in the experimental workflow. Use when the user wants to finalize and archive a change after implementation is complete. | `2026-04-01` | `skills/openspec-archive-change` |
| `openspec-explore` | `workflow` | Enter explore mode - a thinking partner for exploring ideas, investigating problems, and clarifying requirements. Use when the user wants to think through something before or during a change. | `2026-04-01` | `skills/openspec-explore` |
| `openspec-propose` | `workflow` | Propose a new change with all artifacts generated in one step. Use when the user wants to quickly describe what they want to build and get a complete proposal with design, specs, and tasks ready for implementation. | `2026-04-01` | `skills/openspec-propose` |
| `pk-ecommerce-init` | `integration` | 未填写描述 | `2026-04-01` | `skills/pk-ecommerce-init` |
| `pwa-master-skill` | `engineering` | PWA 设置与迁移技能。当用户希望在现有 Web 应用中实现离线支持、可安装性、服务工作线程（Service Worker）更新、清单（Manifest）设置或 PWA 用户体验改进时使用。 | `2026-04-01` | `skills/pwa-master-skill` |
| `r2-uploader-skill` | `integration` | 生产级 Cloudflare R2 图床上传与分发技能。用于一键同步本地图片/素材到 img.webkubor.online，并自动生成公网直链。 | `2026-04-01` | `skills/r2-uploader-skill` |
| `think` | `cognition` | Socratic deep thinking and multi-dimensional analysis for complex problems. Use when user asks for "deep thinking", "essential analysis", "multi-dimensional evaluation", or uses the /think command. Guides Claude to clarify concepts, challenge assumptions, think counter-intuitively, and provide balanced decision matrices. | `2026-04-01` | `skills/think-skill` |
| `true-advisor-skill` | `cognition` | 针对代码、产品、策略、运营、写作和通用决策的“反谄媚”顾问。当用户要求进行判断、方案对比、红队测试（Red-teaming）、事前分析（Pre-mortem analysis）、权衡审查，或者想要直言不讳的建议而非客气的认同时使用。 | `2026-04-01` | `skills/true-advisor-skill` |
| `vitepress-init-skill` | `engineering` | Universal VitePress Documentation Scaffolding Protocol. Optimized for Gemini 2.x Auto-Aesthetics injection and intelligent directory planning. | `2026-04-01` | `skills/vitepress-init-skill` |
| `wechat-publisher-skill` | `integration` | 微信公众号自动化发布技能（基于宝玉老师版本深度适配）。支持 Markdown 转换、API 极速发布及 Chrome CDP 模拟浏览器发布。 | `2026-04-01` | `skills/wechat-publisher-skill` |

## 分类视图

### cognition

- `think`：Socratic deep thinking and multi-dimensional analysis for complex problems. Use when user asks for "deep thinking", "essential analysis", "multi-dimensional evaluation", or uses the /think command. Guides Claude to clarify concepts, challenge assumptions, think counter-intuitively, and provide balanced decision matrices.
- `true-advisor-skill`：针对代码、产品、策略、运营、写作和通用决策的“反谄媚”顾问。当用户要求进行判断、方案对比、红队测试（Red-teaming）、事前分析（Pre-mortem analysis）、权衡审查，或者想要直言不讳的建议而非客气的认同时使用。

### creative

- `cinematic-storyboard-skill`：影视分镜与脚本策划技能。专注于武侠剧集（如《沸腾之雪》）的视觉叙事、镜头设计、角色动线及分镜脚本自动生成。
- `logo-designer`：Vector Aesthetics Protocol for generating high-quality, proportionally-coordinated, modern aesthetic SVG logos. Does not depend on external drawing libraries - uses AI's SVG coding capabilities directly to output production-ready vector graphics. Use for website logos, App icons, Favicons, and brand identities.

### engineering

- `ai-modification-skill`：AI-Native Workspace Transformation Protocol. Optimized for Gemini 2.x Context-Native Reasoning and Multi-Agent orchestration.
- `chrome-native-debug`：接管原生 Chrome 浏览器进行自动化操作（共享登录态）。使用 Chrome 144+ 新方式：chrome://inspect 远程调试 + Chrome DevTools MCP --autoConnect。无需重启 Chrome，无需独立 profile，直接操控用户当前浏览器。当用户要求"打开网页"、"操控浏览器"、"接管浏览器"、"用原生浏览器"、"共享登录态"、"在当前浏览器里操作"时使用此 Skill。
- `code-standards-skill`：代码质量与可维护性护栏。当用户要求进行代码审查、制定重构标准、降低复杂度、拆分文件、清理命名或强化工程规范时使用。
- `pwa-master-skill`：PWA 设置与迁移技能。当用户希望在现有 Web 应用中实现离线支持、可安装性、服务工作线程（Service Worker）更新、清单（Manifest）设置或 PWA 用户体验改进时使用。
- `vitepress-init-skill`：Universal VitePress Documentation Scaffolding Protocol. Optimized for Gemini 2.x Auto-Aesthetics injection and intelligent directory planning.

### integration

- `agent-reach`：>
- `github-uploader-skill`：生产级 GitHub 图床上传与 jsDelivr CDN 分发技能。用于将项目文档插图同步至 webkubor/upic-images，并生成极速 CDN 直链。
- `obsidian`：>
- `pk-ecommerce-init`：未填写描述
- `r2-uploader-skill`：生产级 Cloudflare R2 图床上传与分发技能。用于一键同步本地图片/素材到 img.webkubor.online，并自动生成公网直链。
- `wechat-publisher-skill`：微信公众号自动化发布技能（基于宝玉老师版本深度适配）。支持 Markdown 转换、API 极速发布及 Chrome CDP 模拟浏览器发布。

### media

- `audio-music-engineer-skill`：音频创作与工程处理技能。包含语音设计 SOP、音频后期脚本及自动化渲染流程，支持《沸腾之雪》等影视级别的音频工程。

### workflow

- `openspec-apply-change`：Implement tasks from an OpenSpec change. Use when the user wants to start implementing, continue implementation, or work through tasks.
- `openspec-archive-change`：Archive a completed change in the experimental workflow. Use when the user wants to finalize and archive a change after implementation is complete.
- `openspec-explore`：Enter explore mode - a thinking partner for exploring ideas, investigating problems, and clarifying requirements. Use when the user wants to think through something before or during a change.
- `openspec-propose`：Propose a new change with all artifacts generated in one step. Use when the user wants to quickly describe what they want to build and get a complete proposal with design, specs, and tasks ready for implementation.

## 使用原则

1. 新增 skill 时，直接放入 `CortexOS/skills/`，把原文档、脚本、references 一起收进来。
2. `CortexOS/.agents/` 下不再放 skills。
3. 涉及私人凭证的 skill，优先从环境变量读取，避免硬编码密钥进入 Git 历史。

