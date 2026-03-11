#!/usr/bin/env node

import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '../../')

const [mode = 'dev', ...restArgs] = process.argv.slice(2)
const vitepressArgs = [mode, 'docs', ...restArgs]
const bridgeEnv = {
  ...process.env,
  FLEET_CONTROL_PORT: process.env.FLEET_CONTROL_PORT || '18790'
}

const bridge = spawn('node', ['scripts/services/fleet-control-bridge.mjs'], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: bridgeEnv
})

const vitepress = spawn('pnpm', ['exec', 'vitepress', ...vitepressArgs], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    CORTEXOS_LOCAL_TEAM: '1'
  }
})

function shutdown(code = 0) {
  if (!bridge.killed) {
    bridge.kill('SIGTERM')
  }
  process.exit(code)
}

vitepress.on('exit', (code) => {
  shutdown(code ?? 0)
})

vitepress.on('error', (error) => {
  console.error(error)
  shutdown(1)
})

process.on('SIGINT', () => shutdown(130))
process.on('SIGTERM', () => shutdown(143))
