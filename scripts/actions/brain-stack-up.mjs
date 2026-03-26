#!/usr/bin/env node

import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '../..')
const ecosystemPath = path.join(projectRoot, 'ecosystem.config.cjs')

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

function main () {
  safeRun('pm2 delete brain-cortex-pilot')
  safeRun('pm2 delete brain-frontend')
  run(`pm2 start ${JSON.stringify(ecosystemPath)}`)
  safeRun('pm2 save')

  const status = safeRun('pm2 list')
  process.stdout.write(`${status}\n`)
  process.stdout.write('\n🧠 主脑常驻服务已启动\n')
  process.stdout.write('  - 后台: brain-cortex-pilot\n')
  process.stdout.write('  - 前端: brain-frontend\n')
  process.stdout.write('  - 地址: http://127.0.0.1:5181/CortexOS/brain/\n')
}

main()
