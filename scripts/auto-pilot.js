#!/usr/bin/env node

/**
 * 外部大脑自动运转主脚本 (Brain-Pilot V3.6 - Status-Aware Hardcore)
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

function getCompactTime() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

// 核心增强：解析 router.md 获取语义映射
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
  for (const [route, intent] of Object.entries(routerMap)) {
    if (filePath.startsWith('docs/' + route) || filePath.startsWith(route)) return intent;
  }
  return '🛠 基础架构';
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
  const routerMap = getRouterMap();

  // 1. Tasks
  const buffer = consumeBuffer();
  if (buffer && buffer.length > 0) {
    buffer.forEach(item => summaryParts.push(`⚡️ Task: ${item.task}\n> ${item.description}`));
  }

  // 2. Git Stats
  let totalStat = "";
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

      totalStat = execSync('git diff --shortstat', { encoding: 'utf-8', cwd: PROJECT_ROOT }).trim();
      const intents = new Set();
      
      const fileList = lines.map(line => {
        const file = line.substring(3).trim();
        const intent = getSemanticIntent(file, routerMap);
        intents.add(intent);
        return `- [${intent}] ${file} ${stats[file] || ''}`;
      }).join('\n');

      const intentSummary = Array.from(intents).join(' | ');
      summaryParts.push(`📝 Sync [${intentSummary}]:\n${fileList}\n📊 Stats: ${totalStat || 'New'}`);
      
      autoCommitAndLog();
    }
  } catch (e) {}

  if (summaryParts.length > 0) {
    let modeLabel = "✅ Semantic Mode";
    try {
      await runNativeIngestion();
    } catch (e) {
      modeLabel = "🚨 Physical Mode (Vector Offline)";
    }

    sendToLark(`[${timeLabel}] AI_Sync | ${modeLabel}`, summaryParts.join('\n\n'));
  } else {
    console.log(`[${getCurrentTimestamp()}] ℹ️ Silent...`);
  }
}

autoPilot();
