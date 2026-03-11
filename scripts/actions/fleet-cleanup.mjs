#!/usr/bin/env node

import { cleanupAiTeamState } from '../lib/ai-team-state.mjs'
import { syncFleetDashboard } from './sync-fleet-dashboard.mjs'

const CLEANUP_THRESHOLD_HOURS = 2

function parseArgs(argv) {
  return {
    dryRun: argv.includes('--dry-run') || argv.includes('-n')
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const result = cleanupAiTeamState({
    thresholdHours: CLEANUP_THRESHOLD_HOURS,
    dryRun: args.dryRun,
    operator: 'system',
    reason: 'fleet:cleanup'
  })

  for (const item of result.cleaned) {
    console.log(`🗑️ 清理: ${item.memberId} (${item.reason})`)
  }

  if (result.successor) {
    console.log(`👑 顺位继承成功: ${result.successor} 已自动接任指挥官。`)
  } else if (!args.dryRun && result.totalAgents === 0) {
    console.log('📭 阵列已清空，无可继任节点。')
  }

  if (!args.dryRun) {
    syncFleetDashboard()
  }

  console.log(`✨ 阵列维护完成${args.dryRun ? '（dry-run）' : ''}。`)
}

main()
