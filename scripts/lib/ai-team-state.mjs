import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ensureAiTeamDb } from './ai-team-db.mjs'
import { ensureFleetPaths } from '../actions/fleet-paths.mjs'
import { fleetMetaKey, loadFleetMeta } from '../actions/fleet-meta.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '../../')
const { fleetFile } = ensureFleetPaths(projectRoot)

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

function extractAgentFromNode(node) {
  const text = stripMarkdown(node).toLowerCase()
  if (text.includes('gemini')) return 'Gemini'
  if (text.includes('codex')) return 'Codex'
  if (text.includes('claude')) return 'Claude'
  if (text.includes('lobster')) return 'Lobster'
  if (text.includes('opencode')) return 'OpenCode'
  return 'Unknown'
}

function extractAlias(nodeText) {
  const clean = stripMarkdown(nodeText)
  if (!clean) return 'Agent'
  const primeMatch = clean.match(/^([^-]+)-Prime\b/i)
  if (primeMatch) return primeMatch[1].trim()
  const numberMatch = clean.match(/^([^-]+)-\d+\b/)
  if (numberMatch) return numberMatch[1].trim()
  const parenMatch = clean.match(/^([^(]+)\s*\(/)
  if (parenMatch) return parenMatch[1].trim()
  return clean.split(/\s+/)[0].trim() || 'Agent'
}

function statusToType(status) {
  const text = String(status ?? '')
  if (text.includes('已离线')) return 'offline'
  if (text.includes('等待分配')) return 'queued'
  if (text.includes('执行中') || text.includes('队长锁')) return 'active'
  return 'unknown'
}

function resolveStatus(rowStatus, metaStatus, isCaptain) {
  if (isCaptain) return rowStatus
  if (String(metaStatus || '').includes('队长锁')) return rowStatus
  return metaStatus || rowStatus
}

function parseTableRow(line) {
  const parts = line.split('|').slice(1, -1).map(part => part.trim())
  if (parts.length < 5) return null
  const nodeId = stripMarkdown(parts[0])
  if (!nodeId || nodeId.includes('节点 ID') || nodeId.includes('示例节点')) return null

  if (parts.length >= 7) {
    return {
      memberId: nodeId,
      nodeId,
      agentName: normalizeAgent(parts[1]),
      alias: extractAlias(parts[0]),
      role: normalizeRole(parts[2]),
      workspace: stripMarkdown(parts[3]),
      task: stripMarkdown(parts[4]),
      since: stripMarkdown(parts[5]),
      status: stripMarkdown(parts[6]),
      isCaptain: stripMarkdown(parts[6]).includes('队长锁')
    }
  }

  if (parts.length >= 6) {
    return {
      memberId: nodeId,
      nodeId,
      agentName: normalizeAgent(parts[1]),
      alias: extractAlias(parts[0]),
      role: normalizeRole(inferRoleFromTask(parts[3])),
      workspace: stripMarkdown(parts[2]),
      task: stripMarkdown(parts[3]),
      since: stripMarkdown(parts[4]),
      status: stripMarkdown(parts[5]),
      isCaptain: stripMarkdown(parts[5]).includes('队长锁')
    }
  }

  return {
    memberId: nodeId,
    nodeId,
    agentName: extractAgentFromNode(parts[0]),
    alias: extractAlias(parts[0]),
    role: normalizeRole(inferRoleFromTask(parts[2])),
    workspace: stripMarkdown(parts[1]),
    task: stripMarkdown(parts[2]),
    since: stripMarkdown(parts[3]),
    status: stripMarkdown(parts[4]),
    isCaptain: stripMarkdown(parts[4]).includes('队长锁')
  }
}

export function loadFleetSnapshot() {
  if (!fs.existsSync(fleetFile)) {
    throw new Error(`未找到舰队编排板: ${fleetFile}`)
  }

  const content = fs.readFileSync(fleetFile, 'utf8')
  const lines = content.split('\n')
  const headerIndex = lines.findIndex(line => line.includes('| 节点 ID (模型/别名) |'))
  if (headerIndex === -1) {
    throw new Error('舰队编排板缺少活跃节点表格头')
  }

  const meta = loadFleetMeta()
  const agents = []

  for (let index = headerIndex + 2; index < lines.length; index++) {
    const line = lines[index]
    if (!line.trim().startsWith('|')) break
    const row = parseTableRow(line)
    if (!row) continue

    const metaEntry = meta.entries[fleetMetaKey(row.agentName, row.workspace)] || {}
    const status = resolveStatus(row.status, metaEntry.lastStatus, row.isCaptain)
    agents.push({
      memberId: row.memberId,
      nodeId: metaEntry.nodeId || row.nodeId,
      agentName: row.agentName,
      alias: row.alias,
      role: normalizeRole(metaEntry.lastRole || row.role),
      workspace: row.workspace,
      task: metaEntry.lastTask || row.task,
      type: statusToType(status),
      isCaptain: row.isCaptain ? 1 : 0,
      status,
      heartbeatAt: metaEntry.lastHeartbeatAt || row.since,
      updatedAt: metaEntry.updatedAt || row.since
    })
  }

  return { agents }
}

export function syncAiTeamState({ action = 'sync', operator = 'system', payload = null, reason = '' } = {}) {
  const snapshot = loadFleetSnapshot()
  const db = ensureAiTeamDb()

  const previousCaptain = db.prepare(`
    SELECT member_id
    FROM agents
    WHERE is_captain = 1
    LIMIT 1
  `).get()

  const syncAgents = db.transaction((agents) => {
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

    for (const agent of agents) {
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

  syncAgents(snapshot.agents)

  const nextCaptain = db.prepare(`
    SELECT member_id
    FROM agents
    WHERE is_captain = 1
    LIMIT 1
  `).get()

  if ((previousCaptain?.member_id || null) !== (nextCaptain?.member_id || null) && nextCaptain?.member_id) {
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
      agents: snapshot.agents.map(agent => ({
        memberId: agent.memberId,
        agentName: agent.agentName,
        workspace: agent.workspace,
        isCaptain: Boolean(agent.isCaptain)
      })),
      payload
    })
  )

  db.close()

  return {
    ok: true,
    action,
    totalAgents: snapshot.agents.length,
    captain: nextCaptain?.member_id || null
  }
}
