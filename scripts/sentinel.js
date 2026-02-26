#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '../docs');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

function getLogPath() {
  const today = getCurrentDate();
  return path.join(DOCS_DIR, 'memory', 'journal', `${today}.md`);
}

function ensureJournalExists() {
  const logPath = getLogPath();
  const journalDir = path.dirname(logPath);

  if (!fs.existsSync(journalDir)) {
    fs.mkdirSync(journalDir, { recursive: true });
  }

  if (!fs.existsSync(logPath)) {
    const templatePath = path.join(journalDir, 'new-task-template.md');
    const template = fs.readFileSync(templatePath, 'utf-8');
    fs.writeFileSync(logPath, template);
  }
}

function getCurrentTimestamp() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').split('.')[0];
}

function addToLog(content) {
  ensureJournalExists();
  const logPath = getLogPath();

  const header = `# ${getCurrentDate()}: ${content.title || '自动操作记录'}\n`;
  const timestamp = `## 🕐 时间: ${getCurrentTimestamp()}\n`;

  fs.appendFileSync(logPath, header + timestamp + content.body + '\n\n---\n\n');
}

function recordOperation(operation) {
  log(colors.cyan, `📝 记录操作: ${operation.action}`);

  addToLog({
    title: operation.action,
    body: operation.details
  });
}

function recordHealthCheck(checks) {
  log(colors.cyan, '🔍 执行大脑自检...');
  const results = checks.filter(c => !c.pass).map(c => `  ❌ ${c.name}: ${c.reason}`);

  if (results.length > 0) {
    log(colors.yellow, `⚠️  发现 ${results.length} 个问题:`);
    results.forEach(r => log(colors.yellow, r));
  } else {
    log(colors.green, '✅ 大脑健康检查通过');
  }

  addToLog({
    title: '🧠 大脑健康检查',
    body: `执行时间: ${getCurrentTimestamp()}\n\n检查项:\n${checks.map(c => `- [${c.pass ? 'x' : ' '}] ${c.name}: ${c.pass ? '通过' : `失败: ${c.reason}`}`).join('\n')}`
  });
}

function recordAgentSwitch(agentName) {
  log(colors.cyan, `🔄 记录 Agent 切换: ${agentName}`);

  addToLog({
    title: `🔄 Agent 切换到 ${agentName}`,
    body: `时间: ${getCurrentTimestamp()}\n\n状态更新:\n- 新 Agent 已就绪\n- 持续记录该 Agent 的操作日志\n- 所有公用记忆保持同步`
  });
}

function recordTaskStatus(status, details = '') {
  log(colors.cyan, `📊 记录任务状态: ${status}`);

  addToLog({
    title: `📊 任务状态: ${status}`,
    body: details ? `详细信息:\n${details}` : `状态已更新`
  });
}

function recordDecision(decision, context = '') {
  log(colors.yellow, `💡 记录决策: ${decision}`);

  addToLog({
    title: `💡 决策: ${decision}`,
    body: `时间: ${getCurrentTimestamp()}\n\n决策原因:\n${context}`
  });
}

function recordError(error, context = '') {
  log(colors.red, `❌ 记录错误: ${error}`);

  addToLog({
    title: `❌ 错误记录: ${error}`,
    body: `时间: ${getCurrentTimestamp()}\n\n错误详情:\n${context}`
  });
}

function getJournalContent() {
  ensureJournalExists();
  const logPath = getLogPath();
  return fs.readFileSync(logPath, 'utf-8');
}

// 暴露给外部使用
module.exports = {
  getCurrentTimestamp,
  addToLog,
  recordOperation,
  recordHealthCheck,
  recordAgentSwitch,
  recordTaskStatus,
  recordDecision,
  recordError,
  getJournalContent,
  ensureJournalExists,
  getLogPath
};

// 如果作为命令行运行
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('记忆哨兵模块 - 记录操作日志\n');
  console.log('使用方式:');
  console.log('  const sentinel = require("./health-check.js");');
  console.log('  sentinel.recordOperation({ action: "xxx", details: "xxx" });');
  console.log('  sentinel.recordHealthCheck([...]);');
  console.log('  sentinel.recordAgentSwitch("xxx");');
}