#!/usr/bin/env node

/**
 * 记忆哨兵模块 (Sentinel V4.0 - Evidence Chain Edition)
 * 核心变更: 强制引入引用声明 (Citations) 与证据链追踪 (Evidence Trace)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { sendToLark } from '../services/lark-service.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '../../');

const BUFFER_PATH = path.join(__dirname, '../../.context_buffer.json');
const ASSISTANT_MEMORY_HOME = process.env.CORTEXOS_ASSISTANT_MEMORY_HOME || path.join(PROJECT_ROOT, '.memory');
const LOGS_DIR = path.join(ASSISTANT_MEMORY_HOME, 'logs');

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
