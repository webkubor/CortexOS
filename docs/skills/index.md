---
description: CortexOS 主脑技能库索引。通用 skills 的真源在 CortexOS 仓库内，私人 skills 保留在 personal-skills 独立仓库。
---
# Skills 总览

> 通用 skills 的 **代码真源在 CortexOS 仓库内**（`.agents/skills/`）。
> 私人 skills（含凭证、Cookie、个人账号配置）的真源在独立的 `personal-skills` 仓库。
> `~/.agents/skills/` 只是挂载点，全部为 symlink，不存放实体文件。

## 当前主脑技能库

- 本地路径：`/Users/webkubor/Documents/CortexOS/.agents/skills/`
- 最近提交：`1c16dea 2026-04-01 auto: 基础架构 at 2026/4/1 15:00:00`
- 同步命令：`pnpm skills:sync`

## 架构原则

1. **CortexOS 是主脑**：通用、可共享的 skills 统一收拢到 CortexOS 内部。
2. **personal-skills 是私人配置层**：只保留含个人凭证、账号、私有配置的 skills（如 GitHub 图床、R2 上传、公众号发布）。
3. **~/.agents/skills/ 是挂载点**：全部为 symlink，通用技能指向 CortexOS，私人技能指向 personal-skills。
4. **修改通用 skill**：直接改 CortexOS 里的真源，所有 Agent 即时生效。
5. **修改私人 skill**：改 personal-skills 里的真源，避免私人凭证进入主脑仓库。

## 当前技能清单

| 名称 | 分类 | 描述 | 最近提交 | 目录 |
| --- | --- | --- | --- | --- |
| `agent-reach` | `integration` | > | `-` | `agent-reach` |
| `ai-modification-skill` | `engineering` | AI-Native Workspace Transformation Protocol. Optimized for Gemini 2.x Context-Native Reasoning and Multi-Agent orchestration. | `-` | `ai-modification-skill` |
| `audio-music-engineer-skill` | `media` | 音频创作与工程处理技能。包含语音设计 SOP、音频后期脚本及自动化渲染流程，支持《沸腾之雪》等影视级别的音频工程。 | `-` | `audio-music-engineer-skill` |
| `chrome-native-debug` | `engineering` | 接管原生 Chrome 浏览器进行自动化操作（共享登录态）。使用 Chrome 144+ 新方式：chrome://inspect 远程调试 + Chrome DevTools MCP --autoConnect。无需重启 Chrome，无需独立 profile，直接操控用户当前浏览器。当用户要求"打开网页"、"操控浏览器"、"接管浏览器"、"用原生浏览器"、"共享登录态"、"在当前浏览器里操作"时使用此 Skill。 | `-` | `chrome-native-debug` |
| `cinematic-storyboard-skill` | `creative` | 影视分镜与脚本策划技能。专注于武侠剧集（如《沸腾之雪》）的视觉叙事、镜头设计、角色动线及分镜脚本自动生成。 | `-` | `cinematic-storyboard-skill` |
| `code-standards-skill` | `engineering` | 代码质量与可维护性护栏。当用户要求进行代码审查、制定重构标准、降低复杂度、拆分文件、清理命名或强化工程规范时使用。 | `-` | `code-standards-skill` |
| `logo-designer` | `creative` | Vector Aesthetics Protocol for generating high-quality, proportionally-coordinated, modern aesthetic SVG logos. Does not depend on external drawing libraries - uses AI's SVG coding capabilities directly to output production-ready vector graphics. Use for website logos, App icons, Favicons, and brand identities. | `-` | `logo-designer` |
| `obsidian` | `integration` | > | `-` | `obsidian` |
| `openspec-apply-change` | `workflow` | Implement tasks from an OpenSpec change. Use when the user wants to start implementing, continue implementation, or work through tasks. | `-` | `openspec-apply-change` |
| `openspec-archive-change` | `workflow` | Archive a completed change in the experimental workflow. Use when the user wants to finalize and archive a change after implementation is complete. | `-` | `openspec-archive-change` |
| `openspec-explore` | `workflow` | Enter explore mode - a thinking partner for exploring ideas, investigating problems, and clarifying requirements. Use when the user wants to think through something before or during a change. | `-` | `openspec-explore` |
| `openspec-propose` | `workflow` | Propose a new change with all artifacts generated in one step. Use when the user wants to quickly describe what they want to build and get a complete proposal with design, specs, and tasks ready for implementation. | `-` | `openspec-propose` |
| `pk-ecommerce-init` | `integration` | 未填写描述 | `-` | `pk-ecommerce-init` |
| `pwa-master-skill` | `engineering` | PWA 设置与迁移技能。当用户希望在现有 Web 应用中实现离线支持、可安装性、服务工作线程（Service Worker）更新、清单（Manifest）设置或 PWA 用户体验改进时使用。 | `-` | `pwa-master-skill` |
| `think` | `cognition` | Socratic deep thinking and multi-dimensional analysis for complex problems. Use when user asks for "deep thinking", "essential analysis", "multi-dimensional evaluation", or uses the /think command. Guides Claude to clarify concepts, challenge assumptions, think counter-intuitively, and provide balanced decision matrices. | `-` | `think-skill` |
| `true-advisor-skill` | `cognition` | 针对代码、产品、策略、运营、写作和通用决策的“反谄媚”顾问。当用户要求进行判断、方案对比、红队测试（Red-teaming）、事前分析（Pre-mortem analysis）、权衡审查，或者想要直言不讳的建议而非客气的认同时使用。 | `-` | `true-advisor-skill` |
| `ui-ux-pro-max` | `creative` | UI/UX design intelligence. 50 styles, 21 palettes, 50 font pairings, 20 charts, 9 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, mobile app, .html, .tsx, .vue, .svelte. Elements: button, modal, navbar, sidebar, card, table, form, chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, flat design. Topics: color palette, accessibility, animation, layout, typography, font pairing, spacing, hover, shadow, gradient. Integrations: shadcn/ui MCP for component search and examples. | `-` | `ui-ux-pro-max` |
| `vitepress-init-skill` | `engineering` | Universal VitePress Documentation Scaffolding Protocol. Optimized for Gemini 2.x Auto-Aesthetics injection and intelligent directory planning. | `-` | `vitepress-init-skill` |

## 分类视图

### cognition

- `think`：Socratic deep thinking and multi-dimensional analysis for complex problems. Use when user asks for "deep thinking", "essential analysis", "multi-dimensional evaluation", or uses the /think command. Guides Claude to clarify concepts, challenge assumptions, think counter-intuitively, and provide balanced decision matrices.
- `true-advisor-skill`：针对代码、产品、策略、运营、写作和通用决策的“反谄媚”顾问。当用户要求进行判断、方案对比、红队测试（Red-teaming）、事前分析（Pre-mortem analysis）、权衡审查，或者想要直言不讳的建议而非客气的认同时使用。

### creative

- `cinematic-storyboard-skill`：影视分镜与脚本策划技能。专注于武侠剧集（如《沸腾之雪》）的视觉叙事、镜头设计、角色动线及分镜脚本自动生成。
- `logo-designer`：Vector Aesthetics Protocol for generating high-quality, proportionally-coordinated, modern aesthetic SVG logos. Does not depend on external drawing libraries - uses AI's SVG coding capabilities directly to output production-ready vector graphics. Use for website logos, App icons, Favicons, and brand identities.
- `ui-ux-pro-max`：UI/UX design intelligence. 50 styles, 21 palettes, 50 font pairings, 20 charts, 9 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, mobile app, .html, .tsx, .vue, .svelte. Elements: button, modal, navbar, sidebar, card, table, form, chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, flat design. Topics: color palette, accessibility, animation, layout, typography, font pairing, spacing, hover, shadow, gradient. Integrations: shadcn/ui MCP for component search and examples.

### engineering

- `ai-modification-skill`：AI-Native Workspace Transformation Protocol. Optimized for Gemini 2.x Context-Native Reasoning and Multi-Agent orchestration.
- `chrome-native-debug`：接管原生 Chrome 浏览器进行自动化操作（共享登录态）。使用 Chrome 144+ 新方式：chrome://inspect 远程调试 + Chrome DevTools MCP --autoConnect。无需重启 Chrome，无需独立 profile，直接操控用户当前浏览器。当用户要求"打开网页"、"操控浏览器"、"接管浏览器"、"用原生浏览器"、"共享登录态"、"在当前浏览器里操作"时使用此 Skill。
- `code-standards-skill`：代码质量与可维护性护栏。当用户要求进行代码审查、制定重构标准、降低复杂度、拆分文件、清理命名或强化工程规范时使用。
- `pwa-master-skill`：PWA 设置与迁移技能。当用户希望在现有 Web 应用中实现离线支持、可安装性、服务工作线程（Service Worker）更新、清单（Manifest）设置或 PWA 用户体验改进时使用。
- `vitepress-init-skill`：Universal VitePress Documentation Scaffolding Protocol. Optimized for Gemini 2.x Auto-Aesthetics injection and intelligent directory planning.

### integration

- `agent-reach`：>
- `obsidian`：>
- `pk-ecommerce-init`：未填写描述

### media

- `audio-music-engineer-skill`：音频创作与工程处理技能。包含语音设计 SOP、音频后期脚本及自动化渲染流程，支持《沸腾之雪》等影视级别的音频工程。

### workflow

- `openspec-apply-change`：Implement tasks from an OpenSpec change. Use when the user wants to start implementing, continue implementation, or work through tasks.
- `openspec-archive-change`：Archive a completed change in the experimental workflow. Use when the user wants to finalize and archive a change after implementation is complete.
- `openspec-explore`：Enter explore mode - a thinking partner for exploring ideas, investigating problems, and clarifying requirements. Use when the user wants to think through something before or during a change.
- `openspec-propose`：Propose a new change with all artifacts generated in one step. Use when the user wants to quickly describe what they want to build and get a complete proposal with design, specs, and tasks ready for implementation.

## 使用原则

1. 新增通用 skill 时，放入 `CortexOS/.agents/skills/`，然后执行 `pnpm skills:sync` 更新索引。
2. 新增私人 skill 时，放入 `personal-skills/arsenal/`，并在 `~/.agents/skills/` 创建 symlink。
3. 不要在 `~/.agents/skills/` 直接放实体目录，避免真源漂移。

