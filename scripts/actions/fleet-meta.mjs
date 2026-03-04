import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ensureFleetPaths } from "./fleet-paths.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "../../");
const { fleetMetaFile: metaFile } = ensureFleetPaths(projectRoot);

function safeReadJSON(file) {
  try {
    if (!fs.existsSync(file)) return null;
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function fleetMetaKey(agent, workspace) {
  return `${String(agent || "").trim()}::${String(workspace || "").trim()}`;
}

export function loadFleetMeta() {
  const parsed = safeReadJSON(metaFile);
  if (!parsed || typeof parsed !== "object") {
    return { version: 1, entries: {} };
  }
  return {
    version: 1,
    entries: parsed.entries && typeof parsed.entries === "object" ? parsed.entries : {},
  };
}

export function saveFleetMeta(meta) {
  fs.mkdirSync(path.dirname(metaFile), { recursive: true });
  fs.writeFileSync(metaFile, `${JSON.stringify(meta, null, 2)}\n`, "utf8");
}

function isCompletedTask(task, status) {
  const text = `${task || ""} ${status || ""}`;
  return /(已完成|完成：|完成了|done|finished|已收工|已结项)/i.test(text);
}

export function touchFleetMeta({ agent, workspace, role, task, status, heartbeatAt, nodeId }) {
  const meta = loadFleetMeta();
  const key = fleetMetaKey(agent, workspace);
  const now = heartbeatAt;
  const existing = meta.entries[key] || {};

  const next = {
    firstLoginAt: existing.firstLoginAt || now,
    lastHeartbeatAt: now,
    lastTask: task || existing.lastTask || "待分配任务",
    lastRole: role || existing.lastRole || "未分配",
    lastStatus: status || existing.lastStatus || "[ 执行中 ] 活跃",
    nodeId: nodeId || existing.nodeId || "",
    updatedAt: now,
    lastCompletedTask: existing.lastCompletedTask || null,
  };

  if (isCompletedTask(task, status)) {
    next.lastCompletedTask = {
      task: task || existing.lastTask || "已完成任务",
      at: now,
    };
  }

  meta.entries[key] = next;
  saveFleetMeta(meta);
  return next;
}
