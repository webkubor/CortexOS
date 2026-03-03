#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "../../");
const sourceFile = path.join(projectRoot, "docs/memory/fleet_status.md");
const outputFile = path.join(projectRoot, "docs/public/data/ai_team_status.json");

const STALE_HOURS = 4;

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

function main() {
  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ 未找到源文件: ${sourceFile}`);
    process.exit(1);
  }

  const content = fs.readFileSync(sourceFile, "utf8");
  const lines = content.split("\n");
  const headerIndex = lines.findIndex((line) => line.includes("| 节点 ID (模型/别名) |"));
  if (headerIndex === -1) {
    console.error("❌ 在 fleet_status.md 中未找到表格头。");
    process.exit(1);
  }

  const now = new Date();
  const rows = [];
  for (let i = headerIndex + 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith("|")) break;
    const row = parseTableRow(line);
    if (!row) continue;

    const todoProgress = getProgressFromTodo(row.workspace);
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
      type: statusType(row.status),
      progress: finalProgress,
      isCaptain: row.member.includes("Prime") || row.status.includes("队长锁"),
      hasTodo: todoProgress !== null,
      isStale: isStale
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    version: "v5.4.0 (角色分工 + 客观进度 + 僵尸检测)",
    source: "docs/memory/fleet_status.md",
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
    console.log(`ℹ️ 看板数据无实质变化，跳过写入: ${outputFile}`);
    return;
  }

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`✅ 看板数据同步成功: ${outputFile} (已开启客观进度感知)`);
}

main();
