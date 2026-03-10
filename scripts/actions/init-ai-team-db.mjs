#!/usr/bin/env node

import { ensureAiTeamDb, getAiTeamDbMeta } from '../lib/ai-team-db.mjs'

const { dbFile } = getAiTeamDbMeta()
const db = ensureAiTeamDb()

const tables = db.prepare(`
  SELECT name
  FROM sqlite_master
  WHERE type = 'table'
    AND name NOT LIKE 'sqlite_%'
  ORDER BY name
`).all()

console.log(JSON.stringify({
  ok: true,
  dbFile,
  tables: tables.map((table) => table.name)
}, null, 2))

db.close()
