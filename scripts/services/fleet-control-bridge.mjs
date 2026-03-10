#!/usr/bin/env node

import fs from 'fs'
import http from 'http'
import path from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '../../')
const fleetFile = path.join(projectRoot, '.memory/fleet/fleet_status.md')
const port = Number(process.env.FLEET_CONTROL_PORT || 18790)
const host = process.env.FLEET_CONTROL_HOST || '127.0.0.1'

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

function updateMemberStatus(memberId, nextStatus) {
  const content = fs.readFileSync(fleetFile, 'utf8')
  const lines = content.split('\n')
  const tableStartIndex = lines.findIndex((line) => line.includes('| 节点 ID'))

  if (tableStartIndex === -1) {
    throw new Error('Table not found in fleet_status.md')
  }

  for (let i = tableStartIndex + 2; i < lines.length; i++) {
    if (!lines[i].trim().startsWith('|')) break
    if (!lines[i].includes(memberId)) continue

    const cols = lines[i].split('|')
    if (cols.length < 8) continue
    cols[7] = ` ${nextStatus} `
    lines[i] = cols.join('|')
    fs.writeFileSync(fleetFile, lines.join('\n'), 'utf8')
    return
  }

  throw new Error(`Member not found: ${memberId}`)
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

  if (req.method !== 'POST' || req.url !== '/api/fleet/action') {
    writeJson(res, 404, { error: 'Not Found' }, origin)
    return
  }

  try {
    if (!fs.existsSync(fleetFile)) {
      writeJson(res, 404, { error: 'fleet_status.md not found' }, origin)
      return
    }

    const data = await readJsonBody(req)
    const { action, memberId } = data

    if (!memberId) {
      writeJson(res, 400, { error: 'memberId is required' }, origin)
      return
    }

    if (action === 'kick-out') {
      updateMemberStatus(memberId, '[ 已离线 ]')
      const result = await syncFleetDashboard()
      writeJson(res, 200, { success: true, stdout: result.stdout }, origin)
      return
    }

    if (action === 'make-captain') {
      const result = await runCommand('pnpm', ['run', 'fleet:handover', '--', '--to-node', memberId])
      await syncFleetDashboard()
      writeJson(res, 200, { success: true, stdout: result.stdout }, origin)
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

server.listen(port, host, () => {
  console.log(`fleet-control-bridge listening on http://${host}:${port}`)
})
