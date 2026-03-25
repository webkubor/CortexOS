#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath, pathToFileURL } from 'url'
import { suggestTriageAction } from '../../services/brain-api/src/triage.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '../../')
const ASSISTANT_MEMORY_HOME = process.env.CORTEXOS_ASSISTANT_MEMORY_HOME || path.join(PROJECT_ROOT, '.memory')
const CACHE_DIR = path.join(ASSISTANT_MEMORY_HOME, 'cache')
const INBOX_DIR = path.join(ASSISTANT_MEMORY_HOME, 'inbox')
const STATE_PATH = path.join(CACHE_DIR, 'cloud-brain-inbox-state.json')
const INBOX_MARKDOWN_PATH = path.join(INBOX_DIR, 'cloud-brain-inbox.md')
const INBOX_HTML_PATH = path.join(INBOX_DIR, 'cloud-brain-inbox.html')
const LOGO_PATH = path.join(PROJECT_ROOT, 'docs/public/logo.svg')
const HERO_PATH = path.join(PROJECT_ROOT, 'docs/public/images/aureate-hero.png')
const NOTIFICATION_ICON_PATH = path.join(PROJECT_ROOT, '.memory/cache/brain-assets/logo.svg.png')

const BRAIN_API_URL = String(process.env.BRAIN_API_URL || 'https://brain-api-675793533606.asia-southeast2.run.app').trim()
const BRAIN_API_TOKEN = String(process.env.BRAIN_API_TOKEN || '').trim()
const BRAIN_PROJECT = String(process.env.BRAIN_INBOX_PROJECT || process.env.BRAIN_DEFAULT_PROJECT || 'cortexos').trim()
const BRAIN_INBOX_LIMIT = Math.min(Math.max(Number(process.env.BRAIN_INBOX_LIMIT) || 20, 1), 100)
const AUTO_TRIAGE = !['0', 'false', 'off'].includes(String(process.env.BRAIN_INBOX_AUTO_TRIAGE || 'true').trim().toLowerCase())
const OPEN_ON_NEW = !['0', 'false', 'off'].includes(String(process.env.BRAIN_INBOX_OPEN_ON_NEW || 'false').trim().toLowerCase())

function ensureDirs () {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  fs.mkdirSync(INBOX_DIR, { recursive: true })
}

function readState () {
  try {
    if (!fs.existsSync(STATE_PATH)) return { seen: {}, lastCheckedAt: null, lastInboxCount: 0 }
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'))
  } catch {
    return { seen: {}, lastCheckedAt: null, lastInboxCount: 0 }
  }
}

function writeState (state) {
  ensureDirs()
  fs.writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, 'utf-8')
}

function getHeaders (json = false) {
  const headers = {}
  if (json) headers['content-type'] = 'application/json'
  if (BRAIN_API_TOKEN) headers.authorization = `Bearer ${BRAIN_API_TOKEN}`
  return headers
}

async function fetchJson (pathname, options = {}) {
  const response = await fetch(`${BRAIN_API_URL}${pathname}`, options)
  const text = await response.text()
  const data = text ? JSON.parse(text) : {}
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${data.error || text || pathname}`)
  }
  return data
}

function formatLocalTime (value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function escapeNotificationText (text) {
  return String(text || '')
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ')
    .slice(0, 110)
}

function escapeHtml (text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function toFileUrl (filePath) {
  if (!fs.existsSync(filePath)) return ''
  return pathToFileURL(filePath).href
}

function priorityTone (priority) {
  const text = String(priority || '中')
  if (text.includes('高') || text.includes('紧急') || text.includes('P0') || text.includes('P1')) return 'high'
  if (text.includes('低') || text.includes('P3')) return 'low'
  return 'medium'
}

function statusTone (status) {
  const text = String(status || '').toLowerCase()
  if (text.includes('new') || text.includes('待')) return 'pending'
  if (text.includes('triaged')) return 'triaged'
  if (text.includes('acted') || text.includes('完成')) return 'acted'
  return 'default'
}

function notifyNative (notification) {
  try {
    const title = escapeNotificationText(notification.title || `新消息 · ${notification.source || 'unknown'}`)
    const body = escapeNotificationText(notification.content || '收到一条新的云端通知')
    const subtitle = escapeNotificationText(`Cloud Brain · ${notification.agent || 'agent'} / ${notification.source || 'unknown'}`)
    const groupId = escapeNotificationText(`cortexos-cloud-brain-${notification.id || Date.now()}`)
    const appIcon = toFileUrl(NOTIFICATION_ICON_PATH) || toFileUrl(HERO_PATH)
    const contentImage = toFileUrl(HERO_PATH)

    if (fs.existsSync('/opt/homebrew/bin/terminal-notifier')) {
      const args = [
        '/opt/homebrew/bin/terminal-notifier',
        '-title', `🧠 ${title}`,
        '-subtitle', subtitle,
        '-message', body,
        '-group', groupId,
        '-sound', 'default'
      ]

      if (appIcon) args.push('-appIcon', appIcon)
      if (contentImage) args.push('-contentImage', contentImage)

      execSync(args.map(part => JSON.stringify(part)).join(' '))
      return
    }

    execSync(`osascript -e 'display notification "${body}" with title "🧠 ${title}" subtitle "${subtitle}"'`)
  } catch {}
}

function openInboxHtml () {
  try {
    execSync(`open ${JSON.stringify(INBOX_HTML_PATH)}`)
  } catch {}
}

function renderInboxMarkdown ({ notifications, tasks, memories, lastCheckedAt }) {
  const pendingNotifications = notifications.filter(item => ['new', 'triaged'].includes(String(item.status || '').toLowerCase()))
  const lines = [
    '# Cloud Brain Inbox',
    '',
    `- 项目: \`${BRAIN_PROJECT}\``,
    `- 上次检查: ${formatLocalTime(lastCheckedAt)}`,
    `- 未归档通知: ${pendingNotifications.length}`,
    `- 最近任务: ${tasks.length}`,
    `- 最近记忆: ${memories.length}`,
    ''
  ]

  lines.push('## Notifications')
  if (pendingNotifications.length === 0) {
    lines.push('', '- 当前没有待关注通知')
  } else {
    pendingNotifications.forEach((item) => {
      lines.push('', `### ${item.title || item.id}`)
      lines.push(`- 状态: \`${item.status}\` | 优先级: \`${item.priority}\``)
      lines.push(`- 来源: \`${item.source}\` | Agent: \`${item.agent}\``)
      lines.push(`- 时间: ${formatLocalTime(item.createdAt)}`)
      lines.push(`- 内容: ${item.content}`)
    })
  }

  lines.push('', '## Tasks')
  if (tasks.length === 0) {
    lines.push('', '- 当前没有最近任务')
  } else {
    tasks.forEach((item) => {
      lines.push('', `- [${item.status}] ${item.title} (${item.priority})`)
    })
  }

  lines.push('', '## Memories')
  if (memories.length === 0) {
    lines.push('', '- 当前没有最近记忆')
  } else {
    memories.forEach((item) => {
      lines.push('', `- ${item.summary || item.content.slice(0, 60)} [${item.agent}/${item.source}]`)
    })
  }

  return `${lines.join('\n')}\n`
}

function renderNotificationCard (item) {
  return `
    <article class="notice-card tone-${statusTone(item.status)} priority-${priorityTone(item.priority)}">
      <div class="notice-card__meta">
        <span class="pill pill-status">${escapeHtml(item.status || 'new')}</span>
        <span class="pill pill-priority">${escapeHtml(item.priority || '中')}</span>
        <span class="notice-card__time">${escapeHtml(formatLocalTime(item.createdAt))}</span>
      </div>
      <h3>${escapeHtml(item.title || item.id)}</h3>
      <p>${escapeHtml(item.content || '')}</p>
      <footer>
        <span>${escapeHtml(item.agent || 'unknown')}</span>
        <span>${escapeHtml(item.source || 'unknown')}</span>
      </footer>
    </article>`
}

function renderTaskCard (item) {
  return `
    <article class="mini-card task-card priority-${priorityTone(item.priority)}">
      <div class="mini-card__top">
        <span class="pill pill-status">${escapeHtml(item.status || '执行中')}</span>
        <span class="pill pill-priority">${escapeHtml(item.priority || '中')}</span>
      </div>
      <h4>${escapeHtml(item.title || item.taskId || '未命名任务')}</h4>
      <p>${escapeHtml(item.owner || '待分配')} · ${escapeHtml(item.assigneeAgent || '未指定')}</p>
    </article>`
}

function renderMemoryCard (item) {
  return `
    <article class="mini-card memory-card">
      <div class="mini-card__top">
        <span class="pill pill-memory">${escapeHtml(item.kind || 'memory')}</span>
        <span class="mini-card__time">${escapeHtml(formatLocalTime(item.createdAt))}</span>
      </div>
      <h4>${escapeHtml(item.summary || item.title || '未命名记忆')}</h4>
      <p>${escapeHtml((item.content || '').slice(0, 120))}</p>
    </article>`
}

function renderInboxHtml ({ notifications, tasks, memories, lastCheckedAt }) {
  const pendingNotifications = notifications.filter(item => ['new', 'triaged'].includes(String(item.status || '').toLowerCase()))
  const logoUrl = toFileUrl(LOGO_PATH)
  const heroUrl = toFileUrl(HERO_PATH)
  const notificationCards = pendingNotifications.length > 0
    ? pendingNotifications.map(renderNotificationCard).join('\n')
    : '<div class="empty-state">当前没有待关注通知</div>'
  const taskCards = tasks.length > 0
    ? tasks.map(renderTaskCard).join('\n')
    : '<div class="empty-state small">当前没有最近任务</div>'
  const memoryCards = memories.length > 0
    ? memories.map(renderMemoryCard).join('\n')
    : '<div class="empty-state small">当前没有最近记忆</div>'

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Cloud Brain Inbox</title>
  <style>
    :root {
      --bg: #08101d;
      --panel: rgba(10, 18, 32, 0.78);
      --panel-strong: rgba(12, 20, 36, 0.92);
      --border: rgba(255, 215, 140, 0.16);
      --text: #eef3ff;
      --muted: #97a6c3;
      --gold: #f1c36f;
      --green: #2ee58a;
      --blue: #78b7ff;
      --red: #ff6d7a;
      --shadow: 0 28px 80px rgba(0,0,0,.38);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(255, 201, 110, .12), transparent 30%),
        radial-gradient(circle at top right, rgba(79, 150, 255, .11), transparent 26%),
        linear-gradient(180deg, #0a1120 0%, #07111f 48%, #060c16 100%);
      padding: 36px;
    }
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background-image: linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
      background-size: 30px 30px;
      opacity: .15;
    }
    .shell {
      position: relative;
      max-width: 1280px;
      margin: 0 auto;
      display: grid;
      gap: 24px;
    }
    .hero {
      position: relative;
      overflow: hidden;
      border: 1px solid var(--border);
      border-radius: 28px;
      background: var(--panel);
      box-shadow: var(--shadow);
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      min-height: 260px;
    }
    .hero__content { padding: 32px; position: relative; z-index: 1; }
    .hero__eyebrow { color: var(--gold); font-size: 12px; letter-spacing: .28em; text-transform: uppercase; }
    .hero h1 { margin: 14px 0 10px; font-size: 42px; line-height: 1.02; }
    .hero p { margin: 0; max-width: 58ch; line-height: 1.7; color: var(--muted); }
    .hero__stats { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 24px; }
    .metric {
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 999px;
      padding: 10px 14px;
      color: var(--text);
      font-size: 13px;
    }
    .metric strong { color: var(--gold); margin-left: 8px; }
    .hero__art {
      position: relative;
      border-left: 1px solid rgba(255,255,255,.05);
      background:
        linear-gradient(180deg, rgba(255,255,255,.04), transparent),
        url('${heroUrl}') center/cover no-repeat;
      min-height: 260px;
    }
    .hero__logo {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      padding: 12px;
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.08);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(14px);
    }
    .hero__logo img { width: 100%; height: 100%; object-fit: contain; }
    .section {
      border: 1px solid var(--border);
      border-radius: 24px;
      background: var(--panel-strong);
      box-shadow: var(--shadow);
      padding: 22px;
    }
    .section__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
    }
    .section__head h2 { margin: 0; font-size: 20px; }
    .section__sub { color: var(--muted); font-size: 13px; }
    .notice-grid, .tri-grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    }
    .notice-card, .mini-card {
      background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 20px;
      padding: 18px;
      min-height: 180px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .notice-card h3, .mini-card h4 { margin: 0; line-height: 1.35; }
    .notice-card p, .mini-card p { margin: 0; color: var(--muted); line-height: 1.65; }
    .notice-card__meta, .mini-card__top {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .notice-card__time, .mini-card__time { margin-left: auto; color: var(--muted); font-size: 12px; }
    .notice-card footer {
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      gap: 10px;
      color: var(--muted);
      font-size: 12px;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 12px;
      border: 1px solid rgba(255,255,255,.08);
      background: rgba(255,255,255,.04);
      color: var(--text);
    }
    .priority-high .pill-priority, .tone-pending .pill-status { color: #111; background: linear-gradient(135deg, #ffd488, #ffb24c); }
    .priority-medium .pill-priority, .tone-triaged .pill-status { background: rgba(80, 146, 255, .16); color: #a9cbff; }
    .priority-low .pill-priority, .tone-acted .pill-status, .pill-memory { background: rgba(46, 229, 138, .14); color: #8ef3be; }
    .notice-card.priority-high, .task-card.priority-high { border-color: rgba(255, 193, 99, .28); }
    .notice-card.priority-medium, .task-card.priority-medium { border-color: rgba(120, 183, 255, .2); }
    .notice-card.priority-low, .task-card.priority-low { border-color: rgba(46, 229, 138, .18); }
    .empty-state {
      min-height: 180px;
      border: 1px dashed rgba(255,255,255,.12);
      border-radius: 20px;
      display: grid;
      place-items: center;
      color: var(--muted);
      background: rgba(255,255,255,.02);
    }
    .empty-state.small { min-height: 140px; }
    @media (max-width: 980px) {
      body { padding: 20px; }
      .hero { grid-template-columns: 1fr; }
      .hero__art { min-height: 180px; border-left: 0; border-top: 1px solid rgba(255,255,255,.05); }
      .hero h1 { font-size: 34px; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <div class="hero__content">
        <div class="hero__logo">${logoUrl ? `<img src="${logoUrl}" alt="CortexOS" />` : '🧠'}</div>
        <div class="hero__eyebrow">CortexOS / Cloud Brain Inbox</div>
        <h1>大脑收件箱</h1>
        <p>这里显示云端大脑刚刚收到的通知、自动分诊后的任务，以及最近沉淀的重点知识。现在不再只是普通系统弹窗，而是你本地主脑自己的视觉面板。</p>
        <div class="hero__stats">
          <span class="metric">项目<strong>${escapeHtml(BRAIN_PROJECT)}</strong></span>
          <span class="metric">待处理通知<strong>${pendingNotifications.length}</strong></span>
          <span class="metric">最近任务<strong>${tasks.length}</strong></span>
          <span class="metric">最近记忆<strong>${memories.length}</strong></span>
          <span class="metric">上次检查<strong>${escapeHtml(formatLocalTime(lastCheckedAt))}</strong></span>
        </div>
      </div>
      <div class="hero__art"></div>
    </section>

    <section class="section">
      <div class="section__head">
        <h2>待处理通知</h2>
        <div class="section__sub">新通知会在这里先落地，再决定是进记忆、进任务，还是直接归档。</div>
      </div>
      <div class="notice-grid">${notificationCards}</div>
    </section>

    <section class="section">
      <div class="section__head">
        <h2>最近任务</h2>
        <div class="section__sub">自动分诊后，真正需要你继续处理的事项会进入任务层。</div>
      </div>
      <div class="tri-grid">${taskCards}</div>
    </section>

    <section class="section">
      <div class="section__head">
        <h2>最近记忆</h2>
        <div class="section__sub">通知不是都进长期记忆，只有高价值信息才会被沉淀下来。</div>
      </div>
      <div class="tri-grid">${memoryCards}</div>
    </section>
  </main>
</body>
</html>`
}

async function autoTriageNotification (notification) {
  const suggestion = suggestTriageAction(notification)
  if (!AUTO_TRIAGE) {
    return {
      id: notification.id,
      action: 'none',
      suggestion: suggestion.action,
      skipped: true
    }
  }

  const result = await fetchJson(`/notifications/${notification.id}/triage`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({
      action: suggestion.action,
      summary: suggestion.summary
    })
  })

  return {
    id: notification.id,
    action: suggestion.action,
    suggestion: suggestion.action,
    skipped: false,
    createdType: result.created?.type || null
  }
}

async function main () {
  ensureDirs()
  const state = readState()

  const notificationsResponse = await fetchJson(`/notifications?project=${encodeURIComponent(BRAIN_PROJECT)}&limit=${BRAIN_INBOX_LIMIT}`, {
    headers: getHeaders(false)
  })

  const notifications = Array.isArray(notificationsResponse.notifications) ? notificationsResponse.notifications : []

  const fresh = notifications.filter(item => !state.seen?.[item.id])
  const triageResults = []

  for (const notification of fresh) {
    console.log(`[brain-inbox] 新通知: ${notification.title || notification.id} <${notification.id}>`)
    notifyNative(notification)
    const triageResult = await autoTriageNotification(notification)
    triageResults.push(triageResult)
    state.seen[notification.id] = {
      seenAt: new Date().toISOString(),
      title: notification.title || '',
      action: triageResult.action
    }
  }

  state.lastCheckedAt = new Date().toISOString()
  const notificationsAfterResponse = await fetchJson(`/notifications?project=${encodeURIComponent(BRAIN_PROJECT)}&limit=${BRAIN_INBOX_LIMIT}`, {
    headers: getHeaders(false)
  })
  const tasksResponse = await fetchJson(`/tasks?project=${encodeURIComponent(BRAIN_PROJECT)}&limit=10`, {
    headers: getHeaders(false)
  })
  const memoriesResponse = await fetchJson(`/memories?project=${encodeURIComponent(BRAIN_PROJECT)}&limit=10`, {
    headers: getHeaders(false)
  })

  const notificationsAfter = Array.isArray(notificationsAfterResponse.notifications) ? notificationsAfterResponse.notifications : []
  const tasks = Array.isArray(tasksResponse.tasks) ? tasksResponse.tasks : []
  const memories = Array.isArray(memoriesResponse.memories) ? memoriesResponse.memories : []

  state.lastInboxCount = notificationsAfter.filter(item => ['new', 'triaged'].includes(String(item.status || '').toLowerCase())).length
  writeState(state)

  fs.writeFileSync(
    INBOX_MARKDOWN_PATH,
    renderInboxMarkdown({
      notifications: notificationsAfter,
      tasks,
      memories,
      lastCheckedAt: state.lastCheckedAt
    }),
    'utf-8'
  )

  fs.writeFileSync(
    INBOX_HTML_PATH,
    renderInboxHtml({
      notifications: notificationsAfter,
      tasks,
      memories,
      lastCheckedAt: state.lastCheckedAt
    }),
    'utf-8'
  )

  if (fresh.length > 0 && OPEN_ON_NEW) {
    openInboxHtml()
  }

  console.log(JSON.stringify({
    ok: true,
    project: BRAIN_PROJECT,
    notifications: notificationsAfter.length,
    newNotifications: fresh.length,
    autoTriaged: triageResults.filter(item => !item.skipped).length,
    autoTriageEnabled: AUTO_TRIAGE,
    inboxFile: INBOX_MARKDOWN_PATH,
    inboxHtmlFile: INBOX_HTML_PATH,
    stateFile: STATE_PATH
  }))
}

await main()
