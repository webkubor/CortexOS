#!/usr/bin/env node

/**
 * 外部大脑自动运转主脚本 (Brain-Pilot V4.4 - Memory Hub Edition)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';
import { consumeBuffer, addToLog, getCurrentTimestamp, sendToLark } from './sentinel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = '/Users/webkubor/Documents/AI_Common';
const UV_PATH = '/Users/webkubor/.local/bin/uv';
const ROUTER_PATH = path.join(PROJECT_ROOT, 'docs/router.md');
const HISTORY_PATH = path.join(PROJECT_ROOT, 'docs/BRAIN_HISTORY.md');

function getCompactTime() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

// 核心：检测新的深度复盘
function detectNewRetrospectives() {
  try {
    const result = execSync('find docs/memory/retrospectives -name "*.md" -mmin -10', {
      encoding: 'utf-8', cwd: PROJECT_ROOT
    });
    return result.trim().split('\n').filter(f => f && !f.includes('index.md'));
  } catch (e) { return []; }
}

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
    if (!file.endsWith('.md')) return "";
    const diff = execSync(`git diff -U0 "${file}" | grep "^+[^+]" | sed "s/^+//g" | head -n 2`, {
      encoding: 'utf-8', cwd: PROJECT_ROOT
    });
    const snippet = diff.trim().split('\n').filter(l => l.trim()).join('; ');
    return snippet ? `\n   「 ${snippet.substring(0, 100).replace(/\n/g, ' ')} 」` : "";
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
  const timeLabel = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  const buffer = consumeBuffer();
  
  try {
    const status = execSync('git status --short', { encoding: 'utf-8', cwd: PROJECT_ROOT });
    const lines = status.trim().split('\n').filter(l => l && !l.includes('chroma_db/') && !l.includes('.last_notif.json'));
    
    const newRetros = detectNewRetrospectives();

    if (lines.length > 0 || (buffer && buffer.length > 0) || newRetros.length > 0) {
      const stats = execSync('git diff --numstat', { encoding: 'utf-8', cwd: PROJECT_ROOT })
                    .trim().split('\n')
                    .reduce((acc, line) => {
                      const parts = line.split('\t');
                      if (parts.length >= 3) acc[parts[2]] = `(+${parts[0]}/-${parts[1]})`;
                      return acc;
                    }, {});

      const totalStat = execSync('git diff --shortstat', { encoding: 'utf-8', cwd: PROJECT_ROOT }).trim();
      
      // 1. 任务块
      let taskSection = "";
      if (buffer && buffer.length > 0) {
        taskSection = buffer.map(item => `⚡️ **任务达成**: ${item.task}\n> ${item.description}`).join('\n\n') + "\n\n━━━━━━━━━━━━━━\n\n";
      }

      // 2. 复盘块
      let retroSection = "";
      if (newRetros.length > 0) {
        const list = newRetros.map(f => `• ${path.basename(f)}`).join('\n');
        retroSection = `📚 **复盘入库**\n${list}\n\n━━━━━━━━━━━━━━\n\n`;
      }

      // 3. 变更块
      const groupedFiles = {};
      lines.forEach(line => {
        const file = line.substring(3).trim();
        const intent = getSemanticIntent(file, routerMap);
        if (!groupedFiles[intent]) groupedFiles[intent] = [];
        groupedFiles[intent].push({ name: file.replace('docs/', ''), stat: stats[file] || "", snippet: getDiffSnippet(file) });
      });

      let changeSection = "";
      for (const [intent, files] of Object.entries(groupedFiles)) {
        changeSection += `📁 **${intent}**\n`;
        files.forEach(f => {
          changeSection += `• ${f.name}  *${f.stat}* ${f.snippet}\n`;
        });
        changeSection += `\n`;
      }

      const finalBody = `${taskSection}${retroSection}${changeSection}━━━━━━━━━━━━━━\n📊 **统计**: ${totalStat || '全量同步'}`;

      // 执行提交
      const intents = Object.keys(groupedFiles).join(' & ');
      execSync(`git add . && git commit -m "auto: ${intents || 'sync'} at ${startTime}"`, { cwd: PROJECT_ROOT });

      // 智力同步
      let modeLabel = "Semantic ✅";
      try {
        await runNativeIngestion();
      } catch (e) { modeLabel = "Physical 🚨"; }

      sendToLark(`[${timeLabel}] Brain ${brainVersion} | ${modeLabel}`, finalBody);
      addToLog({ title: '大脑同步', body: finalBody });
      console.log(`🚀 智能简报已送达飞书！`);
    }
  } catch (e) { console.error('⚠️ 自动驾驶运行异常:', e.message); }
}

autoPilot();
