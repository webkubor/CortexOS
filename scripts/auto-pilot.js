#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { autoCommitAndLog } from './auto-commit.js';
import { runAutoRecycle } from './auto-recycle.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '../docs');
const PROJECT_ROOT = path.join(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
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
  const timestamp = `## 🕐 时间：${getCurrentTimestamp()}\n`;

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
    body: `时间：${status.timestamp}\n\n系统状态:\n• 知识库自检：${status.lastHealthCheck}\n• 文件修改：${status.filesModified.length} 个\n• 健康状态：${status.systemHealth}\n\n${checkResult.success ? '✅ 检查通过' : '❌ 检查失败'}`
  });

  return status;
}

function autoPilot() {
  log(colors.cyan, '🚀 外部大脑自动运转系统启动');
  log(colors.cyan, '='.repeat(60));

  const startTime = Date.now();

  // 1. 执行健康检查
  runHealthCheck();

  // 2. 检测变化
  const changes = detectChanges();

  // 3. 记录系统状态
  recordSystemStatus(changes);

  // 4. 自动提交记录（如果有变更）
  if (changes.length > 0) {
    log(colors.cyan, '\n🔄 执行自动提交记录...');
    autoCommitAndLog();
  }

  // 5. 每周日执行自动回收（可选）
  const today = new Date();
  if (today.getDay() === 0) {
    log(colors.cyan, '\n🗃️  今天是周日，执行自动回收...');
    runAutoRecycle();
  }

  // 6. 生成报告
  const duration = Date.now() - startTime;

  log('\n' + '='.repeat(60), '\n');
  log(colors.green, `✨ 大脑自动运转完成 (耗时：${duration}ms)`);

  if (changes.length > 0) {
    log(colors.yellow, `\n📝 检测到 ${changes.length} 个文件变化，已自动记录并提交`);
  }

  log(colors.cyan, '\n建议:');
  log(colors.cyan, '  • 配置定时任务让它持续运行');
  log(colors.cyan, '  • 运行 tail -f docs/memory/journal/$(date +%Y-%m-%d).md 查看记录');
  log(colors.cyan, '  • 每周日自动执行回收机制');
  log(colors.cyan, '  • 所有操作都自动写入 memory/journal/');
}

// 启动自动运转
autoPilot();

// 导出供其他脚本调用
export {
  autoPilot,
  detectChanges,
  recordSystemStatus,
  getCurrentTimestamp,
  addToLog
};
