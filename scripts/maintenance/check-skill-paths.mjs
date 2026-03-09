#!/usr/bin/env node

import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '../../')
const home = os.homedir()

const skipDirs = new Set([
  '.git',
  'node_modules',
  'dist',
  'build'
])

const skipPrefixes = [
  '.memory/',
  'docs/.vitepress/cache/',
  'docs/.vitepress/dist/',
  'docs/public/data/'
]

const textExts = new Set([
  '.md',
  '.mdx',
  '.txt',
  '.json',
  '.jsonl',
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.mts',
  '.cts',
  '.vue',
  '.yaml',
  '.yml',
  '.toml',
  '.py',
  '.sh'
])

const pathPatterns = [
  /\/Users\/webkubor\/\.(?:codex|agents)\/skills\/[^\s<)`'"]+/g,
  /~\/\.(?:codex|agents)\/skills\/[^\s<)`'"]+/g
]

const placeholderNames = new Set([
  'your-skill',
  '<skill>',
  'example-skill'
])

function isTextFile (filePath) {
  return textExts.has(path.extname(filePath).toLowerCase())
}

function shouldSkipPath (targetPath) {
  const relative = path.relative(projectRoot, targetPath)
  if (!relative || relative.startsWith('..')) return false
  const normalized = relative.split(path.sep).join('/')
  for (const dir of skipDirs) {
    if (normalized === dir || normalized.startsWith(`${dir}/`)) return true
  }
  for (const prefix of skipPrefixes) {
    if (normalized === prefix.slice(0, -1) || normalized.startsWith(prefix)) return true
  }
  return false
}

function sanitizeMatch (rawMatch) {
  return rawMatch.replace(/[。，“”、,.;:!?]+$/u, '')
}

function walk (dirPath, out = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      if (shouldSkipPath(fullPath)) continue
      walk(fullPath, out)
      continue
    }
    if (entry.isFile() && isTextFile(fullPath)) out.push(fullPath)
  }
  return out
}

function expandHome (rawPath) {
  if (rawPath.startsWith('~/')) return path.join(home, rawPath.slice(2))
  return rawPath
}

function pathExists (targetPath) {
  try {
    fs.accessSync(targetPath)
    return true
  } catch {
    return false
  }
}

function extractSkillName (rawPath) {
  const normalized = rawPath.replace(/^~\//, `${home}/`)
  const parts = normalized.split('/').filter(Boolean)
  const skillsIndex = parts.findIndex(part => part === 'skills')
  if (skillsIndex === -1) return null
  const next = parts[skillsIndex + 1]
  if (!next || placeholderNames.has(next)) return null
  if (next === '.system') return parts[skillsIndex + 2] || null
  return next
}

function findSkillCandidates (skillName) {
  const candidates = [
    path.join(home, '.codex/skills', skillName, 'SKILL.md'),
    path.join(home, '.agents/skills', skillName, 'SKILL.md'),
    path.join(home, '.codex/skills', '.system', skillName, 'SKILL.md')
  ]

  const results = []
  for (const candidate of candidates) {
    if (pathExists(candidate)) results.push(candidate)
  }

  return results
}

function collectMatches (content) {
  const matches = []
  for (const pattern of pathPatterns) {
    for (const match of content.matchAll(pattern)) {
      matches.push(sanitizeMatch(match[0]))
    }
  }
  return [...new Set(matches)]
}

function buildBrokenRefsReport () {
  const files = walk(projectRoot)
  const brokenRefs = []

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8')
    const matches = collectMatches(content)
    if (matches.length === 0) continue

    const lines = content.split('\n')
    for (const rawRef of matches) {
      const resolvedRef = expandHome(rawRef)
      if (pathExists(resolvedRef)) continue

      const lineNumber = lines.findIndex(line => line.includes(rawRef)) + 1
      const skillName = extractSkillName(rawRef)
      const suggestions = skillName ? findSkillCandidates(skillName) : []

      brokenRefs.push({
        filePath,
        lineNumber,
        rawRef,
        resolvedRef,
        skillName,
        suggestions
      })
    }
  }

  return brokenRefs
}

function main () {
  const brokenRefs = buildBrokenRefsReport()

  if (brokenRefs.length === 0) {
    console.log('✅ skill 路径巡检通过：未发现失效 skill 引用')
    return
  }

  console.error(`❌ 发现 ${brokenRefs.length} 个失效 skill 路径引用:\n`)

  for (const item of brokenRefs) {
    const relativePath = path.relative(projectRoot, item.filePath)
    console.error(`- ${relativePath}:${item.lineNumber || '?'} -> ${item.rawRef}`)
    if (item.skillName) {
      console.error(`  skill: ${item.skillName}`)
    }
    if (item.suggestions.length > 0) {
      console.error(`  可用候选: ${item.suggestions.join(' | ')}`)
    } else {
      console.error(`  可用候选: 未找到同名 SKILL.md`)
    }
  }

  process.exit(1)
}

main()
