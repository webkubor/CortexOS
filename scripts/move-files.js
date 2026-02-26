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

function moveFiles() {
  console.log('🚀 开始整理文档结构\n');

  const archives = {
    logs: [],
    assets: [],
    temp: []
  };

  const filesToMove = getAllMarkdownFiles(DOCS_DIR);

  for (const file of filesToMove) {
    const relativePath = file.replace(DOCS_DIR + path.sep, '');
    const parts = relativePath.split(path.sep);

    const category = parts[0] || 'root';

    let shouldArchive = false;

    if (category === 'memory' && parts.includes('journal')) {
      shouldArchive = true;
      archives.logs.push({ from: file, to: `docs/archive/logs/${path.basename(file)}` });
    }

    if (category === 'persona' && parts.includes('refs') && file.endsWith('.png')) {
      shouldArchive = true;
      archives.assets.push({ from: file, to: `docs/public/images/persona/${path.basename(file)}` });
    }

    if (category === 'persona' && (file.endsWith('.png') || file.endsWith('.jpeg') || file.endsWith('.jpg'))) {
      shouldArchive = true;
      archives.assets.push({ from: file, to: `docs/public/images/persona/${path.basename(file)}` });
    }

    if (parts.includes('temp') || parts.includes('draft') || parts.includes('backup')) {
      shouldArchive = true;
      archives.temp.push({ from: file, to: `docs/archive/temp/${path.basename(file)}` });
    }
  }

  console.log('📋 建议移动文件:\n');

  console.log('📂 日志文件 → archive/logs/');
  archives.logs.forEach(item => {
    console.log(`  • ${path.basename(item.from)} → ${path.basename(item.to)}`);
  });
  console.log('');

  console.log('🖼️ 图片资源 → public/images/persona/');
  archives.assets.forEach(item => {
    console.log(`  • ${path.basename(item.from)} → ${path.basename(item.to)}`);
  });
  console.log('');

  console.log('📄 临时文件 → archive/temp/');
  archives.temp.forEach(item => {
    console.log(`  • ${path.basename(item.from)} → ${path.basename(item.to)}`);
  });
  console.log('');

  const totalMoves = archives.logs.length + archives.assets.length + archives.temp.length;

  if (totalMoves === 0) {
    console.log('✅ 所有文件结构已优化，无需移动');
  } else {
    console.log(`🎯 共 ${totalMoves} 个文件需要移动\n`);

    console.log('执行命令示例:');
    console.log('```bash');
    archives.logs.forEach(item => {
      console.log(`mkdir -p docs/archive/logs`);
      console.log(`mv ${path.basename(item.from)} docs/archive/logs/`);
    });
    archives.assets.forEach(item => {
      console.log(`mkdir -p docs/public/images/persona`);
      console.log(`mv ${path.basename(item.from)} docs/public/images/persona/`);
    });
    archives.temp.forEach(item => {
      console.log(`mkdir -p docs/archive/temp`);
      console.log(`mv ${path.basename(item.from)} docs/archive/temp/`);
    });
    console.log('```');
  }

  console.log('\n⚠️ 注意:');
  console.log('  1. 移动前请确保已经 commit 所有未保存的更改');
  console.log('  2. 图片移动后，相关文档中的引用可能需要更新');
  console.log('  3. 建议先创建 archive 目录');
  console.log('  4. 可以分批执行，每次移动后 git commit 一次\n');
}

moveFiles();