#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const PROJECT_ROOT = process.cwd()
const SKILLS_ROOT = path.join(PROJECT_ROOT, 'skills')
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'docs/skills/index.md')

function run (cmd, cwd = PROJECT_ROOT) {
  return execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf-8').trim()
}

function walkSkillFiles (dir) {
  if (!fs.existsSync(dir)) return []
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
  if (/ecommerce|wechat|github|r2|uploader/.test(name)) return 'integration'
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
  const relativeDir = path.relative(PROJECT_ROOT, skillDir)
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
    'description: CortexOS 主脑技能库统一索引。所有项目 skills 真源统一在 skills/。',
    '---',
    '# Skills 总览',
    '',
    '> 所有项目 skills 真源统一在 `skills/`。',
    '',
    '## 当前主脑技能库',
    '',
    '- Skills 目录：`/Users/webkubor/Documents/CortexOS/skills/`',
    `- 最近提交：\`${repoHead}\``,
    `- 同步命令：\`pnpm skills:sync\``,
    '',
    '## 架构原则',
    '',
    '1. **项目内 skills 单目录收敛**：所有 skills 统一放在 `CortexOS/skills/`。',
    '2. **skills 的 SSOT 在项目内**：原文档、脚本、references 直接收进 `CortexOS/skills/`，不要再用软链接或隐藏目录冒充真源。',
    '3. **修改 skill**：直接改 `CortexOS/skills/`。',
    '4. **私人凭证隔离**：含 Token/Key 的 skill 内部通过环境变量或 `~/Documents/memory/secrets/` 读取，不硬编码。',
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
    '1. 新增 skill 时，直接放入 `CortexOS/skills/`，把原文档、脚本、references 一起收进来。',
    '2. `CortexOS/.agents/` 下不再放 skills。',
    '3. 涉及私人凭证的 skill，优先从环境变量读取，避免硬编码密钥进入 Git 历史。',
    ''
  )

  return `${lines.join('\n')}\n`
}

function main () {
  const skillFiles = walkSkillFiles(SKILLS_ROOT)
  const skills = skillFiles
    .map(parseSkillMeta)
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, buildMarkdown(skills), 'utf-8')
  console.log(JSON.stringify({ ok: true, output: OUTPUT_PATH, count: skills.length }, null, 2))
}

main()
