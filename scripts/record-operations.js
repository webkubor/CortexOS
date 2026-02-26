#!/usr/bin/env node

/**
 * 实际操作记录器
 * 
 * 功能：记录用户对大脑的实际操作
 * - Git 提交记录
 * - 文件增删改
 * - 目录结构变化
 * - 脚本执行历史
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '../docs');
const PROJECT_ROOT = path.join(__dirname, '..');

function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

function getCurrentTimestamp() {
  return new Date().toISOString().replace('T', ' ').split('.')[0];
}

function getLogPath() {
  const today = getCurrentDate();
  return path.join(DOCS_DIR, 'memory', 'journal', `${today}.md`);
}

function appendToLog(content) {
  const logPath = getLogPath();
  const journalDir = path.dirname(logPath);

  if (!fs.existsSync(journalDir)) {
    fs.mkdirSync(journalDir, { recursive: true });
  }

  fs.appendFileSync(logPath, content + '\n\n');
}

function getRecentGitCommits() {
  try {
    const commits = execSync('git log --oneline --since="10 minutes ago"', {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT
    });
    return commits.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

function getGitChanges() {
  try {
    const changes = execSync('git status --short', {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT
    });
    return changes.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

function getRecentFileOperations() {
  try {
    // 检测最近 10 分钟的文件操作
    const added = execSync('find docs -name "*.md" -mmin -10 -type f', {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT
    }).trim().split('\n').filter(Boolean);

    const modified = execSync('find docs -name "*.md" -mmin -10 -type f', {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT
    }).trim().split('\n').filter(Boolean);

    return {
      added: added.length,
      modified: modified.length,
      files: [...new Set([...added, ...modified])]
    };
  } catch (error) {
    return { added: 0, modified: 0, files: [] };
  }
}

function getDirectoryChanges() {
  try {
    const dirs = execSync('find docs -type d -mmin -10', {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT
    }).trim().split('\n').filter(Boolean);

    return dirs.map(d => d.replace('docs/', ''));
  } catch (error) {
    return [];
  }
}

function recordActualOperations() {
  console.log('📝 记录实际操作...\n');

  const commits = getRecentGitCommits();
  const changes = getGitChanges();
  const fileOps = getRecentFileOperations();
  const dirChanges = getDirectoryChanges();

  // 构建操作记录
  let operations = `## 🔄 实际操作记录 - ${getCurrentTimestamp()}\n\n`;

  // Git 提交
  if (commits.length > 0) {
    operations += `### Git 提交\n`;
    commits.forEach(c => {
      operations += `- ${c}\n`;
    });
    operations += '\n';
  }

  // 文件变更
  if (changes.length > 0) {
    operations += `### 文件变更 (${changes.length} 个)\n`;
    changes.slice(0, 10).forEach(c => {
      operations += `- ${c}\n`;
    });
    if (changes.length > 10) {
      operations += `- ... 共 ${changes.length} 个\n`;
    }
    operations += '\n';
  }

  // 文件操作
  if (fileOps.files.length > 0) {
    operations += `### 文件操作\n`;
    operations += `- 新增/修改：${fileOps.files.length} 个文件\n`;
    fileOps.files.slice(0, 5).forEach(f => {
      operations += `  - ${f.replace(PROJECT_ROOT + '/', '')}\n`;
    });
    if (fileOps.files.length > 5) {
      operations += `  - ... 共 ${fileOps.files.length} 个\n`;
    }
    operations += '\n';
  }

  // 目录变化
  if (dirChanges.length > 0) {
    operations += `### 目录结构变化\n`;
    dirChanges.slice(0, 5).forEach(d => {
      operations += `- ${d}\n`;
    });
    if (dirChanges.length > 5) {
      operations += `- ... 共 ${dirChanges.length} 个\n`;
    }
    operations += '\n';
  }

  // 如果有实际操作，记录到日志
  if (commits.length > 0 || changes.length > 0 || fileOps.files.length > 0 || dirChanges.length > 0) {
    operations += `**状态**: 检测到实际操作\n`;
    appendToLog(operations + '\n---\n');
    console.log('✅ 实际操作已记录');
    console.log(`  • Git 提交: ${commits.length} 个`);
    console.log(`  • 文件变更: ${changes.length} 个`);
    console.log(`  • 文件操作: ${fileOps.files.length} 个`);
    console.log(`  • 目录变化: ${dirChanges.length} 个`);
  } else {
    console.log('ℹ️ 无实际操作，跳过记录');
  }

  return {
    commits: commits.length,
    changes: changes.length,
    fileOps: fileOps.files.length,
    dirChanges: dirChanges.length
  };
}

// 如果作为命令行运行
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('📋 实际操作记录器');
  console.log('='.repeat(60));
  recordActualOperations();
  console.log('\n='.repeat(60));
}

// 导出供其他脚本调用
export { recordActualOperations };
