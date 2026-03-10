#!/usr/bin/env node

import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { ensureFleetPaths } from "./fleet-paths.mjs";

import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "../../");
const { fleetFile: sourceFile } = ensureFleetPaths(projectRoot);
const outputFile = path.join(projectRoot, "docs/public/data/ai_team_status.json");

function checkCLI(cmd, dirPath = null) {
  try {
    execSync(`which ${cmd}`, { stdio: "ignore" });
    return { status: "online", reason: "命令链路正常" };
  } catch (err) {
    if (dirPath && fs.existsSync(dirPath)) {
      return {
        status: "offline",
        reason: `命令 ${cmd} 未找到，但在 ${dirPath.replace(os.homedir(), "~")} 发现配置目录。可能需要配置 PATH。`
      };
    }
    return { status: "offline", reason: `未在系统 PATH 中找到 ${cmd}，请检查是否已安装。` };
  }
}

const STALE_HOURS = 4;
const HOME_DIR = os.homedir();

function stripMarkdown(value) {
  return String(value ?? "")
    .replace(/`/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .trim();
}

function normalizeAgent(value) {
  const raw = String(value ?? "").trim();
  const lower = raw.toLowerCase();
  if (lower.includes("gemini")) return "Gemini";
  if (lower.includes("codex")) return "Codex";
  if (lower.includes("claude")) return "Claude";
  if (lower.includes("opencode")) return "OpenCode";
  return raw || "Unknown";
}

function extractAgentFromNode(node) {
  const text = stripMarkdown(node).toLowerCase();
  if (text.includes("gemini")) return "Gemini";
  if (text.includes("codex")) return "Codex";
  if (text.includes("claude")) return "Claude";
  if (text.includes("opencode")) return "OpenCode";
  return "Unknown";
}

function inferRoleFromTask(task) {
  const text = String(task || "").toLowerCase();
  if (!text) return "未分配";
  if (/(前端|frontend|react|vue|页面|样式|css|ui|ux|h5|web)/i.test(text)) return "前端";
  if (/(后端|backend|api|服务|接口|数据库|db|sql|redis|中间件|server)/i.test(text)) return "后端";
  return "未分配";
}

function normalizeRole(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "未分配";
  const lower = raw.toLowerCase();
  if (/(前端|frontend|front-end|fe)/i.test(lower)) return "前端";
  if (/(后端|backend|back-end|be)/i.test(lower)) return "后端";
  return raw;
}

function sanitizeWorkspaceForOutput(workspacePath) {
  const raw = String(workspacePath ?? "").trim();
  if (!raw) return raw;
  const normalized = path.normalize(raw);
  const homePrefix = `${path.normalize(HOME_DIR)}${path.sep}`;
  if (normalized === path.normalize(HOME_DIR)) return "~";
  if (normalized.startsWith(homePrefix)) {
    return `~/${path.relative(HOME_DIR, normalized)}`;
  }
  return normalized;
}

function getProgressFromTodo(workspacePath) {
  try {
    const todoPath = path.join(workspacePath, "TODO.md");
    if (!fs.existsSync(todoPath)) return null;
    const content = fs.readFileSync(todoPath, "utf8");
    const lines = content.split("\n");
    let total = 0;
    let completed = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("- [ ]")) { total++; }
      else if (trimmed.match(/^- \[[xX]\]/)) { total++; completed++; }
    }
    if (total === 0) return null;
    return Math.round((completed / total) * 100);
  } catch (err) { return null; }
}

function statusToProgress(status) {
  const s = String(status ?? "");
  if (s.includes("等待分配")) return 5;
  if (s.includes("执行中")) return 55;
  if (s.includes("队长锁")) return 60;
  if (s.includes("已离线")) return 100;
  return 20;
}

function statusType(status) {
  const s = String(status ?? "");
  if (s.includes("已离线")) return "offline";
  if (s.includes("执行中") || s.includes("队长锁")) return "active";
  if (s.includes("等待分配")) return "queued";
  return "unknown";
}

function parseTableRow(line) {
  const parts = line.split("|").slice(1, -1).map((s) => s.trim());
  if (parts.length < 5) return null;
  const node = stripMarkdown(parts[0]);
  if (!node || node.includes("节点 ID") || node.includes("---") || node.includes("示例节点")) return null;
  if (parts.length >= 7) {
    return {
      member: node,
      agent: normalizeAgent(parts[1]),
      role: normalizeRole(parts[2]),
      workspace: stripMarkdown(parts[3]),
      task: stripMarkdown(parts[4]),
      since: stripMarkdown(parts[5]),
      status: stripMarkdown(parts[6]),
    };
  }
  if (parts.length >= 6) {
    return {
      member: node,
      agent: normalizeAgent(parts[1]),
      role: normalizeRole(inferRoleFromTask(parts[3])),
      workspace: stripMarkdown(parts[2]),
      task: stripMarkdown(parts[3]),
      since: stripMarkdown(parts[4]),
      status: stripMarkdown(parts[5]),
    };
  }
  return {
    member: node,
    agent: extractAgentFromNode(parts[0]),
    role: normalizeRole(inferRoleFromTask(parts[2])),
    workspace: stripMarkdown(parts[1]),
    task: stripMarkdown(parts[2]),
    since: stripMarkdown(parts[3]),
    status: stripMarkdown(parts[4]),
  };
}

function getComparablePayload(payload) {
  const clone = JSON.parse(JSON.stringify(payload));
  delete clone.generatedAt;
  return clone;
}

export function syncFleetDashboard() {
  if (!fs.existsSync(sourceFile)) {
    throw new Error(`未找到源文件: ${sourceFile}`);
  }

  const content = fs.readFileSync(sourceFile, "utf8");
  const lines = content.split("\n");
  const headerIndex = lines.findIndex((line) => line.includes("| 节点 ID (模型/别名) |"));
  if (headerIndex === -1) {
    throw new Error("在 fleet_status.md 中未找到表格头。");
  }

  const now = new Date();
  const rows = [];
  for (let i = headerIndex + 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith("|")) break;
    const row = parseTableRow(line);
    if (!row) continue;

    const workspaceRaw = row.workspace;
    const todoProgress = getProgressFromTodo(workspaceRaw);
    const finalProgress = todoProgress !== null ? todoProgress : statusToProgress(row.status);

    // 检查是否为僵尸节点 (stale)
    let isStale = false;
    if (row.since.includes("-")) {
      const startTime = new Date(row.since.replace(/-/g, "/"));
      const diffHours = (now - startTime) / (1000 * 60 * 60);
      isStale = diffHours > STALE_HOURS && !row.status.includes("队长锁");
    }

    rows.push({
      ...row,
      workspace: sanitizeWorkspaceForOutput(workspaceRaw),
      type: statusType(row.status),
      progress: finalProgress,
      isCaptain: false, // Initial value, determined later
      hasTodo: todoProgress !== null,
      isStale: isStale
    });
  }

  // 检查常驻智能体小龙虾 (OpenClaw)
  const openclawDir = path.join(os.homedir(), ".openclaw");
  const hasOpenClaw = fs.existsSync(openclawDir);
  const isLobsterActive = rows.some(r => r.agent.toLowerCase().includes("lobster") || r.member.includes("栖月"));

  if (hasOpenClaw && !isLobsterActive) {
    rows.push({
      member: "栖月-Prime",
      agent: "Lobster",
      role: "指挥官",
      workspace: "系统沉睡舱",
      task: "等待唤醒与派单...",
      since: "-",
      status: "已离线",
      type: "offline",
      progress: 100,
      isCaptain: false, // Initial value
      hasTodo: false,
      isStale: false
    });
  }

  // 👑 唯一机长选举逻辑 (Single Captain Election)
  // 优先级: 处于“队长锁”状态的节点 (手动干预) > 活跃的 Prime 节点 (默认大脑) > 列表第一个活跃节点
  let captainIndex = rows.findIndex(r => r.status.includes("队长锁"));
  if (captainIndex === -1) captainIndex = rows.findIndex(r => r.member.includes("Prime") && r.type === "active");
  if (captainIndex === -1) captainIndex = rows.findIndex(r => r.type === "active");
  if (captainIndex === -1 && rows.length > 0) captainIndex = 0; // Fallback to first ever node if all else fails

  if (captainIndex !== -1) {
    rows[captainIndex].isCaptain = true;
  }

  // 技能库盘点 (Local Skill Inventory)
  const skillPaths = [
    path.join(os.homedir(), ".agents/skills"),
    path.join(os.homedir(), ".codex/skills")
  ];
  let skillsCount = 0;
  skillPaths.forEach(p => {
    if (fs.existsSync(p)) {
      try {
        const dirs = fs.readdirSync(p, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith("."));
        skillsCount += dirs.length;
      } catch (e) { /* ignore */ }
    }
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    version: "v5.6.5 (系统环境透显 + 工具链路监控)",
    source: ".memory/fleet/fleet_status.md",
    environment: {
      tools: {
        codex: checkCLI("codex"),
        gemini: checkCLI("gemini"),
        claude: checkCLI("claude", path.join(os.homedir(), ".claude")),
        openclaw: checkCLI("openclaw", path.join(os.homedir(), ".openclaw")),
      },
      nodeVersion: process.version,
      skillsCount: skillsCount,
    },
    total: rows.length,
    active: rows.filter((r) => r.type === "active").length,
    offline: rows.filter((r) => r.type === "offline").length,
    queued: rows.filter((r) => r.type === "queued").length,
    members: rows,
  };

  let shouldWrite = true;
  if (fs.existsSync(outputFile)) {
    try {
      const previous = JSON.parse(fs.readFileSync(outputFile, "utf8"));
      const prevComparable = getComparablePayload(previous);
      const nextComparable = getComparablePayload(payload);
      shouldWrite = JSON.stringify(prevComparable) !== JSON.stringify(nextComparable);
    } catch (err) {
      shouldWrite = true;
    }
  }

  if (!shouldWrite) {
    return {
      ok: true,
      changed: false,
      outputFile,
      payload
    };
  }

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return {
    ok: true,
    changed: true,
    outputFile,
    payload
  };
}

function main() {
  try {
    const result = syncFleetDashboard();
    if (!result.changed) {
      console.log(`ℹ️ 看板数据无实质变化，跳过写入: ${result.outputFile}`);
      return;
    }
    console.log(`✅ 看板数据同步成功: ${result.outputFile} (已开启客观进度感知)`);
  } catch (error) {
    console.error(`❌ ${error?.message || error}`);
    process.exit(1);
  }
}

main();
