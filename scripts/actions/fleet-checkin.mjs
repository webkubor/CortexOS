#!/usr/bin/env node

import path from "path";
import { touchFleetMeta } from "./fleet-meta.mjs";
import { syncProjectRegistry } from "./project-registry.mjs";

function sanitize(value) {
  return String(value ?? "").replace(/\|/g, "｜").trim();
}

function normalizeAgent(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "Unknown";
  const lower = raw.toLowerCase();
  if (lower.includes("gemini")) return "Gemini";
  if (lower.includes("codex")) return "Codex";
  if (lower.includes("claude")) return "Claude";
  if (lower.includes("opencode")) return "OpenCode";
  return raw;
}

function normalizeRole(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "未分配";
  const lower = raw.toLowerCase();
  if (/(前端|frontend|front-end|fe)/i.test(lower)) return "前端";
  if (/(后端|backend|back-end|be)/i.test(lower)) return "后端";
  return raw;
}

function nowLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function parseArgs(argv) {
  const args = {
    workspace: process.cwd(),
    agent: "Unknown",
    role: "未分配",
    task: "心跳打卡",
    status: "[ 执行中 ] 活跃",
    nodeId: "",
    heartbeatAt: nowLocal(),
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--workspace" && argv[i + 1]) args.workspace = argv[++i];
    else if (token === "--agent" && argv[i + 1]) args.agent = argv[++i];
    else if (token === "--role" && argv[i + 1]) args.role = argv[++i];
    else if (token === "--task" && argv[i + 1]) args.task = argv[++i];
    else if (token === "--status" && argv[i + 1]) args.status = argv[++i];
    else if (token === "--node-id" && argv[i + 1]) args.nodeId = argv[++i];
    else if (token === "--at" && argv[i + 1]) args.heartbeatAt = argv[++i];
    else if (token === "--help" || token === "-h") args.help = true;
  }

  args.workspace = path.resolve(args.workspace);
  args.agent = normalizeAgent(sanitize(args.agent));
  args.role = normalizeRole(sanitize(args.role));
  args.task = sanitize(args.task);
  args.status = sanitize(args.status);
  args.nodeId = sanitize(args.nodeId);
  args.heartbeatAt = sanitize(args.heartbeatAt) || nowLocal();
  return args;
}

function printHelp() {
  console.log("用法:");
  console.log('  node scripts/actions/fleet-checkin.mjs --workspace <path> --agent <Gemini|Codex|Claude> [--role 前端|后端] [--task "心跳打卡"] [--status "[ 执行中 ] 活跃"] [--node-id "节点ID"]');
  console.log("示例:");
  console.log('  node scripts/actions/fleet-checkin.mjs --workspace "$PWD" --agent Codex --task "继续修复"');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const saved = touchFleetMeta({
    agent: args.agent,
    role: args.role,
    workspace: args.workspace,
    task: args.task,
    status: args.status,
    heartbeatAt: args.heartbeatAt,
    nodeId: args.nodeId,
  });

  let projectRegistry = null;
  try {
    // checkin 也会刷新项目索引，这样“继续干同一个项目”不会丢上下文。
    projectRegistry = syncProjectRegistry({
      workspace: args.workspace,
      agent: args.agent,
      role: args.role,
      task: args.task,
      nodeId: args.nodeId,
    });
  } catch {
    // 心跳本身不能因为项目索引异常而失败，这里保持静默兜底。
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        action: "checkin",
        agent: args.agent,
        role: args.role,
        workspace: args.workspace,
        heartbeatAt: args.heartbeatAt,
        firstLoginAt: saved.firstLoginAt,
        lastCompletedTask: saved.lastCompletedTask || null,
        projectRegistry: projectRegistry
          ? {
              name: projectRegistry.project.name,
              rootPath: projectRegistry.project.rootPath,
              commandCenterFile: projectRegistry.commandCenterFile,
            }
          : null,
      },
      null,
      2
    )
  );
}

main();
