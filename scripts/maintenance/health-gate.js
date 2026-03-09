#!/usr/bin/env node

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '../../');

const checks = [
  {
    name: 'Core health (P0)',
    command: 'node',
    args: ['scripts/tools/health-check.js', '--strict']
  },
  {
    name: 'Docs index runtime',
    command: 'node',
    args: ['scripts/maintenance/check-docs-index.js']
  },
  {
    name: 'Skill paths runtime',
    command: 'node',
    args: ['scripts/maintenance/check-skill-paths.mjs']
  },
  {
    name: 'Health verify runtime',
    command: 'node',
    args: ['scripts/maintenance/verify-health.js']
  },
  {
    name: 'Docs build (P0)',
    command: 'pnpm',
    args: ['run', 'docs:build']
  }
];

function runCheck(check) {
  console.log(`\n=== ${check.name} ===`);
  const result = spawnSync(check.command, check.args, {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.error) {
    console.error(`❌ ${check.name} 执行失败: ${result.error.message}`);
    return false;
  }

  if (result.status !== 0) {
    console.error(`❌ ${check.name} 未通过 (exit code: ${result.status ?? 'unknown'})`);
    return false;
  }

  console.log(`✅ ${check.name} 通过`);
  return true;
}

console.log('🛡️ Brain Health Gate 启动');

for (const check of checks) {
  if (!runCheck(check)) {
    console.error('\n🚫 Health Gate 失败，已阻断发布');
    process.exit(1);
  }
}

console.log('\n🎉 Health Gate 全部通过');
