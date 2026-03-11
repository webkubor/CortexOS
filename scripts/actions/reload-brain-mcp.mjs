#!/usr/bin/env node

import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '../..')
const serverPath = path.join(projectRoot, 'mcp_server', 'server.py')

function listBrainServerPids() {
  try {
    const output = execSync('ps -ax -o pid=,command=', {
      encoding: 'utf-8'
    }).trim()
    if (!output) return []

    return output
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const match = line.match(/^(\d+)\s+(.*)$/)
        if (!match) return null
        return {
          pid: Number(match[1]),
          command: match[2]
        }
      })
      .filter(Boolean)
      .filter(item =>
        item.pid !== process.pid &&
        item.command.includes(serverPath)
      )
  } catch {
    return []
  }
}

function main() {
  const processes = listBrainServerPids()
  if (processes.length === 0) {
    console.log('ℹ️ 未发现正在运行的 CortexOS MCP Server 进程。下次客户端调用时会自动拉起新进程。')
    return
  }

  const stopped = []
  const failed = []

  for (const item of processes) {
    try {
      process.kill(item.pid, 'SIGTERM')
      stopped.push(item)
    } catch (error) {
      failed.push({
        ...item,
        error: error?.message || String(error)
      })
    }
  }

  if (stopped.length > 0) {
    console.log(`✅ 已发送重载信号到 ${stopped.length} 个 MCP 进程:`)
    for (const item of stopped) {
      console.log(`- PID ${item.pid}: ${item.command}`)
    }
  }

  if (failed.length > 0) {
    console.log(`⚠️ 以下进程重载失败:`)
    for (const item of failed) {
      console.log(`- PID ${item.pid}: ${item.error}`)
    }
    process.exitCode = 1
  }
}

main()
