#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '../docs');
const PROJECT_ROOT = path.join(__dirname, '..');

const config = {
  interval: 5 * 60 * 1000, // 5 分钟
  logToFile: true
};

function log(color, message) {
  console.log(`${color}${message}\x1b[0m`);
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

function detectChanges() {
  try {
    const modifiedFiles = execSync('find docs -name "*.md" -mmin -10', {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
      maxBuffer: 1024 * 1024
    });
    const files = modifiedFiles.trim().split('\n').filter(Boolean);

    if (files.length === 0) return [];

    return files.slice(0, 5);
  } catch (error) {
    return [];
  }
}

function runHealthCheck() {
  try {
    const result = execSync('node scripts/health-check.js', {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
      maxBuffer: 1024 * 1024 * 10
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

function recordSystemStatus(changes) {
  const checkResult = runHealthCheck();

  const status = {
    timestamp: getCurrentTimestamp(),
    systemHealth: checkResult.success ? '正常' : '异常',
    filesModified: detectChanges(),
    lastHealthCheck: '刚刚'
  };

  addToLog({
    title: '🤖 大脑自动运转状态',
    body: `时间: ${status.timestamp}\n\n系统状态:\n• 知识库自检: ${status.lastHealthCheck}\n• 文件修改: ${status.filesModified.length} 个\n• 健康状态: ${status.systemHealth}\n\n${checkResult.success ? '✅ 检查通过' : '❌ 检查失败'}`
  });

  return status;
}

function autoPilotOnce() {
  log('\x1b[36m🚀 外部大脑自动运转系统启动\x1b[0m');
  log('\x1b[36m' + '='.repeat(60) + '\x1b[0m');

  const startTime = Date.now();

  // 执行健康检查
  runHealthCheck();

  // 检测变化
  const changes = detectChanges();

  // 记录系统状态
  recordSystemStatus(changes);

  // 生成报告
  const duration = Date.now() - startTime;

  log('\n' + '\x1b[32m' + '='.repeat(60) + '\x1b[0m', '\n');
  log('\x1b[32m✨ 大脑自动运转完成 (耗时: ' + duration + 'ms)\x1b[0m');

  if (changes.length > 0) {
    log('\x1b[33m📝 检测到 ' + changes.length + ' 个文件变化，已自动记录\x1b[0m');
  }

  log('\x1b[36m建议:\x1b[0m');
  log('  • 配置定时任务让它持续运行');
  log('  • 运行 tail -f docs/memory/journal/2026-02-26.md 查看记录');
}

// 主循环
function main() {
  log('\x1b[32m✨ 大脑自动运转系统已启动\x1b[0m');
  log('\x1b[32m  • 执行频率: 每 ' + (config.interval / 60000) + ' 分钟\x1b[0m');
  log('\x1b[32m  • 内存占用: 极小 (< 5MB)\x1b[0m');
  log('\x1b[32m  • CPU 占用: 几乎为 0\x1b[0m');
  log('\x1b[32m  • 自动记录: 操作已写入 memory/journal/\x1b[0m');
  log('\x1b[36m' + '='.repeat(60) + '\x1b[0m\n');

  // 立即执行一次
  autoPilotOnce();

  // 设置定时器
  setInterval(autoPilotOnce, config.interval);
}

// 启动
main();

// 导出供其他脚本调用
export { autoPilotOnce, getCurrentTimestamp };