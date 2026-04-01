#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const PROJECT_ROOT = process.cwd()
const THIRD_PARTY_SKILLS_ROOT = path.join(PROJECT_ROOT, '.agents', 'skills')
const PERSONAL_SKILLS_ROOT = path.join(PROJECT_ROOT, 'skills')
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
    'description: CortexOS 主脑技能库统一索引。个人开发 skills 真源在 skills/，第三方 skills 保留在 .agents/skills/。',
    '---',
    '# Skills 总览',
    '',
    '> 个人开发 skills 真源在 `skills/`。',
    '> 第三方 skills 保留在 `.agents/skills/`。',
    '',
    '## 当前主脑技能库',
    '',
    '- 第三方目录：`/Users/webkubor/Documents/CortexOS/.agents/skills/`',
    '- 个人目录：`/Users/webkubor/Documents/CortexOS/skills/`',
    `- 最近提交：\`${repoHead}\``,
    `- 同步命令：\`pnpm skills:sync\``,
    '',
    '## 架构原则',
    '',
    '1. **个人与第三方分层**：个人开发 skills 放 `CortexOS/skills/`，第三方 skills 留在 `CortexOS/.agents/skills/`。',
    '2. **个人 skill 的 SSOT 在项目内**：原文档、脚本、references 直接收进 `CortexOS/skills/`，不要再用软链接冒充真源。',
    '3. **修改个人 skill**：直接改 `CortexOS/skills/`；不要把第三方 skills 混搬到这里。',
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
    '1. 新增个人 skill 时，直接放入 `CortexOS/skills/`，把原文档、脚本、references 一起收进来。',
    '2. 第三方 skills 继续留在 `.agents/skills/`，不要混搬到 `skills/`。',
    '3. 涉及私人凭证的 skill，优先从环境变量读取，避免硬编码密钥进入 Git 历史。',
    ''
  )

  return `${lines.join('\n')}\n`
}

function main () {
  const personalSkillFiles = walkSkillFiles(PERSONAL_SKILLS_ROOT)
  const thirdPartySkillFiles = walkSkillFiles(THIRD_PARTY_SKILLS_ROOT)
  const skills = [...personalSkillFiles, ...thirdPartySkillFiles]
    .map(parseSkillMeta)
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, buildMarkdown(skills), 'utf-8')
  console.log(JSON.stringify({ ok: true, output: OUTPUT_PATH, count: skills.length }, null, 2))
}

main()
