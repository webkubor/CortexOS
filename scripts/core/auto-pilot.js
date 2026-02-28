#!/usr/bin/env node

/**
 * 外部大脑自动运转主脚本 (Brain-Pilot V4.9 - Lark Optimized Edition)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';
import { consumeBuffer, addToLog, getCurrentTimestamp, sendToLark, sendNativeNotification } from './sentinel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '../../');
const UV_PATH = '/Users/webkubor/.local/bin/uv';
const ROUTER_PATH = path.join(PROJECT_ROOT, 'docs/router.md');
const HISTORY_PATH = path.join(PROJECT_ROOT, 'docs/BRAIN_HISTORY.md');

/**
 * 获取当前大脑的智力版本号
 * 从 BRAIN_HISTORY.md 中提取最新的版本标记
 * @returns {string} 版本号 (例如 'v1.2.0')
 */
function getBrainVersion() {
  try {
    const content = fs.readFileSync(HISTORY_PATH, 'utf-8');
    const match = content.match(/> \*\*当前智力档位\*\*: (v[\d.]+)/);
    return match ? match[1] : 'v0.0.0';
  } catch (e) { return 'v?.?.?'; }
}

/**
 * 解析路由表映射
 * 提取 router.md 中的路径与语义意图的对应关系
 * @returns {Object} 路由映射表 { "path": "intent" }
 */
function getRouterMap() {
  try {
    const content = fs.readFileSync(ROUTER_PATH, 'utf-8');
    const tableRegex = /\| \*\*([^*]+)\*\* \| `([^`]+)` \|/g;
    const map = {};
    let match;
    while ((match = tableRegex.exec(content)) !== null) {
      map[match[2].trim()] = match[1].trim();
    }
    return map;
  } catch (e) { return {}; }
}

/**
 * 根据文件路径推断语义意图
 * @param {string} filePath - 文件相对路径
 * @param {Object} routerMap - 路由映射关系
 * @returns {string} 语义标签 (如 '创作', '工程')
 */
function getSemanticIntent(filePath, routerMap) {
  if (filePath === 'docs/router.md') return '入口协议';
  if (filePath === 'docs/BRAIN_HISTORY.md') return '大脑演化史';
  for (const [route, intent] of Object.entries(routerMap)) {
    if (filePath.startsWith('docs/' + route) || filePath.startsWith(route)) return intent;
  }
  return '基础架构';
}

function parseStatusFile(line) {
  const raw = line.substring(3).trim();
  if (raw.includes(' -> ')) return raw.split(' -> ').pop().trim();
  return raw;
}

function parseDiffStats() {
  try {
    const output = execSync('git diff --numstat', { encoding: 'utf-8', cwd: PROJECT_ROOT }).trim();
    if (!output) return {};
    return output.split('\n').reduce((acc, line) => {
      const parts = line.split('\t');
      if (parts.length < 3) return acc;
      const file = parts.slice(2).join('\t').trim();
      const added = Number.isFinite(Number(parts[0])) ? Number(parts[0]) : 0;
      const deleted = Number.isFinite(Number(parts[1])) ? Number(parts[1]) : 0;
      acc[file] = {
        added,
        deleted,
        score: added + deleted,
        stat: `(+${added}/-${deleted})`
      };
      return acc;
    }, {});
  } catch (e) {
    return {};
  }
}

function compactPath(filePath) {
  return filePath.replace(/^docs\//, '');
}

function buildTotalStat(files, statMap) {
  const total = files.reduce((acc, file) => {
    const stat = statMap[file];
    if (stat) {
      acc.added += stat.added;
      acc.deleted += stat.deleted;
    }
    return acc;
  }, { added: 0, deleted: 0 });
  return `${files.length} 个文件变动 | ${total.added} 新增, ${total.deleted} 删除`;
}

function buildDetailedLog(buffer, groupedFiles, fileRecords, totalStat) {
  let message = '';
  if (buffer && buffer.length > 0) {
    buffer.forEach(item => {
      message += `【 任务达成 】\n${item.task}\n> ${item.description}\n\n`;
    });
  }

  for (const [intent, files] of Object.entries(groupedFiles)) {
    message += `[ ${intent} ]\n`;
    files.forEach(f => {
      message += `  - ${f.name} ${f.stat}\n`;
    });
    message += `\n`;
  }

  if (fileRecords.length === 0 && (!buffer || buffer.length === 0)) {
    message += '[ 基础架构 ]\n  - 无文件变更（仅任务缓冲）\n\n';
  }

  message += `------------------------------\n`;
  message += `数据汇总: ${totalStat}`;
  return message;
}

function buildLarkSummary(buffer, fileRecords, groupedFiles, totalStat) {
  const lines = [];

  if (buffer && buffer.length > 0) {
    lines.push('🎯 任务进展');
    buffer.slice(0, 3).forEach((item, idx) => {
      const task = (item.task || '未命名任务').trim();
      lines.push(`${idx + 1}. ${task}`);
    });
    if (buffer.length > 3) lines.push(`… 其余 ${buffer.length - 3} 项任务已省略`);
    lines.push('');
  }

  lines.push(`📊 数据汇总: ${totalStat}`);

  const moduleSummary = Object.entries(groupedFiles)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([intent, files]) => `${intent} ${files.length}`)
    .join(' | ');
  if (moduleSummary) lines.push(`🧭 模块分布: ${moduleSummary}`);

  if (fileRecords.length > 0) {
    lines.push('📌 重点变更');
    const topFiles = [...fileRecords]
      .sort((a, b) => (b.score - a.score) || a.name.localeCompare(b.name, 'zh-CN'))
      .slice(0, 4);
    topFiles.forEach((f, idx) => {
      lines.push(`${idx + 1}) ${compactPath(f.name)} ${f.stat} [${f.intent}]`);
    });
    if (fileRecords.length > topFiles.length) {
      lines.push(`… 其余 ${fileRecords.length - topFiles.length} 个文件已折叠`);
    }
  }

  lines.push('');
  lines.push('🗂 详细记录已写入 docs/memory/logs');
  return lines.join('\n');
}

/**
 * 执行向量库入库任务
 * 调用 Python 脚本完成 ChromaDB 的物理构建
 * @returns {Promise<void>}
 */
async function runNativeIngestion() {
  return new Promise((resolve, reject) => {
    const ingestProcess = spawn(UV_PATH, ['run', './scripts/ingest/chroma_ingest.py'], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, AI_COMMON_ROOT: path.join(PROJECT_ROOT, 'docs') }
    });
    ingestProcess.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Exit ${code}`)));
  });
}

/**
 * 大脑自动推进主程序
 * 流程：检测变动 -> 自动提交 -> 向量化检索 -> 发送多端通知
 */
async function autoPilot() {
  const brainVersion = getBrainVersion();
  const routerMap = getRouterMap();
  const startTime = getCurrentTimestamp();

  const buffer = consumeBuffer();

  try {
    const statusOutput = execSync('git status --short', { encoding: 'utf-8', cwd: PROJECT_ROOT });
    const rawLines = statusOutput.split('\n').filter(l => l.trim() && !l.includes('chroma_db/') && !l.includes('.last_notif.json'));

    if (rawLines.length > 0 || (buffer && buffer.length > 0)) {
      const stats = parseDiffStats();
      const changedFiles = rawLines
        .map(parseStatusFile)
        .filter(Boolean);
      const uniqueFiles = [...new Set(changedFiles)];

      const groupedFiles = {};
      const fileRecords = [];
      uniqueFiles.forEach(file => {
        const intent = getSemanticIntent(file, routerMap);
        if (!groupedFiles[intent]) groupedFiles[intent] = [];
        const stat = stats[file]?.stat || '(+0/-0)';
        const score = stats[file]?.score ?? 0;
        const record = { name: file, stat, score, intent };
        groupedFiles[intent].push(record);
        fileRecords.push(record);
      });

      const totalStat = buildTotalStat(uniqueFiles, stats);
      const detailedMessage = buildDetailedLog(buffer, groupedFiles, fileRecords, totalStat || '全量同步完成');
      const larkMessage = buildLarkSummary(buffer, fileRecords, groupedFiles, totalStat || '全量同步完成');

      // 执行提交
      const intents = Object.keys(groupedFiles).join(' & ');
      execSync(`git add . && git commit -m "auto: ${intents || 'sync'} at ${startTime}"`, { cwd: PROJECT_ROOT });

      // 模式判定
      let modeLabel = "语义模式";
      try {
        await runNativeIngestion();
      } catch (e) { modeLabel = "物理模式"; }

      // 推送 (标题带关键词和核心状态)
      sendToLark(`${brainVersion} | ${modeLabel}`, larkMessage);
      sendNativeNotification(`大脑同步完成: ${modeLabel}`, `数据汇总: ${totalStat}`);

      addToLog({ title: '大脑同步', body: detailedMessage });
      console.log(`🚀 飞书定制版战报已送达！`);
    }
  } catch (e) {
    console.error('⚠️ 运行异常:', e.message);
    sendNativeNotification('⚠️ 大脑神经元异常', `自动记录与同步失败: ${e.message}`);
  }
}

autoPilot();
