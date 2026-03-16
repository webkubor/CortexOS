#!/usr/bin/env node

/**
 * 私人助理：助理雷达 (Assistant Radar)
 * 作用：扫描并感知用户本地环境中的私有工具 (Skills)
 * 归属：私人助理逻辑核心 (Assistant Logic Core)
 */

import fs from 'fs'
import os from 'os'
import path from 'path'

const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex')
const outJsonFile = path.join(codexHome, '.memory', 'skills_inventory.json')

/**
 * 标准化技能名称
 */
function canonicalSkillName (name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/^gemini-skill-/, '')
    .replace(/-skills?$/, '')
}

/**
 * 扫描特定目录下的技能项
 */
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

/**
 * 合并并清洗扫描结果
 */
function mergeInstalledSkills (raw) {
  const map = new Map()
  for (const item of raw) {
    const key = item.canonical
    if (!map.has(key)) {
      map.set(key, {
        name: item.name,
        canonical: key,
        sources: new Set([item.source]),
        paths: new Set([item.path]),
        hasSkillFile: item.hasSkillFile
      })
      continue
    }
    const prev = map.get(key)
    prev.sources.add(item.source)
    prev.paths.add(item.path)
    prev.hasSkillFile = prev.hasSkillFile || item.hasSkillFile
  }

  return [...map.values()]
    .map(item => ({
      name: item.name,
      canonical: item.canonical,
      sources: [...item.sources],
      paths: [...item.paths],
      hasSkillFile: item.hasSkillFile
    }))
}

async function runRadar () {
  const home = os.homedir()
  const scanDirs = [
    { label: 'Agents Skills', path: path.join(home, '.agents/skills') },
    { label: 'Codex Skills', path: path.join(home, '.codex/skills') }
  ]

  const raw = scanDirs.flatMap(d => listSkillEntriesInDir(d.path, d.label))
  const inventory = mergeInstalledSkills(raw)

  const payload = {
    updatedAt: new Date().toISOString(),
    inventory
  }

  fs.mkdirSync(path.dirname(outJsonFile), { recursive: true })
  fs.writeFileSync(outJsonFile, JSON.stringify(payload, null, 2), 'utf8')
  
  console.log(`[Assistant Radar] Detected ${inventory.length} skills. Inventory updated.`)
  return inventory
}

// 支持直接运行
if (import.meta.url === `file://${process.argv[1]}`) {
  runRadar().catch(console.error)
}

export { runRadar }
