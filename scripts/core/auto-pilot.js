#!/usr/bin/env node

/**
 * 外部大脑自动运转主脚本 (Brain-Pilot V4.8 - Full Chinese Edition)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';
import { consumeBuffer, addToLog, getCurrentTimestamp, sendToLark } from './sentinel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '../../');
const UV_PATH = '/Users/webkubor/.local/bin/uv';
const ROUTER_PATH = path.join(PROJECT_ROOT, 'docs/router.md');
const HISTORY_PATH = path.join(PROJECT_ROOT, 'docs/BRAIN_HISTORY.md');

function getBrainVersion() {
  try {
    const content = fs.readFileSync(HISTORY_PATH, 'utf-8');
    const match = content.match(/> \*\*当前智力档位\*\*: (v[\d.]+)/);
    return match ? match[1] : 'v0.0.0';
  } catch (e) { return 'v?.?.?'; }
}

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

function getSemanticIntent(filePath, routerMap) {
  if (filePath === 'docs/router.md') return '入口协议';
  if (filePath === 'docs/BRAIN_HISTORY.md') return '大脑演化史';
  for (const [route, intent] of Object.entries(routerMap)) {
    if (filePath.startsWith('docs/' + route) || filePath.startsWith(route)) return intent;
  }
  return '基础架构';
}

function getDiffSnippet(file) {
  try {
    const fullPath = path.join(PROJECT_ROOT, file);
    if (!file.endsWith('.md') || !fs.existsSync(fullPath)) return "";
    const diff = execSync(`git diff -U0 "${file}" | grep "^+[^+]" | sed "s/^+//g" | head -n 2`, {
      encoding: 'utf-8', cwd: PROJECT_ROOT
    });
    const snippet = diff.trim().split('\n').filter(l => l.trim()).join('；');
    return snippet ? `\n      「 ${snippet.substring(0, 100).replace(/\n/g, ' ')} 」` : "";
  } catch (e) { return ""; }
}

async function runNativeIngestion() {
  return new Promise((resolve, reject) => {
    const ingestProcess = spawn(UV_PATH, ['run', './scripts/ingest/chroma_ingest.py'], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, AI_COMMON_ROOT: path.join(PROJECT_ROOT, 'docs') }
    });
    ingestProcess.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Exit ${code}`)));
  });
}

async function autoPilot() {
  const brainVersion = getBrainVersion();
  const routerMap = getRouterMap();
  const startTime = getCurrentTimestamp();

  const buffer = consumeBuffer();
  
  try {
    const statusOutput = execSync('git status --short', { encoding: 'utf-8', cwd: PROJECT_ROOT });
    const rawLines = statusOutput.split('\n').filter(l => l.trim() && !l.includes('chroma_db/') && !l.includes('.last_notif.json'));
    
    if (rawLines.length > 0 || (buffer && buffer.length > 0)) {
      const stats = execSync('git diff --numstat', { encoding: 'utf-8', cwd: PROJECT_ROOT })
                    .trim().split('\n')
                    .reduce((acc, line) => {
                      const parts = line.split('\t');
                      if (parts.length >= 3) acc[parts[2]] = `(+${parts[0]}/-${parts[1]})`;
                      return acc;
                    }, {});

      // 提取总统计并翻译
      let totalStat = execSync('git diff --shortstat', { encoding: 'utf-8', cwd: PROJECT_ROOT }).trim();
      totalStat = totalStat.replace(/files? changed/, '个文件变更')
                           .replace(/insertions?\(\+\)/, '行新增')
                           .replace(/deletions?\(-\)/, '行删除')
                           .replace(/,/, '，');
      
      let message = "";

      // 1. 任务部分
      if (buffer && buffer.length > 0) {
        buffer.forEach(item => {
          message += `🎯 **任务达成**: ${item.task}\n${item.description}\n\n`;
        });
      }

      // 2. 变更部分
      const groupedFiles = {};
      rawLines.forEach(line => {
        const file = line.substring(3).trim(); // 稳健截取
        const intent = getSemanticIntent(file, routerMap);
        if (!groupedFiles[intent]) groupedFiles[intent] = [];
        groupedFiles[intent].push({ name: file, stat: stats[file] || "", snippet: getDiffSnippet(file) });
      });

      for (const [intent, files] of Object.entries(groupedFiles)) {
        message += `⚡️ **${intent}**\n`;
        files.forEach(f => {
          message += `   • ${f.name}  ${f.stat}${f.snippet}\n`;
        });
        message += `\n`;
      }

      message += `━━━━━━━━━━━━━━\n`;
      message += `📊 **统计**: ${totalStat || '全量同步'}`;

      // 执行提交
      const intents = Object.keys(groupedFiles).join(' & ');
      execSync(`git add . && git commit -m "auto: ${intents || 'sync'} at ${startTime}"`, { cwd: PROJECT_ROOT });

      // 模式翻译
      let modeLabel = "语义模式 ✅";
      try {
        await runNativeIngestion();
      } catch (e) { modeLabel = "物理模式 🚨"; }

      // 推送
      sendToLark(`大脑版本 ${brainVersion} | ${modeLabel}`, message);
      
      addToLog({ title: '大脑同步', body: message });
      console.log(`🚀 全中文战报已送达！`);
    }
  } catch (e) { console.error('⚠️ 运行异常:', e.message); }
}

autoPilot();
