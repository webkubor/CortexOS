#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const PROJECT_ROOT = process.cwd()
const SKILLS_ROOT = path.join(PROJECT_ROOT, '.agents', 'skills')
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'docs/skills/index.md')

function run (cmd, cwd = PROJECT_ROOT) {
  return execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf-8').trim()
}

function walkSkillFiles (dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const results = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkSkillFiles(full))
      continue
    }
    if (entry.isFile() && entry.name === 'SKILL.md') results.push(full)
  }
  return results
}

function inferCategory (name) {
  if (name.startsWith('openspec-')) return 'workflow'
  if (/logo|design|ui|ux|cinematic|storyboard/.test(name)) return 'creative'
  if (/audio|music/.test(name)) return 'media'
  if (/ecommerce|wechat|xhs|github|r2|uploader/.test(name)) return 'integration'
  if (/modification|vitepress|code|standards|pwa|chrome|debug/.test(name)) return 'engineering'
  if (/think|advisor/.test(name)) return 'cognition'
  if (/agent|reach|obsidian/.test(name)) return 'integration'
  return 'core'
}

function parseSkillMeta (filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const lines = raw.split('\n')
  let inFrontmatter = false
  const meta = {}

  for (const line of lines) {
    if (line.trim() === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true
        continue
      }
      break
    }
    if (!inFrontmatter) continue
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (match) meta[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }

  const skillDir = path.dirname(filePath)
  const name = meta.name || path.basename(skillDir)
  const category = inferCategory(name)
  const relativeDir = path.relative(SKILLS_ROOT, skillDir)
  const lastCommit = run(`git log -1 --format=%cs -- ${JSON.stringify(relativeDir)}`, PROJECT_ROOT) || '-'

  return {
    name,
    description: meta.description || '未填写描述',
    category,
    relativeDir,
    lastCommit
  }
}

function buildMarkdown (skills) {
  const repoHead = run("git log -1 --format='%h %cs %s'", PROJECT_ROOT)
  const categories = [...new Set(skills.map(skill => skill.category))]

  const lines = [
    '---',
    'description: CortexOS 主脑技能库索引。通用 skills 的真源在 CortexOS 仓库内，私人 skills 保留在 personal-skills 独立仓库。',
    '---',
    '# Skills 总览',
    '',
    '> 通用 skills 的 **代码真源在 CortexOS 仓库内**（`.agents/skills/`）。',
    '> 私人 skills（含凭证、Cookie、个人账号配置）的真源在独立的 `personal-skills` 仓库。',
    '> `~/.agents/skills/` 只是挂载点，全部为 symlink，不存放实体文件。',
    '',
    '## 当前主脑技能库',
    '',
    '- 本地路径：`/Users/webkubor/Documents/CortexOS/.agents/skills/`',
    `- 最近提交：\`${repoHead}\``,
    `- 同步命令：\`pnpm skills:sync\``,
    '',
    '## 架构原则',
    '',
    '1. **CortexOS 是主脑**：通用、可共享的 skills 统一收拢到 CortexOS 内部。',
    '2. **personal-skills 是私人配置层**：只保留含个人凭证、账号、私有配置的 skills（如 GitHub 图床、R2 上传、公众号发布）。',
    '3. **~/.agents/skills/ 是挂载点**：全部为 symlink，通用技能指向 CortexOS，私人技能指向 personal-skills。',
    '4. **修改通用 skill**：直接改 CortexOS 里的真源，所有 Agent 即时生效。',
    '5. **修改私人 skill**：改 personal-skills 里的真源，避免私人凭证进入主脑仓库。',
    '',
    '## 当前技能清单',
    '',
    '| 名称 | 分类 | 描述 | 最近提交 | 目录 |',
    '| --- | --- | --- | --- | --- |'
  ]

  for (const skill of skills) {
    lines.push(`| \`${skill.name}\` | \`${skill.category}\` | ${skill.description} | \`${skill.lastCommit}\` | \`${skill.relativeDir}\` |`)
  }

  lines.push('', '## 分类视图', '')
  for (const category of categories.sort()) {
    lines.push(`### ${category}`, '')
    for (const skill of skills.filter(item => item.category === category)) {
      lines.push(`- \`${skill.name}\`：${skill.description}`)
    }
    lines.push('')
  }

  lines.push(
    '## 使用原则',
    '',
    '1. 新增通用 skill 时，放入 `CortexOS/.agents/skills/`，然后执行 `pnpm skills:sync` 更新索引。',
    '2. 新增私人 skill 时，放入 `personal-skills/arsenal/`，并在 `~/.agents/skills/` 创建 symlink。',
    '3. 不要在 `~/.agents/skills/` 直接放实体目录，避免真源漂移。',
    ''
  )

  return `${lines.join('\n')}\n`
}

function main () {
  const skillFiles = walkSkillFiles(SKILLS_ROOT)
  const skills = skillFiles.map(parseSkillMeta).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, buildMarkdown(skills), 'utf-8')
  console.log(JSON.stringify({ ok: true, output: OUTPUT_PATH, count: skills.length }, null, 2))
}

main()
