#!/usr/bin/env node

/**
 * 记忆哨兵模块 (Sentinel V4.0 - Evidence Chain Edition)
 * 核心变更: 强制引入引用声明 (Citations) 与证据链追踪 (Evidence Trace)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '../../docs');
const BUFFER_PATH = path.join(__dirname, '../../.context_buffer.json');
const SECRETS_DIR = path.join(__dirname, '../../brain/secrets');
const NOTIF_LOCK_PATH = path.join(__dirname, '../../.last_notif.json');
const LOGS_DIR = path.join(DOCS_DIR, 'memory/logs');

/**
 * 获取当前时间戳
 * @returns {string} 格式化的时间字符串
 */
export function getCurrentTimestamp() {
  return new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
}

/**
 * 获取今日日志文件的物理路径
 * @returns {string} 绝对路径
 */
export function getLogPath() {
  const today = new Date().toISOString().split('T')[0];
  return path.join(LOGS_DIR, `${today}.md`);
}

/**
 * 记录 Agent 的物理操作，增加强制引用声明
 */
/**
 * 记录 Agent 的原子化操作日志
 * @param {Object} action - 操作详情 { type, file, summary }
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

/**
 * 确保日志记录系统准备就绪
 * 如果目录或文件不存在，则自动初始化
 */
export function ensureJournalExists() {
  const logPath = getLogPath();
  if (!fs.existsSync(path.dirname(logPath))) fs.mkdirSync(path.dirname(logPath), { recursive: true });
  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, `# ${new Date().toISOString().split('T')[0]}: 操作日志\n\n`);
  }
}

/**
 * 向全局聚合日志中添加记录
 * 支持证据链 (Evidence Trace) 自动注入
 * @param {Object} content - 日志内容 { title, body, sources }
 * @param {Object} options - 配置项 { notify: boolean }
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

/**
 * 向飞书推送战报
 * 包含防骚扰冷却逻辑和消息内容脱敏
 * @param {string} title - 通知标题
 * @param {string} body - 通知正文
 */
export async function sendToLark(title, body) {
  try {
    const normalizedBody = String(body ?? '');
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
      try { lastNotif = JSON.parse(fs.readFileSync(NOTIF_LOCK_PATH, 'utf-8')); } catch (e) { }
    }

    if (normalizedBody.trim() === String(lastNotif.body ?? '').trim()) return;

    if (Date.now() - lastNotif.timestamp < 5 * 60 * 1000) return;

    const paragraphs = buildLarkParagraphs(normalizedBody, { maxChars: 1800, maxLines: 22 });

    const payload = {
      msg_type: "post",
      content: {
        post: { zh_cn: { title: `🧠 大脑同步: ${title}`, content: paragraphs } }
      }
    };

    const response = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (response.ok) fs.writeFileSync(NOTIF_LOCK_PATH, JSON.stringify({ timestamp: Date.now(), body: normalizedBody.trim() }));
  } catch (e) { console.error('Lark 推送失败:', e.message); }
}

function buildLarkParagraphs(body, options = {}) {
  const maxChars = options.maxChars ?? 1800;
  const maxLines = options.maxLines ?? 22;
  const maxLineLength = options.maxLineLength ?? 180;
  const lines = String(body ?? '').split('\n');
  const paragraphs = [];
  let usedChars = 0;

  for (const rawLine of lines) {
    let line = rawLine.replace(/\t/g, '  ').trimEnd();
    if (!line) line = ' ';

    if (line.length > maxLineLength) {
      line = `${line.slice(0, maxLineLength - 1)}…`;
    }

    if (usedChars + line.length > maxChars || paragraphs.length >= maxLines) {
      paragraphs.push([{ tag: 'text', text: '…（内容已折叠，详情见本地日志）' }]);
      break;
    }

    paragraphs.push([{ tag: 'text', text: line }]);
    usedChars += line.length;
  }

  if (paragraphs.length === 0) {
    paragraphs.push([{ tag: 'text', text: '（空通知）' }]);
  }

  return paragraphs;
}

/**
 * 发送 macOS 原生系统通知 (无限制)
 */
export function sendNativeNotification(title, body) {
  try {
    const escapedTitle = title.replace(/"/g, '\\"');
    const escapedBody = body.substring(0, 100).replace(/"/g, '\\"').replace(/\n/g, ' ');
    execSync(`osascript -e 'display notification "${escapedBody}" with title "🧠 ${escapedTitle}"'`);
  } catch (e) {
    console.error('系统通知发送失败:', e.message);
  }
}

/**
 * 将任务推送到缓存缓冲区
 * @param {Object} data - 任务数据
 */
export function pushSemanticContext(data) {
  let buffer = [];
  if (fs.existsSync(BUFFER_PATH)) {
    try { buffer = JSON.parse(fs.readFileSync(BUFFER_PATH, 'utf-8')); } catch (e) { buffer = []; }
  }
  buffer.push({ timestamp: getCurrentTimestamp(), ...data });
  fs.writeFileSync(BUFFER_PATH, JSON.stringify(buffer, null, 2));
}

/**
 * 消费缓冲区内的所有记录
 * @returns {Array} 缓冲区中的内容
 */
export function consumeBuffer() {
  if (!fs.existsSync(BUFFER_PATH)) return null;
  const buffer = JSON.parse(fs.readFileSync(BUFFER_PATH, 'utf-8'));
  fs.unlinkSync(BUFFER_PATH);
  return buffer;
}

export default { pushSemanticContext, consumeBuffer, addToLog, getCurrentTimestamp, sendToLark, logAgentAction, sendNativeNotification };
