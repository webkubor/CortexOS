#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '../..')
const memoryRoot = path.join(projectRoot, '.memory')
const inboxStatePath = path.join(memoryRoot, 'cache/cloud-brain-inbox-state.json')
const inboxFilePath = path.join(memoryRoot, 'inbox/cloud-brain-inbox.md')
const brainApiUrl = process.env.BRAIN_API_URL || 'https://brain-api-675793533606.asia-southeast2.run.app'
const brainFrontendUrl = 'http://127.0.0.1:5181/CortexOS/brain/'
const isWatchMode = process.argv.includes('--watch')
const color = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m'
}

function formatLocalTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date)
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '-'
  if (seconds < 60) return `${seconds}秒`
  const minutes = Math.floor(seconds / 60)
  const remainSeconds = seconds % 60
  if (minutes < 60) return `${minutes}分 ${remainSeconds}秒`
  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60
  if (hours < 24) return `${hours}小时 ${remainMinutes}分`
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24
  return `${days}天 ${remainHours}小时`
}

function loadInboxState() {
  try {
    if (!fs.existsSync(inboxStatePath)) return { seen: {}, lastCheckedAt: '' }
    return JSON.parse(fs.readFileSync(inboxStatePath, 'utf8'))
  } catch {
    return { seen: {}, lastCheckedAt: '' }
  }
}

function loadPm2Processes() {
  try {
    const raw = execSync('pm2 jlist', { cwd: projectRoot, encoding: 'utf8' })
    return JSON.parse(raw)
  } catch {
    return []
  }
}

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return response.json()
}

function section(title, rows) {
  if (!rows.length) return ''
  return [`${color.bold}${color.cyan}【${title}】${color.reset}`, ...rows.map((row) => `  ${row}`)].join('\n')
}

function normalizeProcessStatus(value) {
  const text = String(value || '').trim().toLowerCase()
  if (text === 'online') return '在线'
  if (text === 'stopped') return '已停止'
  if (text === 'errored') return '异常'
  if (text === 'launching') return '启动中'
  return value || '未知'
}

function paint(text, tone = 'normal') {
  if (tone === 'good') return `${color.green}${text}${color.reset}`
  if (tone === 'warn') return `${color.yellow}${text}${color.reset}`
  if (tone === 'bad') return `${color.red}${text}${color.reset}`
  return text
}

function renderCount(label, value, { warn = false } = {}) {
  const num = Number(value) || 0
  let rendered = `${num} 条`
  if (warn && num > 0) {
    rendered = paint(rendered, num >= 3 ? 'bad' : 'warn')
  } else if (num === 0) {
    rendered = paint(rendered, 'good')
  }
  return `${label}：${rendered}`
}

async function main() {
  const snapshot = await buildSnapshot()
  process.stdout.write(snapshot.output)
}

async function buildSnapshot() {
  const inboxState = loadInboxState()
  const pm2Processes = loadPm2Processes()
  const pilotProcess = pm2Processes.find((item) => item.name === 'brain-cortex-pilot') || null
  const frontendProcess = pm2Processes.find((item) => item.name === 'brain-frontend') || null

  let health = null
  let notifications = []
  let tasks = []
  let cloudError = ''

  try {
    const [healthPayload, notificationsPayload, tasksPayload] = await Promise.all([
      fetchJson(`${brainApiUrl}/health`),
      fetchJson(`${brainApiUrl}/notifications?project=cortexos&limit=100`),
      fetchJson(`${brainApiUrl}/tasks?project=cortexos&limit=100`)
    ])
    health = healthPayload
    notifications = Array.isArray(notificationsPayload.notifications) ? notificationsPayload.notifications : []
    tasks = Array.isArray(tasksPayload.tasks) ? tasksPayload.tasks : []
  } catch (error) {
    cloudError = error.message
  }

  const pendingNotifications = notifications.filter((item) => {
    const status = String(item.status || '').trim().toLowerCase()
    return status === 'new' || status === 'triaged'
  })
  const unreadNotifications = notifications.filter((item) => item.read !== true)
  const openTasks = tasks.filter((item) => String(item.status || '').trim() !== '已完成')
  const seenCount = Object.keys(inboxState.seen || {}).length
  const latestNotification = notifications[0] || null
  const recentNotifications = notifications.slice(0, 3)
  const pilotStatus = pilotProcess ? normalizeProcessStatus(pilotProcess.pm2_env?.status) : '未运行'
  const pilotUptime = pilotProcess?.pm2_env?.pm_uptime
    ? formatDuration(Math.floor((Date.now() - pilotProcess.pm2_env.pm_uptime) / 1000))
    : '-'
  const pilotRestarts = pilotProcess?.pm2_env?.restart_time ?? 0
  const frontendStatus = frontendProcess ? normalizeProcessStatus(frontendProcess.pm2_env?.status) : '未运行'
  const frontendTone = frontendProcess ? (frontendStatus === '在线' ? 'good' : 'warn') : 'bad'
  const cloudStatus = cloudError ? `离线（${cloudError}）` : `在线 · ${health?.version || '-'}`
  const cloudStatusTone = cloudError ? 'bad' : 'good'
  const pilotTone = pilotProcess ? (pilotStatus === '在线' ? 'good' : 'warn') : 'bad'

  const lines = [
    `${color.bold}${color.cyan}🧠 Webkubor 主脑状态${color.reset}`,
    `${color.dim}────────────────────────${color.reset}`,
    section('运行总览', [
      `云端大脑：${paint(cloudStatus, cloudStatusTone)}`,
      `主脑后台：${paint(`${pilotStatus} · 已运行 ${pilotUptime} · 重启 ${pilotRestarts} 次`, pilotTone)}`,
      `主脑前端：${paint(`${frontendStatus} · ${brainFrontendUrl}`, frontendTone)}`,
      `最近收件箱检查：${formatLocalTime(inboxState.lastCheckedAt)}`
    ]),
    '',
    section('通知收件箱', [
      renderCount('通知总数', notifications.length),
      renderCount('待处理', pendingNotifications.length, { warn: true }),
      renderCount('未读', unreadNotifications.length, { warn: true }),
      renderCount('已记录缓存', seenCount),
      `最近一条：${latestNotification ? `${latestNotification.title || latestNotification.id} · ${formatLocalTime(latestNotification.createdAt)}` : '暂无'}`
    ]),
    '',
    section('任务状态', [
      renderCount('任务总数', tasks.length),
      renderCount('待处理任务', openTasks.length, { warn: true })
    ]),
    '',
    section('本地落点', [
      `收件箱文件：${fs.existsSync(inboxFilePath) ? inboxFilePath : '未生成'}`
    ])
  ]

  if (recentNotifications.length > 0) {
    lines.push('', section('最近 3 条通知', recentNotifications.map((item, index) => {
      const acted = String(item.status || '').trim() === 'acted'
      const statusText = acted ? paint('已处理', 'good') : paint(item.status || '新通知', 'warn')
      return `${index + 1}. ${item.title || item.id} · ${statusText} · ${formatLocalTime(item.createdAt)}`
    })))
  }

  if (pendingNotifications.length > 0) {
    lines.push('', `${color.bold}${color.yellow}【待处理通知】${color.reset}`)
    pendingNotifications.slice(0, 5).forEach((item, index) => {
      lines.push(`  ${index + 1}. ${item.title || item.id} · ${item.status || '新通知'} · ${formatLocalTime(item.createdAt)}`)
    })
  }

  if (openTasks.length > 0) {
    lines.push('', `${color.bold}${color.yellow}【待处理任务】${color.reset}`)
    openTasks.slice(0, 5).forEach((item, index) => {
      lines.push(`  ${index + 1}. ${item.title || item.id} · ${item.status || '待处理'}`)
    })
  }

  const output = `${lines.filter(Boolean).join('\n')}\n`
  const comparable = JSON.stringify({
    cloudError,
    healthVersion: health?.version || '',
    pilotStatus,
    pilotRestarts,
    frontendStatus,
    inboxLastCheckedAt: inboxState.lastCheckedAt,
    notifications: notifications.map(item => [item.id, item.status, item.read, item.updatedAt, item.actedAt]),
    tasks: tasks.map(item => [item.id || item.taskId, item.status, item.updatedAt]),
    seenCount
  })

  return { output, comparable }
}

async function watchLoop() {
  let lastComparable = ''

  while (true) {
    const snapshot = await buildSnapshot()
    if (snapshot.comparable !== lastComparable) {
      process.stdout.write('\x1Bc')
      process.stdout.write(snapshot.output)
      process.stdout.write(`\n${color.dim}监控中：仅在状态变化时刷新，Ctrl+C 退出。${color.reset}\n`)
      lastComparable = snapshot.comparable
    }
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}

const entry = isWatchMode ? watchLoop : main

entry().catch((error) => {
  console.error(`brain:status 失败：${error.message}`)
  process.exit(1)
})
