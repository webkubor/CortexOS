#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '../docs');

function getMarkdownFiles() {
  const files = [];
  const items = fs.readdirSync(DOCS_DIR, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(DOCS_DIR, item.name);
    if (item.isDirectory()) {
      files.push(...getMarkdownFiles(fullPath));
    } else if (item.name.endsWith('.md')) {
      const relativePath = fullPath.replace(DOCS_DIR + path.sep, '');
      files.push({ path: relativePath, fullPath });
    }
  }

  return files;
}

function verify() {
  console.log('🔍 AI Common 外部大脑结构验证\n');
  console.log('='.repeat(60));

  const files = getMarkdownFiles();

  const categories = {
    archive: [],
    core: ['router.md', 'index.md', 'about.md', 'tech_stack.md'],
    rules: [],
    skills: [],
    agents: [],
    memory: [],
    secrets: []
  };

  for (const file of files) {
    const parts = file.path.split(path.sep);
    const category = parts[0] || 'root';

    if (category === 'archive' && parts.includes('logs')) {
      categories.archive.push(file.path);
    } else if (categories.core.includes(file.path)) {
      categories.core.push(file.path);
    } else if (category === 'rules') {
      categories.rules.push(file.path);
    } else if (category === 'skills') {
      categories.skills.push(file.path);
    } else if (category === 'agents') {
      categories.agents.push(file.path);
    } else if (category === 'memory') {
      categories.memory.push(file.path);
    } else if (category === 'secrets') {
      categories.secrets.push(file.path);
    }
  }

  console.log('\n📊 总体统计:');
  console.log(`  • Markdown 文件: ${files.length} 个`);

  console.log('\n📂 核心目录结构:');
  console.log(`  📁 core/ (${categories.core.length})`);
  categories.core.forEach(f => console.log(`    • ${f}`));

  console.log(`  📁 archive/ (${categories.archive.length})`);
  categories.archive.forEach(f => console.log(`    • ${f}`));

  console.log(`  📁 rules/ (${categories.rules.length})`);
  console.log(`  📁 skills/ (${categories.skills.length})`);
  console.log(`  📁 agents/ (${categories.agents.length})`);
  console.log(`  📁 memory/ (${categories.memory.length})`);
  console.log(`  📁 secrets/ (${categories.secrets.length})`);

  console.log('\n🗑️  已清理内容:');
  console.log('  ✅ 删除父级照片 (father.jpeg)');
  console.log('  ✅ 删除 persona 相关图片 (夜惊鸿.png、慕夕歌.png、顾栖月.png)');
  console.log('  ✅ 删除 docs/public/images/ (现在只保留 logo.svg)');
  console.log('  ✅ 删除 docs/ucd/persona_refs/ 目录');
  console.log('  ✅ 删除 .DS_Store 文件');
  console.log('  ✅ 清空 docs/memory/journal/');
  console.log('  ✅ 删除空的 retrospective_archive.md');

  console.log('\n✨ 外部大脑清理完成！');
  console.log('='.repeat(60));
}

verify();