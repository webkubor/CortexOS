#!/usr/bin/env node

import fs from 'fs'
import os from 'os'
import path from 'path'
import { execSync, spawn, spawnSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '../../')
const GEMINI_SETTINGS = path.join(os.homedir(), '.gemini', 'settings.json')
const MCP_NAME = 'ai-common-brain'
const SERVER_PATH = path.join(PROJECT_ROOT, 'mcp_server', 'server.py')
const EXPECTED_ARGS = ['run', '--project', PROJECT_ROOT, SERVER_PATH]

function notifyNative(title, body) {
  try {
    const escapedTitle = String(title).replace(/"/g, '\\"')
    const escapedBody = String(body).replace(/"/g, '\\"').slice(0, 120)
    execSync(`osascript -e 'display notification "${escapedBody}" with title "🧠 ${escapedTitle}"'`)
  } catch (e) {}
}

function notifyLark(title, body) {
  try {
    spawnSync('node', [
      path.join(PROJECT_ROOT, 'scripts/services/lark-cli.mjs'),
      '--title',
      title,
      '--body',
      body
    ], { cwd: PROJECT_ROOT, stdio: 'ignore' })
  } catch (e) {}
}

function loadGeminiSettings() {
  if (!fs.existsSync(GEMINI_SETTINGS)) {
    return { ok: false, reason: 'gemini_settings_missing' }
  }
  try {
    const json = JSON.parse(fs.readFileSync(GEMINI_SETTINGS, 'utf-8'))
    return { ok: true, json }
  } catch (e) {
    return { ok: false, reason: `gemini_settings_parse_error:${e.message}` }
  }
}

function saveGeminiSettings(json) {
  fs.writeFileSync(GEMINI_SETTINGS, `${JSON.stringify(json, null, 2)}\n`)
}

function normalizeMcpConfig(json) {
  if (!json.mcpServers) json.mcpServers = {}
  const current = json.mcpServers[MCP_NAME] || {}
  const args = Array.isArray(current.args) ? current.args : []
  const sameArgs = JSON.stringify(args) === JSON.stringify(EXPECTED_ARGS)
  const sameCommand = current.command === 'uv'
  if (sameArgs && sameCommand) return { changed: false }

  json.mcpServers[MCP_NAME] = {
    ...current,
    command: 'uv',
    args: EXPECTED_ARGS,
    trust: true
  }
  return { changed: true }
}

function smokeTestServer() {
  return new Promise((resolve) => {
    if (!fs.existsSync(SERVER_PATH)) {
      resolve({ ok: false, reason: 'server_path_missing' })
      return
    }
    let resolved = false
    const proc = spawn('uv', EXPECTED_ARGS, {
      cwd: PROJECT_ROOT,
      stdio: 'ignore'
    })

    const timeout = setTimeout(() => {
      if (resolved) return
      resolved = true
      proc.kill('SIGTERM')
      resolve({ ok: true, reason: 'boot_ok' })
    }, 1200)

    proc.on('error', (err) => {
      if (resolved) return
      resolved = true
      clearTimeout(timeout)
      resolve({ ok: false, reason: `spawn_error:${err.message}` })
    })

    proc.on('exit', (code) => {
      if (resolved) return
      resolved = true
      clearTimeout(timeout)
      resolve({ ok: false, reason: `early_exit:${code}` })
    })
  })
}

async function main() {
  const result = {
    ok: true,
    fixedConfig: false,
    smoke: null,
    reason: 'ok'
  }

  const loaded = loadGeminiSettings()
  if (!loaded.ok) {
    result.ok = false
    result.reason = loaded.reason
    console.log(JSON.stringify(result))
    return
  }

  const normalized = normalizeMcpConfig(loaded.json)
  if (normalized.changed) {
    saveGeminiSettings(loaded.json)
    result.fixedConfig = true
    notifyNative('MCP 配置已自动修复', `${MCP_NAME} 已回写 CortexOS 路径`)
    notifyLark('MCP 配置修复', `${MCP_NAME} 路径漂移已自动修复为 CortexOS`)
  }

  result.smoke = await smokeTestServer()
  if (!result.smoke.ok) {
    result.ok = false
    result.reason = result.smoke.reason
    notifyNative('MCP 健康检查异常', `${MCP_NAME} 启动失败: ${result.reason}`)
    notifyLark('MCP 健康检查异常', `${MCP_NAME} 启动失败: ${result.reason}`)
  }

  console.log(JSON.stringify(result))
}

await main()
