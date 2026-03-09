#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '../docs');
const rootDir = path.join(__dirname, '..');

function getAllMarkdownFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...getAllMarkdownFiles(fullPath));
    } else if (item.name.endsWith('.md') && !item.name.endsWith('.mjs')) {
      files.push(fullPath);
    }
  }

  return files;
}

function getIndexedFiles() {
  const indexFiles = [];

  const routerPath = path.join(DOCS_DIR, 'router.md');
  const indexPath = path.join(DOCS_DIR, 'index.md');

  if (fs.existsSync(routerPath)) {
    const content = fs.readFileSync(routerPath, 'utf-8');
    const routerMdMatches = content.matchAll(/docs\/[^)]+\.md/g);
    for (const match of routerMdMatches) {
      const relativePath = match[0].replace('docs/', '').replace('docs\\', '');
      if (relativePath) indexFiles.push(relativePath);
    }
  }

  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf-8');
    const indexMdMatches = content.matchAll(/link: ["']\/[^"']+["']/g);
    for (const match of indexMdMatches) {
      const link = match[0];
      const linkMatch = link.match(/\/([a-z-\/]+\.md)/);
      if (linkMatch) {
        const relativePath = linkMatch[1];
        if (!indexFiles.includes(relativePath)) {
          indexFiles.push(relativePath);
        }
      }
    }
  }

  return [...new Set(indexFiles)];
}

function checkSidebarConfig() {
  const configPath = path.join(DOCS_DIR, '.vitepress', 'config.mjs');
  if (!fs.existsSync(configPath)) return [];

  const content = fs.readFileSync(configPath, 'utf-8');

  const items = [];
  const linkMatches = content.matchAll(/link: ["']\/([a-z-\/]+\.md)["']/g);
  for (const match of linkMatches) {
    items.push(match[1]);
  }

  return [...new Set(items)];
}

function checkFrontmatter(name, content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return { hasFrontmatter: false };

  const frontmatter = frontmatterMatch[1];
  const tags = frontmatter.match(/tags?:\s*(\[.+\])/);

  if (!tags) return { hasFrontmatter: true };

  const tagArray = JSON.parse(tags[1]);

  return {
    hasFrontmatter: true,
    tags: tagArray,
    highPriority: tagArray.includes('core') || tagArray.includes('rule') || tagArray.includes('skill')
  };
}

function analyzeStructure() {
  console.log('🔍 开始自检 docs 目录结构...\n');

  const allMdFiles = getAllMarkdownFiles(DOCS_DIR);
  const indexedFiles = getIndexedFiles();
  const sidebarFiles = checkSidebarConfig();

  const allIndexed = [...new Set([...indexedFiles, ...sidebarFiles])];

  console.log(`📊 统计信息:`);
  console.log(`  - 总文件数: ${allMdFiles.length}`);
  console.log(`  - 已索引文件: ${allIndexed.length}`);
  console.log(`  - 未索引文件: ${allMdFiles.length - allIndexed.length}\n`);

  const unindexedFiles = [];
  const weakIndexFiles = [];

  for (const file of allMdFiles) {
    const relativePath = file.replace(DOCS_DIR + path.sep, '');
    if (!allIndexed.includes(relativePath)) {
      unindexedFiles.push(relativePath);
    } else if (!sidebarFiles.includes(relativePath) && relativePath !== 'router.md' && relativePath !== 'index.md') {
      weakIndexFiles.push(relativePath);
    }
  }

  if (unindexedFiles.length > 0) {
    console.log('🚨 未索引文件 (需要检查是否应该索引):');
    unindexedFiles.sort().forEach(file => {
      const content = fs.readFileSync(path.join(DOCS_DIR, file), 'utf-8');
      const frontmatter = checkFrontmatter(file, content);
      console.log(`  • ${file} ${frontmatter.hasFrontmatter ? (frontmatter.highPriority ? '🔒 core/rule/skill' : '⚠️ fragment/log') : '❌ 无 frontmatter'}`);
    });
    console.log('');
  }

  if (weakIndexFiles.length > 0) {
    console.log('⚠️  在 router 中存在但未在 sidebar 中配置:');
    weakIndexFiles.sort().forEach(file => {
      console.log(`  • ${file}`);
    });
    console.log('');
  }

  console.log('📂 目录分析:\n');

  const categories = {};
  for (const file of allMdFiles) {
    const relativePath = file.replace(DOCS_DIR + path.sep, '');
    const dir = relativePath.split('/')[0];

    if (!categories[dir]) categories[dir] = [];
    categories[dir].push(file);
  }

  for (const [category, files] of Object.entries(categories)) {
    console.log(`  📁 ${category}/ (${files.length} 个文件)`);

    const likelyCore = files.filter(f => {
      try {
        const content = fs.readFileSync(path.join(DOCS_DIR, f), 'utf-8');
        return checkFrontmatter(f, content).hasFrontmatter && checkFrontmatter(f, content).highPriority;
      } catch (e) {
        return false;
      }
    });

    const likelySnippet = files.filter(f => {
      try {
        const content = fs.readFileSync(path.join(DOCS_DIR, f), 'utf-8');
        const frontmatter = checkFrontmatter(f, content);
        return !frontmatter.highPriority && frontmatter.hasFrontmatter && !f.includes('.json');
      } catch (e) {
        return false;
      }
    });

    if (likelyCore.length > 0) {
      console.log(`    🔒 核心协议层: ${likelyCore.length} 个`);
    }
    if (likelySnippet.length > 0) {
      console.log(`    📄 片段/日志层: ${likelySnippet.length} 个`);
    }

    console.log('');
  }

  console.log('✅ 自检完成\n');

  if (unindexedFiles.length > 0) {
    console.log('建议操作:');
    unindexedFiles.forEach(file => {
      console.log(`  - ${file} → ${getSuggestedDestination(file)}`);
    });
  }
}

function getSuggestedDestination(file) {
  if (file.includes('journal') || file.includes('2026-')) return 'archive/logs/';
  if (file.includes('temp') || file.includes('draft')) return 'archive/temp/';
  if (file.includes('ops/skill-sync')) return 'archive/cleanup/';
  if (file.includes('example') || file.includes('demo')) return 'archive/examples/';
  return 'archive/others/';
}

analyzeStructure();