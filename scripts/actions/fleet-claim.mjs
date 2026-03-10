#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { touchFleetMeta } from './fleet-meta.mjs';
import { ensureFleetPaths } from './fleet-paths.mjs';
import { syncProjectRegistry } from './project-registry.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../../');
const { fleetFile } = ensureFleetPaths(projectRoot);

function parseArgs(argv) {
  const args = {
    workspace: process.cwd(),
    task: '待分配任务',
    agent: 'Gemini',
    alias: 'Candy',
    role: '',
    status: '[ 执行中 ] 活跃',
    dryRun: false,
    forceSwitch: false
  };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--workspace' && argv[i + 1]) args.workspace = argv[++i];
    else if (token === '--task' && argv[i + 1]) args.task = argv[++i];
    else if (token === '--agent' && argv[i + 1]) args.agent = argv[++i];
    else if (token === '--alias' && argv[i + 1]) args.alias = argv[++i];
    else if (token === '--role' && argv[i + 1]) args.role = argv[++i];
    else if (token === '--status' && argv[i + 1]) args.status = argv[++i];
    else if (token === '--dry-run') args.dryRun = true;
    else if (token === '--force-switch') args.forceSwitch = true;
    else if (token === '--help' || token === '-h') args.help = true;
  }

  args.workspace = path.resolve(args.workspace);
  args.task = sanitizeCell(args.task);
  args.status = sanitizeCell(args.status);
  args.agent = normalizeAgent(sanitizeCell(args.agent));
  args.alias = sanitizeCell(args.alias);
  args.role = normalizeRole(sanitizeCell(args.role || inferRoleFromTask(args.task)));
  return args;
}

function sanitizeCell(value) {
  return String(value ?? '').replace(/\|/g, '｜').trim();
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

function buildRow({ nodeId, agent, role, workspace, task, time, status }) {
  return `| ${nodeId} | ${agent} | ${role} | \`${workspace}\` | ${task} | ${time} | ${status} |`;
}

function extractAgentFromNode(node) {
  const text = stripMarkdown(node).toLowerCase();
  if (text.includes('gemini')) return 'Gemini';
  if (text.includes('codex')) return 'Codex';
  if (text.includes('claude')) return 'Claude';
  if (text.includes('opencode')) return 'OpenCode';
  return 'Unknown';
}

function printHelp() {
  console.log('用法:');
  console.log('  node scripts/actions/fleet-claim.mjs --workspace <path> --task <任务描述> [--agent Gemini] [--alias Candy] [--role 前端|后端] [--status "[ 执行中 ] 活跃"]');
  console.log('示例:');
  console.log('  node scripts/actions/fleet-claim.mjs --workspace "$PWD" --task "修复登录流程" --agent Gemini --role 后端');
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

  const sameWorkspaceRows = parsedRows.filter(row => row.workspace === args.workspace);
  const sameWorkspaceSameAgentRow = sameWorkspaceRows.find(row => {
    const existingAgent = row.agent || extractAgentFromNode(row.node);
    return existingAgent === args.agent;
  });

  const parallelRows = sameWorkspaceRows.filter(row => row !== sameWorkspaceSameAgentRow);
  const warnings = [];
  if (args.forceSwitch) {
    warnings.push('参数 --force-switch 当前为兼容保留项；同路径多模型默认允许并行登记。');
  }
  if (parallelRows.length > 0) {
    const agents = parallelRows.map(row => row.agent || extractAgentFromNode(row.node)).join(', ');
    const nodes = parallelRows.map(row => stripMarkdown(row.node)).join(' | ');
    warnings.push(`同一路径已有其他模型在线: ${agents}（${nodes}）。已允许并行登记，请注意文件冲突。`);
  }
  if (!args.task.includes('待分配') && args.role === '未分配') {
    warnings.push('当前任务已明确但角色仍为“未分配”，建议立即用 --role 前端/后端 回填。');
  }

  let number;
  if (sameWorkspaceSameAgentRow) {
    const nodeText = stripMarkdown(sameWorkspaceSameAgentRow.node);
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
  const heartbeatAt = nowLocal();
  const rowLine = buildRow({
    nodeId,
    agent: args.agent,
    role: args.role,
    workspace: args.workspace,
    task: args.task,
    time: heartbeatAt,
    status: number === 0 ? '[ 队长锁 ] 活跃' : args.status
  });

  if (sameWorkspaceSameAgentRow) {
    lines[sameWorkspaceSameAgentRow.index] = rowLine;
  } else {
    const exampleIndex = lines.findIndex((line, idx) => idx >= dataStart && idx < dataEnd && line.includes('示例节点'));
    const insertAt = exampleIndex !== -1 ? exampleIndex : dataEnd;
    lines.splice(insertAt, 0, rowLine);
  }

  const nextContent = lines.join('\n');

  if (!args.dryRun) {
    fs.writeFileSync(fleetFile, nextContent, 'utf8');
    touchFleetMeta({
      agent: args.agent,
      workspace: args.workspace,
      role: args.role,
      task: args.task,
      status: number === 0 ? '[ 队长锁 ] 活跃' : args.status,
      heartbeatAt,
      nodeId: stripMarkdown(nodeId)
    });
  }

  let projectRegistry = null;
  try {
    projectRegistry = syncProjectRegistry({
      workspace: args.workspace,
      agent: args.agent,
      role: args.role,
      task: args.task,
      nodeId: stripMarkdown(nodeId),
      dryRun: args.dryRun
    });
  } catch (error) {
    warnings.push(`项目索引同步失败: ${sanitizeCell(error?.message || error)}`);
  }

  console.log(JSON.stringify({
    ok: true,
    file: fleetFile,
    machineNumber: number,
    nodeId: stripMarkdown(nodeId),
    agent: args.agent,
    role: args.role,
    workspace: args.workspace,
    task: args.task,
    warnings,
    projectRegistry: projectRegistry ? {
      name: projectRegistry.project.name,
      rootPath: projectRegistry.project.rootPath,
      lastWorkspace: projectRegistry.project.lastWorkspace,
      commandCenterFile: projectRegistry.commandCenterFile
    } : null,
    dryRun: args.dryRun
  }, null, 2));
}

main();
