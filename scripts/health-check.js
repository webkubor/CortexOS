#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '../docs');
const PROJECT_ROOT = path.join(__dirname, '..');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function checkMarkdownExists(relativePath) {
  const filePath = path.join(DOCS_DIR, relativePath);
  return checkFileExists(filePath) && !fs.statSync(filePath).isDirectory();
}

function verifyRouterPaths() {
  log(colors.blue, '\n🔍 检查 router.md 路径引用...');

  const routerPath = path.join(DOCS_DIR, 'router.md');
  if (!checkFileExists(routerPath)) {
    log(colors.red, '❌ router.md 不存在');
    return [];
  }

  const content = fs.readFileSync(routerPath, 'utf-8');
  const routerMdMatches = content.matchAll(/docs\/[^)]+\.md/g);

  const missing = [];
  for (const match of routerMdMatches) {
    const relativePath = match[0].replace('docs/', '').replace('docs\\', '');
    if (!checkMarkdownExists(relativePath)) {
      missing.push(relativePath);
    }
  }

  if (missing.length > 0) {
    log(colors.red, `❌ router.md 中引用了 ${missing.length} 个不存在的路径`);
    missing.slice(0, 5).forEach(p => log(colors.red, `  • ${p}`));
    if (missing.length > 5) {
      log(colors.red, `  ... 共 ${missing.length} 个`);
    }
  } else {
    log(colors.green, `✅ router.md 中所有 ${routerMdMatches.length} 个路径都有效`);
  }

  return missing;
}

function verifySidebarLinks() {
  log(colors.blue, '\n🔍 检查 sidebar 链接...');

  const configPath = path.join(DOCS_DIR, '.vitepress', 'config.mjs');
  if (!checkFileExists(configPath)) {
    log(colors.red, '❌ config.mjs 不存在');
    return [];
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  const linkMatches = content.matchAll(/link: ["']\/([a-z-\/]+\.md)["']/g);

  const missing = [];
  for (const match of linkMatches) {
    const relativePath = match[1];
    if (!checkMarkdownExists(relativePath)) {
      missing.push(relativePath);
    }
  }

  if (missing.length > 0) {
    log(colors.red, `❌ sidebar 中引用了 ${missing.length} 个不存在的路径`);
    missing.slice(0, 5).forEach(p => log(colors.red, `  • ${p}`));
    if (missing.length > 5) {
      log(colors.red, `  ... 共 ${missing.length} 个`);
    }
  } else {
    log(colors.green, `✅ sidebar 中所有 ${linkMatches.length} 个链接都有效`);
  }

  return missing;
}

function checkEmptyDirectories() {
  log(colors.blue, '\n🔍 检查空目录...');

  const emptyDirs = [];
  const checkDir = (dir, parentPath = '') => {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        checkDir(fullPath, parentPath ? `${parentPath}/${item.name}` : item.name);
      }
    }

    if (items.length === 0 && parentPath) {
      emptyDirs.push(parentPath);
    }
  };

  checkDir(DOCS_DIR);

  if (emptyDirs.length > 0) {
    log(colors.yellow, `⚠️  发现 ${emptyDirs.length} 个空目录:`);
    emptyDirs.slice(0, 10).forEach(d => log(colors.yellow, `  • ${d}`));
    if (emptyDirs.length > 10) {
      log(colors.yellow, `  ... 共 ${emptyDirs.length} 个`);
    }
  } else {
    log(colors.green, '✅ 没有发现空目录');
  }

  return emptyDirs;
}

function checkMemoryJournal() {
  log(colors.blue, '\n🔍 检查 memory/journal 目录...');

  const journalDir = path.join(DOCS_DIR, 'memory', 'journal');
  const indexFile = path.join(journalDir, 'README.md');
  const templateFile = path.join(journalDir, 'new-task-template.md');

  let issues = [];

  if (!checkFileExists(journalDir)) {
    log(colors.red, '❌ memory/journal/ 目录不存在');
    issues.push('memory/journal/ 不存在');
  } else if (!checkFileExists(indexFile)) {
    log(colors.red, '❌ memory/journal/README.md 不存在');
    issues.push('缺少 README.md');
  } else {
    log(colors.green, '✅ memory/journal/README.md 存在');
  }

  if (!checkFileExists(templateFile)) {
    log(colors.red, '❌ memory/journal/new-task-template.md 不存在');
    issues.push('缺少 new-task-template.md');
  } else {
    log(colors.green, '✅ memory/journal/new-task-template.md 存在');
  }

  return issues;
}

function checkCriticalFiles() {
  log(colors.blue, '\n🔍 检查核心文件...');

  const criticalFiles = [
    { name: 'router.md', path: path.join(DOCS_DIR, 'router.md') },
    { name: 'index.md', path: path.join(DOCS_DIR, 'index.md') },
    { name: 'tech_stack.md', path: path.join(DOCS_DIR, 'tech_stack.md') },
    { name: 'README.md', path: DOCS_DIR },
    { name: 'about.md', path: path.join(DOCS_DIR, 'about.md') }
  ];

  const missing = [];
  for (const file of criticalFiles) {
    if (checkFileExists(file.path)) {
      if (file.name !== 'README.md') {
        const stats = fs.statSync(file.path);
        if (stats.isDirectory()) {
          log(colors.green, `✅ ${file.name}/ 存在`);
        } else {
          log(colors.green, `✅ ${file.name} 存在`);
        }
      }
    } else {
      log(colors.red, `❌ ${file.name} 不存在`);
      missing.push(file.name);
    }
  }

  return missing;
}

function checkScriptFolder() {
  log(colors.blue, '\n🔍 检查 scripts/ 目录...');

  const scriptDir = path.join(PROJECT_ROOT, 'scripts');
  if (!checkFileExists(scriptDir)) {
    log(colors.yellow, '⚠️  scripts/ 目录不存在');
    return [];
  }

  const markdownScripts = [];
  fs.readdirSync(scriptDir).forEach(file => {
    if (file.endsWith('.js')) {
      markdownScripts.push(file);
    }
  });

  if (markdownScripts.length === 0) {
    log(colors.yellow, '⚠️  scripts/ 目录为空');
  } else {
    log(colors.green, `✅ scripts/ 包含 ${markdownScripts.length} 个脚本`);
  }

  return markdownScripts;
}

function checkPrivateFiles() {
  log(colors.blue, '\n🔍 检查 private files...');

  const privateDirs = [
    'secrets/',
    '.git/',
    'node_modules/'
  ];

  let issues = [];

  for (const dir of privateDirs) {
    const dirPath = path.join(DOCS_DIR, dir);
    if (!checkFileExists(dirPath)) {
      continue;
    }

    const hasMarkdown = fs.readdirSync(dirPath).some(f => f.endsWith('.md'));
    if (hasMarkdown) {
      log(colors.yellow, `⚠️  ${dir} 目录包含 Markdown 文件（应排除）：`);
      fs.readdirSync(dirPath).forEach(f => {
        if (f.endsWith('.md')) {
          log(colors.yellow, `  • ${dir}${f}`);
        }
      });
      issues.push(`${dir} 目录包含 Markdown 文件`);
    }
  }

  return issues;
}

function checkArchiveContents() {
  log(colors.blue, '\n🔍 检查 archive/ 目录...');

  const archiveDir = path.join(DOCS_DIR, 'archive');
  if (!checkFileExists(archiveDir)) {
    log(colors.yellow, '⚠️  archive/ 目录不存在');
    return [];
  }

  const logsDir = path.join(archiveDir, 'logs');
  if (!checkFileExists(logsDir)) {
    log(colors.yellow, '⚠️  archive/logs/ 目录不存在');
    return [];
  }

  const logFiles = fs.readdirSync(logsDir).filter(f => f.endsWith('.md'));

  if (logFiles.length > 0) {
    log(colors.green, `✅ archive/logs/ 包含 ${logFiles.length} 个日志文件`);
    logFiles.slice(0, 3).forEach(f => log(colors.green, `  • ${f}`));
  } else {
    log(colors.yellow, '⚠️  archive/logs/ 为空');
  }

  return logFiles;
}

function runHealthCheck() {
  log(colors.cyan, '🧠 AI Common 外部大脑健康检查');
  log(colors.cyan, '='.repeat(50));

  const startTime = Date.now();
  const issues = {
    critical: [],
    warnings: [],
    info: []
  };

  // 执行各项检查
  issues.critical.push(...verifyRouterPaths());
  issues.critical.push(...verifySidebarLinks());
  issues.warnings.push(...checkEmptyDirectories());
  issues.critical.push(...checkMemoryJournal());
  issues.critical.push(...checkCriticalFiles());
  issues.info.push(...checkScriptFolder());
  issues.warnings.push(...checkPrivateFiles());
  issues.info.push(...checkArchiveContents());

  const duration = Date.now() - startTime;

  // 输出总结
  log('\n' + '='.repeat(50), '\n');

  if (issues.critical.length === 0 && issues.warnings.length === 0) {
    log(colors.green, '🎉 外部大脑健康检查通过！');
    log(colors.cyan, `✨ 检查耗时: ${duration}ms`);
    log(colors.cyan, '\n建议:');
    log(colors.cyan, '  • 继续维护执行日志记录');
    log(colors.cyan, '  • 定期运行 docs 结构自检: node scripts/cleanup-docs.js');
  } else {
    log(colors.red, `❌ 发现 ${issues.critical.length} 个严重问题，${issues.warnings.length} 个警告`);

    if (issues.critical.length > 0) {
      log('\n🚨 严重问题:');
      issues.critical.forEach((issue, i) => {
        log(colors.red, `  ${i + 1}. ${issue}`);
      });
    }

    if (issues.warnings.length > 0) {
      log('\n⚠️  警告:');
      issues.warnings.slice(0, 5).forEach((issue, i) => {
        log(colors.yellow, `  ${i + 1}. ${issue}`);
      });
    }

    log('\n📝 建议:');
    log(colors.yellow, '  1. 优先修复严重问题');
    log(colors.yellow, '  2. 参考相关规范文档');
    log(colors.yellow, '  3. 运行 node scripts/cleanup-docs.js 整理文档');
  }

  log(colors.cyan, '='.repeat(50));
}

// 执行健康检查
runHealthCheck();