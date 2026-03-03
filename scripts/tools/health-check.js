#!/usr/bin/env node

/**
 * CortexOS 外部大脑健康检查 (Sentinel V4.1 Optimized)
 * 适配 2026-02-27 重构后的目录结构
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 核心路径自动对齐
const PROJECT_ROOT = path.join(__dirname, '../../');
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');
const SCRIPTS_DIR = path.join(PROJECT_ROOT, 'scripts');
const EXTERNAL_SECRETS_DIR = process.env.CORTEXOS_SECRET_HOME || path.join(os.homedir(), 'Documents', 'CortexOS-Secrets');

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
  // 处理多种可能的引用格式 (docs/xxx.md 或 xxx.md)
  const cleanPath = relativePath.startsWith('docs/') ? relativePath.replace('docs/', '') : relativePath;
  const filePath = path.join(DOCS_DIR, cleanPath);
  return checkFileExists(filePath) && !fs.statSync(filePath).isDirectory();
}

/**
 * 验证 router.md 路径引用
 */
function verifyRouterPaths() {
  log(colors.blue, '\n🔍 检查 router.md 路径引用...');

  const routerPath = path.join(DOCS_DIR, 'router.md');
  if (!checkFileExists(routerPath)) {
    log(colors.red, `❌ router.md 不存在 (路径: ${routerPath})`);
    return ['router.md 缺失'];
  }

  const content = fs.readFileSync(routerPath, 'utf-8');
  const matches = [];
  const linkPattern = /\]\(([^)]+)\)/g;
  let linkMatch;
  while ((linkMatch = linkPattern.exec(content)) !== null) {
    matches.push(linkMatch[1].trim());
  }

  const issues = [];
  let validCount = 0;

  for (const match of matches) {
    if (!match || match.startsWith('http://') || match.startsWith('https://') || match.startsWith('#')) {
      continue;
    }

    const normalized = match.replace(/\\/g, '/');
    const resolved = path.resolve(path.dirname(routerPath), normalized);
    const candidates = [
      resolved,
      `${resolved}.md`,
      path.join(resolved, 'index.md')
    ];

    if (candidates.some(p => fs.existsSync(p))) {
      validCount++;
    } else {
      issues.push(`无效引用: ${match}`);
    }
  }

  if (issues.length > 0) {
    log(colors.red, `❌ router.md 中引用了 ${issues.length} 个不存在的路径`);
    issues.slice(0, 5).forEach(p => log(colors.red, `  • ${p}`));
  } else {
    log(colors.green, `✅ router.md 中所有 ${validCount} 个核心路径都有效`);
  }

  return issues;
}

/**
 * 检查关键目录 (重构后)
 * 注意：外置秘钥目录和 memory/logs 属于本地私密/运行时目录，
 * 在 CI 环境中不存在是正常的，不计入 P0 阻断项。
 */
function checkCriticalDirectories() {
  log(colors.blue, '\n🔍 检查核心目录结构...');
  const isCI = process.env.CI === 'true';

  // P0 严格检查：任何环境都必须存在
  const criticalDirs = [
    { name: 'Rules', path: path.join(DOCS_DIR, 'rules') },
    { name: 'UCD (Aesthetics)', path: path.join(DOCS_DIR, 'ucd') },
    { name: 'Core Scripts', path: path.join(SCRIPTS_DIR, 'core') }
  ];

  // 本地专属目录：CI 环境跳过（私密 / 运行时生成）
  const localOnlyDirs = [
    { name: 'Memory Logs', path: path.join(DOCS_DIR, 'memory/logs') },
    { name: 'External Secrets', path: EXTERNAL_SECRETS_DIR }
  ];

  const missing = [];
  for (const dir of criticalDirs) {
    if (checkFileExists(dir.path) && fs.statSync(dir.path).isDirectory()) {
      log(colors.green, `✅ ${dir.name} 目录存在`);
    } else {
      log(colors.red, `❌ ${dir.name} 目录缺失 (期望: ${dir.path})`);
      missing.push(dir.name);
    }
  }

  for (const dir of localOnlyDirs) {
    if (isCI) {
      log(colors.yellow, `⏭️  ${dir.name} 已跳过 (CI 环境，本地私密目录)`);
    } else if (checkFileExists(dir.path) && fs.statSync(dir.path).isDirectory()) {
      log(colors.green, `✅ ${dir.name} 目录存在`);
    } else {
      log(colors.yellow, `⚠️  ${dir.name} 目录缺失 (本地建议创建)`);
    }
  }

  return missing;
}

/**
 * 检查 RAG 与 向量库环境
 * chroma_db 是本地运行时数据库，CI 中不存在属正常，不计入 warning。
 */
function checkVectorStore() {
  log(colors.blue, '\n🔍 检查 RAG 向量库环境...');
  const isCI = process.env.CI === 'true';
  const chromaPath = path.join(PROJECT_ROOT, 'chroma_db');
  const queryScript = path.join(SCRIPTS_DIR, 'ingest/query_brain.py');

  let issues = [];
  if (isCI) {
    log(colors.yellow, '⏭️  ChromaDB 检查已跳过 (CI 环境，本地向量库)');
  } else if (checkFileExists(chromaPath)) {
    log(colors.green, '✅ ChromaDB 本地数据存在');
  } else {
    log(colors.yellow, '⚠️  ChromaDB 数据未就绪（本地 RAG 功能不可用）');
  }

  if (checkFileExists(queryScript)) {
    log(colors.green, '✅ 语义检索脚本就绪');
  } else {
    log(colors.red, '❌ 语义检索脚本缺失');
    issues.push('query_brain.py 缺失');
  }
  return issues;
}

function runHealthCheck() {
  const strictMode = process.argv.includes('--strict');
  const failOnWarning = process.argv.includes('--fail-on-warning');

  log(colors.cyan, '🧠 CortexOS 外部大脑健康检查 (Sentinel V4.1)');
  log(colors.cyan, '='.repeat(50));

  const issues = {
    critical: [],
    warnings: []
  };

  issues.critical.push(...checkCriticalDirectories());
  issues.critical.push(...verifyRouterPaths());
  issues.warnings.push(...checkVectorStore());

  log(colors.cyan, '\n' + '='.repeat(50));
  if (issues.critical.length === 0) {
    log(colors.green, '🎉 外部大脑核心架构健康！');
  } else {
    log(colors.red, `❌ 发现 ${issues.critical.length} 个架构性问题`);
  }
  if (issues.warnings.length > 0) {
    log(colors.yellow, `⚠️  发现 ${issues.warnings.length} 个警告`);
  }
  log(colors.cyan, '='.repeat(50));

  if (strictMode && (issues.critical.length > 0 || (failOnWarning && issues.warnings.length > 0))) {
    log(colors.red, '\n🚫 strict 模式未通过');
    process.exitCode = 1;
  }
}

runHealthCheck();
