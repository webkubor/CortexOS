#!/usr/bin/env node

import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '../../')

const skillsReposFile = path.join(projectRoot, 'docs/skills/github_repos.md')
const outMarkdownFile = path.join(projectRoot, 'docs/skills/management.md')
const outJsonFile = path.join(projectRoot, 'docs/public/data/skills_inventory.json')
const localSkillsRoot = path.join(os.homedir(), 'Desktop/skills')

function nowLocal () {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

function canonicalSkillName (name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/^gemini-skill-/, '')
    .replace(/-skills?$/, '')
}

function parseNativeSkillsFromRepos (markdownPath) {
  if (!fs.existsSync(markdownPath)) return []
  const text = fs.readFileSync(markdownPath, 'utf8')
  const lines = text.split('\n')
  const results = []
  for (const line of lines) {
    if (!line.trim().startsWith('|')) continue
    const cols = line.split('|').slice(1, -1).map(s => s.trim())
    if (cols.length < 3) continue
    const [name, repo, usage] = cols
    if (!name || !repo || name === 'Skill' || name.startsWith(':---')) continue
    if (!repo.includes('github.com/webkubor/')) continue
    results.push({
      name,
      canonical: canonicalSkillName(name),
      repo,
      usage
    })
  }
  return results
}

function listSkillEntriesInDir (dirPath, sourceLabel) {
  if (!fs.existsSync(dirPath)) return []
  let entries = []
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true })
  } catch {
    return []
  }

  const output = []
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const fullPath = path.join(dirPath, entry.name)
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue

    let resolvedPath = fullPath
    try {
      resolvedPath = fs.realpathSync(fullPath)
    } catch {}

    const hasSkillFile = fs.existsSync(path.join(resolvedPath, 'SKILL.md')) || fs.existsSync(path.join(resolvedPath, 'skill.md'))

    output.push({
      name: entry.name,
      canonical: canonicalSkillName(entry.name),
      source: sourceLabel,
      path: fullPath,
      resolvedPath,
      hasSkillFile
    })
  }
  return output
}

function mergeInstalledSkills (raw) {
  const map = new Map()
  for (const item of raw) {
    const key = item.canonical || item.name.toLowerCase()
    if (!map.has(key)) {
      map.set(key, {
        name: item.name,
        canonical: key,
        sources: new Set([item.source]),
        paths: new Set([item.path]),
        resolvedPaths: new Set([item.resolvedPath]),
        hasSkillFile: item.hasSkillFile
      })
      continue
    }
    const prev = map.get(key)
    prev.sources.add(item.source)
    prev.paths.add(item.path)
    prev.resolvedPaths.add(item.resolvedPath)
    prev.hasSkillFile = prev.hasSkillFile || item.hasSkillFile
  }

  return [...map.values()]
    .map(item => ({
      name: item.name,
      canonical: item.canonical,
      sources: [...item.sources].sort(),
      paths: [...item.paths].sort(),
      resolvedPaths: [...item.resolvedPaths].sort(),
      hasSkillFile: item.hasSkillFile
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

function buildMarkdown ({ generatedAt, nativeSkills, installedSkills, scanDirs }) {
  const installedMap = new Map(installedSkills.map(s => [s.canonical, s]))
  const installedSet = new Set(installedSkills.map(s => s.canonical))
  const sampleRepo = nativeSkills[0]?.repo || 'https://github.com/webkubor/omni-publisher-skill'

  const nativeRows = nativeSkills.map(item => {
    const installed = installedSet.has(item.canonical) ? '是' : '否'
    const installedAt = installedMap.get(item.canonical)?.paths?.join('<br>') || '-'
    const installCmd = `gemini skills install ${item.repo}`
    return `| ${item.name} | ${item.repo} | ${installed} | ${installedAt} | \`${installCmd}\` |`
  }).join('\n')

  const installedRows = installedSkills.map(item => {
    const sourceText = item.sources.join(', ')
    const pathText = item.paths.join('<br>')
    return `| ${item.name} | ${sourceText} | ${item.hasSkillFile ? '是' : '否'} | ${pathText} |`
  }).join('\n')

  const installLocationRows = scanDirs.map(d => {
    return `| ${d.label} | \`${d.path}\` | ${d.exists ? '是' : '否'} | \`ls -la ${d.path}\` |`
  }).join('\n')

  return `---
description: Skills 管理页（安装位置 + 使用方式 + 扫描结果）
---
# Skills 管理台

> 本页由脚本自动生成：\`node scripts/tools/sync-skills-management.mjs\`  
> 最近生成时间：${generatedAt}

## 0. 先做这 3 步（实操）

1. 安装拆分出去的原生 skill（从下方表格复制 \`gemini skills install ...\`）  
2. 运行 \`node scripts/tools/sync-skills-management.mjs\` 刷新本页  
3. 看“本机已安装 Skills”确认路径是否出现  
4. 在对话里直接点名 skill（\`$skill-name\`）实际触发一次

## 1. 安装在哪里

### 1.1 运行时安装目录

| 运行时 | 目录 | 当前存在 | 检查命令 |
| :--- | :--- | :---: | :--- |
${installLocationRows}

### 1.2 本机私有 skills 源码目录

- 源码目录：\`${localSkillsRoot}\`
- 推荐做法：源码放这里，再链接到对应运行时目录。

示例（把本地 skill 接入 Codex）：

\`\`\`bash
ln -s "${localSkillsRoot}/your-skill" "$HOME/.codex/skills/your-skill"
\`\`\`

## 2. 初始化建议安装（CortexOS 原生 skills）

| Skill | 仓库 | 已安装 | 已安装路径 | 安装命令 |
| :--- | :--- | :---: | :--- | :--- |
${nativeRows || '| (空) | - | - | - | - |'}

## 3. 本机已安装 Skills（自动扫描）

| 名称 | 来源 | 包含 SKILL.md | 路径 |
| :--- | :--- | :---: | :--- |
${installedRows || '| (未发现) | - | - | - |'}

## 4. 怎么使用（落地步骤）

### 4.1 先安装（Gemini 侧）

\`\`\`bash
gemini skills install ${sampleRepo}
ls -la "$HOME/.agents/skills"
\`\`\`

### 4.2 本地源码接入 Codex（开发常用）

\`\`\`bash
mkdir -p "$HOME/.codex/skills"
ln -sfn "${localSkillsRoot}/your-skill" "$HOME/.codex/skills/your-skill"
test -f "$HOME/.codex/skills/your-skill/SKILL.md" && echo "OK: SKILL.md 已就绪"
\`\`\`

### 4.3 在对话里触发

- 直接写 skill 名称（例如：\`xhs-manager-skill\`）
- 或显式前缀（例如：\`$xhs-manager-skill\`）

### 4.4 验收（不是“装了就算完”）

\`\`\`bash
node scripts/tools/sync-skills-management.mjs
ls -la "$HOME/.codex/skills" | rg "xhs-manager|omni-publisher|scm-ops"
\`\`\`

- 管理台出现该 skill（见第 3 节）  
- 路径下存在 \`SKILL.md\`  
- 实际对话触发后，Agent 回应中体现该 skill 语义

## 5. 维护约定

- 原生拆分 skills 以 \`docs/skills/github_repos.md\` 为 SSOT。
- 用户本机安装态以本页扫描结果为准。
- 新增私有 skill：放到 \`${localSkillsRoot}\`，并同步更新 \`~/Documents/memory/skills/index.md\`。
`
}

function main () {
  const home = os.homedir()
  const scanDirs = [
    { label: '~/.agents/skills', path: path.join(home, '.agents/skills') },
    { label: '~/.agent/skills', path: path.join(home, '.agent/skills') },
    { label: '~/.codex/skills', path: path.join(home, '.codex/skills') }
  ].map(item => ({
    ...item,
    exists: fs.existsSync(item.path)
  }))

  const nativeSkills = parseNativeSkillsFromRepos(skillsReposFile)
  const installedRaw = scanDirs.flatMap(d => listSkillEntriesInDir(d.path, d.label))
  const installedSkills = mergeInstalledSkills(installedRaw)

  const payload = {
    generatedAt: new Date().toISOString(),
    generatedAtLocal: nowLocal(),
    nativeSkills,
    installedSkills,
    scanDirs,
    localSkillsRoot
  }

  fs.mkdirSync(path.dirname(outJsonFile), { recursive: true })
  fs.writeFileSync(outJsonFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  const markdown = buildMarkdown({
    generatedAt: payload.generatedAtLocal,
    nativeSkills,
    installedSkills,
    scanDirs
  })
  fs.writeFileSync(outMarkdownFile, markdown, 'utf8')

  console.log('✅ skills 管理台已更新:')
  console.log(`- ${outMarkdownFile}`)
  console.log(`- ${outJsonFile}`)
  console.log(`- native: ${nativeSkills.length}, installed: ${installedSkills.length}`)
}

main()
