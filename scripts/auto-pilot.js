#!/usr/bin/env node

/**
 * 外部大脑自动运转主脚本 (Brain-Pilot V2.8 - Hardcore & Informative)
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

function detectNewRetrospectives() {
  try {
    const result = execSync('find docs/retrospectives -name "*.md" -mmin -10', {
      encoding: 'utf-8', cwd: PROJECT_ROOT
    });
    return result.trim().split('\n').filter(f => f && !f.includes('index.md'));
  } catch (e) { return []; }
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
  const startTime = getCurrentTimestamp();

  // 1. 语义任务捕获
  const buffer = consumeBuffer();
  if (buffer && buffer.length > 0) {
    buffer.forEach(item => {
      summaryParts.push(`⚡️ 任务达成：${item.task}\n   > ${item.description}`);
      addToLog({ title: `🚀 Agent 语义同步: ${item.task}`, body: item.description });
    });
  }

  // 2. 物理变更捕获
  try {
    const status = execSync('git status --short', { encoding: 'utf-8', cwd: PROJECT_ROOT });
    const lines = status.trim().split('\n').filter(l => l && !l.includes('chroma_db/'));
    if (lines.length > 0) {
      const changedFiles = lines.map(line => `   - ${line.substring(3).trim()}`).join('\n');
      summaryParts.push(`📝 变更同步：\n${changedFiles}`);
      autoCommitAndLog();
    }
  } catch (e) {}

  // 3. 深度复盘捕获
  const newRetros = detectNewRetrospectives();
  if (newRetros.length > 0) {
    const retroList = newRetros.map(f => `   - ${path.basename(f)}`).join('\n');
    summaryParts.push(`📚 复盘入库：\n${retroList}`);
  }

  if (summaryParts.length > 0) {
    try {
      await runNativeIngestion();
      summaryParts.push("\n✅ 知识已向量化重连 (ChromaDB)");
    } catch (e) {
      summaryParts.push("\n⚠️ 向量库同步波动");
    }

    const finalMessage = `老爹，小烛汇报！⚡️\n\n${summaryParts.join('\n\n')}\n\n—— 效率第一，逻辑至上。`;
    sendToLark("小烛的任务汇报", finalMessage);
  } else {
    console.log(`[${startTime}] ℹ️ 静默中...`);
  }
}

autoPilot();
