#!/usr/bin/env node

import fs from 'fs'
import os from 'os'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { getAiTeamState } from '../lib/ai-team-state.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '../../')
const outputFile = path.join(projectRoot, '.memory/cache/ai_team_status.local.json')
const HOME_DIR = os.homedir()

function checkCLI(cmd, dirPath = null) {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' })
    return { status: 'online', reason: '命令链路正常' }
  } catch {
    if (dirPath && fs.existsSync(dirPath)) {
      return {
        status: 'offline',
        reason: `命令 ${cmd} 未找到，但在 ${dirPath.replace(os.homedir(), '~')} 发现配置目录。可能需要配置 PATH。`
      }
    }
    return { status: 'offline', reason: `未在系统 PATH 中找到 ${cmd}，请检查是否已安装。` }
  }
}

function sanitizeWorkspaceForOutput(workspacePath) {
  const raw = String(workspacePath ?? '').trim()
  if (!raw) return raw
  const normalized = path.normalize(raw)
  const homePrefix = `${path.normalize(HOME_DIR)}${path.sep}`
  if (normalized === path.normalize(HOME_DIR)) return '~'
  if (normalized.startsWith(homePrefix)) {
    return `~/${path.relative(HOME_DIR, normalized)}`
  }
  return normalized
}

function getProgressFromTodo(workspacePath) {
  try {
    const todoPath = path.join(workspacePath, 'TODO.md')
    if (!fs.existsSync(todoPath)) return null
    const content = fs.readFileSync(todoPath, 'utf8')
    const lines = content.split('\n')
    let total = 0
    let completed = 0
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('- [ ]')) total++
      else if (trimmed.match(/^- \[[xX]\]/)) {
        total++
        completed++
      }
    }
    if (total === 0) return null
    return Math.round((completed / total) * 100)
  } catch {
    return null
  }
}

function statusToProgress(status, isCaptain) {
  if (isCaptain) return 60
  const text = String(status ?? '')
  if (text.includes('等待')) return 5
  if (text.includes('已离线')) return 100
  return 55
}

function getComparablePayload(payload) {
  const clone = JSON.parse(JSON.stringify(payload))
  delete clone.generatedAt
  return clone
}

export function buildFleetDashboardPayload(state = getAiTeamState()) {
  const rows = state.agents.map((agent) => {
    const workspace = sanitizeWorkspaceForOutput(agent.workspace)
    const todoProgress = getProgressFromTodo(agent.workspace)
    return {
      member: agent.memberId,
      alias: agent.alias,
      agent: agent.agentName,
      role: agent.role,
      workspace,
      task: agent.task,
      since: agent.heartbeatAt || agent.updatedAt,
      status: agent.status,
      type: agent.type,
      progress: todoProgress !== null ? todoProgress : statusToProgress(agent.status, agent.isCaptain),
      isCaptain: agent.isCaptain,
      hasTodo: todoProgress !== null,
      isStale: false
    }
  })

  return {
    generatedAt: new Date().toISOString(),
    version: 'v5.7.1-local (本地 AI Team 状态快照)',
    source: '.memory/sqlite/ai-team.db',
    environment: {
      tools: {
        codex: checkCLI('codex'),
        gemini: checkCLI('gemini'),
        claude: checkCLI('claude', path.join(os.homedir(), '.claude')),
        openclaw: checkCLI('openclaw', path.join(os.homedir(), '.openclaw'))
      },
      nodeVersion: process.version,
      skillsCount: [path.join(os.homedir(), '.agents/skills'), path.join(os.homedir(), '.codex/skills')]
        .filter((dirPath) => fs.existsSync(dirPath))
        .reduce((count, dirPath) => {
          try {
            return count + fs.readdirSync(dirPath, { withFileTypes: true }).filter((entry) => entry.isDirectory() && !entry.name.startsWith('.')).length
          } catch {
            return count
          }
        }, 0)
    },
    total: state.total,
    active: state.active,
    offline: state.offline,
    queued: state.queued,
    members: rows
  }
}

export function syncFleetDashboard() {
  const payload = buildFleetDashboardPayload()

  let shouldWrite = true
  if (fs.existsSync(outputFile)) {
    try {
      const previous = JSON.parse(fs.readFileSync(outputFile, 'utf8'))
      shouldWrite = JSON.stringify(getComparablePayload(previous)) !== JSON.stringify(getComparablePayload(payload))
    } catch {
      shouldWrite = true
    }
  }

  if (!shouldWrite) {
    return { ok: true, changed: false, outputFile, payload }
  }

  fs.mkdirSync(path.dirname(outputFile), { recursive: true })
  fs.writeFileSync(outputFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  return { ok: true, changed: true, outputFile, payload }
}

function main() {
  try {
    const result = syncFleetDashboard()
    if (!result.changed) {
      console.log(`ℹ️ 看板数据无实质变化，跳过写入: ${result.outputFile}`)
      return
    }
    console.log(`✅ 看板数据同步成功: ${result.outputFile}`)
  } catch (error) {
    console.error(`❌ ${error?.message || error}`)
    process.exit(1)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
