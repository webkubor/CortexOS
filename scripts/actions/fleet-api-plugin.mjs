import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const projectRoot = path.resolve(process.cwd());
const fleetFile = path.join(projectRoot, '.memory/fleet/fleet_status.md');

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
        return;
      }

      reject(new Error(stderr.trim() || stdout.trim() || `${command} exited with code ${code}`));
    });
  });
}

async function syncFleetDashboard() {
  return runCommand('node', ['scripts/actions/sync-fleet-dashboard.mjs']);
}

function updateMemberStatus(memberId, nextStatus) {
  let content = fs.readFileSync(fleetFile, 'utf8');
  const lines = content.split('\n');
  const tableStartIndex = lines.findIndex((line) => line.includes('| 节点 ID'));

  if (tableStartIndex === -1) {
    throw new Error('Table not found in fleet_status.md');
  }

  for (let i = tableStartIndex + 2; i < lines.length; i++) {
    if (!lines[i].trim().startsWith('|')) break;
    if (!lines[i].includes(memberId)) continue;

    const cols = lines[i].split('|');
    if (cols.length < 8) continue;
    cols[7] = ` ${nextStatus} `;
    lines[i] = cols.join('|');
    fs.writeFileSync(fleetFile, lines.join('\n'), 'utf8');
    return;
  }

  throw new Error(`Member not found: ${memberId}`);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function writeJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function handleFleetAction(req, res) {
  if (!fs.existsSync(fleetFile)) {
    writeJson(res, 404, { error: 'fleet_status.md not found' });
    return;
  }

  const data = await readJsonBody(req);
  const { action, memberId } = data;

  if (!memberId) {
    writeJson(res, 400, { error: 'memberId is required' });
    return;
  }

  if (action === 'kick-out') {
    updateMemberStatus(memberId, '[ 已离线 ]');
    const result = await syncFleetDashboard();
    writeJson(res, 200, { success: true, stdout: result.stdout });
    return;
  }

  if (action === 'make-captain') {
    const result = await runCommand('pnpm', ['run', 'fleet:handover', '--', '--to-node', memberId]);
    await syncFleetDashboard();
    writeJson(res, 200, { success: true, stdout: result.stdout });
    return;
  }

  writeJson(res, 400, { error: `Unsupported action: ${action}` });
}

function attachFleetMiddleware(middlewares) {
  middlewares.use(async (req, res, next) => {
    if (req.method !== 'POST' || !req.url.startsWith('/api/fleet/action')) {
      next();
      return;
    }

    try {
      await handleFleetAction(req, res);
    } catch (error) {
      writeJson(res, 500, { error: error.message });
    }
  });
}

export function fleetApiPlugin() {
  return {
    name: 'fleet-api-plugin',
    configureServer(server) {
      attachFleetMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachFleetMiddleware(server.middlewares);
    }
  };
}
