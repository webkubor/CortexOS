#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureFleetPaths } from './fleet-paths.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../../');
const { fleetFile } = ensureFleetPaths(projectRoot);

function sanitizeCell(value) {
  return String(value ?? '').replace(/\|/g, '｜').trim();
}

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
      raw: line,
      node: parts[0],
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
      raw: line,
      node: parts[0],
      agent: normalizeAgent(parts[1]),
      role: normalizeRole(inferRoleFromTask(parts[3])),
      workspace: stripMarkdown(parts[2]),
      task: parts[3],
      time: parts[4],
      status: parts[5]
    };
  }
  return {
    raw: line,
    node: parts[0],
    agent: extractAgentFromNode(parts[0]),
    role: normalizeRole(inferRoleFromTask(parts[2])),
    workspace: stripMarkdown(parts[1]),
    task: parts[2],
    time: parts[3],
    status: parts[4]
  };
}

function buildRow({ nodeId, agent, role, workspace, task, time, status }) {
  return `| ${nodeId} | ${agent} | ${role} | \`${workspace}\` | ${task} | ${time} | ${status} |`;
}

function nowLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function isPrimeNode(node) {
  const text = stripMarkdown(node).toLowerCase();
  return text.includes('prime') || text.includes('0号机');
}

function extractAlias(nodeText) {
  const clean = stripMarkdown(nodeText);
  if (!clean) return 'Agent';
  const mPrime = clean.match(/^([^-]+)-Prime\b/i);
  if (mPrime) return mPrime[1].trim();
  const mNum = clean.match(/^([^-]+)-\d+\b/);
  if (mNum) return mNum[1].trim();
  const mParen = clean.match(/^([^(]+)\s*\(/);
  if (mParen) return mParen[1].trim();
  return clean.split(/\s+/)[0].trim() || 'Agent';
}

function extractMachineNumber(nodeText) {
  const clean = stripMarkdown(nodeText);
  if (isPrimeNode(clean)) return 0;
  const m = clean.match(/\b(\d+)\b/);
  return m ? Number(m[1]) : null;
}

function getUsedNumbers(rows, exclusions = new Set()) {
  const used = new Set();
  for (const row of rows) {
    if (exclusions.has(row.index)) continue;
    const n = extractMachineNumber(row.node);
    if (n !== null) used.add(n);
  }
  return used;
}

function chooseNumber(rows, exclusions = new Set()) {
  const used = getUsedNumbers(rows, exclusions);
  for (let i = 1; i < 1000; i++) {
    if (!used.has(i)) return i;
  }
  return 9999;
}

function parseArgs(argv) {
  const args = {
    toNode: '',
    toWorkspace: '',
    toAgent: '',
    dryRun: false
  };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--to-node' && argv[i + 1]) args.toNode = sanitizeCell(argv[++i]);
    else if (token === '--to-workspace' && argv[i + 1]) args.toWorkspace = path.resolve(argv[++i]);
    else if (token === '--to-agent' && argv[i + 1]) args.toAgent = normalizeAgent(argv[++i]);
    else if (token === '--dry-run') args.dryRun = true;
    else if (token === '--help' || token === '-h') args.help = true;
  }
  return args;
}

function printHelp() {
  console.log('用法:');
  console.log('  node scripts/actions/fleet-handover.mjs --to-node "<节点ID文本>" [--dry-run]');
  console.log('  node scripts/actions/fleet-handover.mjs --to-workspace "<绝对路径>" [--to-agent Codex] [--dry-run]');
  console.log('示例:');
  console.log('  node scripts/actions/fleet-handover.mjs --to-node "Codex-3 (Codex)"');
  console.log('  node scripts/actions/fleet-handover.mjs --to-workspace "/Users/webkubor/Desktop/create" --to-agent Codex');
}

function findTargetRow(rows, args) {
  if (args.toNode) {
    const targetText = stripMarkdown(args.toNode);
    return rows.find(row => stripMarkdown(row.node) === targetText) || null;
  }
  if (args.toWorkspace) {
    const candidates = rows.filter(row => row.workspace === args.toWorkspace);
    if (candidates.length === 0) return null;
    if (!args.toAgent) return candidates[0];
    return candidates.find(row => (row.agent || extractAgentFromNode(row.node)) === args.toAgent) || null;
  }
  return null;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }
  if (!args.toNode && !args.toWorkspace) {
    console.error('缺少目标参数：请传 --to-node 或 --to-workspace。');
    printHelp();
    process.exit(1);
  }

  if (!fs.existsSync(fleetFile)) {
    console.error(`未找到编排板文件: ${fleetFile}`);
    process.exit(1);
  }

  const content = fs.readFileSync(fleetFile, 'utf8');
  const lines = content.split('\n');
  const tableHeaderIndex = lines.findIndex(line => line.includes('| 节点 ID (模型/别名) |'));
  if (tableHeaderIndex === -1) {
    console.error('未找到活跃节点表格头，无法执行移交。');
    process.exit(1);
  }

  const dataStart = tableHeaderIndex + 2;
  let dataEnd = dataStart;
  while (dataEnd < lines.length && lines[dataEnd].trim().startsWith('|')) dataEnd++;

  const rows = [];
  for (let i = dataStart; i < dataEnd; i++) {
    const row = parseTableRow(lines[i]);
    if (!row) continue;
    if (row.node.includes('示例节点')) continue;
    rows.push({ ...row, index: i });
  }

  const targetRow = findTargetRow(rows, args);
  if (!targetRow) {
    console.error(JSON.stringify({
      ok: false,
      code: 'target_not_found',
      hint: '未找到目标节点，请检查 --to-node 文本或 --to-workspace/--to-agent 参数。'
    }, null, 2));
    process.exit(2);
  }

  const currentPrimeRow = rows.find(row => isPrimeNode(row.node)) || null;
  const handoverTime = nowLocal();
  const warnings = [];

  const targetAgent = targetRow.agent || extractAgentFromNode(targetRow.node);
  const targetAlias = extractAlias(targetRow.node);
  const promotedNode = `**${targetAlias}-Prime (0号机/${targetAgent})**`;

  if (currentPrimeRow && currentPrimeRow.index !== targetRow.index) {
    const oldAlias = extractAlias(currentPrimeRow.node);
    const oldAgent = currentPrimeRow.agent || extractAgentFromNode(currentPrimeRow.node);
    const demoteNumber = chooseNumber(rows, new Set([currentPrimeRow.index, targetRow.index]));
    const demotedNode = `**${oldAlias}-${demoteNumber} (${oldAgent})**`;

    lines[currentPrimeRow.index] = buildRow({
      nodeId: demotedNode,
      agent: oldAgent,
      role: currentPrimeRow.role || '未分配',
      workspace: currentPrimeRow.workspace,
      task: currentPrimeRow.task,
      time: handoverTime,
      status: '[ 执行中 ] 活跃'
    });
  } else if (!currentPrimeRow) {
    warnings.push('当前未检测到已有 0 号机，已直接提升目标节点为队长。');
  }

  lines[targetRow.index] = buildRow({
    nodeId: promotedNode,
    agent: targetAgent,
    role: targetRow.role || '未分配',
    workspace: targetRow.workspace,
    task: targetRow.task,
    time: handoverTime,
    status: '[ 队长锁 ] 活跃'
  });

  const nextContent = lines.join('\n');
  if (!args.dryRun) {
    fs.writeFileSync(fleetFile, nextContent, 'utf8');
  }

  console.log(JSON.stringify({
    ok: true,
    file: fleetFile,
    from: currentPrimeRow ? stripMarkdown(currentPrimeRow.node) : null,
    to: stripMarkdown(promotedNode),
    workspace: targetRow.workspace,
    time: handoverTime,
    warnings,
    dryRun: args.dryRun
  }, null, 2));
}

main();
