#!/usr/bin/env node

import fs from 'fs'
import os from 'os'
import path from 'path'

const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex')
const outJsonFile = path.join(codexHome, '.memory', 'skills_inventory.json')

function nowLocal () {
  const d = new Date()
  return d.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
}

function canonicalSkillName (name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/^gemini-skill-/, '')
    .replace(/-skills?$/, '')
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

    const entryExists = fs.existsSync(fullPath)
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
      entryExists,
      hasSkillFile
    })
  }
  return output
}

function mergeInstalledSkills (raw) {
  const map = new Map()
  for (const item of raw) {
    const key = item.canonical || item.name.toLowerCase()
    const isUsable = item.entryExists && item.hasSkillFile
    if (!map.has(key)) {
      map.set(key, {
        name: item.name,
        canonical: key,
        sources: new Set(isUsable ? [item.source] : []),
        paths: new Set(isUsable ? [item.path] : []),
        resolvedPaths: new Set(isUsable ? [item.resolvedPath] : []),
        hasSkillFile: isUsable,
        brokenPaths: item.entryExists ? [] : [item.path]
      })
      continue
    }
    const prev = map.get(key)
    if (isUsable) {
      prev.sources.add(item.source)
      prev.paths.add(item.path)
      prev.resolvedPaths.add(item.resolvedPath)
      prev.hasSkillFile = prev.hasSkillFile || item.hasSkillFile
    }
    if (!item.entryExists) prev.brokenPaths.push(item.path)
  }

  return [...map.values()]
    .map(item => ({
      name: item.name,
      canonical: item.canonical,
      sources: [...item.sources].sort(),
      paths: [...item.paths].sort(),
      resolvedPaths: [...item.resolvedPaths].sort(),
      hasSkillFile: item.hasSkillFile,
      brokenPaths: [...new Set(item.brokenPaths)].sort()
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
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

  const installedRaw = scanDirs.flatMap(d => listSkillEntriesInDir(d.path, d.label))
  const installedSkills = mergeInstalledSkills(installedRaw)

  const payload = {
    generatedAt: new Date().toISOString(),
    generatedAtLocal: nowLocal(),
    installedSkills,
    scanDirs
  }

  fs.mkdirSync(path.dirname(outJsonFile), { recursive: true })
  fs.writeFileSync(outJsonFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  console.log('✅ Assistant Radar: Skills inventory updated.')
  console.log(`- Data saved to: ${outJsonFile}`)
  console.log(`- Detected skills: ${installedSkills.length}`)
}

main()
