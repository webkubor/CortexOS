---
description: CortexOS 对外部桌面 skills 母库的正式索引。skills 保持独立存在，主脑只维护索引、治理与使用协议。
---
# Skills 总览

> 这些 skills 的 **代码真源不在 CortexOS 仓库内**，而在独立母库：`~/Desktop/skills`。
> CortexOS 只负责：识别、索引、治理、同步状态与使用入口。

## 当前母库

- 本地路径：`~/Desktop/skills`
- 远端仓库：`https://gitlab.com/webkubor/personal-skills.git`
- 最近提交：`b0d23bf 2026-03-24 chore: remove xhs-manager-skill`
- 同步命令：`pnpm skills:sync`

## 为什么要独立存在

1. Skills 是横跨多个 agent 的能力资产，不应绑定在 CortexOS 单仓库里。
2. CortexOS 是主脑；skills 是外挂能力母库。
3. 让 skills 单独存在，才能一边维护、一边优化，不被主脑项目节奏绑死。

## 当前技能清单

| 名称 | 分类 | 描述 | 最近提交 | 目录 |
| --- | --- | --- | --- | --- |
| `ai-modification-skill` | `arsenal` | 工作区索引和 AI 可读性清理。当用户想要添加或改进 `llms.txt`、仓库地图（repo maps）、AI 入口文档或轻量级项目上下文脚手架时使用。 | `2026-03-23` | `arsenal/ai-modification-skill` |
| `chrome-native-debug` | `arsenal` | 接管原生 Chrome 浏览器进行自动化操作（共享登录态）。使用 Chrome 144+ 新方式：chrome://inspect 远程调试 + Chrome DevTools MCP --autoConnect。无需重启 Chrome，无需独立 profile，直接操控用户当前浏览器。当用户要求"打开网页"、"操控浏览器"、"接管浏览器"、"用原生浏览器"、"共享登录态"、"在当前浏览器里操作"时使用此 Skill。 | `2026-03-24` | `arsenal/chrome-native-debug` |
| `code-standards-skill` | `arsenal` | 代码质量与可维护性护栏。当用户要求进行代码审查、制定重构标准、降低复杂度、拆分文件、清理命名或强化工程规范时使用。 | `2026-03-23` | `arsenal/code-standards-skill` |
| `r2-uploader-skill` | `arsenal` | 生产级 Cloudflare R2 图床上传与分发技能。用于一键同步本地图片/素材到 img.webkubor.online，并自动生成公网直链。 | `2026-03-23` | `arsenal/r2-uploader-skill` |
| `true-advisor-skill` | `arsenal` | 针对代码、产品、策略、运营、写作和通用决策的“反谄媚”顾问。当用户要求进行判断、方案对比、红队测试（Red-teaming）、事前分析（Pre-mortem analysis）、权衡审查，或者想要直言不讳的建议而非客气的认同时使用。 | `2026-03-23` | `arsenal/true-advisor-skill` |
| `vitepress-init-skill` | `arsenal` | VitePress 设置技能。当用户想要初始化或修复 VitePress 文档网站（包括配置、导航、侧边栏、静态资源和文档结构）时使用。 | `2026-03-23` | `arsenal/vitepress-init-skill` |

## 分类视图

### arsenal

- `ai-modification-skill`：工作区索引和 AI 可读性清理。当用户想要添加或改进 `llms.txt`、仓库地图（repo maps）、AI 入口文档或轻量级项目上下文脚手架时使用。
- `chrome-native-debug`：接管原生 Chrome 浏览器进行自动化操作（共享登录态）。使用 Chrome 144+ 新方式：chrome://inspect 远程调试 + Chrome DevTools MCP --autoConnect。无需重启 Chrome，无需独立 profile，直接操控用户当前浏览器。当用户要求"打开网页"、"操控浏览器"、"接管浏览器"、"用原生浏览器"、"共享登录态"、"在当前浏览器里操作"时使用此 Skill。
- `code-standards-skill`：代码质量与可维护性护栏。当用户要求进行代码审查、制定重构标准、降低复杂度、拆分文件、清理命名或强化工程规范时使用。
- `r2-uploader-skill`：生产级 Cloudflare R2 图床上传与分发技能。用于一键同步本地图片/素材到 img.webkubor.online，并自动生成公网直链。
- `true-advisor-skill`：针对代码、产品、策略、运营、写作和通用决策的“反谄媚”顾问。当用户要求进行判断、方案对比、红队测试（Red-teaming）、事前分析（Pre-mortem analysis）、权衡审查，或者想要直言不讳的建议而非客气的认同时使用。
- `vitepress-init-skill`：VitePress 设置技能。当用户想要初始化或修复 VitePress 文档网站（包括配置、导航、侧边栏、静态资源和文档结构）时使用。

## 使用原则

1. 修改 skill 内容时，改母库 `Desktop/skills`，不要在 CortexOS 里复制一份。
2. 修改后执行 `pnpm skills:sync`，让主脑重新生成技能索引。
3. 主脑只保留文档入口、治理规则和最近同步状态，不保留冗余 skill 代码。

