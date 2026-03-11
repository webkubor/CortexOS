#!/usr/bin/env node

import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '../../')

function parseArgs(argv) {
  const args = {
    mode: 'dev',
    host: process.env.TEAM_LOCAL_HOST || '127.0.0.1',
    port: process.env.TEAM_LOCAL_PORT || '5173',
    help: false
  }

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if ((token === 'dev' || token === 'preview') && i === 0) args.mode = token
    else if (token === '--host' && argv[i + 1]) args.host = argv[++i]
    else if (token === '--port' && argv[i + 1]) args.port = argv[++i]
    else if (token === '--help' || token === '-h') args.help = true
  }

  return args
}

function printHelp() {
  console.log('用法:')
  console.log('  pnpm run team:local')
  console.log('  pnpm run team:local -- --host 0.0.0.0 --port 5173')
  console.log('  pnpm run team:local -- preview --host 127.0.0.1 --port 4173')
}

function getLaunchUrl(args) {
  const route = '/CortexOS/team/'
  return `http://${args.host}:${args.port}${route}`
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }

  const runtimeArgs = [
    'scripts/actions/vitepress-with-fleet-bridge.mjs',
    args.mode,
    '--host',
    args.host,
    '--port',
    args.port
  ]

  if (args.mode === 'dev') {
    runtimeArgs.push('--open', '/CortexOS/team/')
  }

  console.log(`🛰️ AI Team 本地中枢启动中: ${getLaunchUrl(args)}`)

  const child = spawn('node', runtimeArgs, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env
  })

  child.on('exit', (code) => {
    process.exit(code ?? 0)
  })

  child.on('error', (error) => {
    console.error(error)
    process.exit(1)
  })
}

main()
