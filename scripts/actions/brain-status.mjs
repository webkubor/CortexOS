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
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainSeconds = seconds % 60
  if (minutes < 60) return `${minutes}m ${remainSeconds}s`
  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60
  if (hours < 24) return `${hours}h ${remainMinutes}m`
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24
  return `${days}d ${remainHours}h`
}

function loadInboxState() {
  try {
    if (!fs.existsSync(inboxStatePath)) {
      return { seen: {}, lastCheckedAt: '' }
    }
    return JSON.parse(fs.readFileSync(inboxStatePath, 'utf8'))
  } catch {
    return { seen: {}, lastCheckedAt: '' }
  }
}

function loadPm2Process() {
  try {
    const raw = execSync('pm2 jlist', { cwd: projectRoot, encoding: 'utf8' })
    const list = JSON.parse(raw)
    return list.find((item) => item.name === 'brain-cortex-pilot') || null
  } catch {
    return null
  }
}

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.json()
}

async function main() {
  const inboxState = loadInboxState()
  const pm2Process = loadPm2Process()

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

  const unactedNotifications = notifications.filter((item) => String(item.status || '').trim() !== 'acted')
  const unreadNotifications = notifications.filter((item) => item.read !== true)
  const openTasks = tasks.filter((item) => String(item.status || '').trim() !== '已完成')
  const seenCount = Object.keys(inboxState.seen || {}).length

  const statusLines = [
    '🧠 CortexOS Brain Status',
    '',
    `Cloud Brain: ${cloudError ? `offline (${cloudError})` : `online · ${health?.version || '-'}`}`,
    `Brain Pilot: ${pm2Process ? `${pm2Process.pm2_env?.status || 'unknown'} · uptime ${formatDuration(pm2Process.pm2_env?.pm_uptime ? Math.floor((Date.now() - pm2Process.pm2_env.pm_uptime) / 1000) : 0)} · restarts ${pm2Process.pm2_env?.restart_time ?? 0}` : 'not running'}`,
    `Last Inbox Check: ${formatLocalTime(inboxState.lastCheckedAt)}`,
    '',
    `Notifications: total ${notifications.length} · pending ${unactedNotifications.length} · unread ${unreadNotifications.length}`,
    `Tasks: total ${tasks.length} · open ${openTasks.length}`,
    `Seen Cache: ${seenCount}`,
    '',
    `Inbox File: ${fs.existsSync(inboxFilePath) ? inboxFilePath : 'missing'}`
  ]

  if (unactedNotifications.length > 0) {
    statusLines.push('', 'Pending Notifications:')
    unactedNotifications.slice(0, 5).forEach((item, index) => {
      statusLines.push(`${index + 1}. ${item.title || item.id} · ${item.status || 'new'} · ${formatLocalTime(item.createdAt)}`)
    })
  }

  if (openTasks.length > 0) {
    statusLines.push('', 'Open Tasks:')
    openTasks.slice(0, 5).forEach((item, index) => {
      statusLines.push(`${index + 1}. ${item.title || item.id} · ${item.status || '待处理'}`)
    })
  }

  console.log(statusLines.join('\n'))
}

main().catch((error) => {
  console.error(`brain:status 失败: ${error.message}`)
  process.exit(1)
})
