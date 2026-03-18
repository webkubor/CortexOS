#!/usr/bin/env node

/**
 * Memory Harvest — 关系记忆收割器
 *
 * 职责：从今日操作日志中提炼有情感价值的事件，追加到 relationship.md。
 * 触发：由 auto-pilot.js 在每轮维护任务中调用（每 5 分钟一次）。
 *
 * 判断逻辑（纯本地，无 LLM 调用）：
 *   - 命中"里程碑关键词" → category: 里程碑
 *   - 命中"偏好关键词"   → category: 偏好发现
 *   - 命中"反驳关键词"   → category: 温柔反驳
 *   - 命中"决策关键词"   → category: 共同决策
 *   - 其余 → 跳过，不写入（噪音过滤）
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '../../');
const ASSISTANT_MEMORY_HOME =
  process.env.CORTEXOS_ASSISTANT_MEMORY_HOME ||
  path.join(PROJECT_ROOT, '.memory');

const RELATIONSHIP_FILE = path.join(
  ASSISTANT_MEMORY_HOME,
  'persona',
  'relationship.md'
);

// 防重复标记：记录已经收割过的日志行 hash
const HARVEST_STATE_FILE = path.join(
  ASSISTANT_MEMORY_HOME,
  'meta',
  'memory-harvest-state.json'
);

// ── 关键词规则表 ──────────────────────────────────────────────
const RULES = [
  {
    category: '里程碑',
    keywords: ['里程碑', '首次', '第一次', '升级', '完成', 'v1', 'v2', '初始化', '人格扩展'],
  },
  {
    category: '偏好发现',
    keywords: ['喜欢', '不喜欢', '偏好', '习惯', '风格', '审美', '讨厌', '倾向'],
  },
  {
    category: '温柔反驳',
    keywords: ['反驳', '不对', '异议', '我认为', '但是', '然而', '其实'],
  },
  {
    category: '共同决策',
    keywords: ['决定', '确定', '共识', '方向', '选择', '我们', '一起'],
  },
];

// ── 工具函数 ─────────────────────────────────────────────────

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

function loadState() {
  try {
    if (fs.existsSync(HARVEST_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(HARVEST_STATE_FILE, 'utf-8'));
    }
  } catch {
    // ignore
  }
  return { harvested: [] };
}

function saveState(state) {
  const dir = path.dirname(HARVEST_STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // 只保留最近 500 条 hash，防止无限增长
  state.harvested = state.harvested.slice(-500);
  fs.writeFileSync(HARVEST_STATE_FILE, JSON.stringify(state, null, 2));
}

function classifyLine(line) {
  for (const rule of RULES) {
    if (rule.keywords.some(kw => line.includes(kw))) {
      return rule.category;
    }
  }
  return null;
}

function getTodayLogPath() {
  const today = new Date().toISOString().split('T')[0];
  return path.join(ASSISTANT_MEMORY_HOME, 'logs', `${today}.md`);
}

function appendToRelationship(entries) {
  if (entries.length === 0) return;

  const marker = '## 3. 共同经历日志 (Shared History)';

  let content = '';
  if (fs.existsSync(RELATIONSHIP_FILE)) {
    content = fs.readFileSync(RELATIONSHIP_FILE, 'utf-8');
  } else {
    fs.mkdirSync(path.dirname(RELATIONSHIP_FILE), { recursive: true });
    content = `# Candy × 栖洲 关系记忆档案\n\n${marker}\n`;
  }

  const block = entries
    .map(e => {
      const lines = [`\n#### ${e.date} ${e.time} [${e.category}] (auto-harvest)`];
      lines.push(`- **事件**: ${e.event}`);
      return lines.join('\n');
    })
    .join('\n');

  if (content.includes(marker)) {
    const insertPos = content.indexOf(marker) + marker.length;
    const nextSection = content.indexOf('\n## ', insertPos);
    if (nextSection === -1) {
      content = content + block + '\n';
    } else {
      content = content.slice(0, nextSection) + block + '\n' + content.slice(nextSection);
    }
  } else {
    content += `\n${marker}\n${block}\n`;
  }

  fs.writeFileSync(RELATIONSHIP_FILE, content, 'utf-8');
}

// ── 主流程 ────────────────────────────────────────────────────

function harvest() {
  const logPath = getTodayLogPath();
  if (!fs.existsSync(logPath)) {
    console.log('[memory-harvest] 今日日志不存在，跳过');
    return { harvested: 0 };
  }

  const state = loadState();
  const logContent = fs.readFileSync(logPath, 'utf-8');
  const lines = logContent.split('\n');

  const newEntries = [];
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 10) continue;

    const hash = simpleHash(trimmed);
    if (state.harvested.includes(hash)) continue;

    const category = classifyLine(trimmed);
    if (!category) continue;

    // 清理 markdown 标记，提取纯文本事件描述
    const event = trimmed
      .replace(/^#+\s*/, '')
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .slice(0, 80);

    newEntries.push({ date: dateStr, time: timeStr, category, event });
    state.harvested.push(hash);
  }

  if (newEntries.length > 0) {
    appendToRelationship(newEntries);
    saveState(state);
    console.log(`[memory-harvest] 沉淀 ${newEntries.length} 条关系记忆`);
  } else {
    console.log('[memory-harvest] 无新增情感事件');
  }

  return { harvested: newEntries.length };
}

harvest();
