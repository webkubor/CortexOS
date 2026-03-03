#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../../');
const fleetFile = path.join(projectRoot, 'docs/memory/fleet_status.md');

function stripMarkdown(value) {
  return String(value ?? '')
    .replace(/`/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .trim();
}

function normalizeAgent(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return 'Unknown';
  const lower = raw.toLowerCase();
  if (lower.includes('gemini')) return 'Gemini';
  if (lower.includes('codex')) return 'Codex';
  if (lower.includes('claude')) return 'Claude';
  if (lower.includes('opencode')) return 'OpenCode';
  return raw;
}

function inferRoleFromTask(task) {
  const text = String(task || '').toLowerCase();
  if (!text) return '未分配';
  if (/(前端|frontend|react|vue|页面|样式|css|ui|ux|h5|web)/i.test(text)) return '前端';
  if (/(后端|backend|api|服务|接口|数据库|db|sql|redis|中间件|server)/i.test(text)) return '后端';
  return '未分配';
}

function normalizeRole(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '未分配';
  const lower = raw.toLowerCase();
  if (/(前端|frontend|front-end|fe)/i.test(lower)) return '前端';
  if (/(后端|backend|back-end|be)/i.test(lower)) return '后端';
  return raw;
}

function extractAgentFromNode(node) {
  const text = stripMarkdown(node).toLowerCase();
  if (text.includes('gemini')) return 'Gemini';
  if (text.includes('codex')) return 'Codex';
  if (text.includes('claude')) return 'Claude';
  if (text.includes('opencode')) return 'OpenCode';
  return 'Unknown';
}

function parseTableRow(line) {
  const parts = line.split('|').slice(1, -1).map(s => s.trim());
  if (parts.length < 5) return null;
  if (parts.length >= 7) {
    return {
      node: stripMarkdown(parts[0]),
      agent: normalizeAgent(parts[1]),
      role: normalizeRole(parts[2]),
      workspace: stripMarkdown(parts[3]),
      task: parts[4],
      time: parts[5],
      status: parts[6]
    };
  }
  if (parts.length >= 6) {
    return {
      node: stripMarkdown(parts[0]),
      agent: normalizeAgent(parts[1]),
      role: normalizeRole(inferRoleFromTask(parts[3])),
      workspace: stripMarkdown(parts[2]),
      task: parts[3],
      time: parts[4],
      status: parts[5]
    };
  }
  return {
    node: stripMarkdown(parts[0]),
    agent: extractAgentFromNode(parts[0]),
    role: normalizeRole(inferRoleFromTask(parts[2])),
    workspace: stripMarkdown(parts[1]),
    task: parts[2],
    time: parts[3],
    status: parts[4]
  };
}

function isCaptain(node, status) {
  const n = String(node).toLowerCase();
  const s = String(status).toLowerCase();
  return n.includes('prime') || n.includes('0号机') || s.includes('队长锁');
}

function usage() {
  console.log('用法:');
  console.log('  node scripts/actions/fleet-status.mjs [--json]');
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    usage();
    return;
  }
  const outputJson = args.includes('--json');

  if (!fs.existsSync(fleetFile)) {
    console.error(`未找到编排板文件: ${fleetFile}`);
    process.exit(1);
  }

  const content = fs.readFileSync(fleetFile, 'utf8');
  const lines = content.split('\n');
  const tableHeaderIndex = lines.findIndex(line => line.includes('| 节点 ID (模型/别名) |'));
  if (tableHeaderIndex === -1) {
    console.error('未找到活跃节点表格头。');
    process.exit(1);
  }

  const dataStart = tableHeaderIndex + 2;
  let dataEnd = dataStart;
  while (dataEnd < lines.length && lines[dataEnd].trim().startsWith('|')) dataEnd++;

  const nodes = [];
  for (let i = dataStart; i < dataEnd; i++) {
    const row = parseTableRow(lines[i]);
    if (!row) continue;
    if (String(row.node).includes('示例节点')) continue;
    nodes.push({
      ...row,
      isCaptain: isCaptain(row.node, row.status)
    });
  }

  const byAgent = nodes.reduce((acc, row) => {
    acc[row.agent] = (acc[row.agent] || 0) + 1;
    return acc;
  }, {});
  const byRole = nodes.reduce((acc, row) => {
    const role = row.role || '未分配';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  const workspaceMap = new Map();
  for (const row of nodes) {
    if (!workspaceMap.has(row.workspace)) workspaceMap.set(row.workspace, new Set());
    workspaceMap.get(row.workspace).add(row.agent);
  }
  const sharedWorkspaces = [...workspaceMap.entries()]
    .filter(([, agents]) => agents.size > 1)
    .map(([workspace, agents]) => ({ workspace, agents: [...agents] }));

  const captain = nodes.find(n => n.isCaptain) || null;
  const payload = {
    ok: true,
    file: fleetFile,
    total: nodes.length,
    captain,
    byAgent,
    byRole,
    sharedWorkspaces,
    nodes
  };

  if (outputJson) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const summary = Object.entries(byAgent)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${v}`)
    .join(' | ');

  console.log('🧭 AI Team 状态总览');
  console.log(`总活跃节点: ${nodes.length}`);
  console.log(`模型分布: ${summary || '无'}`);
  const roleSummary = Object.entries(byRole)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${v}`)
    .join(' | ');
  console.log(`角色分布: ${roleSummary || '无'}`);
  if (captain) {
    console.log(`当前队长: ${captain.node} @ ${captain.workspace}`);
  } else {
    console.log('当前队长: 未检测到队长节点');
  }
  if (sharedWorkspaces.length > 0) {
    console.log('同路径并行:');
    sharedWorkspaces.forEach(item => {
      console.log(`- ${item.workspace} -> ${item.agents.join(', ')}`);
    });
  }
  console.log('节点列表:');
  nodes.forEach((n, idx) => {
    const captainMark = n.isCaptain ? ' [队长]' : '';
    console.log(`${idx + 1}. ${n.node}${captainMark}`);
    console.log(`   ${n.agent} | ${n.role} | ${n.workspace}`);
    console.log(`   任务: ${n.task} | 状态: ${n.status} | 时间: ${n.time}`);
  });
}

main();
