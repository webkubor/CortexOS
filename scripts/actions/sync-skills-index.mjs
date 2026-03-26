#!/usr/bin/env node

import fs from 'fs'
import os from 'os'
import path from 'path'
import { execSync } from 'child_process'

const PROJECT_ROOT = process.cwd()
const SKILLS_ROOT = path.join(os.homedir(), 'Desktop', 'skills')
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

  const relative = path.relative(SKILLS_ROOT, filePath)
  const parts = relative.split(path.sep)
  const category = parts[0] || 'uncategorized'
  const skillDir = path.dirname(filePath)
  const lastCommit = run(`git log -1 --format=%cs -- ${JSON.stringify(skillDir)}`, SKILLS_ROOT) || '-'

  return {
    name: meta.name || path.basename(skillDir),
    description: meta.description || '未填写描述',
    category,
    relativeDir: path.dirname(relative),
    lastCommit
  }
}

function buildMarkdown (skills) {
  const repoRemote = run('git remote get-url origin', SKILLS_ROOT)
  const repoHead = run("git log -1 --format='%h %cs %s'", SKILLS_ROOT)
  const categories = [...new Set(skills.map(skill => skill.category))]

  const lines = [
    '---',
    'description: CortexOS 对外部桌面 skills 母库的正式索引。skills 保持独立存在，主脑只维护索引、治理与使用协议。',
    '---',
    '# Skills 总览',
    '',
    '> 这些 skills 的 **代码真源不在 CortexOS 仓库内**，而在独立母库：`~/Desktop/skills`。',
    '> CortexOS 只负责：识别、索引、治理、同步状态与使用入口。',
    '',
    '## 当前母库',
    '',
    '- 本地路径：`~/Desktop/skills`',
    `- 远端仓库：\`${repoRemote}\``,
    `- 最近提交：\`${repoHead}\``,
    `- 同步命令：\`pnpm skills:sync\``,
    '',
    '## 为什么要独立存在',
    '',
    '1. Skills 是横跨多个 agent 的能力资产，不应绑定在 CortexOS 单仓库里。',
    '2. CortexOS 是主脑；skills 是外挂能力母库。',
    '3. 让 skills 单独存在，才能一边维护、一边优化，不被主脑项目节奏绑死。',
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
  for (const category of categories) {
    lines.push(`### ${category}`, '')
    for (const skill of skills.filter(item => item.category === category)) {
      lines.push(`- \`${skill.name}\`：${skill.description}`)
    }
    lines.push('')
  }

  lines.push('## 使用原则', '', '1. 修改 skill 内容时，改母库 `Desktop/skills`，不要在 CortexOS 里复制一份。', '2. 修改后执行 `pnpm skills:sync`，让主脑重新生成技能索引。', '3. 主脑只保留文档入口、治理规则和最近同步状态，不保留冗余 skill 代码。', '')

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
