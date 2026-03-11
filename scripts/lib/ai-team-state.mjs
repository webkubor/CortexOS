import { ensureAiTeamDb } from './ai-team-db.mjs'

function stripMarkdown(value) {
  return String(value ?? '')
    .replace(/`/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .trim()
}

function normalizeAgent(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return 'Unknown'
  const lower = raw.toLowerCase()
  if (lower.includes('gemini')) return 'Gemini'
  if (lower.includes('codex')) return 'Codex'
  if (lower.includes('claude')) return 'Claude'
  if (lower.includes('lobster')) return 'Lobster'
  if (lower.includes('opencode')) return 'OpenCode'
  return raw
}

function normalizeRole(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return '未分配'
  const lower = raw.toLowerCase()
  if (/(前端|frontend|front-end|fe)/i.test(lower)) return '前端'
  if (/(后端|backend|back-end|be)/i.test(lower)) return '后端'
  return raw
}

function inferRoleFromTask(task) {
  const text = String(task || '').toLowerCase()
  if (!text) return '未分配'
  if (/(前端|frontend|react|vue|页面|样式|css|ui|ux|h5|web)/i.test(text)) return '前端'
  if (/(后端|backend|api|服务|接口|数据库|db|sql|redis|中间件|server)/i.test(text)) return '后端'
  return '未分配'
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

function parseDate(value) {
  const text = String(value || '').trim()
  if (!text || !text.includes('-')) return new Date(0)
  return new Date(text.replace(/-/g, '/'))
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

function normalizeStoredAgent(agent) {
  const normalized = {
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
      ON CONFLICT(member_id) DO UPDATE SET
        node_id = excluded.node_id,
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
      seen.push(agent.memberId)
      upsertAgent.run(agent)
    }

    if (seen.length > 0) {
      const placeholders = seen.map(() => '?').join(', ')
      db.prepare(`DELETE FROM agents WHERE member_id NOT IN (${placeholders})`).run(...seen)
    } else {
      db.prepare('DELETE FROM agents').run()
    }
  })

  syncAgents(normalizedAgents)

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

function getCurrentAgents() {
  const agents = loadAgentsFromDb()
  return agents.slice().sort(compareAgentOrder)
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
  const sameWorkspaceSameAgentRow = sameWorkspaceRows.find(row => row.agentName === normalizedAgent)
  const parallelRows = sameWorkspaceRows.filter(row => row.memberId !== sameWorkspaceSameAgentRow?.memberId)
  const warnings = []
  if (parallelRows.length > 0) {
    warnings.push(`同一路径已有其他模型在线: ${parallelRows.map(row => `${row.agentName}（${row.memberId}）`).join('、')}。已允许并行登记，请注意文件冲突。`)
  }

  let target = sameWorkspaceSameAgentRow
  if (!target) {
    target = {
      memberId: `${normalizedAlias}-1 (${normalizedAgent})`,
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

  const normalizedAgents = agents.map(row => ({ ...row }))
  const usedIds = new Set(normalizedAgents.filter(row => row.memberId !== target.memberId).map(row => row.memberId))
  if (target.isCaptain) {
    target.memberId = buildPrimeMemberId(target)
  } else {
    target.memberId = chooseWorkerMemberId(target, normalizedAgents, usedIds)
  }
  target.nodeId = target.memberId

  const result = persistAiTeamAgents(normalizedAgents, {
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

export function checkinAiTeamMember({ workspace, agent, role, task, status = '[ 执行中 ] 活跃', nodeId = '', heartbeatAt = nowLocal() }) {
  const agents = getCurrentAgents().map(item => ({ ...item }))
  const normalizedWorkspace = stripMarkdown(workspace)
  const normalizedAgent = normalizeAgent(agent)
  const normalizedRole = normalizeRole(role || inferRoleFromTask(task))
  const normalizedTask = stripMarkdown(task || '心跳打卡')
  const normalizedNodeId = stripMarkdown(nodeId)

  let target = null
  if (normalizedNodeId) {
    target = agents.find(row => row.memberId === normalizedNodeId)
  }
  if (!target) {
    target = agents.find(row => row.workspace === normalizedWorkspace && row.agentName === normalizedAgent)
  }
  if (!target) {
    const claimResult = claimAiTeamMember({
      workspace: normalizedWorkspace,
      task: normalizedTask,
      agent: normalizedAgent,
      alias: normalizedAgent,
      role: normalizedRole,
      status
    })
    return {
      ...claimResult,
      action: 'checkin'
    }
  }

  target.role = normalizedRole
  target.task = normalizedTask
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

    agent.isCaptain = 0
    if (agent.type !== 'queued') {
      agent.type = 'active'
      agent.status = '[ 执行中 ] 活跃'
    }
    survivors.push(agent)
  }

  let successor = null
  if (survivors.length > 0) {
    successor = pickSuccessor(survivors)
    if (successor) {
      successor.isCaptain = 1
      successor.type = 'active'
      successor.status = '[ 队长锁 ] 活跃'
      successor.memberId = buildPrimeMemberId(successor)
      successor.nodeId = successor.memberId
      successor.updatedAt = nowLocal()
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
  const captain = agents.find(agent => agent.isCaptain) || null
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
    total: agents.length,
    active: agents.filter(agent => agent.type === 'active').length,
    offline: agents.filter(agent => agent.type === 'offline').length,
    queued: agents.filter(agent => agent.type === 'queued').length,
    captain: captain ? captain.memberId : null,
    agents,
    recentCaptainEvents,
    recentOperations
  }
}
