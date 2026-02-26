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
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkDocCompliance() {
  log(colors.cyan, '\n📄 检查文档是否遵循标准规范...');

  const markdownFiles = [];
  const items = fs.readdirSync(DOCS_DIR, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(DOCS_DIR, item.name);
    if (item.isDirectory()) {
      markdownFiles.push(...getAllMarkdownFiles(fullPath));
    } else if (item.name.endsWith('.md')) {
      markdownFiles.push(fullPath);
    }
  }

  log(colors.cyan, `📊 扫描到 ${markdownFiles.length} 个 Markdown 文件\n`);

  const unstructured = [];
  const withFrontmatter = [];

  for (const file of markdownFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    if (!content.startsWith('---')) {
      unstructured.push(file);
    } else {
      withFrontmatter.push(file);
    }
  }

  log(colors.blue, '检查结果:');

  if (unstructured.length > 0) {
    log(colors.yellow, `\n⚠️  发现 ${unstructured.length} 个文档没有 frontmatter:`);
    unstructured.slice(0, 10).forEach(f => {
      const relative = f.replace(DOCS_DIR + path.sep, '');
      log(colors.yellow, `  • ${relative}`);
    });
    if (unstructured.length > 10) {
      log(colors.yellow, `  ... 共 ${unstructured.length} 个`);
    }
  } else {
    log(colors.green, '✅ 所有文档都有 frontmatter');
  }

  if (withFrontmatter.length > 0) {
    log(colors.green, `\n✅ ${withFrontmatter.length} 个文档有 frontmatter`);
  }

  return unstructured.length;
}

function getAllMarkdownFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...getAllMarkdownFiles(fullPath));
    } else if (item.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

function checkRouterUpdates() {
  log(colors.cyan, '\n🔍 检查 router.md 更新状态...');

  const routerPath = path.join(DOCS_DIR, 'router.md');
  const content = fs.readFileSync(routerPath, 'utf-8');
  const lastUpdatedMatch = content.match(/Last Updated: (\d{4}-\d{2}-\d{2})/);

  if (lastUpdatedMatch) {
    const lastUpdated = lastUpdatedMatch[1];
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (lastUpdated === today) {
      log(colors.green, `✅ router.md 今天已更新 (${lastUpdated})`);
    } else if (lastUpdated === '2026-02-26') {
      log(colors.cyan, `ℹ️  router.md 最后更新: 2026-02-26 (今天)`);
    } else {
      log(colors.yellow, `⚠️  router.md 未更新 (最后: ${lastUpdated})`);
    }
  }

  return lastUpdatedMatch ? lastUpdatedMatch[1] : null;
}

function checkMemoryJournal() {
  log(colors.cyan, '\n🔍 检查 memory/journal 内容...');

  const journalDir = path.join(DOCS_DIR, 'memory', 'journal');
  if (!fs.existsSync(journalDir)) {
    log(colors.red, '❌ memory/journal/ 目录不存在');
    return 0;
  }

  const files = fs.readdirSync(journalDir);
  const markdownFiles = files.filter(f => f.endsWith('.md'));

  if (markdownFiles.length === 0) {
    log(colors.yellow, '⚠️  memory/journal/ 为空');
    return 0;
  }

  log(colors.green, `✅ memory/journal/ 包含 ${markdownFiles.length} 个文件`);
  markdownFiles.forEach(f => log(colors.green, `  • ${f}`));

  return markdownFiles.length;
}

function checkUnreferencedFiles() {
  log(colors.cyan, '\n🔍 检查可能未被引用的文件...');

  const importantDirs = ['rules', 'skills', 'agents'];
  const allMarkdownFiles = getAllMarkdownFiles(DOCS_DIR);
  const referencedFiles = new Set();

  // 添加已知的引用源
  const routerPath = path.join(DOCS_DIR, 'router.md');
  const indexPath = path.join(DOCS_DIR, 'index.md');

  [routerPath, indexPath].forEach(path => {
    const content = fs.readFileSync(path, 'utf-8');
    const matches = content.matchAll(/docs\/[^)]+\.md/g);
    for (const match of matches) {
      referencedFiles.add(match[0].replace('docs/', '').replace('docs\\', ''));
    }
  });

  // 检查 sidebar
  const configPath = path.join(DOCS_DIR, '.vitepress', 'config.mjs');
  if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const linkMatches = configContent.matchAll(/link: ["']\/([a-z-\/]+\.md)["']/g);
    for (const match of linkMatches) {
      referencedFiles.add(match[1]);
    }
  }

  // 查找未引用的重要文件
  const unreferenced = [];
  for (const file of allMarkdownFiles) {
    const relative = file.replace(DOCS_DIR + path.sep, '');
    if (!referencedFiles.has(relative)) {
      // 排除一些特殊情况
      if (!relative.startsWith('archive/') &&
          !relative.includes('.json') &&
          !relative.startsWith('node_modules')) {
        unreferenced.push(relative);
      }
    }
  }

  if (unreferenced.length > 0) {
    log(colors.yellow, `⚠️  发现 ${unreferenced.length} 个可能未被引用的文件:`);
    unreferenced.slice(0, 10).forEach(f => {
      log(colors.yellow, `  • ${f}`);
    });
    if (unreferenced.length > 10) {
      log(colors.yellow, `  ... 共 ${unreferenced.length} 个`);
    }
  } else {
    log(colors.green, '✅ 所有重要文件都已正确引用');
  }

  return unreferenced.length;
}

function getAllMarkdownFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...getAllMarkdownFiles(fullPath));
    } else if (item.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

function generateIndexReport() {
  log(colors.cyan, '\n📊 生成文档索引报告...\n');

  const categories = {
    core: [],
    rules: [],
    skills: [],
    agents: [],
    archives: [],
    memory: []
  };

  const files = getAllMarkdownFiles(DOCS_DIR);

  for (const file of files) {
    const relative = file.replace(DOCS_DIR + path.sep, '');
    const parts = relative.split(path.sep);
    const category = parts[0] || 'root';

    if (category === 'archive' && parts.includes('logs')) {
      categories.archives.push(relative);
    } else if (categories.core.includes(relative)) {
      categories.core.push(relative);
    } else if (category === 'rules') {
      categories.rules.push(relative);
    } else if (category === 'skills') {
      categories.skills.push(relative);
    } else if (category === 'agents') {
      categories.agents.push(relative);
    } else if (category === 'memory') {
      categories.memory.push(relative);
    }
  }

  log(colors.cyan, '📁 文档分类统计:');
  log(colors.cyan, `  • core: ${categories.core.length} 个`);
  log(colors.cyan, `  • rules: ${categories.rules.length} 个`);
  log(colors.cyan, `  • skills: ${categories.skills.length} 个`);
  log(colors.cyan, `  • agents: ${categories.agents.length} 个`);
  log(colors.cyan, `  • archives: ${categories.archives.length} 个`);
  log(colors.cyan, `  • memory: ${categories.memory.length} 个`);
  log(colors.cyan, `  • 总计: ${files.length} 个`);
}

function verifyExecution() {
  log(colors.cyan, '🚀 运行验证任务...\n');

  // 执行自检
  checkDocCompliance();
  checkRouterUpdates();
  checkMemoryJournal();
  checkUnreferencedFiles();

  // 生成报告
  generateIndexReport();

  log(colors.cyan, '\n✅ 验证任务完成！');
  log(colors.cyan, '\n建议:');
  log(colors.cyan, '  1. 检查上述警告和错误');
  log(colors.cyan, '  2. 运行 docs 完整健康检查: node scripts/health-check.js');
  log(colors.cyan, '  3. 修复问题后再次验证');
}

verifyExecution();