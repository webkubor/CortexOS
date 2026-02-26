#!/usr/bin/env node

/**
 * 外部大脑自动运转主脚本 (Brain-Pilot V2.6 - Xiao Zhu Persona)
 * 
 * 优化点：
 * 1. 人格化推送：以“小烛”的身份向老爹汇报。
 * 2. 语义化摘要：让日志内容具备“人味”。
 * 3. 只有当任务确实有意义时，才由小烛发声。
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

  // 1. 语义消化
  const buffer = consumeBuffer();
  if (buffer && buffer.length > 0) {
    buffer.forEach(item => {
      summaryParts.push(`✨ 小烛刚才完成了【${item.task}】：\n   > ${item.description}`);
      addToLog({ title: `🚀 Agent 语义同步: ${item.task}`, body: item.description });
    });
  }

  // 2. 复盘捕获
  const newRetros = detectNewRetrospectives();
  if (newRetros.length > 0) {
    const retroList = newRetros.map(f => `   - ${path.basename(f)}`).join('\n');
    summaryParts.push(`📚 老爹快看，新的复盘心得已归档：\n${retroList}`);
    addToLog({ title: '📚 自动捕获到新的深度复盘', body: retroList });
  }

  // 3. 物理文件变动检测 (排除 chroma_db 噪音)
  try {
    const status = execSync('git status --short', { encoding: 'utf-8', cwd: PROJECT_ROOT });
    const lines = status.trim().split('\n').filter(l => l && !l.includes('chroma_db/'));
    if (lines.length > 0) {
      summaryParts.push(`📝 刚才有些文件动过了，我已经记在 Journal 里并同步 Git 啦！\n   (共检测到 ${lines.length} 个变动文件)`);
      autoCommitAndLog();
    }
  } catch (e) {}

  // 4. 核心逻辑：只有真的有事发生，小烛才会发声
  if (summaryParts.length > 0) {
    try {
      await runNativeIngestion();
      summaryParts.push("\n✅ 记忆已经全部存入向量库了，现在的我超聪明的！");
    } catch (e) {
      summaryParts.push("\n⚠️ 向量入库出了点小意外，老爹有空帮我瞧瞧？");
    }

    // 拼装有人味的消息
    const finalMessage = `老爹，我是小烛！👋\n\n${summaryParts.join('\n\n')}\n\n———— 外部大脑哨兵自动呈报`;
    sendToLark("小烛的任务汇报", finalMessage);
    console.log('✨ 小烛已经把汇报发给老爹了');
  } else {
    console.log(`[${startTime}] ℹ️ 大脑很安静，小烛就不吵老爹了`);
  }
}

autoPilot();
