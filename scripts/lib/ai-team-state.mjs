import { ensureAiTeamDb } from './ai-team-db.mjs'
import { inferRoleFromTask, normalizeAgent, normalizeRole } from './agent-utils.mjs'

function stripMarkdown(value) {
  return String(value ?? '')
    .replace(/`/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .trim()
}

function nowLocal() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

function nowIso() {
  return new Date().toISOString()
}

function parseDate(value) {
  const text = String(value || '').trim()
  if (!text || !text.includes('-')) return new Date(0)
  return new Date(text.replace(/-/g, '/'))
}

function priorityRank(priority) {
  const text = String(priority || '').toLowerCase()
  if (['high', '紧急', '高', '🔴'].some(token => text.includes(token))) return 0
  if (['medium', '重要', '中', '🟡'].some(token => text.includes(token))) return 1
  if (['low', '低', '🟢'].some(token => text.includes(token))) return 2
  return 3
}

function extractTaskIds(text) {
  const matches = String(text || '').match(/\b(?:task[-#]?\d{1,8}(?:-[a-z0-9-]+)?|\d{4}-\d{2}-\d{2}-[a-z0-9-]+)\b/ig) || []
  return matches.map(match => match.toLowerCase())
}

function buildTaskQueue(db) {
  const rows = db.prepare(`
    SELECT
      task_id AS taskId,
      title,
      assignee,
      assignee_member_id AS assigneeMemberId,
      assignee_agent AS assigneeAgent,
      assignee_role AS assigneeRole,
      workspace,
      published_at AS publishedAt,
      status,
      priority,
      priority_rank AS priorityRank,
      completed,
      updated_at AS updatedAt
    FROM tasks
    ORDER BY completed ASC, priority_rank ASC, updated_at DESC, task_id ASC
    LIMIT 20
  `).all()

  return rows.map((task, index) => ({
    id: `任务-${String(index + 1).padStart(2, '0')}`,
    taskId: task.taskId,
    title: task.title || task.taskId,
    status: task.completed ? '已完成' : (task.status || '待启动'),
    owner: task.assignee || '待分配',
    priority: task.priority || '未标注',
    assigneeMemberId: task.assigneeMemberId || '',
    assigneeAgent: task.assigneeAgent || '',
    assigneeRole: task.assigneeRole || '',
    workspace: task.workspace || '',
    publishedAt: task.publishedAt || ''
  }))
}

function parseLiveTaskRecord(agent) {
  const text = stripMarkdown(agent?.task || '')
  if (isIdleTaskText(text)) return null

  const parts = text.split('｜').map(part => stripMarkdown(part)).filter(Boolean)
  const hasTaskId = parts.length > 1 && /^(task[-#]?\d|\d{4}-\d{2}-\d{2}-)/i.test(parts[0])

  return {
    taskId: hasTaskId ? parts[0] : '',
    title: hasTaskId ? parts.slice(1).join('｜') : text,
    status: '执行中',
    priority: '当前',
    publishedAt: '',
    updatedAt: agent?.heartbeatAt || agent?.updatedAt || nowIso(),
    isLive: true
  }
}

function findExistingOpenTask(db, { taskId = '', title = '', memberId = '', agentName = '', workspace = '', assignee = '' }) {
  const normalizedTaskId = stripMarkdown(taskId)
  if (normalizedTaskId) {
    return db.prepare(`
      SELECT
        task_id AS taskId,
        title,
        assignee,
        assignee_member_id AS assigneeMemberId,
        assignee_agent AS assigneeAgent,
        assignee_role AS assigneeRole,
      workspace,
      published_at AS publishedAt,
      status,
      priority,
      completed
      FROM tasks
      WHERE lower(task_id) = lower(?)
      LIMIT 1
    `).get(normalizedTaskId) || null
  }

  const normalizedTitle = stripMarkdown(title)
  if (!normalizedTitle) return null

  return db.prepare(`
    SELECT
      task_id AS taskId,
      title,
      assignee,
      assignee_member_id AS assigneeMemberId,
      assignee_agent AS assigneeAgent,
      assignee_role AS assigneeRole,
      workspace,
      published_at AS publishedAt,
      status,
      priority,
      completed
    FROM tasks
    WHERE completed = 0
      AND lower(title) = lower(?)
      AND (
        lower(assignee_member_id) = lower(?)
        OR (
          (assignee_member_id IS NULL OR assignee_member_id = '')
          AND lower(assignee_agent) = lower(?)
          AND lower(workspace) = lower(?)
          AND lower(assignee) = lower(?)
        )
      )
    ORDER BY updated_at DESC, id DESC
    LIMIT 1
  `).get(
    normalizedTitle,
    stripMarkdown(memberId),
    stripMarkdown(agentName),
    stripMarkdown(workspace),
    stripMarkdown(assignee)
  ) || null
}

function buildMemberRecentTasks(db, agent, limit = 6) {
  const rows = db.prepare(`
    SELECT
      task_id AS taskId,
      title,
      status,
      priority,
      published_at AS publishedAt,
      updated_at AS updatedAt,
      completed
    FROM tasks
    WHERE lower(assignee_member_id) = lower(?)
      OR (
        (assignee_member_id IS NULL OR assignee_member_id = '')
        AND lower(assignee_agent) = lower(?)
        AND lower(workspace) = lower(?)
        AND lower(assignee) = lower(?)
      )
    ORDER BY completed ASC, updated_at DESC, id DESC
    LIMIT ?
  `).all(
    stripMarkdown(agent?.memberId || ''),
    stripMarkdown(agent?.agentName || ''),
    stripMarkdown(agent?.workspace || ''),
    stripMarkdown(agent?.alias || agent?.memberId || ''),
    limit
  )

  const recentTasks = rows.map((task) => ({
    taskId: task.taskId,
    title: task.title || task.taskId,
    status: Number(task.completed) === 1 ? '已完成' : (task.status || '待启动'),
    priority: task.priority || '未标注',
    publishedAt: task.publishedAt || '',
    updatedAt: task.updatedAt || '',
    isLive: false
  }))

  const liveTask = parseLiveTaskRecord(agent)
  if (!liveTask) {
    return recentTasks
  }

  const matchedTask = recentTasks.find((task) => {
    if (liveTask.taskId && task.taskId) {
      return liveTask.taskId.toLowerCase() === task.taskId.toLowerCase()
    }
    return task.title === liveTask.title
  })

  if (matchedTask) {
    matchedTask.isLive = true
    matchedTask.status = liveTask.status
    return recentTasks
  }

  return [liveTask, ...recentTasks].slice(0, limit)
}

function buildRecentTaskMap(db, agents) {
  const lookup = new Map()
  for (const agent of agents) {
    const key = agent.identityKey || agent.memberId
    lookup.set(key, buildMemberRecentTasks(db, agent))
  }
  return lookup
}

function normalizeTaskRecord(task, index = 0) {
  const status = stripMarkdown(task.status || '待启动')
  const completed = status === '已完成' ? 1 : 0
  const priority = stripMarkdown(task.priority || '未标注')
  const explicitTaskId = stripMarkdown(task.taskId || task.id || '')
  return {
    taskId: explicitTaskId || `task-${Date.now()}-${index + 1}`,
    title: stripMarkdown(task.title || task.taskId || `任务-${index + 1}`),
    assignee: stripMarkdown(task.owner || task.assignee || '待分配'),
    assigneeMemberId: stripMarkdown(task.assigneeMemberId || ''),
    assigneeAgent: stripMarkdown(task.assigneeAgent || ''),
    assigneeRole: stripMarkdown(task.assigneeRole || ''),
    workspace: stripMarkdown(task.workspace || ''),
    publishedAt: stripMarkdown(task.publishedAt || nowIso()),
    status,
    priority,
    priorityRank: priorityRank(priority),
    completed,
    updatedAt: nowIso(),
    syncedAt: nowIso()
  }
}

function generateTaskId() {
  const stamp = nowIso().replace(/[-:TZ.]/g, '').slice(0, 12)
  return `task-${stamp}-${Math.random().toString(36).slice(2, 6)}`
}

function insertTaskRecord(db, normalized, { operator = 'system', reason = 'tasks:create', action = 'create-task' } = {}) {
  db.prepare(`
    INSERT INTO tasks (
      task_id,
      title,
      assignee,
      assignee_member_id,
      assignee_agent,
      assignee_role,
      workspace,
      published_at,
      status,
      priority,
      priority_rank,
      completed,
      updated_at,
      synced_at
    ) VALUES (
      @taskId,
      @title,
      @assignee,
      @assigneeMemberId,
      @assigneeAgent,
      @assigneeRole,
      @workspace,
      @publishedAt,
      @status,
      @priority,
      @priorityRank,
      @completed,
      @updatedAt,
      @syncedAt
    )
    ON CONFLICT(task_id) DO UPDATE SET
      title = excluded.title,
      assignee = excluded.assignee,
      assignee_member_id = excluded.assignee_member_id,
      assignee_agent = excluded.assignee_agent,
      assignee_role = excluded.assignee_role,
      workspace = excluded.workspace,
      published_at = CASE
        WHEN tasks.published_at IS NULL OR tasks.published_at = '' THEN excluded.published_at
        ELSE tasks.published_at
      END,
      status = excluded.status,
      priority = excluded.priority,
      priority_rank = excluded.priority_rank,
      completed = excluded.completed,
      updated_at = excluded.updated_at,
      synced_at = excluded.synced_at
  `).run(normalized)

  db.prepare(`
    INSERT INTO operation_logs (action, target_type, target_id, payload_json)
    VALUES (?, ?, ?, ?)
  `).run(
    action,
    'tasks',
    normalized.taskId,
    JSON.stringify({
      operator,
      reason,
      taskId: normalized.taskId,
      title: normalized.title,
      workspace: normalized.workspace,
      assigneeMemberId: normalized.assigneeMemberId || null
    })
  )
}

function bindLiveTaskToFormalRecord(db, agent) {
  if (!agent || agent.type === 'offline') return null

  const liveTask = parseLiveTaskRecord(agent)
  if (!liveTask || !stripMarkdown(liveTask.title)) return null

  const existing = findExistingOpenTask(db, {
    taskId: liveTask.taskId,
    title: liveTask.title,
    memberId: agent.memberId,
    agentName: agent.agentName,
    workspace: agent.workspace,
    assignee: agent.alias || agent.memberId
  })

  const resolvedTaskId = stripMarkdown(liveTask.taskId || existing?.taskId || generateTaskId())
  const resolvedTitle = stripMarkdown(existing?.title || liveTask.title)
  const publishedAt = stripMarkdown(existing?.publishedAt || nowLocal())
  const priority = stripMarkdown(existing?.priority || '未标注')

  insertTaskRecord(db, {
    taskId: resolvedTaskId,
    title: resolvedTitle,
    assignee: stripMarkdown(agent.alias || agent.memberId),
    assigneeMemberId: stripMarkdown(agent.memberId),
    assigneeAgent: stripMarkdown(agent.agentName),
    assigneeRole: stripMarkdown(agent.role),
    workspace: stripMarkdown(agent.workspace),
    publishedAt,
    status: '执行中',
    priority,
    priorityRank: priorityRank(priority),
    completed: 0,
    updatedAt: nowIso(),
    syncedAt: nowIso()
  }, {
    operator: stripMarkdown(agent.agentName || 'system'),
    reason: 'tasks:sync-live-agent-task',
    action: 'sync-live-task'
  })

  agent.task = `${resolvedTaskId}｜${resolvedTitle}`
  return {
    taskId: resolvedTaskId,
    title: resolvedTitle
  }
}

export function replaceAiTeamTasks(tasks = [], { operator = 'system', reason = 'tasks:replace' } = {}) {
  const db = ensureAiTeamDb()
  const normalized = tasks.map((task, index) => normalizeTaskRecord(task, index))
  const clearTasks = db.prepare('DELETE FROM tasks')
  const insertTask = db.prepare(`
    INSERT INTO tasks (
      task_id,
      title,
      assignee,
      assignee_member_id,
      assignee_agent,
      assignee_role,
      workspace,
      published_at,
      status,
      priority,
      priority_rank,
      completed,
      updated_at,
      synced_at
    ) VALUES (
      @taskId,
      @title,
      @assignee,
      @assigneeMemberId,
      @assigneeAgent,
      @assigneeRole,
      @workspace,
      @publishedAt,
      @status,
      @priority,
      @priorityRank,
      @completed,
      @updatedAt,
      @syncedAt
    )
  `)

  const transaction = db.transaction(() => {
    clearTasks.run()
    for (const task of normalized) {
      insertTask.run(task)
    }

    db.prepare(`
      INSERT INTO operation_logs (action, target_type, target_id, payload_json)
      VALUES (?, ?, ?, ?)
    `).run(
      'replace-tasks',
      'tasks',
      null,
      JSON.stringify({
        operator,
        reason,
        total: normalized.length,
        tasks: normalized.map(task => ({
          taskId: task.taskId,
          title: task.title,
          status: task.status
        }))
      })
    )
  })

  transaction()
  db.close()
  return normalized
}

export function createAiTeamTask(task, { operator = 'system', reason = 'tasks:create' } = {}) {
  const db = ensureAiTeamDb()
  const normalized = normalizeTaskRecord(task)
  if (!normalized.title) {
    db.close()
    throw new Error('任务标题不能为空')
  }
  if (!normalized.workspace) {
    db.close()
    throw new Error('工作路径不能为空')
  }

  if (!normalized.taskId) {
    normalized.taskId = generateTaskId()
  }
  insertTaskRecord(db, normalized, { operator, reason, action: 'create-task' })

  db.close()
  return normalized
}

export function deleteAiTeamTask(taskId, { operator = 'system', reason = 'tasks:delete' } = {}) {
  const normalizedTaskId = stripMarkdown(taskId)
  if (!normalizedTaskId) {
    throw new Error('taskId 不能为空')
  }

  const db = ensureAiTeamDb()
  const existing = db.prepare(`
    SELECT
      task_id AS taskId,
      title,
      status,
      completed,
      workspace
    FROM tasks
    WHERE lower(task_id) = lower(?)
    LIMIT 1
  `).get(normalizedTaskId)

  if (!existing) {
    db.close()
    throw new Error(`未找到任务: ${normalizedTaskId}`)
  }

  if (Number(existing.completed) === 1 || stripMarkdown(existing.status) !== '待启动') {
    db.close()
    throw new Error('仅允许删除待启动任务')
  }

  db.prepare('DELETE FROM tasks WHERE lower(task_id) = lower(?)').run(normalizedTaskId)
  db.prepare(`
    INSERT INTO operation_logs (action, target_type, target_id, payload_json)
    VALUES (?, ?, ?, ?)
  `).run(
    'delete-task',
    'tasks',
    existing.taskId,
    JSON.stringify({
      operator,
      reason,
      taskId: existing.taskId,
      title: existing.title,
      workspace: existing.workspace
    })
  )

  db.close()
  return existing
}

function isIdleTaskText(task) {
  const text = stripMarkdown(task)
  if (!text) return true
  const normalized = text.replace(/\s+/g, '')
  return [
    '待分配任务',
    '待分配',
    '待命状态',
    '待命',
    '空闲',
    '无任务',
    '心跳打卡'
  ].includes(normalized)
}

function pickIdleAgentForWorkspace(agents, workspace) {
  const normalizedWorkspace = stripMarkdown(workspace)
  return agents
    .filter(agent => agent.workspace === normalizedWorkspace)
    .filter(agent => agent.type !== 'offline')
    .filter(agent => isIdleTaskText(agent.task))
    .sort((a, b) => {
      if (Boolean(a.isCaptain) !== Boolean(b.isCaptain)) {
        return Number(a.isCaptain) - Number(b.isCaptain)
      }
      if (a.type !== b.type) {
        if (a.type === 'active') return -1
        if (b.type === 'active') return 1
      }
      return parseDate(b.heartbeatAt || b.updatedAt) - parseDate(a.heartbeatAt || a.updatedAt)
    })[0] || null
}

export function createAndDispatchAiTeamTask(task, { operator = 'system', reason = 'tasks:create-dispatch' } = {}) {
  const agents = getCurrentAgents().map(item => ({ ...item }))
  const normalized = normalizeTaskRecord(task)
  if (!normalized.title) {
    throw new Error('任务标题不能为空')
  }
  if (!normalized.workspace) {
    throw new Error('工作路径不能为空')
  }

  if (!normalized.taskId) {
    normalized.taskId = generateTaskId()
  }

  const idleAgent = pickIdleAgentForWorkspace(agents, normalized.workspace)
  if (idleAgent) {
    normalized.assignee = idleAgent.alias || idleAgent.memberId
    normalized.assigneeMemberId = idleAgent.memberId
    normalized.assigneeAgent = idleAgent.agentName
    normalized.assigneeRole = idleAgent.role
    normalized.status = '执行中'
    normalized.completed = 0
  }

  const db = ensureAiTeamDb()
  insertTaskRecord(db, normalized, {
    operator,
    reason,
    action: idleAgent ? 'dispatch-task' : 'create-task'
  })
  db.close()

  if (idleAgent) {
    idleAgent.task = `${normalized.taskId}｜${normalized.title}`
    idleAgent.updatedAt = nowLocal()
    idleAgent.heartbeatAt = idleAgent.heartbeatAt || idleAgent.updatedAt
    if (!idleAgent.isCaptain) {
      idleAgent.type = 'active'
      idleAgent.status = '[ 执行中 ] 活跃'
    }

    persistAiTeamAgents(agents, {
      action: 'dispatch-task',
      operator,
      reason,
      payload: {
        taskId: normalized.taskId,
        workspace: normalized.workspace,
        assigneeMemberId: idleAgent.memberId
      }
    })
  }

  return {
    task: normalized,
    dispatched: Boolean(idleAgent),
    assignee: idleAgent
      ? {
          memberId: idleAgent.memberId,
          alias: idleAgent.alias,
          agent: idleAgent.agentName,
          role: idleAgent.role,
          workspace: idleAgent.workspace
        }
      : null
  }
}

export function assignAiTeamTaskToMember(task, memberId, { operator = 'system', reason = 'tasks:assign-member' } = {}) {
  const normalizedMemberId = stripMarkdown(memberId)
  if (!normalizedMemberId) {
    throw new Error('memberId 不能为空')
  }

  const agents = getCurrentAgents().map(item => ({ ...item }))
  const target = agents.find(agent => agent.memberId === normalizedMemberId)
  if (!target) {
    throw new Error(`未找到成员: ${normalizedMemberId}`)
  }
  if (target.type === 'offline') {
    throw new Error('离线成员不能直接领取任务')
  }

  const normalized = normalizeTaskRecord(task)
  if (!normalized.title) {
    throw new Error('任务标题不能为空')
  }
  if (!normalized.workspace) {
    normalized.workspace = stripMarkdown(target.workspace || '')
  }
  if (!normalized.workspace) {
    throw new Error('工作路径不能为空')
  }
  if (!normalized.taskId) {
    normalized.taskId = generateTaskId()
  }

  normalized.assignee = target.alias || target.memberId
  normalized.assigneeMemberId = target.memberId
  normalized.assigneeAgent = target.agentName
  normalized.assigneeRole = target.role
  normalized.completed = 0

  const targetBusy = !isIdleTaskText(target.task)
  normalized.status = targetBusy ? '待启动' : '执行中'

  const db = ensureAiTeamDb()
  insertTaskRecord(db, normalized, {
    operator,
    reason,
    action: 'assign-task'
  })
  db.close()

  if (!targetBusy) {
    target.task = `${normalized.taskId}｜${normalized.title}`
    target.updatedAt = nowLocal()
    target.heartbeatAt = target.heartbeatAt || target.updatedAt
    if (!target.isCaptain) {
      target.type = 'active'
      target.status = '[ 执行中 ] 活跃'
    }

    persistAiTeamAgents(agents, {
      action: 'assign-task',
      operator,
      reason,
      payload: {
        taskId: normalized.taskId,
        workspace: normalized.workspace,
        assigneeMemberId: target.memberId
      }
    })
  }

  return {
    task: normalized,
    assignee: {
      memberId: target.memberId,
      alias: target.alias,
      agent: target.agentName,
      role: target.role,
      workspace: target.workspace
    },
    activated: !targetBusy
  }
}

export function completeAiTeamTask(taskId, {
  memberId = '',
  summary = '',
  operator = 'system',
  reason = 'tasks:complete'
} = {}) {
  const normalizedTaskId = stripMarkdown(taskId)
  if (!normalizedTaskId) {
    throw new Error('taskId 不能为空')
  }

  const db = ensureAiTeamDb()
  const existing = db.prepare(`
    SELECT
      task_id AS taskId,
      title,
      assignee,
      assignee_member_id AS assigneeMemberId,
      assignee_agent AS assigneeAgent,
      assignee_role AS assigneeRole,
      workspace,
      status,
      completed
    FROM tasks
    WHERE lower(task_id) = lower(?)
    LIMIT 1
  `).get(normalizedTaskId)

  if (!existing) {
    db.close()
    throw new Error(`未找到任务: ${normalizedTaskId}`)
  }

  if (Number(existing.completed) === 1 || stripMarkdown(existing.status) === '已完成') {
    db.close()
    return existing
  }

  const completedAt = nowIso()
  db.prepare(`
    UPDATE tasks
    SET
      status = '已完成',
      completed = 1,
      updated_at = ?,
      synced_at = ?
    WHERE lower(task_id) = lower(?)
  `).run(completedAt, completedAt, normalizedTaskId)

  db.prepare(`
    INSERT INTO operation_logs (action, target_type, target_id, payload_json)
    VALUES (?, ?, ?, ?)
  `).run(
    'complete-task',
    'tasks',
    existing.taskId,
    JSON.stringify({
      operator,
      reason,
      taskId: existing.taskId,
      title: existing.title,
      memberId: stripMarkdown(memberId || existing.assigneeMemberId || ''),
      summary: stripMarkdown(summary || '')
    })
  )
  db.close()

  const normalizedMemberId = stripMarkdown(memberId || existing.assigneeMemberId || '')
  if (normalizedMemberId) {
    const agents = getCurrentAgents().map(item => ({ ...item }))
    const target = agents.find(agent => agent.memberId === normalizedMemberId)
    if (target) {
      const liveTaskIds = extractTaskIds(target.task)
      if (liveTaskIds.includes(existing.taskId.toLowerCase())) {
        target.task = '待分配任务'
        target.updatedAt = nowLocal()
        target.heartbeatAt = target.heartbeatAt || target.updatedAt
        persistAiTeamAgents(agents, {
          action: 'complete-task',
          operator,
          reason,
          payload: {
            taskId: existing.taskId,
            memberId: target.memberId,
            summary: stripMarkdown(summary || '')
          }
        })
      }
    }
  }

  return {
    ...existing,
    status: '已完成',
    completed: 1,
    completedAt
  }
}

function statusToType(status) {
  const text = String(status ?? '')
  if (text.includes('已离线')) return 'offline'
  if (text.includes('等待分配') || text.includes('待处理')) return 'queued'
  if (text.includes('执行中') || text.includes('队长锁')) return 'active'
  return 'unknown'
}

function compareAgentOrder(a, b) {
  const rank = (agent) => {
    if (agent.isCaptain) return 0
    if (agent.type === 'active') return 1
    if (agent.type === 'queued') return 2
    if (agent.type === 'offline') return 3
    return 4
  }

  const rankDiff = rank(a) - rank(b)
  if (rankDiff !== 0) return rankDiff
  return parseDate(b.updatedAt || b.heartbeatAt) - parseDate(a.updatedAt || a.heartbeatAt)
}

function buildPrimeMemberId(agent) {
  return `${agent.alias}-Prime (0号机/${agent.agentName})`
}

function buildIdentityKey(agent) {
  const agentName = stripMarkdown(agent.agentName || 'Unknown')
  const alias = stripMarkdown(agent.alias || agentName)
  const workspace = stripMarkdown(agent.workspace)
  return `${agentName}::${alias}::${workspace}`
}

function isPrimeMemberId(memberId) {
  const text = stripMarkdown(memberId).toLowerCase()
  return text.includes('-prime') || text.includes('0号机')
}

function chooseWorkerMemberId(agent, agents, excludedIds = new Set()) {
  const baseAlias = agent.alias || 'Agent'
  const baseAgent = agent.agentName || 'Unknown'
  const current = stripMarkdown(agent.memberId)

  if (current && !isPrimeMemberId(current) && !excludedIds.has(current)) {
    return current
  }

  const used = new Set(
    agents
      .map(item => stripMarkdown(item.memberId))
      .filter(memberId => memberId && !excludedIds.has(memberId))
  )

  for (let index = 1; index < 1000; index++) {
    const candidate = `${baseAlias}-${index} (${baseAgent})`
    if (!used.has(candidate)) return candidate
  }

  return `${baseAlias}-9999 (${baseAgent})`
}

function syncTaskClaimsFromAgents(db, agents) {
  const tasks = db.prepare(`
    SELECT
      task_id AS taskId,
      assignee,
      assignee_member_id AS assigneeMemberId,
      assignee_agent AS assigneeAgent,
      assignee_role AS assigneeRole
    FROM tasks
  `).all()

  const claims = new Map()
  for (const agent of agents) {
    if (agent.type === 'offline') continue
    for (const taskId of extractTaskIds(agent.task)) {
      claims.set(taskId, {
        assignee: agent.alias || agent.memberId,
        assigneeMemberId: agent.memberId,
        assigneeAgent: agent.agentName,
        assigneeRole: agent.role,
        workspace: agent.workspace
      })
    }
  }

  const updateClaim = db.prepare(`
    UPDATE tasks
    SET
      assignee = @assignee,
      assignee_member_id = @assigneeMemberId,
      assignee_agent = @assigneeAgent,
      assignee_role = @assigneeRole,
      workspace = @workspace,
      synced_at = @syncedAt
    WHERE task_id = @taskId
  `)

  for (const task of tasks) {
    const claim = claims.get(String(task.taskId || '').toLowerCase())
    if (!claim) continue
    updateClaim.run({
      taskId: task.taskId,
      ...claim,
      syncedAt: nowIso()
    })
  }
}

function syncTaskRecordsFromAgents(db, agents) {
  for (const agent of agents) {
    bindLiveTaskToFormalRecord(db, agent)
  }
}

function reconcileTaskAssignments(db, agents) {
  const tasks = db.prepare(`
    SELECT
      task_id AS taskId,
      title,
      assignee,
      assignee_member_id AS assigneeMemberId,
      assignee_agent AS assigneeAgent,
      assignee_role AS assigneeRole,
      workspace,
      completed,
      status
    FROM tasks
    WHERE completed = 0
  `).all()

  const activeAgents = agents.filter(agent => agent.type !== 'offline')
  if (activeAgents.length === 0) return

  const updateClaim = db.prepare(`
    UPDATE tasks
    SET
      assignee = @assignee,
      assignee_member_id = @assigneeMemberId,
      assignee_agent = @assigneeAgent,
      assignee_role = @assigneeRole,
      workspace = @workspace,
      synced_at = @syncedAt
    WHERE task_id = @taskId
  `)

  for (const task of tasks) {
    const currentMemberId = stripMarkdown(task.assigneeMemberId)
    if (currentMemberId && activeAgents.some(agent => agent.memberId === currentMemberId)) continue

    let candidates = activeAgents.slice()
    const normalizedWorkspace = stripMarkdown(task.workspace)
    const normalizedAgent = normalizeAgent(task.assigneeAgent)
    const normalizedAssignee = stripMarkdown(task.assignee)

    if (normalizedWorkspace) {
      const workspaceMatches = candidates.filter(agent => agent.workspace === normalizedWorkspace)
      if (workspaceMatches.length > 0) candidates = workspaceMatches
    }

    if (normalizedAgent) {
      const agentMatches = candidates.filter(agent => agent.agentName === normalizedAgent)
      if (agentMatches.length > 0) candidates = agentMatches
    }

    if (normalizedAssignee && normalizedAssignee !== '待分配') {
      const assigneeMatches = candidates.filter(agent =>
        agent.alias === normalizedAssignee || agent.memberId === normalizedAssignee
      )
      if (assigneeMatches.length > 0) candidates = assigneeMatches
    }

    if (candidates.length !== 1) continue

    const resolved = candidates[0]
    updateClaim.run({
      taskId: task.taskId,
      assignee: resolved.alias || resolved.memberId,
      assigneeMemberId: resolved.memberId,
      assigneeAgent: resolved.agentName,
      assigneeRole: resolved.role,
      workspace: resolved.workspace || normalizedWorkspace,
      syncedAt: nowIso()
    })
  }
}

function normalizeStoredAgent(agent) {
  const normalized = {
    identityKey: stripMarkdown(agent.identityKey || ''),
    memberId: stripMarkdown(agent.memberId || agent.nodeId),
    nodeId: stripMarkdown(agent.nodeId || agent.memberId),
    agentName: normalizeAgent(agent.agentName),
    alias: stripMarkdown(agent.alias || 'Agent'),
    role: normalizeRole(agent.role || inferRoleFromTask(agent.task)),
    workspace: stripMarkdown(agent.workspace),
    task: stripMarkdown(agent.task || '待分配任务'),
    type: stripMarkdown(agent.type || statusToType(agent.status)),
    isCaptain: agent.isCaptain ? 1 : 0,
    status: stripMarkdown(agent.status || '[ 执行中 ] 活跃'),
    heartbeatAt: stripMarkdown(agent.heartbeatAt || agent.updatedAt || nowLocal()),
    updatedAt: stripMarkdown(agent.updatedAt || agent.heartbeatAt || nowLocal())
  }

  if (!normalized.identityKey) {
    normalized.identityKey = buildIdentityKey(normalized)
  }

  if (normalized.isCaptain) {
    normalized.type = 'active'
    normalized.status = '[ 队长锁 ] 活跃'
    normalized.memberId = buildPrimeMemberId(normalized)
  }

  if (!normalized.nodeId) normalized.nodeId = normalized.memberId
  return normalized
}

function loadAgentsFromDb() {
  const db = ensureAiTeamDb()
  const agents = db.prepare(`
    SELECT
      identity_key AS identityKey,
      member_id AS memberId,
      node_id AS nodeId,
      agent_name AS agentName,
      alias,
      role,
      workspace,
      task,
      type,
      is_captain AS isCaptain,
      status,
      heartbeat_at AS heartbeatAt,
      updated_at AS updatedAt
    FROM agents
    ORDER BY is_captain DESC, updated_at DESC, agent_name ASC
  `).all().map(agent => normalizeStoredAgent(agent))
  db.close()
  return agents
}

function persistAiTeamAgents(agents, { action = 'sync', operator = 'system', payload = null, reason = '', persistLog = true } = {}) {
  const normalizedAgents = agents.map(normalizeStoredAgent)
  const db = ensureAiTeamDb()
  syncTaskRecordsFromAgents(db, normalizedAgents)

  const previousCaptain = db.prepare(`
    SELECT member_id
    FROM agents
    WHERE is_captain = 1
    LIMIT 1
  `).get()

  const syncAgents = db.transaction((rows) => {
    const seen = []
    const upsertAgent = db.prepare(`
      INSERT INTO agents (
        member_id,
        identity_key,
        node_id,
        agent_name,
        alias,
        role,
        workspace,
        task,
        type,
        is_captain,
        status,
        heartbeat_at,
        updated_at
      ) VALUES (
        @memberId,
        @identityKey,
        @nodeId,
        @agentName,
        @alias,
        @role,
        @workspace,
        @task,
        @type,
        @isCaptain,
        @status,
        @heartbeatAt,
        @updatedAt
      )
      ON CONFLICT(identity_key) DO UPDATE SET
        node_id = excluded.node_id,
        member_id = excluded.member_id,
        agent_name = excluded.agent_name,
        alias = excluded.alias,
        role = excluded.role,
        workspace = excluded.workspace,
        task = excluded.task,
        type = excluded.type,
        is_captain = excluded.is_captain,
        status = excluded.status,
        heartbeat_at = excluded.heartbeat_at,
        updated_at = excluded.updated_at
    `)

    for (const agent of rows) {
      seen.push(agent.identityKey)
      upsertAgent.run(agent)
    }

    if (seen.length > 0) {
      const placeholders = seen.map(() => '?').join(', ')
      db.prepare(`DELETE FROM agents WHERE identity_key NOT IN (${placeholders})`).run(...seen)
    } else {
      db.prepare('DELETE FROM agents').run()
    }
  })

  syncAgents(normalizedAgents)
  syncTaskClaimsFromAgents(db, normalizedAgents)
  reconcileTaskAssignments(db, normalizedAgents)

  const nextCaptain = db.prepare(`
    SELECT member_id
    FROM agents
    WHERE is_captain = 1
    LIMIT 1
  `).get()

  if (persistLog && (previousCaptain?.member_id || null) !== (nextCaptain?.member_id || null) && nextCaptain?.member_id) {
    db.prepare(`
      INSERT INTO captain_events (from_member_id, to_member_id, reason, operator)
      VALUES (?, ?, ?, ?)
    `).run(
      previousCaptain?.member_id || null,
      nextCaptain.member_id,
      reason || `fleet:${action}`,
      operator
    )
  }

  if (persistLog) {
    db.prepare(`
      INSERT INTO operation_logs (action, target_type, target_id, payload_json)
      VALUES (?, ?, ?, ?)
    `).run(
      action,
      'fleet',
      nextCaptain?.member_id || null,
      JSON.stringify({
        operator,
        reason,
        agents: normalizedAgents.map(agent => ({
          memberId: agent.memberId,
          agentName: agent.agentName,
          workspace: agent.workspace,
          isCaptain: Boolean(agent.isCaptain)
        })),
        payload
      })
    )
  }

  db.close()

  return {
    ok: true,
    action,
    totalAgents: normalizedAgents.length,
    captain: nextCaptain?.member_id || null,
    agents: normalizedAgents.slice().sort(compareAgentOrder)
  }
}

function pickSuccessor(agents, excludedMemberId = '') {
  return agents
    .filter(agent => agent.memberId !== excludedMemberId)
    .filter(agent => agent.type !== 'offline')
    .sort((a, b) => parseDate(b.heartbeatAt || b.updatedAt) - parseDate(a.heartbeatAt || a.updatedAt))[0] || null
}

function refreshCaptainPresentation(agent) {
  agent.isCaptain = 1
  agent.type = 'active'
  agent.status = '[ 队长锁 ] 活跃'
  agent.memberId = buildPrimeMemberId(agent)
  agent.nodeId = agent.memberId
  agent.updatedAt = nowLocal()
}

function refreshWorkerPresentation(agent, agents, excludedIds = new Set()) {
  agent.isCaptain = 0
  if (agent.type !== 'offline') {
    agent.type = 'active'
    agent.status = '[ 执行中 ] 活跃'
  }
  agent.memberId = chooseWorkerMemberId(agent, agents, excludedIds)
  agent.nodeId = agent.memberId
  agent.updatedAt = nowLocal()
}

function getCurrentAgents() {
  const agents = loadAgentsFromDb()
  return agents.slice().sort(compareAgentOrder)
}

function findAgentByIdentity(agents, { workspace, agentName, alias, nodeId = '', allowLegacyFallback = false }) {
  const normalizedNodeId = stripMarkdown(nodeId)
  const normalizedWorkspace = stripMarkdown(workspace)
  const normalizedAgentName = normalizeAgent(agentName)
  const normalizedAlias = stripMarkdown(alias || normalizedAgentName)
  const identityKey = buildIdentityKey({
    workspace: normalizedWorkspace,
    agentName: normalizedAgentName,
    alias: normalizedAlias
  })

  if (normalizedNodeId) {
    const byNodeId = agents.find(row => row.memberId === normalizedNodeId)
    if (byNodeId) return byNodeId
  }

  const byIdentityKey = agents.find(row => row.identityKey === identityKey)
  if (byIdentityKey) return byIdentityKey

  const byAlias = agents.find(row =>
    row.workspace === normalizedWorkspace &&
    row.agentName === normalizedAgentName &&
    row.alias === normalizedAlias
  )
  if (byAlias) return byAlias

  if (!allowLegacyFallback) return null

  return agents.find(row => row.workspace === normalizedWorkspace && row.agentName === normalizedAgentName) || null
}

export function claimAiTeamMember({ workspace, task, agent, alias, role, status = '[ 执行中 ] 活跃' }) {
  const agents = getCurrentAgents().map(item => ({ ...item }))
  const normalizedWorkspace = stripMarkdown(workspace)
  const normalizedAgent = normalizeAgent(agent)
  const normalizedAlias = stripMarkdown(alias || normalizedAgent)
  const normalizedRole = normalizeRole(role || inferRoleFromTask(task))
  const normalizedTask = stripMarkdown(task)
  const heartbeatAt = nowLocal()

  const sameWorkspaceRows = agents.filter(row => row.workspace === normalizedWorkspace)
  const sameWorkspaceSameAgentRow = findAgentByIdentity(agents, {
    workspace: normalizedWorkspace,
    agentName: normalizedAgent,
    alias: normalizedAlias,
    allowLegacyFallback: false
  })
  const parallelRows = sameWorkspaceRows.filter(row => row.memberId !== sameWorkspaceSameAgentRow?.memberId)
  const warnings = []
  if (parallelRows.length > 0) {
    warnings.push(`同一路径已有其他模型在线: ${parallelRows.map(row => `${row.agentName}（${row.memberId}）`).join('、')}。已允许并行登记，请注意文件冲突。`)
  }

  let target = sameWorkspaceSameAgentRow
  if (!target) {
    target = {
      memberId: `${normalizedAlias}-1 (${normalizedAgent})`,
      identityKey: '',
      nodeId: '',
      agentName: normalizedAgent,
      alias: normalizedAlias,
      role: normalizedRole,
      workspace: normalizedWorkspace,
      task: normalizedTask,
      type: statusToType(status),
      isCaptain: 0,
      status,
      heartbeatAt,
      updatedAt: heartbeatAt
    }
    agents.push(target)
  }

  target.agentName = normalizedAgent
  target.alias = normalizedAlias
  target.role = normalizedRole
  target.workspace = normalizedWorkspace
  target.task = normalizedTask
  target.identityKey = buildIdentityKey(target)
  target.heartbeatAt = heartbeatAt
  target.updatedAt = heartbeatAt

  const hasCaptain = agents.some(row => row.isCaptain)
  if (!hasCaptain || target.isCaptain) {
    agents.forEach(row => {
      if (row.memberId === target.memberId) return
      row.isCaptain = 0
      if (row.type !== 'offline') {
        row.type = 'active'
        row.status = '[ 执行中 ] 活跃'
      }
    })
    target.isCaptain = 1
    target.type = 'active'
    target.status = '[ 队长锁 ] 活跃'
  } else {
    target.isCaptain = 0
    target.type = statusToType(status)
    target.status = status
  }

  const usedIds = new Set(agents.filter(row => row !== target).map(row => row.memberId))
  if (target.isCaptain) {
    target.memberId = buildPrimeMemberId(target)
  } else {
    target.memberId = chooseWorkerMemberId(target, agents, usedIds)
  }
  target.nodeId = target.memberId

  const result = persistAiTeamAgents(agents, {
    action: 'claim',
    operator: normalizedAgent,
    reason: 'fleet:claim',
    payload: { workspace: normalizedWorkspace, task: normalizedTask, role: normalizedRole }
  })

  return {
    ...result,
    machineNumber: target.isCaptain ? 0 : Number((target.memberId.match(/-(\d+) \(/) || [])[1] || 0),
    nodeId: target.memberId,
    warnings
  }
}

export function checkinAiTeamMember({ workspace, agent, alias = '', role, task, status = '[ 执行中 ] 活跃', nodeId = '', heartbeatAt = nowLocal() }) {
  const agents = getCurrentAgents().map(item => ({ ...item }))
  const normalizedWorkspace = stripMarkdown(workspace)
  const normalizedAgent = normalizeAgent(agent)
  const normalizedAlias = stripMarkdown(alias || normalizedAgent)
  const normalizedRole = normalizeRole(role || inferRoleFromTask(task))
  const normalizedTask = stripMarkdown(task || '心跳打卡')
  const normalizedNodeId = stripMarkdown(nodeId)

  let target = findAgentByIdentity(agents, {
    workspace: normalizedWorkspace,
    agentName: normalizedAgent,
    alias: normalizedAlias,
    nodeId: normalizedNodeId,
    allowLegacyFallback: !alias && !normalizedNodeId
  })
  if (!target) {
    const claimResult = claimAiTeamMember({
      workspace: normalizedWorkspace,
      task: normalizedTask,
      agent: normalizedAgent,
      alias: normalizedAlias,
      role: normalizedRole,
      status
    })
    return {
      ...claimResult,
      action: 'checkin'
    }
  }

  target.alias = normalizedAlias
  target.role = normalizedRole
  target.task = normalizedTask
  target.identityKey = buildIdentityKey(target)
  target.heartbeatAt = heartbeatAt
  target.updatedAt = heartbeatAt
  if (!target.isCaptain) {
    target.status = status
    target.type = statusToType(status)
  } else {
    target.status = '[ 队长锁 ] 活跃'
    target.type = 'active'
  }

  const result = persistAiTeamAgents(agents, {
    action: 'checkin',
    operator: normalizedAgent,
    reason: 'fleet:checkin',
    payload: { workspace: normalizedWorkspace, nodeId: target.memberId }
  })

  return {
    ...result,
    nodeId: target.memberId,
    heartbeatAt
  }
}

export function makeAiTeamCaptain(memberId, { operator = 'bridge', reason = 'bridge:make-captain', payload = null } = {}) {
  const agents = getCurrentAgents().map(item => ({ ...item }))
  const target = agents.find(agent => agent.memberId === stripMarkdown(memberId))
  if (!target) {
    throw new Error(`未找到目标节点: ${memberId}`)
  }

  const previousCaptain = agents.find(agent => agent.isCaptain)
  const targetOriginalId = target.memberId

  for (const agent of agents) {
    if (agent.memberId === targetOriginalId) continue
    if (!agent.isCaptain) continue
    agent.isCaptain = 0
    if (agent.type !== 'offline') {
      agent.type = 'active'
      agent.status = '[ 执行中 ] 活跃'
    }
    agent.memberId = chooseWorkerMemberId(agent, agents, new Set([targetOriginalId]))
    agent.nodeId = agent.memberId
    agent.updatedAt = nowLocal()
  }

  target.isCaptain = 1
  target.type = 'active'
  target.status = '[ 队长锁 ] 活跃'
  target.memberId = buildPrimeMemberId(target)
  target.nodeId = target.memberId
  target.updatedAt = nowLocal()

  const result = persistAiTeamAgents(agents, {
    action: 'make-captain',
    operator,
    reason,
    payload: {
      from: previousCaptain?.memberId || null,
      to: target.memberId,
      ...(payload || {})
    }
  })

  return {
    ...result,
    from: previousCaptain?.memberId || null,
    to: target.memberId
  }
}

export function markAiTeamMemberOffline(memberId, { operator = 'bridge', reason = 'bridge:kick-out', payload = null } = {}) {
  const agents = getCurrentAgents().map(item => ({ ...item }))
  const target = agents.find(agent => agent.memberId === stripMarkdown(memberId))
  if (!target) {
    throw new Error(`未找到目标节点: ${memberId}`)
  }

  const wasCaptain = Boolean(target.isCaptain)
  target.isCaptain = 0
  target.type = 'offline'
  target.status = '[ 已离线 ]'
  target.updatedAt = nowLocal()
  if (isPrimeMemberId(target.memberId)) {
    target.memberId = chooseWorkerMemberId(target, agents)
    target.nodeId = target.memberId
  }

  let successor = null
  if (wasCaptain) {
    successor = pickSuccessor(agents, target.memberId)
    if (successor) {
      successor.isCaptain = 1
      successor.type = 'active'
      successor.status = '[ 队长锁 ] 活跃'
      successor.memberId = buildPrimeMemberId(successor)
      successor.nodeId = successor.memberId
      successor.updatedAt = nowLocal()
    }
  }

  const result = persistAiTeamAgents(agents, {
    action: 'kick-out',
    operator,
    reason,
    payload: {
      memberId: stripMarkdown(memberId),
      successor: successor?.memberId || null,
      ...(payload || {})
    }
  })

  return {
    ...result,
    successor: successor?.memberId || null
  }
}

export function cleanupAiTeamState({ thresholdHours = 2, dryRun = false, operator = 'system', reason = 'fleet:cleanup' } = {}) {
  const agents = getCurrentAgents().map(agent => ({ ...agent }))
  const now = Date.now()
  const cleaned = []
  const survivors = []

  for (const agent of agents) {
    const heartbeatAt = parseDate(agent.heartbeatAt || agent.updatedAt).getTime()
    const diffHours = (now - heartbeatAt) / (1000 * 60 * 60)
    const isOffline = agent.type === 'offline' || String(agent.status).includes('已离线')
    const isExpired = diffHours > thresholdHours

    if (isOffline || isExpired) {
      cleaned.push({
        memberId: agent.memberId,
        reason: isOffline ? '已离线' : '已逾期'
      })
      continue
    }

    if (agent.type !== 'queued') {
      agent.type = 'active'
      agent.status = agent.isCaptain ? '[ 队长锁 ] 活跃' : '[ 执行中 ] 活跃'
    }
    survivors.push(agent)
  }

  let successor = null
  if (survivors.length > 0) {
    const aliveCaptain = survivors.find(agent => agent.isCaptain)

    if (aliveCaptain) {
      for (const agent of survivors) {
        if (agent.identityKey === aliveCaptain.identityKey) {
          refreshCaptainPresentation(agent)
          continue
        }
        refreshWorkerPresentation(agent, survivors, new Set([aliveCaptain.memberId]))
      }
    } else {
      successor = pickSuccessor(survivors)
      if (successor) {
        for (const agent of survivors) {
          if (agent.identityKey === successor.identityKey) {
            refreshCaptainPresentation(agent)
            continue
          }
          refreshWorkerPresentation(agent, survivors, new Set([successor.memberId]))
        }
      }
    }
  }

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      cleaned,
      successor: successor?.memberId || null,
      totalAgents: survivors.length
    }
  }

  const result = persistAiTeamAgents(survivors, {
    action: 'cleanup',
    operator,
    reason,
    payload: {
      cleaned,
      successor: successor?.memberId || null
    }
  })

  return {
    ...result,
    dryRun: false,
    cleaned,
    successor: successor?.memberId || null,
    totalAgents: survivors.length
  }
}

export function getAiTeamState() {
  const agents = getCurrentAgents()
  const db = ensureAiTeamDb()
  const missions = buildTaskQueue(db, agents)
  const recentTaskMap = buildRecentTaskMap(db, agents)
  const enrichedAgents = agents.map((agent) => ({
    ...agent,
    recentTasks: recentTaskMap.get(agent.identityKey || agent.memberId) || []
  }))
  const captain = enrichedAgents.find(agent => agent.isCaptain) || null
  const recentCaptainEvents = db.prepare(`
    SELECT
      id,
      from_member_id AS fromMemberId,
      to_member_id AS toMemberId,
      reason,
      operator,
      created_at AS createdAt
    FROM captain_events
    ORDER BY id DESC
    LIMIT 10
  `).all()

  const recentOperations = db.prepare(`
    SELECT
      id,
      action,
      target_type AS targetType,
      target_id AS targetId,
      created_at AS createdAt
    FROM operation_logs
    ORDER BY id DESC
    LIMIT 20
  `).all()

  db.close()

  return {
    generatedAt: new Date().toISOString(),
    total: enrichedAgents.length,
    active: enrichedAgents.filter(agent => agent.type === 'active').length,
    offline: enrichedAgents.filter(agent => agent.type === 'offline').length,
    queued: enrichedAgents.filter(agent => agent.type === 'queued').length,
    captain: captain ? captain.memberId : null,
    agents: enrichedAgents,
    missions,
    recentCaptainEvents,
    recentOperations
  }
}
