---
description: Skills 管理页（安装位置 + 使用方式 + 扫描结果）
---
# Skills 管理台

> 本页由脚本自动生成：`node scripts/tools/sync-skills-management.mjs`  
> 最近生成时间：2026-03-06 15:25

## 0. 先做这 3 步（实操）

1. 安装拆分出去的原生 skill（从下方表格复制 `gemini skills install ...`）  
2. 运行 `node scripts/tools/sync-skills-management.mjs` 刷新本页  
3. 看“本机已安装 Skills”确认路径是否出现  
4. 在对话里直接点名 skill（`$skill-name`）实际触发一次

## 1. 安装在哪里

### 1.1 运行时安装目录

| 运行时 | 目录 | 当前存在 | 检查命令 |
| :--- | :--- | :---: | :--- |
| ~/.agents/skills | `/Users/webkubor/.agents/skills` | 是 | `ls -la /Users/webkubor/.agents/skills` |
| ~/.agent/skills | `/Users/webkubor/.agent/skills` | 否 | `ls -la /Users/webkubor/.agent/skills` |
| ~/.codex/skills | `/Users/webkubor/.codex/skills` | 是 | `ls -la /Users/webkubor/.codex/skills` |

### 1.2 本机私有 skills 源码目录

- 源码目录：`~/Desktop/skills`
- 推荐做法：源码放这里，再链接到对应运行时目录。

示例（把本地 skill 接入 Codex）：

```bash
ln -s "$HOME/Desktop/skills/your-skill" "$HOME/.codex/skills/your-skill"
```

## 2. 初始化建议安装（CortexOS 原生 skills）

| Skill | 仓库 | 已安装 | 已安装路径 | 安装命令 |
| :--- | :--- | :---: | :--- | :--- |
| omni-publisher-skill | https://github.com/webkubor/omni-publisher-skill | 是 | /Users/webkubor/.agents/skills/omni-publisher-skill | `gemini skills install https://github.com/webkubor/omni-publisher-skill` |
| ai-modification-skill | https://github.com/webkubor/ai-modification-skill | 是 | /Users/webkubor/.agents/skills/ai-modification-skill | `gemini skills install https://github.com/webkubor/ai-modification-skill` |
| audio-music-engineer-skill | https://github.com/webkubor/audio-music-engineer-skill | 是 | /Users/webkubor/.agents/skills/audio-music-engineer-skill | `gemini skills install https://github.com/webkubor/audio-music-engineer-skill` |
| cinematic-storyboard-skill | https://github.com/webkubor/cinematic-storyboard-skill | 是 | /Users/webkubor/.agents/skills/cinematic-storyboard-skill | `gemini skills install https://github.com/webkubor/cinematic-storyboard-skill` |
| pwa-master-skill | https://github.com/webkubor/pwa-master-skill | 是 | /Users/webkubor/.agents/skills/pwa-master-skill<br>/Users/webkubor/.codex/skills/pwa-master | `gemini skills install https://github.com/webkubor/pwa-master-skill` |
| persona-generator-skill | https://github.com/webkubor/persona-generator-skill | 否 | - | `gemini skills install https://github.com/webkubor/persona-generator-skill` |
| web-ui-skill | https://github.com/webkubor/web-ui-skill | 否 | - | `gemini skills install https://github.com/webkubor/web-ui-skill` |
| vitepress-init-skill | https://github.com/webkubor/vitepress-init-skill | 是 | /Users/webkubor/.agents/skills/vitepress-init-skill<br>/Users/webkubor/.codex/skills/vitepress-init | `gemini skills install https://github.com/webkubor/vitepress-init-skill` |
| brain-sentinel-skill | https://github.com/webkubor/brain-sentinel-skill | 是 | /Users/webkubor/.agents/skills/brain-sentinel-skill | `gemini skills install https://github.com/webkubor/brain-sentinel-skill` |
| code-aureate-skill | https://github.com/webkubor/code-aureate-skill | 是 | /Users/webkubor/.agents/skills/code-aureate-skill | `gemini skills install https://github.com/webkubor/code-aureate-skill` |
| knowledge-navigator-skill | https://github.com/webkubor/knowledge-navigator-skill | 是 | /Users/webkubor/.agents/skills/knowledge-navigator-skill | `gemini skills install https://github.com/webkubor/knowledge-navigator-skill` |
| file-hosting-master-skill | https://github.com/webkubor/file-hosting-master-skill | 否 | - | `gemini skills install https://github.com/webkubor/file-hosting-master-skill` |
| scm-ops-skill | https://github.com/webkubor/scm-ops-skill | 是 | /Users/webkubor/.agents/skills/scm-ops-skill | `gemini skills install https://github.com/webkubor/scm-ops-skill` |
| xhs-manager-skill | https://github.com/webkubor/xhs-manager-skill | 是 | /Users/webkubor/.agents/skills/xhs-manager-skill | `gemini skills install https://github.com/webkubor/xhs-manager-skill` |

## 3. 本机已安装 Skills（自动扫描）

| 名称 | 来源 | 包含 SKILL.md | 路径 |
| :--- | :--- | :---: | :--- |
| ai-modification-skill | ~/.agents/skills | 是 | /Users/webkubor/.agents/skills/ai-modification-skill |
| audio-music-engineer-skill | ~/.agents/skills | 是 | /Users/webkubor/.agents/skills/audio-music-engineer-skill |
| brain-sentinel-skill | ~/.agents/skills | 是 | /Users/webkubor/.agents/skills/brain-sentinel-skill |
| cinematic-storyboard-skill | ~/.agents/skills | 是 | /Users/webkubor/.agents/skills/cinematic-storyboard-skill |
| code-aureate-skill | ~/.agents/skills | 是 | /Users/webkubor/.agents/skills/code-aureate-skill |
| feishu-writer | ~/.agents/skills, ~/.codex/skills | 是 | /Users/webkubor/.agents/skills/feishu-writer<br>/Users/webkubor/.codex/skills/feishu-writer |
| figma | ~/.codex/skills | 是 | /Users/webkubor/.codex/skills/figma |
| figma-implement-design | ~/.codex/skills | 是 | /Users/webkubor/.codex/skills/figma-implement-design |
| find-skills | ~/.agents/skills | 是 | /Users/webkubor/.agents/skills/find-skills |
| frontend-design | ~/.agents/skills, ~/.codex/skills | 是 | /Users/webkubor/.agents/skills/frontend-design<br>/Users/webkubor/.codex/skills/frontend-design |
| github-uploader | ~/.agents/skills | 是 | /Users/webkubor/.agents/skills/github-uploader |
| juejin-writer | ~/.agents/skills, ~/.codex/skills | 是 | /Users/webkubor/.agents/skills/juejin-writer<br>/Users/webkubor/.codex/skills/juejin-writer |
| knowledge-navigator-skill | ~/.agents/skills | 是 | /Users/webkubor/.agents/skills/knowledge-navigator-skill |
| logo-designer | ~/.agents/skills | 是 | /Users/webkubor/.agents/skills/logo-designer |
| obsidian | ~/.agents/skills | 是 | /Users/webkubor/.agents/skills/obsidian |
| omni-publisher-skill | ~/.agents/skills | 是 | /Users/webkubor/.agents/skills/omni-publisher-skill |
| pwa-master-skill | ~/.agents/skills, ~/.codex/skills | 是 | /Users/webkubor/.agents/skills/pwa-master-skill<br>/Users/webkubor/.codex/skills/pwa-master |
| r2-uploader | ~/.agents/skills | 是 | /Users/webkubor/.agents/skills/r2-uploader |
| remotion-best-practices | ~/.agents/skills, ~/.codex/skills | 是 | /Users/webkubor/.agents/skills/remotion-best-practices<br>/Users/webkubor/.codex/skills/remotion-best-practices |
| scm-ops-skill | ~/.agents/skills | 是 | /Users/webkubor/.agents/skills/scm-ops-skill |
| snippet-master | ~/.agents/skills | 是 | /Users/webkubor/.agents/skills/snippet-master |
| start | ~/.codex/skills | 是 | /Users/webkubor/.codex/skills/start |
| think-skill | ~/.agents/skills, ~/.codex/skills | 是 | /Users/webkubor/.agents/skills/think-skill<br>/Users/webkubor/.codex/skills/think |
| ui-ux-pro-max | ~/.codex/skills | 是 | /Users/webkubor/.codex/skills/ui-ux-pro-max |
| visual-studio-skill | ~/.agents/skills | 是 | /Users/webkubor/.agents/skills/visual-studio-skill |
| vitepress-init-skill | ~/.agents/skills, ~/.codex/skills | 是 | /Users/webkubor/.agents/skills/vitepress-init-skill<br>/Users/webkubor/.codex/skills/vitepress-init |
| xhs-manager-skill | ~/.agents/skills | 是 | /Users/webkubor/.agents/skills/xhs-manager-skill |

## 4. 怎么使用（落地步骤）

### 4.1 先安装（Gemini 侧）

```bash
gemini skills install https://github.com/webkubor/omni-publisher-skill
ls -la "$HOME/.agents/skills"
```

### 4.2 本地源码接入 Codex（开发常用）

```bash
mkdir -p "$HOME/.codex/skills"
ln -sfn "$HOME/Desktop/skills/your-skill" "$HOME/.codex/skills/your-skill"
test -f "$HOME/.codex/skills/your-skill/SKILL.md" && echo "OK: SKILL.md 已就绪"
```

### 4.3 在对话里触发

- 直接写 skill 名称（例如：`xhs-manager-skill`）
- 或显式前缀（例如：`$xhs-manager-skill`）

### 4.4 验收（不是“装了就算完”）

```bash
node scripts/tools/sync-skills-management.mjs
ls -la "$HOME/.codex/skills" | rg "xhs-manager|omni-publisher|scm-ops"
```

- 管理台出现该 skill（见第 3 节）  
- 路径下存在 `SKILL.md`  
- 实际对话触发后，Agent 回应中体现该 skill 语义

## 5. 维护约定

- 原生拆分 skills 以 `docs/skills/github_repos.md` 为 SSOT。
- 用户本机安装态以本页扫描结果为准。
- 新增私有 skill：放到 `~/Desktop/skills`，并同步更新 `~/Documents/memory/skills/index.md`。
