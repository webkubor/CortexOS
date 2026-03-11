#!/usr/bin/env node

import http from 'http'
import path from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { ensureAiTeamDb } from '../lib/ai-team-db.mjs'
import { getAiTeamState, makeAiTeamCaptain, markAiTeamMemberOffline } from '../lib/ai-team-state.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '../../')
const port = Number(process.env.FLEET_CONTROL_PORT || 18790)
const host = process.env.FLEET_CONTROL_HOST || '127.0.0.1'
const STATE_POLL_INTERVAL = 2000
const SSE_PING_INTERVAL = 15000
const sseClients = new Map()
let nextClientId = 1
let lastStateSignature = ''
let lastBroadcastState = null

function getSerializableState() {
  const state = getAiTeamState()
  const comparable = JSON.parse(JSON.stringify(state))
  delete comparable.generatedAt
  return { state, signature: JSON.stringify(comparable) }
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
  const payload = lastBroadcastState || getAiTeamState()
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
  }, SSE_PING_INTERVAL)

  sseClients.set(clientId, { res, pingTimer })
  writeSse(res, 'ready', { ok: true, clientId })
  writeSse(res, 'state', { ok: true, state: getAiTeamState() })

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
    writeJson(res, 200, { ok: true, state: getAiTeamState() }, origin)
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
}, STATE_POLL_INTERVAL)

server.listen(port, host, () => {
  console.log(`fleet-control-bridge listening on http://${host}:${port}`)
})
