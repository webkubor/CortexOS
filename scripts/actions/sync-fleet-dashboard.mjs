#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "../../");
const sourceFile = path.join(projectRoot, "docs/memory/fleet_status.md");
const outputFile = path.join(projectRoot, "docs/public/data/ai_team_status.json");

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
  if (parts.length < 6) return null;
  const node = stripMarkdown(parts[0]);
  if (!node || node.includes("示例节点")) return null;

  return {
    member: node,
    agent: normalizeAgent(parts[1]),
    workspace: stripMarkdown(parts[2]),
    task: stripMarkdown(parts[3]),
    since: stripMarkdown(parts[4]),
    status: stripMarkdown(parts[5]),
  };
}

function main() {
  if (!fs.existsSync(sourceFile)) {
    console.error(`source not found: ${sourceFile}`);
    process.exit(1);
  }

  const content = fs.readFileSync(sourceFile, "utf8");
  const lines = content.split("\n");
  const headerIndex = lines.findIndex((line) => line.includes("| 节点 ID (模型/别名) |"));
  if (headerIndex === -1) {
    console.error("table header not found in fleet_status.md");
    process.exit(1);
  }

  const rows = [];
  for (let i = headerIndex + 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith("|")) break;
    const row = parseTableRow(line);
    if (!row) continue;
    rows.push({
      ...row,
      type: statusType(row.status),
      progress: statusToProgress(row.status),
      isCaptain: row.member.includes("Prime") || row.status.includes("队长锁"),
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "docs/memory/fleet_status.md",
    total: rows.length,
    active: rows.filter((r) => r.type === "active").length,
    offline: rows.filter((r) => r.type === "offline").length,
    queued: rows.filter((r) => r.type === "queued").length,
    members: rows,
  };

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`synced: ${outputFile}`);
}

main();
