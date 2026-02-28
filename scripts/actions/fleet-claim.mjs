#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../../');
const fleetFile = path.join(projectRoot, 'docs/memory/fleet_status.md');

function parseArgs(argv) {
  const args = {
    workspace: process.cwd(),
    task: '待分配任务',
    agent: 'Gemini',
    alias: 'Candy',
    status: '[ 执行中 ] 活跃',
    dryRun: false
  };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--workspace' && argv[i + 1]) args.workspace = argv[++i];
    else if (token === '--task' && argv[i + 1]) args.task = argv[++i];
    else if (token === '--agent' && argv[i + 1]) args.agent = argv[++i];
    else if (token === '--alias' && argv[i + 1]) args.alias = argv[++i];
    else if (token === '--status' && argv[i + 1]) args.status = argv[++i];
    else if (token === '--dry-run') args.dryRun = true;
    else if (token === '--help' || token === '-h') args.help = true;
  }

  args.workspace = path.resolve(args.workspace);
  args.task = sanitizeCell(args.task);
  args.status = sanitizeCell(args.status);
  args.agent = sanitizeCell(args.agent);
  args.alias = sanitizeCell(args.alias);
  return args;
}

function sanitizeCell(value) {
  return String(value ?? '').replace(/\|/g, '｜').trim();
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

function stripMarkdown(value) {
  return value
    .replace(/`/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .trim();
}

function parseTableRow(line) {
  const parts = line.split('|').slice(1, -1).map(s => s.trim());
  if (parts.length < 5) return null;
  return {
    raw: line,
    node: parts[0],
    workspace: stripMarkdown(parts[1]),
    task: parts[2],
    time: parts[3],
    status: parts[4]
  };
}

function getUsedNumbers(rows) {
  const used = new Set();
  for (const row of rows) {
    const nodeText = stripMarkdown(row.node);
    const lower = nodeText.toLowerCase();
    if (lower.includes('prime') || nodeText.includes('0号') || nodeText.includes('本尊')) {
      used.add(0);
    }
    const matches = nodeText.match(/\b(\d+)\b/g) || [];
    for (const m of matches) used.add(Number(m));
  }
  return used;
}

function chooseNumber(rows) {
  const used = getUsedNumbers(rows);
  for (let i = 0; i < 1000; i++) {
    if (!used.has(i)) return i;
  }
  return 9999;
}

function buildNodeId(number, alias, agent) {
  if (number === 0) return `**${alias}-Prime (0号机/${agent})**`;
  return `**${alias}-${number} (${agent})**`;
}

function buildRow({ nodeId, workspace, task, time, status }) {
  return `| ${nodeId} | \`${workspace}\` | ${task} | ${time} | ${status} |`;
}

function printHelp() {
  console.log('用法:');
  console.log('  node scripts/actions/fleet-claim.mjs --workspace <path> --task <任务描述> [--agent Gemini] [--alias Candy] [--status "[ 执行中 ] 活跃"]');
  console.log('示例:');
  console.log('  node scripts/actions/fleet-claim.mjs --workspace "$PWD" --task "修复登录流程" --agent Gemini');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  if (!fs.existsSync(fleetFile)) {
    console.error(`未找到编排板文件: ${fleetFile}`);
    process.exit(1);
  }

  const content = fs.readFileSync(fleetFile, 'utf8');
  const lines = content.split('\n');

  const tableHeaderIndex = lines.findIndex(line => line.includes('| 节点 ID (模型/别名) |'));
  if (tableHeaderIndex === -1) {
    console.error('未找到活跃节点表格头，无法自动登记。');
    process.exit(1);
  }

  const dataStart = tableHeaderIndex + 2;
  let dataEnd = dataStart;
  while (dataEnd < lines.length && lines[dataEnd].trim().startsWith('|')) dataEnd++;

  const parsedRows = [];
  for (let i = dataStart; i < dataEnd; i++) {
    const row = parseTableRow(lines[i]);
    if (!row) continue;
    if (row.node.includes('示例节点')) continue;
    parsedRows.push({ ...row, index: i });
  }

  const sameWorkspaceRow = parsedRows.find(row => row.workspace === args.workspace);
  let number;
  if (sameWorkspaceRow) {
    const nodeText = stripMarkdown(sameWorkspaceRow.node);
    const match = nodeText.match(/\b(\d+)\b/);
    if (match) {
      number = Number(match[1]);
    } else if (nodeText.toLowerCase().includes('prime') || nodeText.includes('0号') || nodeText.includes('本尊')) {
      number = 0;
    } else {
      number = chooseNumber(parsedRows);
    }
  } else {
    number = chooseNumber(parsedRows);
  }

  const nodeId = buildNodeId(number, args.alias, args.agent);
  const rowLine = buildRow({
    nodeId,
    workspace: args.workspace,
    task: args.task,
    time: nowLocal(),
    status: number === 0 ? '[ 队长锁 ] 活跃' : args.status
  });

  if (sameWorkspaceRow) {
    lines[sameWorkspaceRow.index] = rowLine;
  } else {
    const exampleIndex = lines.findIndex((line, idx) => idx >= dataStart && idx < dataEnd && line.includes('示例节点'));
    const insertAt = exampleIndex !== -1 ? exampleIndex : dataEnd;
    lines.splice(insertAt, 0, rowLine);
  }

  const nextContent = lines.join('\n');

  if (!args.dryRun) {
    fs.writeFileSync(fleetFile, nextContent, 'utf8');
  }

  console.log(JSON.stringify({
    ok: true,
    file: fleetFile,
    machineNumber: number,
    nodeId: stripMarkdown(nodeId),
    workspace: args.workspace,
    task: args.task,
    dryRun: args.dryRun
  }, null, 2));
}

main();
