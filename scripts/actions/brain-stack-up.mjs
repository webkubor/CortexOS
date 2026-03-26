#!/usr/bin/env node

import fs from 'fs'
import { execSync } from 'child_process'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '../..')
const ecosystemPath = path.join(projectRoot, 'ecosystem.config.cjs')
const pm2LogDir = path.join(os.homedir(), '.pm2', 'logs')

const managedLogFiles = [
  'brain-cortex-pilot-out.log',
  'brain-cortex-pilot-error.log'
].map((name) => path.join(pm2LogDir, name))

function run (command) {
  return execSync(command, { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' }).trim()
}

function safeRun (command) {
  try {
    return run(command)
  } catch {
    return ''
  }
}

function resetManagedLogs () {
  for (const filePath of managedLogFiles) {
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true })
      fs.writeFileSync(filePath, '')
    } catch {}
  }
}

function main () {
  safeRun('pm2 delete brain-cortex-pilot')
  resetManagedLogs()
  run(`pm2 start ${JSON.stringify(ecosystemPath)}`)
  safeRun('pm2 save')

  const status = safeRun('pm2 list')
  process.stdout.write(`${status}\n`)
  process.stdout.write('\n🧠 主脑常驻服务已启动\n')
  process.stdout.write('  - 后台: brain-cortex-pilot\n')
}

main()
