#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '../../')
const ASSISTANT_MEMORY_HOME = process.env.CORTEXOS_ASSISTANT_MEMORY_HOME || path.join(PROJECT_ROOT, '.memory')
const LOGS_DIR = path.join(ASSISTANT_MEMORY_HOME, 'logs')
const META_DIR = path.join(ASSISTANT_MEMORY_HOME, 'meta')
const RETRO_DIR = path.join(ASSISTANT_MEMORY_HOME, 'retros')
const SEEN_FILE = path.join(META_DIR, 'error-retro-seen.json')
const RETRY_FILE = path.join(ASSISTANT_MEMORY_HOME, 'persona', 'retry_patterns.md')

const ERROR_REGEX = /❌|失败|error|exception|traceback|超时|spawn_error|early_exit|connection closed/i

const PATTERNS = [
  {
    key: 'mcp_connection',
    test: /connection closed|spawn_error|early_exit|mcp/i,
    action: '检查 MCP 配置、依赖命令路径并重启客户端会话'
  },
  {
    key: 'timeout',
    test: /超时|timeout/i,
    action: '缩小任务粒度，先做最小命令验证，再逐步放大'
  },
  {
    key: 'permission_or_path',
    test: /permission|denied|enoent|not found|不存在|路径/i,
    action: '先校验路径与权限，再执行写操作'
  },
  {
    key: 'command_failure',
    test: /exit [1-9]|失败|error/i,
    action: '记录失败命令与关键报错，补充前置检查后重跑'
  }
]

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function loadSeen() {
  if (!fs.existsSync(SEEN_FILE)) return []
  try {
    const payload = JSON.parse(fs.readFileSync(SEEN_FILE, 'utf-8'))
    return Array.isArray(payload.items) ? payload.items : []
  } catch {
    return []
  }
}

function saveSeen(items) {
  ensureDir(META_DIR)
  const latest = items.slice(-5000)
  fs.writeFileSync(SEEN_FILE, `${JSON.stringify({ items: latest }, null, 2)}\n`, 'utf-8')
}

function classify(line) {
  for (const pattern of PATTERNS) {
    if (pattern.test.test(line)) return pattern
  }
  return {
    key: 'generic_error',
    action: '记录症状并补充上下文，再执行最小化复现'
  }
}

function listLogFiles() {
  if (!fs.existsSync(LOGS_DIR)) return []
  return fs.readdirSync(LOGS_DIR)
    .filter(name => name.endsWith('.md'))
    .map(name => path.join(LOGS_DIR, name))
    .sort()
}

function collectNewErrorEvents(seenSet) {
  const events = []
  const files = listLogFiles()
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    const lines = content.split('\n')
    lines.forEach((line, idx) => {
      if (!ERROR_REGEX.test(line)) return
      const snippet = line.trim().slice(0, 180)
      if (!snippet) return
      const kind = classify(snippet)
      const signature = `${path.basename(file)}:${idx + 1}:${kind.key}:${snippet}`
      if (seenSet.has(signature)) return
      seenSet.add(signature)
      events.push({
        file: path.basename(file),
        line: idx + 1,
        snippet,
        kind: kind.key,
        action: kind.action
      })
    })
  }
  return events
}

function appendRetro(events) {
  if (events.length === 0) return null
  ensureDir(RETRO_DIR)
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const retroFile = path.join(RETRO_DIR, `${month}-error-retro.md`)

  if (!fs.existsSync(retroFile)) {
    fs.writeFileSync(retroFile, `# ${month} 错误自动复盘\n\n`, 'utf-8')
  }

  const timestamp = now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
  let block = `## ${timestamp}\n`
  events.forEach(event => {
    block += `- 来源: \`${event.file}:${event.line}\`\n`
    block += `- 症状: ${event.snippet}\n`
    block += `- 分类: \`${event.kind}\`\n`
    block += `- 改正动作: ${event.action}\n\n`
  })
  fs.appendFileSync(retroFile, `${block}\n`, 'utf-8')
  return retroFile
}

function appendRetryPatterns(events) {
  if (events.length === 0) return false
  if (!fs.existsSync(RETRY_FILE)) return false

  const existing = fs.readFileSync(RETRY_FILE, 'utf-8')
  const uniqueKinds = [...new Set(events.map(event => event.kind))]
  const missingKinds = uniqueKinds.filter(kind => !existing.includes(`[auto/${kind}]`))
  if (missingKinds.length === 0) return false

  const now = new Date().toISOString().slice(0, 10)
  let block = `\n## 4. 自动复盘增量\n\n`
  missingKinds.forEach(kind => {
    const sample = events.find(event => event.kind === kind)
    block += `- [auto/${kind}] ${now}: ${sample.action}\n`
  })
  fs.appendFileSync(RETRY_FILE, block, 'utf-8')
  return true
}

function main() {
  ensureDir(META_DIR)
  const seenItems = loadSeen()
  const seenSet = new Set(seenItems)

  const events = collectNewErrorEvents(seenSet)
  const retroFile = appendRetro(events)
  const patchedRetry = appendRetryPatterns(events)
  saveSeen([...seenSet])

  if (events.length === 0) {
    console.log('ℹ️ error-retro: 无新增错误事件')
    return
  }

  console.log(`✅ error-retro: 新增复盘 ${events.length} 条`)
  if (retroFile) console.log(`- retro: ${retroFile}`)
  if (patchedRetry) console.log(`- retry_patterns updated: ${RETRY_FILE}`)
}

main()
