#!/usr/bin/env node

import http from 'http'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import {
  FLEET_BRIDGE_HOST,
  FLEET_BRIDGE_PORT,
  FLEET_SSE_PING_INTERVAL_MS,
  FLEET_STATE_POLL_INTERVAL_MS
} from '../config/ai-team.config.mjs'
import { ensureAiTeamDb } from '../lib/ai-team-db.mjs'
import { assignAiTeamTaskToMember, completeAiTeamTask, createAndDispatchAiTeamTask, deleteAiTeamTask, getAiTeamState, makeAiTeamCaptain, markAiTeamMemberOffline } from '../lib/ai-team-state.mjs'
import { buildFleetDashboardPayload } from '../actions/sync-fleet-dashboard.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '../../')
const registryFile = path.join(projectRoot, '.memory/projects/registry.json')
const port = FLEET_BRIDGE_PORT
const host = FLEET_BRIDGE_HOST
const sseClients = new Map()
const runningProcesses = new Map()
let nextClientId = 1
let lastStateSignature = ''
let lastBroadcastState = null

function getSerializableState() {
  const state = buildFleetDashboardPayload(getAiTeamState())
  const comparable = JSON.parse(JSON.stringify(state))
  delete comparable.generatedAt
  return { state, signature: JSON.stringify(comparable) }
}

function loadActivatedWorkspaces() {
  try {
    const raw = JSON.parse(fs.readFileSync(registryFile, 'utf8'))
    const projects = Array.isArray(raw?.projects) ? raw.projects : []
    return projects
      .filter(project => (project.participants || []).length > 0 || project.lastAgent)
      .map(project => ({
        slug: project.slug,
        name: project.name,
        rootPath: project.rootPath,
        workspace: project.lastWorkspace || project.rootPath,
        lastAgent: project.lastAgent || '',
        lastRole: project.lastRole || '',
        participants: project.participants || []
      }))
  } catch {
    return []
  }
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk)
    })

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk)
    })

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() })
        return
      }

      reject(new Error(stderr.trim() || stdout.trim() || `${command} exited with code ${code}`))
    })
  })
}

async function syncFleetDashboard() {
  return runCommand('node', ['scripts/actions/sync-fleet-dashboard.mjs'])
}

function bootstrapAiTeamState() {
  const db = ensureAiTeamDb()
  db.close()
}

function writeSse(res, event, payload) {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(payload)}\n\n`)
}

function broadcastState(event = 'state') {
  if (sseClients.size === 0) return
  const payload = lastBroadcastState || buildFleetDashboardPayload(getAiTeamState())
  for (const client of sseClients.values()) {
    writeSse(client.res, event, { ok: true, state: payload })
  }
}

function refreshStateCache({ forceBroadcast = false, event = 'state' } = {}) {
  const { state, signature } = getSerializableState()
  const changed = signature !== lastStateSignature
  lastStateSignature = signature
  lastBroadcastState = state
  if (forceBroadcast || changed) {
    broadcastState(event)
  }
  return { state, changed }
}

function attachSseClient(req, res, origin) {
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders?.()

  const clientId = nextClientId++
  const pingTimer = setInterval(() => {
    res.write(': ping\n\n')
  }, FLEET_SSE_PING_INTERVAL_MS)

  sseClients.set(clientId, { res, pingTimer })
  writeSse(res, 'ready', { ok: true, clientId })
  writeSse(res, 'state', { ok: true, state: buildFleetDashboardPayload(getAiTeamState()) })

  req.on('close', () => {
    clearInterval(pingTimer)
    sseClients.delete(clientId)
  })
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''

    req.on('data', (chunk) => {
      body += chunk
    })

    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'))
      } catch (error) {
        reject(error)
      }
    })

    req.on('error', reject)
  })
}

function writeJson(res, statusCode, payload, origin = '') {
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Content-Type', 'application/json')
  res.statusCode = statusCode
  res.end(JSON.stringify(payload))
}

function allowOrigin(origin) {
  if (!origin) return '*'

  const allowedOrigins = new Set([
    'http://127.0.0.1:4173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    'http://127.0.0.1:3456',
    'http://localhost:3456',
    'https://webkubor.github.io'
  ])

  return allowedOrigins.has(origin) ? origin : ''
}

const server = http.createServer(async (req, res) => {
  const origin = allowOrigin(req.headers.origin || '')

  if (req.method === 'OPTIONS') {
    writeJson(res, 204, {}, origin)
    return
  }

  if (req.method === 'GET' && req.url === '/health') {
    writeJson(res, 200, { ok: true, service: 'fleet-control-bridge' }, origin)
    return
  }

  if (req.method === 'GET' && req.url === '/api/fleet/state') {
    writeJson(res, 200, { ok: true, state: buildFleetDashboardPayload(getAiTeamState()) }, origin)
    return
  }

  if (req.method === 'GET' && req.url === '/api/fleet/workspaces') {
    writeJson(res, 200, { ok: true, workspaces: loadActivatedWorkspaces() }, origin)
    return
  }

  if (req.method === 'GET' && req.url === '/api/fleet/events') {
    attachSseClient(req, res, origin)
    return
  }

  if (req.method !== 'POST' || req.url !== '/api/fleet/action') {
    writeJson(res, 404, { error: 'Not Found' }, origin)
    return
  }

  try {
    const data = await readJsonBody(req)
    const { action, memberId } = data

    if (action === 'create-task') {
      const { title, workspace, priority = '中' } = data
      if (!title || !String(title).trim()) {
        writeJson(res, 400, { error: 'title is required' }, origin)
        return
      }
      if (!workspace || !String(workspace).trim()) {
        writeJson(res, 400, { error: 'workspace is required' }, origin)
        return
      }

      const availableWorkspaces = new Set(loadActivatedWorkspaces().map(item => item.workspace || item.rootPath))
      if (!availableWorkspaces.has(String(workspace).trim())) {
        writeJson(res, 400, { error: 'workspace is not activated' }, origin)
        return
      }

      const result = createAndDispatchAiTeamTask({
        title,
        workspace: String(workspace).trim(),
        priority,
        status: '待启动',
        owner: '待分配',
        publishedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      }, {
        operator: 'bridge',
        reason: 'fleet-control-bridge:create-task'
      })
      await syncFleetDashboard()
      const { state } = refreshStateCache({ forceBroadcast: true, event: 'state' })
      writeJson(res, 200, { success: true, ...result, state }, origin)
      return
    }

    if (action === 'create-member-task') {
      const { title, memberId, workspace = '', priority = '中' } = data
      if (!title || !String(title).trim()) {
        writeJson(res, 400, { error: 'title is required' }, origin)
        return
      }
      if (!memberId || !String(memberId).trim()) {
        writeJson(res, 400, { error: 'memberId is required' }, origin)
        return
      }

      const result = assignAiTeamTaskToMember({
        title,
        workspace: String(workspace || '').trim(),
        priority,
        status: '待启动',
        owner: String(memberId).trim(),
        publishedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      }, String(memberId).trim(), {
        operator: 'bridge',
        reason: 'fleet-control-bridge:create-member-task'
      })
      await syncFleetDashboard()
      const { state } = refreshStateCache({ forceBroadcast: true, event: 'state' })
      writeJson(res, 200, { success: true, ...result, state }, origin)
      return
    }

    if (action === 'delete-task') {
      const { taskId } = data
      if (!taskId || !String(taskId).trim()) {
        writeJson(res, 400, { error: 'taskId is required' }, origin)
        return
      }

      const result = deleteAiTeamTask(String(taskId).trim(), {
        operator: 'bridge',
        reason: 'fleet-control-bridge:delete-task'
      })
      await syncFleetDashboard()
      const { state } = refreshStateCache({ forceBroadcast: true, event: 'state' })
      writeJson(res, 200, { success: true, deleted: result, state }, origin)
      return
    }

    if (action === 'complete-task') {
      const { taskId, memberId = '', summary = '' } = data
      if (!taskId || !String(taskId).trim()) {
        writeJson(res, 400, { error: 'taskId is required' }, origin)
        return
      }

      const result = completeAiTeamTask(String(taskId).trim(), {
        memberId: String(memberId || '').trim(),
        summary: String(summary || '').trim(),
        operator: 'bridge',
        reason: 'fleet-control-bridge:complete-task'
      })
      await syncFleetDashboard()
      const { state } = refreshStateCache({ forceBroadcast: true, event: 'state' })
      writeJson(res, 200, { success: true, completed: result, state }, origin)
      return
    }

    if (action === 'run-internal-script') {
      const { scriptName, scriptArgs = [] } = data
      const scriptMap = {
        'health:core': { cmd: 'node', args: ['scripts/tools/health-check.js', '--strict'] },
        'health:docs-index': { cmd: 'node', args: ['scripts/maintenance/check-docs-index.js'] },
        'health:verify': { cmd: 'node', args: ['scripts/maintenance/verify-health.js'] },
        'health:gate': { cmd: 'node', args: ['scripts/maintenance/health-gate.js'] },
        'health:mcp': { cmd: 'uv', args: ['run', 'mcp_server/server.py', '--help'] },
        'memory:refresh': { cmd: 'python3', args: ['scripts/ingest/chroma_ingest.py'] }
      }

      if (!scriptName || !scriptMap[scriptName]) {
        writeJson(res, 400, { error: `Invalid or not allowed script: ${scriptName}` }, origin)
        return
      }

      const { cmd, args } = scriptMap[scriptName]
      try {
        const { stdout, stderr } = await runCommand(cmd, [...args, ...scriptArgs])
        writeJson(res, 200, { success: true, stdout, stderr }, origin)
      } catch (e) {
        writeJson(res, 500, { error: e.message }, origin)
      }
      return
    }

    if (action === 'run-engine') {
      const { engineName } = data
      const allowedEngines = new Set([
        'gemini',
        'claude',
        'codex'
      ])

      if (!engineName || !allowedEngines.has(engineName)) {
        writeJson(res, 400, { error: `Invalid or not allowed engine: ${engineName}` }, origin)
        return
      }

      const scriptPath = `scripts/actions/${engineName}-with-fleet.sh`
      
      // Check if already running
      if (runningProcesses.has(engineName)) {
        const existing = runningProcesses.get(engineName)
        if (existing.exitCode === null) {
          writeJson(res, 200, { success: true, message: `${engineName} is already running`, pid: existing.pid }, origin)
          return
        }
      }

      try {
        const child = spawn('bash', [scriptPath], {
          cwd: projectRoot,
          detached: true,
          stdio: ['ignore', 'pipe', 'pipe']
        })

        child.unref() // Allow parent to exit independently
        
        runningProcesses.set(engineName, {
          pid: child.pid,
          exitCode: null,
          startedAt: new Date().toISOString()
        })

        child.on('exit', (code) => {
          const info = runningProcesses.get(engineName)
          if (info) info.exitCode = code
          console.log(`Engine ${engineName} (pid ${child.pid}) exited with code ${code}`)
        })

        writeJson(res, 200, { success: true, message: `Engine ${engineName} ignition started`, pid: child.pid }, origin)
      } catch (e) {
        writeJson(res, 500, { error: e.message }, origin)
      }
      return
    }

    if (action === 'run-setup') {
      try {
        const { stdout, stderr } = await runCommand('bash', ['scripts/actions/setup-codex-alias.sh'])
        writeJson(res, 200, { success: true, stdout, stderr }, origin)
      } catch (e) {
        writeJson(res, 500, { error: e.message }, origin)
      }
      return
    }

    if (!memberId) {
      writeJson(res, 400, { error: 'memberId is required' }, origin)
      return
    }

    if (action === 'kick-out') {
      const result = markAiTeamMemberOffline(memberId, {
        operator: 'bridge',
        reason: 'fleet-control-bridge',
        payload: { memberId }
      })
      const syncResult = await syncFleetDashboard()
      const { state } = refreshStateCache({ forceBroadcast: true, event: 'state' })
      writeJson(res, 200, { success: true, stdout: syncResult.stdout, state, result }, origin)
      return
    }

    if (action === 'make-captain') {
      const result = makeAiTeamCaptain(memberId, {
        operator: 'bridge',
        reason: 'fleet-control-bridge',
        payload: { memberId }
      })
      await syncFleetDashboard()
      const { state } = refreshStateCache({ forceBroadcast: true, event: 'state' })
      writeJson(res, 200, { success: true, state, result }, origin)
      return
    }

    writeJson(res, 400, { error: `Unsupported action: ${action}` }, origin)
  } catch (error) {
    writeJson(res, 500, { error: error.message }, origin)
  }
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log(`fleet-control-bridge already running on http://${host}:${port}`)
    process.exit(0)
    return
  }

  console.error(error)
  process.exit(1)
})

bootstrapAiTeamState()
refreshStateCache()

setInterval(() => {
  try {
    refreshStateCache({ forceBroadcast: false, event: 'state' })
  } catch (error) {
    console.error(`fleet-control-bridge state watcher failed: ${error?.message || error}`)
  }
}, FLEET_STATE_POLL_INTERVAL_MS)

server.listen(port, host, () => {
  console.log(`fleet-control-bridge listening on http://${host}:${port}`)
})
