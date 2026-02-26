#!/usr/bin/env node

/**
 * 自动更新记录机制
 * 
 * 功能：
 * 1. 检测文件变更
 * 2. 自动生成 commit message
 * 3. 记录到当日日志
 * 4. 自动提交
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

function getCurrentTimestamp() {
  return new Date().toISOString().replace('T', ' ').split('.')[0];
}

function getLogPath() {
  const today = getCurrentDate();
  return path.join(PROJECT_ROOT, 'docs', 'memory', 'journal', `${today}.md`);
}

function ensureJournalExists() {
  const logPath = getLogPath();
  const journalDir = path.dirname(logPath);

  if (!fs.existsSync(journalDir)) {
    fs.mkdirSync(journalDir, { recursive: true });
  }

  if (!fs.existsSync(logPath)) {
    const templatePath = path.join(journalDir, 'new-task-template.md');
    if (fs.existsSync(templatePath)) {
      const template = fs.readFileSync(templatePath, 'utf-8');
      fs.writeFileSync(logPath, template);
    } else {
      fs.writeFileSync(logPath, `# ${getCurrentDate()}: 自动记录\n\n`);
    }
  }
}

function appendToLog(content) {
  ensureJournalExists();
  const logPath = getLogPath();
  fs.appendFileSync(logPath, content + '\n\n');
}

function getGitStatus() {
  try {
    const status = execSync('git status --short', {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT
    });
    return status.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

function generateCommitMessage(changes) {
  const added = changes.filter(c => c.startsWith('A ') || c.startsWith('?? '));
  const modified = changes.filter(c => c.startsWith('M '));
  const deleted = changes.filter(c => c.startsWith('D '));
  const renamed = changes.filter(c => c.startsWith('R '));

  const parts = [];

  if (added.length > 0) {
    parts.push(`📝 新增 ${added.length} 个文件`);
  }
  if (modified.length > 0) {
    parts.push(`✏️ 修改 ${modified.length} 个文件`);
  }
  if (deleted.length > 0) {
    parts.push(`🗑️ 删除 ${deleted.length} 个文件`);
  }
  if (renamed.length > 0) {
    parts.push(`🔄 移动 ${renamed.length} 个文件`);
  }

  return parts.join(' | ') || '无变更';
}

function autoCommitAndLog() {
  console.log('🔄 自动更新记录机制启动...\n');

  const changes = getGitStatus();

  if (changes.length === 0) {
    console.log('✅ 无文件变更，跳过自动提交');
    return;
  }

  console.log(`📊 检测到 ${changes.length} 个文件变更:`);
  changes.slice(0, 5).forEach(c => console.log(`  ${c}`));
  if (changes.length > 5) {
    console.log(`  ... 共 ${changes.length} 个`);
  }

  // 生成 commit message
  const commitMessage = generateCommitMessage(changes);
  console.log(`\n📝 提交信息：${commitMessage}`);

  // 记录到日志
  appendToLog(`## 🔄 自动提交记录 - ${getCurrentTimestamp()}

**变更摘要**: ${commitMessage}

**详细变更**:
${changes.map(c => `- ${c}`).join('\n')}

**提交状态**: 待提交
`);

  // 自动提交
  try {
    execSync('git add -A', { cwd: PROJECT_ROOT });
    execSync(`git commit -m "chore: ${commitMessage}"`, { cwd: PROJECT_ROOT });
    console.log('✅ 自动提交成功');

    // 更新日志状态
    appendToLog(`**提交状态**: ✅ 已成功提交\n`);
  } catch (error) {
    console.log('❌ 自动提交失败:', error.message);
    appendToLog(`**提交状态**: ❌ 失败 - ${error.message}\n`);
  }
}

// 如果作为命令行运行
if (import.meta.url === `file://${process.argv[1]}`) {
  autoCommitAndLog();
}

// 导出供其他脚本调用
export { autoCommitAndLog, getGitStatus, generateCommitMessage };
