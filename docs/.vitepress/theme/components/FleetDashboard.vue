<script setup>
import { computed, onMounted, ref } from "vue";

const loading = ref(true);
const error = ref("");
const data = ref({
  generatedAt: "",
  total: 0,
  active: 0,
  offline: 0,
  queued: 0,
  members: [],
  missions: [
    { id: "TASK-001", title: "error-retro 误报修复", status: "IN_PROGRESS", owner: "Codex-1" },
    { id: "TASK-002", title: "语义搜索升级", status: "IN_PROGRESS", owner: "Codex-1" },
    { id: "TASK-003", title: "context-brief 工具开发", status: "OPEN", owner: "UNASSIGNED" },
    { id: "TASK-004", title: "Claude Code MCP 连接修复", status: "IN_PROGRESS", owner: "Claude" }
  ]
});

const currentMembers = computed(() =>
  data.value.members.filter((m) => m.type === "active" || m.type === "queued")
);

const historyMembers = computed(() =>
  data.value.members.filter((m) => m.type === "offline")
);

const captain = computed(() => currentMembers.value.find((m) => m.isCaptain) || null);

const timeText = computed(() => {
  if (!data.value.generatedAt) return "OFFLINE";
  try {
    return new Date(data.value.generatedAt).toLocaleString("zh-CN");
  } catch {
    return data.value.generatedAt;
  }
});

onMounted(async () => {
  loading.value = true;
  error.value = "";
  try {
    const res = await fetch("/CortexOS/data/ai_team_status.json", { cache: "no-store", headers: { pragma: 'no-cache' } });
    if (!res.ok) throw new Error("HTTP 404");
    const json = await res.json();
    data.value = { ...data.value, ...json };
  } catch (e) {
    error.value = "Neural Connection Interrupted: " + (e && e.message ? e.message : String(e));
  } finally {
    loading.value = false;
  }
});

function isWorking(member) {
  return member.type === "active" && member.progress > 0 && member.progress < 100;
}

function statusTone(member) {
  if (member.type === "offline") return "offline";
  if (member.isCaptain) return "captain";
  return "active";
}
</script>

<template>
  <div class="modern-dashboard">
    <!-- 顶部极简 HUD -->
    <header class="dashboard-hud">
      <div class="hud-left">
        <div class="hud-item main">
          <span class="hud-label">FLEET_ARRAY</span>
          <span class="hud-value cyan">CORTEX_01</span>
        </div>
        <div class="hud-divider"></div>
        <div class="hud-item">
          <span class="hud-label">SYNC</span>
          <span class="hud-value">{{ timeText }}</span>
        </div>
      </div>
      <div class="hud-right">
        <div class="hud-item">
          <span class="hud-label">COMMANDER</span>
          <span class="hud-value white">{{ captain ? captain.alias : "VACANT" }}</span>
        </div>
      </div>
    </header>

    <!-- 状态反馈 -->
    <div v-if="loading" class="modern-status loading">
      <div class="loader-bar"></div>
      <span class="status-text">Synchronizing Fleet State...</span>
    </div>
    <div v-else-if="error" class="modern-status error">
      <span class="status-text">{{ error }}</span>
    </div>

    <template v-else>
      <div class="dashboard-body">
        <!-- 左侧：任务看板 Mission Backlog -->
        <aside class="mission-control">
          <div class="module-header">
            <h3 class="module-title">MISSION_BACKLOG</h3>
            <span class="badge secondary">{{ data.missions.length }}</span>
          </div>
          <div class="mission-scroll">
            <div v-for="task in data.missions" :key="task.id" class="mission-card" :class="task.status.toLowerCase()">
              <div class="m-header">
                <span class="m-id">{{ task.id }}</span>
                <div class="m-dot"></div>
              </div>
              <p class="m-title">{{ task.title }}</p>
              <div class="m-footer">
                <span class="m-owner">{{ task.owner }}</span>
                <span class="m-status">{{ task.status }}</span>
              </div>
            </div>
          </div>
        </aside>

        <!-- 右侧：Agent 矩阵 Matrix Grid -->
        <main class="matrix-control">
          <div class="module-header">
            <h3 class="module-title">NEURAL_MATRIX</h3>
            <span class="badge primary">ACTIVE</span>
          </div>
          <div class="matrix-grid">
            <div v-for="member in currentMembers" :key="member.member" 
                 class="agent-node" :class="[statusTone(member), { 'working': isWorking(member) }]">
              
              <div class="node-glass"></div>
              
              <div class="node-header">
                <div class="node-id">
                  <span class="node-alias">{{ member.alias || member.member.split('(')[0] }}</span>
                  <span class="node-tag">{{ member.agent }}</span>
                </div>
                <div class="node-indicator">
                  <div class="glow-dot"></div>
                </div>
              </div>

              <div class="node-task">
                <p class="task-content">{{ member.task || "Stationary" }}</p>
              </div>

              <div class="node-metrics">
                <div class="metric">
                  <div class="progress-info">
                    <span class="p-label">NEURAL_LOAD</span>
                    <span class="p-val">{{ member.progress }}%</span>
                  </div>
                  <div class="progress-bar">
                    <div class="p-fill" :style="{ width: member.progress + '%' }" :class="{ 'anim': isWorking(member) }"></div>
                  </div>
                </div>
                <div class="node-meta">
                  <span class="meta-path">{{ member.workspace.split('/').pop() }}</span>
                  <span class="meta-time">{{ member.since }}</span>
                </div>
              </div>

              <div class="node-captain-badge" v-if="member.isCaptain">
                <span>COMMANDER_LOCK</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <!-- 底部归档记录 -->
      <footer class="archive-section">
        <details class="archive-toggle">
          <summary>ARCHIVED_HISTORY ({{ historyMembers.length }})</summary>
          <div class="archive-table">
            <div v-for="member in historyMembers" :key="member.member" class="archive-row">
              <span class="a-alias">{{ member.alias }}</span>
              <span class="a-task">{{ member.task }}</span>
              <span class="a-time">{{ member.since }}</span>
            </div>
          </div>
        </details>
      </footer>
    </template>
  </div>
</template>

<style scoped>
.modern-dashboard {
  --c-cyan: #06b6d4;
  --c-amber: #f59e0b;
  --c-white: #ffffff;
  --c-grey: #64748b;
  --c-dark-80: rgba(10, 10, 10, 0.8);
  --c-border: rgba(255, 255, 255, 0.05);
  --c-border-hover: rgba(255, 255, 255, 0.1);
  --font-mono: var(--vp-font-family-mono);
  
  margin-top: 0;
  display: flex;
  flex-direction: column;
  background: #000;
  color: #f1f5f9;
  font-family: var(--vp-font-family-base);
  min-height: 600px;
  box-shadow: 0 0 0 1px var(--c-border);
}

/* Dashboard HUD */
.dashboard-hud {
  display: flex;
  justify-content: space-between;
  padding: 16px 24px;
  background: #000;
  border-bottom: 1px solid var(--c-border);
  font-family: var(--font-mono);
}

.hud-left, .hud-right { display: flex; align-items: center; gap: 24px; }
.hud-item { display: flex; flex-direction: column; gap: 2px; }
.hud-label { font-size: 9px; color: var(--c-grey); letter-spacing: 0.1em; }
.hud-value { font-size: 11px; font-weight: 700; color: #cbd5e1; }
.hud-value.cyan { color: var(--c-cyan); }
.hud-value.white { color: #fff; }
.hud-divider { width: 1px; height: 16px; background: var(--c-border); }

/* Dashboard Body */
.dashboard-body {
  display: flex;
  flex: 1;
  background: #000;
}

.module-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.module-title {
  font-size: 11px !important;
  font-weight: 800 !important;
  color: var(--c-grey);
  letter-spacing: 0.15em;
  margin: 0 !important;
  border: none !important;
}

.badge {
  font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-family: var(--font-mono);
}
.badge.primary { background: var(--c-cyan); color: #000; }
.badge.secondary { border: 1px solid var(--c-border); color: var(--c-grey); }

/* Mission Control */
.mission-control {
  width: 320px;
  border-right: 1px solid var(--c-border);
  display: flex;
  flex-direction: column;
}

.mission-scroll { padding: 0 16px 16px; display: flex; flex-direction: column; gap: 12px; }

.mission-card {
  background: #0a0a0a;
  border: 1px solid var(--c-border);
  padding: 16px;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: default;
}

.mission-card:hover { border-color: var(--c-border-hover); background: #111; }

.m-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
.m-id { font-size: 9px; color: var(--c-grey); font-family: var(--font-mono); }
.m-dot { width: 6px; height: 6px; border-radius: 50%; background: #334155; }

.mission-card.in_progress .m-dot { background: var(--c-cyan); box-shadow: 0 0 8px var(--c-cyan); }

.m-title { font-size: 13px; font-weight: 600; line-height: 1.4; margin: 0; color: #e2e8f0; }
.m-footer { display: flex; justify-content: space-between; margin-top: 12px; font-size: 9px; color: var(--c-grey); }

/* Matrix Control */
.matrix-control { flex: 1; }

.matrix-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  padding: 0 16px 16px;
  gap: 16px;
}

.agent-node {
  background: #0a0a0a;
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.agent-node:hover {
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  background: #111;
}

.node-glass {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.03), transparent 60%);
  pointer-events: none;
}

.node-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
.node-alias { font-size: 18px; font-weight: 800; color: #fff; margin-right: 8px; }
.node-tag { font-size: 10px; font-family: var(--font-mono); color: var(--c-grey); }

.glow-dot { width: 8px; height: 8px; border-radius: 50%; background: #334155; }
.working .glow-dot { background: var(--c-cyan); box-shadow: 0 0 12px var(--c-cyan); animation: pulse 1s infinite alternate; }

@keyframes pulse { from { opacity: 0.4; } to { opacity: 1; transform: scale(1.1); } }

.node-task { background: #000; padding: 16px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.03); margin-bottom: 20px; }
.task-content { font-size: 13px; line-height: 1.6; color: #cbd5e1; margin: 0; }

.node-metrics { display: flex; flex-direction: column; gap: 16px; }
.progress-info { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 10px; font-weight: 700; }
.p-label { color: var(--c-grey); letter-spacing: 0.05em; }
.p-val { color: #fff; font-family: var(--font-mono); }

.progress-bar { height: 4px; background: #1e293b; border-radius: 2px; overflow: hidden; }
.p-fill { height: 100%; background: #475569; transition: width 0.6s ease; }
.working .p-fill { background: var(--c-cyan); }
.captain .p-fill { background: var(--c-amber); }

.p-fill.anim {
  background-image: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  background-size: 200% 100%;
  animation: scan 1.5s linear infinite;
}

@keyframes scan { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.node-meta { display: flex; justify-content: space-between; font-size: 9px; color: #475569; font-family: var(--font-mono); }

.node-captain-badge {
  position: absolute; top: 0; right: 0; background: var(--c-amber); color: #000;
  padding: 2px 8px; font-size: 8px; font-weight: 900; letter-spacing: 0.1em;
}

/* Archive */
.archive-section { background: #000; border-top: 1px solid var(--border); }
.archive-toggle summary { padding: 16px 24px; font-size: 11px; color: var(--c-grey); cursor: pointer; user-select: none; }
.archive-table { padding: 0 24px 24px; display: flex; flex-direction: column; gap: 8px; }
.archive-row { display: flex; gap: 24px; font-size: 12px; color: #475569; font-family: var(--font-mono); padding: 8px 0; border-bottom: 1px solid var(--c-border); }
.a-alias { width: 100px; color: #64748b; font-weight: 700; }
.a-task { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Status Bar */
.modern-status { padding: 40px; text-align: center; }
.loader-bar { width: 40px; height: 2px; background: var(--c-cyan); margin: 0 auto 16px; animation: load 1.5s ease infinite; }
@keyframes load { 0% { width: 0; opacity: 0; } 50% { width: 80px; opacity: 1; } 100% { width: 0; opacity: 0; } }
.status-text { font-size: 12px; color: var(--c-grey); letter-spacing: 0.1em; text-transform: uppercase; }

@media (max-width: 1024px) {
  .dashboard-body { flex-direction: column; }
  .mission-control { width: 100%; border-right: none; border-bottom: 1px solid var(--c-border); }
}
</style>
