#!/usr/bin/env node

/**
 * @file fleet-post-task.mjs
 * @description 大脑自动化结项钩子。负责在任务完成后自动执行：
 * 1. 错误复盘与记忆收割 (error-retro)
 * 2. 任务状态纠偏 (tasks:reconcile)
 * 3. 舰队看板同步 (fleet:sync)
 * 4. 冗余节点清理 (fleet:cleanup)
 */

import { execSync } from 'child_process';
import chalk from 'chalk';

const log = (msg) => console.log(chalk.magenta(`[Post-Task] `) + msg);
const warn = (msg) => console.log(chalk.yellow(`[Post-Task] `) + msg);
const success = (msg) => console.log(chalk.green(`[Post-Task] `) + msg);

async function runStep(name, command) {
  log(`执行: ${name}...`);
  try {
    const output = execSync(command, { encoding: 'utf-8' });
    console.log(output.trim());
    success(`${name} 完成。`);
    return true;
  } catch (error) {
    warn(`${name} 执行过程中可能存在警告或失败。`);
    return false;
  }
}

async function main() {
  log(chalk.bold('开始结项自动化流程...'));

  // 1. 进化记忆收割 (关键：将教训转化为资产)
  await runStep('进化记忆收割 (Error Retro)', 'npm run memory:retro');

  // 2. 舰队阵列清理 (保持整洁)
  await runStep('舰队阵列维护 (Fleet Cleanup)', 'npm run fleet:cleanup');

  // 3. 任务状态纠偏 (修正已结束但仍悬挂执行中的任务)
  await runStep('任务池纠偏 (Task Reconcile)', 'npm run tasks:reconcile');

  // 4. 看板同步 (对外同步大脑状态)
  await runStep('看板同步 (Sync Dashboard)', 'npm run fleet:sync-dashboard');

  success(chalk.bold('✨ 大脑已完成本轮任务后的进化与同步。'));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
