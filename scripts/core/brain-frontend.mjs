#!/usr/bin/env node

import path from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { logEvent, logSection } from './brain-console-log.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '../..')
const frontendUrl = 'http://127.0.0.1:5181/CortexOS/brain/'

function handleStream (stream, isError = false) {
  let buffer = ''

  stream.on('data', (chunk) => {
    buffer += chunk.toString()
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) continue
      if (line.includes('page reload')) continue

      if (line.includes('Local:') || line.includes('127.0.0.1:5181') || line.includes('localhost:5181')) {
        logEvent('前端', '主脑页面', '在线', frontendUrl)
        continue
      }

      if (line.includes('ready in') || line.includes('building client + server bundles')) {
        logEvent('前端', 'VitePress', '开始', line)
        continue
      }

      if (isError || /error|failed|EADDRINUSE|ERR_/i.test(line)) {
        logEvent('错误', '主脑前端', '异常', line)
        continue
      }

      logEvent('前端', 'VitePress', '完成', line)
    }
  })
}

logSection('CortexOS 主脑前端')
logEvent('前端', '主脑页面', '开始', frontendUrl)

const child = spawn('pnpm', ['vitepress', 'dev', 'docs', '--host', '127.0.0.1', '--port', '5181', '--strictPort'], {
  cwd: projectRoot,
  stdio: ['ignore', 'pipe', 'pipe']
})

handleStream(child.stdout, false)
handleStream(child.stderr, true)

child.on('close', (code) => {
  if (code === 0) {
    logEvent('前端', '主脑页面', '完成', 'VitePress 已正常退出')
    process.exit(0)
  }

  logEvent('错误', '主脑前端', '异常', `进程退出码 ${code}`)
  process.exit(code || 1)
})
