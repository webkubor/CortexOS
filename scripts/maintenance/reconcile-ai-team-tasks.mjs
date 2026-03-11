#!/usr/bin/env node

import { ensureAiTeamDb } from '../lib/ai-team-db.mjs'
import { completeAiTeamTask } from '../lib/ai-team-state.mjs'

const IDLE_TASK_TEXTS = new Set(['', '待分配任务', '待分配', '待命状态', '待命', '空闲', '无任务', '心跳打卡'])
const EXPLICIT_DONE_PATTERNS = [
  /\[总结\]/i,
  /已圆满完成/u,
  /总结/u,
  /结案/u,
  /收尾/u,
  /闭环/u,
  /终态/u
]

function stripValue(value) {
  return String(value ?? '').trim()
}

function parseArgs(argv) {
  const args = {
    thresholdMinutes: 20,
    dryRun: false
  }

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (token === '--threshold-minutes' && argv[i + 1]) {
      const value = Number(argv[++i])
      if (Number.isFinite(value) && value > 0) args.thresholdMinutes = value
    } else if (token === '--dry-run') {
      args.dryRun = true
    } else if (token === '--help' || token === '-h') {
      args.help = true
    }
  }

  return args
}

function printHelp() {
  console.log('用法:')
  console.log('  node scripts/maintenance/reconcile-ai-team-tasks.mjs [--threshold-minutes 20] [--dry-run]')
}

function extractTaskIds(text) {
  const matches = String(text || '').match(/\b(?:task[-#]?\d{1,14}(?:-[a-z0-9-]+)?|\d{4}-\d{2}-\d{2}-[a-z0-9-]+)\b/ig) || []
  return matches.map(item => item.toLowerCase())
}

function parseTimestamp(value) {
  const raw = stripValue(value)
  if (!raw) return 0
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  const ts = Date.parse(normalized)
  return Number.isFinite(ts) ? ts : 0
}

function isIdleTask(task) {
  const text = stripValue(task).replace(/\s+/g, '')
  return IDLE_TASK_TEXTS.has(text)
}

function hasExplicitDoneSignal(title) {
  const text = stripValue(title)
  return EXPLICIT_DONE_PATTERNS.some(pattern => pattern.test(text))
}

function loadAgents(db) {
  return db.prepare(`
    SELECT
      member_id AS memberId,
      alias,
      agent_name AS agentName,
      workspace,
      task,
      status,
      updated_at AS updatedAt,
      heartbeat_at AS heartbeatAt
    FROM agents
    ORDER BY updated_at DESC, id DESC
  `).all()
}

function loadOpenTasks(db) {
  return db.prepare(`
    SELECT
      task_id AS taskId,
      title,
      assignee,
      assignee_member_id AS assigneeMemberId,
      assignee_agent AS assigneeAgent,
      assignee_role AS assigneeRole,
      workspace,
      status,
      completed,
      updated_at AS updatedAt,
      published_at AS publishedAt
    FROM tasks
    WHERE completed = 0
    ORDER BY updated_at DESC, id DESC
  `).all()
}

function shouldAutoCompleteTask(task, agents, thresholdMinutes) {
  const taskId = stripValue(task.taskId)
  const title = stripValue(task.title)
  const updatedAt = parseTimestamp(task.updatedAt || task.publishedAt)
  const ageMs = updatedAt > 0 ? Date.now() - updatedAt : Number.MAX_SAFE_INTEGER
  const thresholdMs = thresholdMinutes * 60 * 1000

  if (hasExplicitDoneSignal(title)) {
    return {
      ok: true,
      reason: 'title-explicit-done'
    }
  }

  const assigneeMemberId = stripValue(task.assigneeMemberId)
  if (!assigneeMemberId) {
    return { ok: false, reason: 'missing-assignee-member' }
  }

  const member = agents.find(item => stripValue(item.memberId).toLowerCase() === assigneeMemberId.toLowerCase())
  if (!member) {
    return ageMs >= thresholdMs
      ? { ok: true, reason: 'assignee-missing-and-stale' }
      : { ok: false, reason: 'assignee-missing-but-fresh' }
  }

  const memberTaskText = stripValue(member.task)
  const liveTaskIds = extractTaskIds(memberTaskText)
  if (liveTaskIds.includes(taskId.toLowerCase())) {
    return { ok: false, reason: 'still-live' }
  }

  if (isIdleTask(memberTaskText)) {
    return ageMs >= thresholdMs
      ? { ok: true, reason: 'member-idle-and-task-stale' }
      : { ok: false, reason: 'member-idle-but-fresh' }
  }

  if (liveTaskIds.length > 0) {
    return ageMs >= thresholdMs
      ? { ok: true, reason: 'member-switched-to-new-task' }
      : { ok: false, reason: 'member-switched-but-fresh' }
  }

  return { ok: false, reason: 'no-safe-signal' }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }

  const db = ensureAiTeamDb()
  const agents = loadAgents(db)
  const tasks = loadOpenTasks(db)
  db.close()

  const candidates = tasks
    .map(task => ({ task, decision: shouldAutoCompleteTask(task, agents, args.thresholdMinutes) }))
    .filter(item => item.decision.ok)

  if (args.dryRun) {
    const preview = candidates.map(item => ({
      taskId: item.task.taskId,
      title: item.task.title,
      reason: item.decision.reason
    }))
    console.log(JSON.stringify({
      ok: true,
      mode: 'dry-run',
      thresholdMinutes: args.thresholdMinutes,
      count: preview.length,
      tasks: preview
    }, null, 2))
    return
  }

  const completed = []
  for (const item of candidates) {
    const result = completeAiTeamTask(item.task.taskId, {
      operator: 'system',
      memberId: item.task.assigneeMemberId || '',
      reason: `tasks:reconcile:${item.decision.reason}`,
      summary: '自动纠偏：任务已脱离当前 live 执行链路，收口为已完成'
    })
    completed.push({
      taskId: result.taskId,
      title: result.title,
      reason: item.decision.reason
    })
  }

  console.log(JSON.stringify({
    ok: true,
    thresholdMinutes: args.thresholdMinutes,
    completedCount: completed.length,
    tasks: completed
  }, null, 2))
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
