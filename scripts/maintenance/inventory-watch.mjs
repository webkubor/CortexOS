#!/usr/bin/env node

import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '../..')
const ASSISTANT_MEMORY_HOME = process.env.CORTEXOS_ASSISTANT_MEMORY_HOME || path.join(PROJECT_ROOT, '.memory')
const CACHE_DIR = path.join(ASSISTANT_MEMORY_HOME, 'cache')
const STATE_PATH = path.join(CACHE_DIR, 'inventory-watch-state.json')
const GEMINI_SETTINGS = path.join(os.homedir(), '.gemini', 'settings.json')
const LOCAL_BRAIN_API_URL = `http://127.0.0.1:${Number(process.env.BRAIN_API_PORT || 3679)}`
const DEFAULT_CLOUD_BRAIN_API_URL = 'https://brain-api-675793533606.asia-southeast2.run.app'
const BRAIN_API_CANDIDATES = Array.from(new Set([
  String(process.env.BRAIN_API_URL || '').trim(),
  LOCAL_BRAIN_API_URL,
  DEFAULT_CLOUD_BRAIN_API_URL
].filter(Boolean)))
const BRAIN_API_TOKEN = String(process.env.BRAIN_API_TOKEN || '').trim()
const SKILL_SCAN_DIRS = [
  path.join(PROJECT_ROOT, 'skills'),
  path.join(os.homedir(), '.agents/skills'),
  path.join(os.homedir(), '.agent/skills'),
  path.join(os.homedir(), '.codex/skills')
]

function ensureCacheDir () {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
}

function readJson (filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return fallback
  }
}

function writeJson (filePath, data) {
  ensureCacheDir()
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
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
    if (!entryExists || !hasSkillFile) continue

    output.push({
      name: entry.name,
      canonical: canonicalSkillName(entry.name),
      source: sourceLabel,
      path: fullPath,
      resolvedPath
    })
  }
  return output
}

function mergeInstalledSkills (raw) {
  const map = new Map()
  for (const item of raw) {
    const key = item.canonical || String(item.name || '').toLowerCase()
    const prev = map.get(key) || {
      name: item.name,
      canonical: key,
      sources: new Set(),
      paths: new Set(),
      resolvedPaths: new Set()
    }
    prev.name = item.name
    prev.sources.add(item.source)
    prev.paths.add(item.path)
    prev.resolvedPaths.add(item.resolvedPath)
    map.set(key, prev)
  }

  return [...map.values()]
    .map(item => ({
      name: item.name,
      canonical: item.canonical,
      sources: [...item.sources].sort(),
      paths: [...item.paths].sort(),
      resolvedPaths: [...item.resolvedPaths].sort()
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
}

function listInstalledSkills () {
  const raw = SKILL_SCAN_DIRS.flatMap(dirPath => listSkillEntriesInDir(dirPath, dirPath))
  return mergeInstalledSkills(raw)
}

function loadMcpServersFromJson (filePath) {
  const data = readJson(filePath, {})
  const servers = data?.mcpServers && typeof data.mcpServers === 'object' ? data.mcpServers : {}
  return Object.entries(servers)
    .map(([name, config]) => ({
      name,
      command: String(config?.command || ''),
      args: Array.isArray(config?.args) ? config.args.map(arg => String(arg)) : [],
      description: String(config?.description || '')
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
}

function listMcpTools () {
  const serverPy = path.join(PROJECT_ROOT, 'mcp_server/server.py')
  if (!fs.existsSync(serverPy)) return []
  const lines = fs.readFileSync(serverPy, 'utf8').split('\n')
  const tools = []
  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].includes('@mcp.tool()')) continue
    for (const nextLine of lines.slice(index + 1, index + 7)) {
      const stripped = nextLine.trim()
      if (!stripped.startsWith('def ')) continue
      const match = stripped.match(/^def\s+([^(]+)\(/)
      if (match?.[1]) tools.push(match[1].trim())
      break
    }
  }
  return tools.sort((a, b) => a.localeCompare(b, 'zh-CN'))
}

function buildSnapshot () {
  return {
    generatedAt: new Date().toISOString(),
    skills: listInstalledSkills(),
    mcp: {
      geminiSettings: loadMcpServersFromJson(GEMINI_SETTINGS),
      repoConfig: loadMcpServersFromJson(path.join(PROJECT_ROOT, 'mcp_server/mcp_config.json')),
      toolNames: listMcpTools()
    }
  }
}

function toMap (items, keyField) {
  return new Map(items.map(item => [item[keyField], item]))
}

function summarizeChanges (previous, current, keyField, formatter = item => item.name) {
  const prevMap = toMap(previous, keyField)
  const currMap = toMap(current, keyField)

  const added = current.filter(item => !prevMap.has(item[keyField])).map(formatter)
  const removed = previous.filter(item => !currMap.has(item[keyField])).map(formatter)
  const changed = current
    .filter(item => prevMap.has(item[keyField]))
    .filter(item => JSON.stringify(prevMap.get(item[keyField])) !== JSON.stringify(item))
    .map(formatter)

  return { added, removed, changed }
}

function summarizeToolChanges (previous, current) {
  const prev = new Set(previous)
  const curr = new Set(current)
  return {
    added: current.filter(name => !prev.has(name)),
    removed: previous.filter(name => !curr.has(name))
  }
}

function buildChangeReport (previous, current) {
  const skillChanges = summarizeChanges(previous.skills || [], current.skills || [], 'canonical')
  const geminiMcpChanges = summarizeChanges(previous.mcp?.geminiSettings || [], current.mcp?.geminiSettings || [], 'name')
  const repoMcpChanges = summarizeChanges(previous.mcp?.repoConfig || [], current.mcp?.repoConfig || [], 'name')
  const toolChanges = summarizeToolChanges(previous.mcp?.toolNames || [], current.mcp?.toolNames || [])

  const hasChanges = [
    skillChanges.added,
    skillChanges.removed,
    skillChanges.changed,
    geminiMcpChanges.added,
    geminiMcpChanges.removed,
    geminiMcpChanges.changed,
    repoMcpChanges.added,
    repoMcpChanges.removed,
    repoMcpChanges.changed,
    toolChanges.added,
    toolChanges.removed
  ].some(items => items.length > 0)

  return {
    hasChanges,
    skillChanges,
    geminiMcpChanges,
    repoMcpChanges,
    toolChanges
  }
}

function formatList (items, prefix) {
  if (items.length === 0) return []
  return items.slice(0, 8).map(item => `- ${prefix}${item}`)
}

function buildNotificationPayload (report, snapshot) {
  const lines = [
    `检测时间：${new Date().toLocaleString('zh-CN', { hour12: false })}`
  ]

  if (report.skillChanges.added.length || report.skillChanges.removed.length || report.skillChanges.changed.length) {
    lines.push('', '[Skills]')
    lines.push(...formatList(report.skillChanges.added, '新增: '))
    lines.push(...formatList(report.skillChanges.removed, '移除: '))
    lines.push(...formatList(report.skillChanges.changed, '变化: '))
  }

  if (report.geminiMcpChanges.added.length || report.geminiMcpChanges.removed.length || report.geminiMcpChanges.changed.length) {
    lines.push('', '[Gemini MCP]')
    lines.push(...formatList(report.geminiMcpChanges.added, '新增: '))
    lines.push(...formatList(report.geminiMcpChanges.removed, '移除: '))
    lines.push(...formatList(report.geminiMcpChanges.changed, '变化: '))
  }

  if (report.repoMcpChanges.added.length || report.repoMcpChanges.removed.length || report.repoMcpChanges.changed.length) {
    lines.push('', '[Repo MCP]')
    lines.push(...formatList(report.repoMcpChanges.added, '新增: '))
    lines.push(...formatList(report.repoMcpChanges.removed, '移除: '))
    lines.push(...formatList(report.repoMcpChanges.changed, '变化: '))
  }

  if (report.toolChanges.added.length || report.toolChanges.removed.length) {
    lines.push('', '[MCP Tools]')
    lines.push(...formatList(report.toolChanges.added, '新增: '))
    lines.push(...formatList(report.toolChanges.removed, '移除: '))
  }

  return {
    project: 'cortexos',
    source: 'brain-inventory-watch',
    agent: 'cortexos',
    title: '主脑感知到 Skills / MCP 安装变化',
    content: lines.join('\n'),
    tags: ['inventory', 'skills', 'mcp'],
    metadata: {
      skillsCount: snapshot.skills.length,
      geminiMcpCount: snapshot.mcp.geminiSettings.length,
      repoMcpCount: snapshot.mcp.repoConfig.length,
      mcpToolCount: snapshot.mcp.toolNames.length
    }
  }
}

async function postNotification (payload) {
  const headers = { 'content-type': 'application/json' }
  if (BRAIN_API_TOKEN) headers.authorization = `Bearer ${BRAIN_API_TOKEN}`

  let lastError = null
  for (const baseUrl of BRAIN_API_CANDIDATES) {
    try {
      const response = await fetch(`${baseUrl}/notifications`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })
      const text = await response.text()
      const data = text ? JSON.parse(text) : {}
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${data.error || text || 'notification failed'}`)
      }
      return { baseUrl, data }
    } catch (error) {
      lastError = error
    }
  }
  throw lastError || new Error('unable to post inventory notification')
}

async function main () {
  const previous = readJson(STATE_PATH, null)
  const current = buildSnapshot()

  if (!previous) {
    writeJson(STATE_PATH, current)
    console.log(`initialized inventory snapshot (skills=${current.skills.length}, gemini_mcp=${current.mcp.geminiSettings.length}, repo_mcp=${current.mcp.repoConfig.length}, tools=${current.mcp.toolNames.length})`)
    return
  }

  const report = buildChangeReport(previous, current)
  if (!report.hasChanges) {
    console.log('inventory unchanged')
    return
  }

  const payload = buildNotificationPayload(report, current)
  const posted = await postNotification(payload)
  writeJson(STATE_PATH, current)

  console.log(
    `inventory changed -> notified via ${posted.baseUrl} `
      + `(skills +${report.skillChanges.added.length}/-${report.skillChanges.removed.length}/~${report.skillChanges.changed.length}; `
      + `gemini_mcp +${report.geminiMcpChanges.added.length}/-${report.geminiMcpChanges.removed.length}/~${report.geminiMcpChanges.changed.length}; `
      + `repo_mcp +${report.repoMcpChanges.added.length}/-${report.repoMcpChanges.removed.length}/~${report.repoMcpChanges.changed.length}; `
      + `tools +${report.toolChanges.added.length}/-${report.toolChanges.removed.length})`
  )
}

await main()
