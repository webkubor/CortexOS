#!/usr/bin/env node

/**
 * 外部大脑自动运转主脚本 (Brain-Pilot V3.9 - High-Signal Journaling)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';
import { consumeBuffer, addToLog, getCurrentTimestamp, sendToLark } from './sentinel.js';
import { autoCommitAndLog } from './auto-commit.js';

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
  if (filePath === 'docs/router.md') return '⚠️ 入口协议 (Router)';
  if (filePath === 'docs/BRAIN_HISTORY.md') return '📜 大脑演化史';
  for (const [route, intent] of Object.entries(routerMap)) {
    if (filePath.startsWith('docs/' + route) || filePath.startsWith(route)) return intent;
  }
  return '🛠 基础架构';
}

function getDiffSnippet(file) {
  try {
    if (!file.endsWith('.md')) return "";
    const diff = execSync(`git diff -U0 "${file}" | grep "^+[^+]" | sed "s/^+//g" | head -n 3`, {
      encoding: 'utf-8', cwd: PROJECT_ROOT
    });
    const snippet = diff.trim().split('\n').filter(l => l.trim()).join('; ');
    return snippet ? `\n   >> "${snippet.substring(0, 80)}..."` : "";
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
  const summaryParts = [];
  const timeLabel = getCompactTime();
  const brainVersion = getBrainVersion();
  const routerMap = getRouterMap();

  // 1. Tasks (Only Log High-Signal Tasks to Journal)
  const buffer = consumeBuffer();
  if (buffer && buffer.length > 0) {
    buffer.forEach(item => {
      summaryParts.push(`⚡️ Task: ${item.task}\n> ${item.description}`);
      // 只有这种有意义的任务才记入 Journal
      addToLog({ title: item.task, body: item.description });
    });
  }

  // 2. Git Stats (Don't log to Journal anymore, Git history is enough)
  try {
    const status = execSync('git status --short', { encoding: 'utf-8', cwd: PROJECT_ROOT });
    const lines = status.trim().split('\n').filter(l => l && !l.includes('chroma_db/'));
    
    if (lines.length > 0) {
      const stats = execSync('git diff --numstat', { encoding: 'utf-8', cwd: PROJECT_ROOT })
                    .trim().split('\n')
                    .reduce((acc, line) => {
                      const [add, del, file] = line.split('\t');
                      acc[file] = `(+${add}/-${del})`;
                      return acc;
                    }, {});

      const totalStat = execSync('git diff --shortstat', { encoding: 'utf-8', cwd: PROJECT_ROOT }).trim();
      const intents = new Set();
      
      const fileList = lines.map(line => {
        const file = line.substring(3).trim();
        const intent = getSemanticIntent(file, routerMap);
        intents.add(intent);
        const snippet = getDiffSnippet(file);
        return `- [${intent}] ${file} ${stats[file] || ''}${snippet}`;
      }).join('\n');

      const intentSummary = Array.from(intents).join(' | ');
      summaryParts.push(`📝 Sync [${intentSummary}]:\n${fileList}\n📊 Total: ${totalStat || 'New'}`);
      
      autoCommitAndLog();
    }
  } catch (e) {}

  // 3. New Retrospectives
  const newRetros = detectNewRetrospectives();
  if (newRetros.length > 0) {
    const list = newRetros.map(f => `- ${path.basename(f)}`).join('\n');
    summaryParts.push(`📚 Retro:\n${list}`);
    addToLog({ title: '新深度复盘归档', body: list });
  }

  if (summaryParts.length > 0) {
    let modeLabel = "✅ Semantic";
    try {
      await runNativeIngestion();
    } catch (e) {
      modeLabel = "🚨 Physical";
    }

    sendToLark(`[${timeLabel}] Brain ${brainVersion} | ${modeLabel}`, summaryParts.join('\n\n'));
  } else {
    console.log(`[${getCurrentTimestamp()}] ℹ️ Silent...`);
  }
}

autoPilot();
