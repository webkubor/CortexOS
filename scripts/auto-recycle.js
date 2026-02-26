#!/usr/bin/env node

/**
 * 自动回收机制
 * 
 * 功能：
 * 1. 检测过期的日志文件（超过 30 天）
 * 2. 压缩旧日志到 archive
 * 3. 清理临时文件
 * 4. 优化日志文件大小
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');

const config = {
  logRetentionDays: 30,  // 日志保留天数
  archiveDir: path.join(DOCS_DIR, 'archive', 'logs'),
  journalDir: path.join(DOCS_DIR, 'memory', 'journal')
};

function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

function getDaysOld(filePath) {
  const stats = fs.statSync(filePath);
  const mtime = new Date(stats.mtime);
  const now = new Date();
  const diffTime = Math.abs(now - mtime);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function ensureArchiveDir() {
  if (!fs.existsSync(config.archiveDir)) {
    fs.mkdirSync(config.archiveDir, { recursive: true });
  }
}

function archiveOldLogs() {
  console.log('🗃️  检查旧日志文件...\n');

  if (!fs.existsSync(config.journalDir)) {
    console.log('⚠️  journal 目录不存在，跳过');
    return [];
  }

  const files = fs.readdirSync(config.journalDir);
  const archived = [];

  ensureArchiveDir();

  for (const file of files) {
    if (!file.endsWith('.md') || file === 'README.md' || file === 'GUIDE.md' || file === 'new-task-template.md') {
      continue;
    }

    const filePath = path.join(config.journalDir, file);
    const daysOld = getDaysOld(filePath);

    if (daysOld > config.logRetentionDays) {
      const targetPath = path.join(config.archiveDir, file);
      
      // 如果目标文件已存在，添加时间戳
      if (fs.existsSync(targetPath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const newName = file.replace('.md', `.${timestamp}.md`);
        const newTargetPath = path.join(config.archiveDir, newName);
        fs.renameSync(filePath, newTargetPath);
        console.log(`  📦 归档：${file} → ${newName} (${daysOld} 天)`);
        archived.push(newName);
      } else {
        fs.renameSync(filePath, targetPath);
        console.log(`  📦 归档：${file} (${daysOld} 天)`);
        archived.push(file);
      }
    }
  }

  if (archived.length === 0) {
    console.log('✅ 无需归档，所有日志都在保留期内');
  } else {
    console.log(`\n📦 共归档 ${archived.length} 个旧日志文件`);
  }

  return archived;
}

function cleanTempFiles() {
  console.log('\n🧹 清理临时文件...\n');

  const tempPatterns = [
    '*.log',
    '*.tmp',
    '.DS_Store',
    '*.swp',
    '*.bak'
  ];

  let cleanedCount = 0;

  function cleanDir(dir) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        cleanDir(fullPath);
      } else {
        const shouldDelete = tempPatterns.some(pattern => {
          if (pattern.includes('*')) {
            const ext = pattern.replace('*', '');
            return item.endsWith(ext);
          }
          return item === pattern;
        });

        if (shouldDelete) {
          fs.unlinkSync(fullPath);
          console.log(`  🗑️  删除：${fullPath.replace(PROJECT_ROOT + '/', '')}`);
          cleanedCount++;
        }
      }
    }
  }

  cleanDir(DOCS_DIR);

  if (cleanedCount === 0) {
    console.log('✅ 无需清理临时文件');
  } else {
    console.log(`\n🧹 共清理 ${cleanedCount} 个临时文件`);
  }

  return cleanedCount;
}

function optimizeLargeLogs() {
  console.log('\n📝 优化大日志文件...\n');

  const maxSizeKB = 500; // 超过 500KB 的日志文件需要优化

  if (!fs.existsSync(config.journalDir)) {
    console.log('⚠️  journal 目录不存在，跳过');
    return [];
  }

  const files = fs.readdirSync(config.journalDir);
  const optimized = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const filePath = path.join(config.journalDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = Math.ceil(stats.size / 1024);

    if (sizeKB > maxSizeKB) {
      console.log(`  ⚠️  ${file} 过大 (${sizeKB}KB)，建议手动优化`);
      optimized.push({ file, sizeKB });
    }
  }

  if (optimized.length === 0) {
    console.log('✅ 所有日志文件大小正常');
  } else {
    console.log(`\n⚠️  共 ${optimized.length} 个日志文件过大，建议手动拆分或归档`);
  }

  return optimized;
}

function generateRecycleReport(archived, cleaned, optimized) {
  const reportPath = path.join(config.archiveDir, 'recycle-report.md');
  const report = `# 自动回收报告 - ${getCurrentDate()}

## 📦 归档日志
- 数量：${archived.length} 个
- 位置：\`docs/archive/logs/\`

## 🧹 清理临时文件
- 数量：${cleaned} 个

## ⚠️  大文件优化建议
- 数量：${optimized.length} 个
${optimized.length > 0 ? '- 文件：' + optimized.map(o => o.file).join(', ') : ''}

## 📊 统计
- 日志保留期：${config.logRetentionDays} 天
- 执行时间：${new Date().toISOString()}
`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 回收报告已生成：${reportPath.replace(PROJECT_ROOT + '/', '')}`);
}

function runAutoRecycle() {
  console.log('🔄 自动回收机制启动\n');
  console.log('='.repeat(60));

  const startTime = Date.now();

  // 1. 归档旧日志
  const archived = archiveOldLogs();

  // 2. 清理临时文件
  const cleaned = cleanTempFiles();

  // 3. 优化大日志文件
  const optimized = optimizeLargeLogs();

  // 4. 生成报告
  generateRecycleReport(archived, cleaned, optimized);

  const duration = Date.now() - startTime;

  console.log('\n' + '='.repeat(60));
  console.log(`✨ 自动回收完成 (耗时：${duration}ms)`);
  console.log('\n建议:');
  console.log('  • 定期运行自动回收（建议每周一次）');
  console.log('  • 查看回收报告了解优化情况');
  console.log('  • 手动处理大日志文件');
}

// 如果作为命令行运行
if (import.meta.url === `file://${process.argv[1]}`) {
  runAutoRecycle();
}

// 导出供其他脚本调用
export { runAutoRecycle, archiveOldLogs, cleanTempFiles, optimizeLargeLogs };
