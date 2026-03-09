#!/usr/bin/env node

/**
 * 记忆哨兵模块 (Sentinel V4.0 - Evidence Chain Edition)
 * 核心变更: 强制引入引用声明 (Citations) 与证据链追踪 (Evidence Trace)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '../../docs');
const BUFFER_PATH = path.join(__dirname, '../../.context_buffer.json');
const SECRETS_DIR = path.join(__dirname, '../../docs/secrets');
const NOTIF_LOCK_PATH = path.join(__dirname, '../../.last_notif.json');
const LOGS_DIR = path.join(DOCS_DIR, 'memory/logs');

export function getCurrentTimestamp() {
  return new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
}

export function getLogPath() {
  const today = new Date().toISOString().split('T')[0];
  return path.join(LOGS_DIR, `${today}.md`);
}

/**
 * 记录 Agent 的物理操作，增加强制引用声明
 */
export function logAgentAction(action) {
  const actionsDir = path.join(LOGS_DIR, 'raw');
  if (!fs.existsSync(actionsDir)) fs.mkdirSync(actionsDir, { recursive: true });
  
  const today = new Date().toISOString().split('T')[0];
  const logFile = path.join(actionsDir, `candy-${today}.md`);
  if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, `# 小烛行动日志 - ${today}\n\n`);

  // 注入引用声明与物理路径
  const citations = action.citations && action.citations.length > 0 
    ? action.citations.map(c => `\`${c}\``).join(', ') 
    : '⚠️ 逻辑推演 (无物理引用)';
  
  const entry = `\n### ⚡️ 物理操作 - ${getCurrentTimestamp()}\n- **任务**: ${action.task || '未命名'}\n- **参考**: ${citations}\n- **执行**: \`${action.command}\`\n- **结果**: ${action.success ? '✅' : '❌'}\n---\n`;
  fs.appendFileSync(logFile, entry);
}

export function ensureJournalExists() {
  const logPath = getLogPath();
  if (!fs.existsSync(path.dirname(logPath))) fs.mkdirSync(path.dirname(logPath), { recursive: true });
  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, `# ${new Date().toISOString().split('T')[0]}: 操作日志\n\n`);
  }
}

/**
 * 记录执行日志，增加证据链展示
 */
export function addToLog(content, options = { notify: false }) {
  ensureJournalExists();
  const logPath = getLogPath();
  
  // 注入证据链展示 (Sources Searched)
  const evidence = content.sources && content.sources.length > 0 
    ? `\n> **[Sources Searched]**: ${content.sources.map(s => `\`${s}\``).join(' | ')}\n` 
    : '';
  
  const entry = `\n## 🔄 ${content.title || '系统记录'} - ${getCurrentTimestamp()}\n${evidence}\n${content.body}\n\n---\n`;
  fs.appendFileSync(logPath, entry);
  if (options.notify) sendToLark(content.title, content.body);
}

export async function sendToLark(title, body) {
  try {
    const envPath = path.join(SECRETS_DIR, 'lark.env');
    if (!fs.existsSync(envPath)) return;
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const webhookUrl = envContent.match(/LARK_WEBHOOK_URL=(.+)/)?.[1];
    if (!webhookUrl) return;

    const now = new Date();
    const currentHour = now.getHours();
    
    if (currentHour < 10 || currentHour >= 20) return;

    let lastNotif = { timestamp: 0, body: "" };
    if (fs.existsSync(NOTIF_LOCK_PATH)) {
      try { lastNotif = JSON.parse(fs.readFileSync(NOTIF_LOCK_PATH, 'utf-8')); } catch (e) {}
    }

    if (body.trim() === lastNotif.body.trim()) return;

    if (Date.now() - lastNotif.timestamp < 5 * 60 * 1000) return;

    const payload = {
      msg_type: "post",
      content: {
        post: { zh_cn: { title: `🧠 大脑同步: ${title}`, content: [[{ tag: "text", text: body.substring(0, 1000) }]] } }
      }
    };

    const response = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (response.ok) fs.writeFileSync(NOTIF_LOCK_PATH, JSON.stringify({ timestamp: Date.now(), body: body.trim() }));
  } catch (e) { console.error('Lark 推送失败:', e.message); }
}

export function pushSemanticContext(data) {
  let buffer = [];
  if (fs.existsSync(BUFFER_PATH)) {
    try { buffer = JSON.parse(fs.readFileSync(BUFFER_PATH, 'utf-8')); } catch (e) { buffer = []; }
  }
  buffer.push({ timestamp: getCurrentTimestamp(), ...data });
  fs.writeFileSync(BUFFER_PATH, JSON.stringify(buffer, null, 2));
}

export function consumeBuffer() {
  if (!fs.existsSync(BUFFER_PATH)) return null;
  const buffer = JSON.parse(fs.readFileSync(BUFFER_PATH, 'utf-8'));
  fs.unlinkSync(BUFFER_PATH);
  return buffer;
}

export default { pushSemanticContext, consumeBuffer, addToLog, getCurrentTimestamp, sendToLark, logAgentAction };
