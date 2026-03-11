import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '../../')
const dbDir = path.join(projectRoot, '.memory/sqlite')
const dbFile = path.join(dbDir, 'ai-team.db')
const schemaFile = path.join(projectRoot, 'scripts/sql/ai-team-schema.sql')

const agentColumns = {
  identity_key: 'TEXT',
  member_id: 'TEXT NOT NULL UNIQUE',
  node_id: 'TEXT',
  agent_name: 'TEXT NOT NULL',
  alias: 'TEXT',
  role: 'TEXT',
  workspace: 'TEXT',
  task: 'TEXT',
  type: 'TEXT',
  is_captain: 'INTEGER NOT NULL DEFAULT 0',
  status: 'TEXT',
  heartbeat_at: 'TEXT',
  created_at: 'TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP',
  updated_at: 'TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP'
}

const taskColumns = {
  task_id: 'TEXT NOT NULL UNIQUE',
  title: 'TEXT',
  assignee: 'TEXT',
  assignee_member_id: 'TEXT',
  assignee_agent: 'TEXT',
  assignee_role: 'TEXT',
  workspace: 'TEXT',
  published_at: 'TEXT',
  status: 'TEXT',
  priority: 'TEXT',
  priority_rank: 'INTEGER NOT NULL DEFAULT 3',
  completed: 'INTEGER NOT NULL DEFAULT 0',
  source_file: 'TEXT',
  updated_at: 'TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP',
  synced_at: 'TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP'
}

function getTableColumns(db, tableName) {
  return db.prepare(`PRAGMA table_info(${tableName})`).all()
}

function ensureTableColumns(db, tableName, expectedColumns) {
  const existingColumns = new Set(getTableColumns(db, tableName).map(column => column.name))
  for (const [columnName, columnDef] of Object.entries(expectedColumns)) {
    if (existingColumns.has(columnName)) continue
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`)
  }
}

function stripValue(value) {
  return String(value ?? '').trim()
}

function buildIdentityKey(row) {
  const agentName = stripValue(row.agent_name || row.agentName || 'Unknown')
  const alias = stripValue(row.alias || agentName)
  const workspace = stripValue(row.workspace || '')
  return `${agentName}::${alias}::${workspace}`
}

function reconcileAgentIdentityRows(db) {
  const rows = db.prepare(`
    SELECT
      id,
      identity_key,
      member_id,
      agent_name,
      alias,
      workspace,
      is_captain,
      updated_at
    FROM agents
    ORDER BY is_captain DESC, updated_at DESC, id DESC
  `).all()

  const seen = new Set()
  const updateIdentityKey = db.prepare('UPDATE agents SET identity_key = ? WHERE id = ?')
  const deleteAgent = db.prepare('DELETE FROM agents WHERE id = ?')

  for (const row of rows) {
    const identityKey = buildIdentityKey(row)
    if (seen.has(identityKey)) {
      deleteAgent.run(row.id)
      continue
    }
    seen.add(identityKey)
    if (row.identity_key !== identityKey) {
      updateIdentityKey.run(identityKey, row.id)
    }
  }

  const captains = db.prepare(`
    SELECT id
    FROM agents
    WHERE is_captain = 1
    ORDER BY updated_at DESC, id DESC
  `).all()

  if (captains.length > 1) {
    const [, ...others] = captains
    const demoteCaptain = db.prepare('UPDATE agents SET is_captain = 0 WHERE id = ?')
    for (const row of others) {
      demoteCaptain.run(row.id)
    }
  }

  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_identity_key ON agents(identity_key)')
}

export function ensureAiTeamDb() {
  fs.mkdirSync(dbDir, { recursive: true })

  const schema = fs.readFileSync(schemaFile, 'utf8')
  const db = new Database(dbFile)
  db.exec(schema)
  ensureTableColumns(db, 'agents', agentColumns)
  ensureTableColumns(db, 'tasks', taskColumns)
  reconcileAgentIdentityRows(db)

  return db
}

export function getAiTeamDbMeta() {
  return { dbDir, dbFile, schemaFile }
}
