#!/usr/bin/env node

import fs from 'fs'
import os from 'os'
import path from 'path'

import { suggestTriageAction } from '../../services/brain-api/src/triage.js'
import { logEvent } from '../core/brain-console-log.mjs'

const PROJECT_ROOT = process.cwd()
const ASSISTANT_MEMORY_HOME = process.env.CORTEXOS_ASSISTANT_MEMORY_HOME || path.join(PROJECT_ROOT, '.memory')
const OWNER_MEMORY_HOME = process.env.CORTEXOS_OWNER_MEMORY_HOME || path.join(os.homedir(), 'Documents/memory')
const META_DIR = path.join(ASSISTANT_MEMORY_HOME, 'meta')
const STATE_PATH = path.join(META_DIR, 'memory-router-state.json')
const INDEX_PATH = path.join(OWNER_MEMORY_HOME, 'inbox', 'brain-router.md')
const RAW_NOTIFICATION_DIR = path.join(OWNER_MEMORY_HOME, 'inbox', 'brain-notifications')
const MEMORY_DRAFT_DIR = path.join(OWNER_MEMORY_HOME, 'drafts', 'memory')
const DOC_DRAFT_DIR = path.join(OWNER_MEMORY_HOME, 'drafts', 'docs')
const TASK_BRIEF_DIR = path.join(OWNER_MEMORY_HOME, 'drafts', 'tasks')

const BRAIN_API_URL = String(process.env.BRAIN_API_URL || 'https://brain-api-675793533606.asia-southeast2.run.app').trim()
const BRAIN_API_TOKEN = String(process.env.BRAIN_API_TOKEN || '').trim()
const BRAIN_PROJECT = String(process.env.BRAIN_DEFAULT_PROJECT || 'cortexos').trim()
const ROUTER_LIMIT = Math.min(Math.max(Number(process.env.BRAIN_ROUTER_LIMIT) || 40, 1), 200)

function ensureDirs () {
  for (const dir of [META_DIR, RAW_NOTIFICATION_DIR, MEMORY_DRAFT_DIR, DOC_DRAFT_DIR, TASK_BRIEF_DIR, path.dirname(INDEX_PATH)]) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function readState () {
  try {
    if (!fs.existsSync(STATE_PATH)) return { routed: {}, lastRunAt: null }
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'))
  } catch {
    return { routed: {}, lastRunAt: null }
  }
}

function writeState (state) {
  ensureDirs()
  fs.writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
}

function getHeaders (json = false) {
  const headers = { accept: 'application/json' }
  if (json) headers['content-type'] = 'application/json'
  if (BRAIN_API_TOKEN) headers.authorization = `Bearer ${BRAIN_API_TOKEN}`
  return headers
}

async function fetchJson (pathname) {
  const response = await fetch(`${BRAIN_API_URL}${pathname}`, { headers: getHeaders() })
  const text = await response.text()
  const data = text ? JSON.parse(text) : {}
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${data.error || text || pathname}`)
  return data
}

function normalizeText (value, fallback = '') {
  const text = String(value || '').trim()
  return text || fallback
}

function sanitizeSegment (value, fallback = 'item') {
  return normalizeText(value, fallback)
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || fallback
}

function formatTime (value) {
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

function deriveRoute (notification) {
  const type = normalizeText(notification.type, 'report').toLowerCase()
  const action = normalizeText(notification.triageAction).toLowerCase()
  const suggestion = suggestTriageAction(notification)
  const finalAction = action || suggestion.action

  if (type === 'task' || finalAction === 'task') return 'task_brief'
  if (type === 'alert') return finalAction === 'task' ? 'task_brief' : 'doc_draft'
  if (type === 'heartbeat' || finalAction === 'archive') return 'archive'

  const joined = `${notification.title || ''} ${notification.content || ''}`.toLowerCase()
  if (/(架构|协议|规范|api|路由|迁移|sop|工作流|部署|接入|同步)/.test(joined)) return 'doc_draft'

  return 'memory_draft'
}

function buildTitle (notification) {
  return normalizeText(notification.triageSummary || notification.title || notification.content, notification.id).slice(0, 80)
}

function buildSourceLine (notification) {
  const metadata = notification.metadata || {}
  const parts = [
    normalizeText(notification.agent),
    normalizeText(notification.source),
    normalizeText(metadata.nodeName || metadata.nodeId),
    normalizeText(metadata.environment),
    normalizeText(metadata.region)
  ].filter(Boolean)
  return parts.join(' / ') || 'unknown'
}

function buildFrontmatter (pairs) {
  const lines = ['---']
  for (const [key, value] of Object.entries(pairs)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) lines.push(`${key}: [${value.map(item => JSON.stringify(item)).join(', ')}]`)
    else lines.push(`${key}: ${JSON.stringify(value)}`)
  }
  lines.push('---', '')
  return lines.join('\n')
}

function renderRawNotification (notification) {
  const metadata = notification.metadata || {}
  return `${buildFrontmatter({
    source: 'cloud-brain',
    project: notification.project,
    notification_id: notification.id,
    type: notification.type || 'report',
    status: notification.status || 'new',
    triage_action: notification.triageAction || '',
    priority: notification.priority || 'medium',
    created_at: notification.createdAt || '',
    agent: notification.agent || '',
    source_node: notification.source || '',
    tags: notification.tags || []
  })}# ${buildTitle(notification)}

## 来源

- 节点: ${buildSourceLine(notification)}
- 主机: ${normalizeText(metadata.hostname, '未上报')}
- 工作区: ${normalizeText(metadata.workspace, '未上报')}

## 原始汇报

${normalizeText(notification.content, '（空）')}
`
}

function renderMemoryDraft (notification) {
  const metadata = notification.metadata || {}
  return `${buildFrontmatter({
    source: 'cloud-brain',
    route: 'memory_draft',
    project: notification.project,
    notification_id: notification.id,
    type: notification.type || 'report',
    triage_action: notification.triageAction || 'memory',
    created_at: notification.createdAt || '',
    agent: notification.agent || '',
    source_node: notification.source || '',
    tags: notification.tags || []
  })}# ${buildTitle(notification)}

## 重点摘要

${normalizeText(notification.triageSummary || notification.title || notification.content, '待补摘要')}

## 为什么重要

- 这条信息已被主脑判定为可沉淀的结果型信息
- 来源: ${buildSourceLine(notification)}
- 节点主机: ${normalizeText(metadata.hostname, '未上报')}

## 原始内容

${normalizeText(notification.content, '（空）')}

## 后续处理建议

- 如确认长期有效，可整理后并入 \`~/Documents/memory/projects/\` 或 \`~/Documents/memory/ops/\`
- 如只是阶段性结论，可在处理后归档本草稿
`
}

function renderDocDraft (notification) {
  const metadata = notification.metadata || {}
  return `${buildFrontmatter({
    source: 'cloud-brain',
    route: 'doc_draft',
    project: notification.project,
    notification_id: notification.id,
    type: notification.type || 'report',
    created_at: notification.createdAt || '',
    agent: notification.agent || '',
    source_node: notification.source || '',
    tags: notification.tags || []
  })}# ${buildTitle(notification)}

## 建议文档化主题

${normalizeText(notification.title || notification.triageSummary, '待定主题')}

## 写入理由

- 检测到该汇报含有协议、架构、接入、部署或规范类语义
- 来源: ${buildSourceLine(notification)}
- 工作区: ${normalizeText(metadata.workspace, '未上报')}

## 可提炼成的内容

1. 背景与目标
2. 变更内容
3. 接入/部署/验证步骤
4. 风险与注意事项

## 原始内容

${normalizeText(notification.content, '（空）')}
`
}

function renderTaskBrief (notification) {
  const metadata = notification.metadata || {}
  return `${buildFrontmatter({
    source: 'cloud-brain',
    route: 'task_brief',
    project: notification.project,
    notification_id: notification.id,
    type: notification.type || 'task',
    created_at: notification.createdAt || '',
    priority: notification.priority || 'medium',
    agent: notification.agent || '',
    source_node: notification.source || '',
    tags: notification.tags || []
  })}# ${buildTitle(notification)}

## 任务摘要

${normalizeText(notification.triageSummary || notification.title, '待补任务摘要')}

## 来源

- 节点: ${buildSourceLine(notification)}
- 主机: ${normalizeText(metadata.hostname, '未上报')}

## 原始内容

${normalizeText(notification.content, '（空）')}

## 建议

- 若需正式进入任务池，请在主脑中确认并补足 owner / priority / next step
`
}

function writeFileIfMissing (filePath, content) {
  if (fs.existsSync(filePath)) return false
  fs.writeFileSync(filePath, `${content.trimEnd()}\n`, 'utf8')
  return true
}

function writeRoutedArtifacts (notification) {
  ensureDirs()
  const createdAt = new Date(notification.createdAt || Date.now())
  const datePrefix = Number.isNaN(createdAt.getTime())
    ? 'unknown-date'
    : createdAt.toISOString().slice(0, 10)
  const slug = sanitizeSegment(buildTitle(notification), notification.id || 'item')
  const baseName = `${datePrefix}-${notification.id}-${slug}.md`

  const rawPath = path.join(RAW_NOTIFICATION_DIR, baseName)
  const route = deriveRoute(notification)
  const result = {
    route,
    rawPath,
    draftPath: null,
    createdRaw: writeFileIfMissing(rawPath, renderRawNotification(notification)),
    createdDraft: false
  }

  if (route === 'memory_draft') {
    result.draftPath = path.join(MEMORY_DRAFT_DIR, baseName)
    result.createdDraft = writeFileIfMissing(result.draftPath, renderMemoryDraft(notification))
  } else if (route === 'doc_draft') {
    result.draftPath = path.join(DOC_DRAFT_DIR, baseName)
    result.createdDraft = writeFileIfMissing(result.draftPath, renderDocDraft(notification))
  } else if (route === 'task_brief') {
    result.draftPath = path.join(TASK_BRIEF_DIR, baseName)
    result.createdDraft = writeFileIfMissing(result.draftPath, renderTaskBrief(notification))
  }

  return result
}

function renderIndex (entries, state) {
  const lines = [
    '# 中央大脑信息路由',
    '',
    `- 项目: \`${BRAIN_PROJECT}\``,
    `- 最近执行: ${formatTime(state.lastRunAt)}`,
    `- 已路由通知: ${Object.keys(state.routed || {}).length}`,
    ''
  ]

  const recent = entries.slice(0, 20)
  if (recent.length === 0) {
    lines.push('- 当前没有已路由条目')
  } else {
    for (const item of recent) {
      lines.push(`- [${item.route}] ${item.title} · ${item.source} · ${formatTime(item.createdAt)}`)
      if (item.draftPath) lines.push(`  - 草稿: \`${item.draftPath.replace(`${OWNER_MEMORY_HOME}/`, '')}\``)
      lines.push(`  - 原始: \`${item.rawPath.replace(`${OWNER_MEMORY_HOME}/`, '')}\``)
    }
  }

  return `${lines.join('\n')}\n`
}

async function main () {
  ensureDirs()
  const state = readState()
  const routed = state.routed || {}
  const response = await fetchJson(`/notifications?project=${encodeURIComponent(BRAIN_PROJECT)}&limit=${ROUTER_LIMIT}`)
  const notifications = Array.isArray(response.notifications) ? response.notifications : []
  const fresh = []

  for (const notification of notifications) {
    if (!notification?.id || routed[notification.id]) continue
    const artifact = writeRoutedArtifacts(notification)
    routed[notification.id] = {
      id: notification.id,
      title: buildTitle(notification),
      route: artifact.route,
      source: buildSourceLine(notification),
      createdAt: notification.createdAt || new Date().toISOString(),
      rawPath: artifact.rawPath,
      draftPath: artifact.draftPath
    }
    fresh.push({ notification, artifact })
  }

  const nextState = {
    ...state,
    routed,
    lastRunAt: new Date().toISOString()
  }

  const sortedEntries = Object.values(routed).sort((a, b) => Date.parse(b.createdAt || '') - Date.parse(a.createdAt || ''))
  fs.writeFileSync(INDEX_PATH, renderIndex(sortedEntries, nextState), 'utf8')
  writeState(nextState)

  if (fresh.length === 0) {
    logEvent('同步', 'memory-router', '待命', '无新增通知需要路由到用户记忆')
    console.log('[memory-router] 无新增通知需要路由')
    return
  }

  for (const item of fresh.slice(0, 5)) {
    logEvent('同步', 'memory-router', '完成', `${item.artifact.route} · ${item.notification.id}`)
  }
  console.log(`[memory-router] 已路由 ${fresh.length} 条通知到 ~/Documents/memory/`)
}

main().catch((error) => {
  logEvent('错误', 'memory-router', '异常', error.message)
  console.error(error)
  process.exit(1)
})
