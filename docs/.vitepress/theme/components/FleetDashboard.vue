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
    { id: "T-001", title: "Error Retrospective Loop Fix", status: "IN_PROGRESS", owner: "Codex-1" },
    { id: "T-002", title: "Semantic Knowledge Ingestion", status: "IN_PROGRESS", owner: "Codex-1" },
    { id: "T-003", title: "Context Briefing Logic Upgrade", status: "OPEN", owner: "UNASSIGNED" },
    { id: "T-004", title: "Claude Code MCP Persistence", status: "IN_PROGRESS", owner: "Claude" }
  ]
});

// Agent Logo 映射 (精细矢量路径)
const agentLogos = {
  gemini: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  claude: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 4L4 20H20L12 4Z" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 4V20" stroke-linecap="round"/><path d="M8 12H16" stroke-linecap="round"/></svg>`,
  codex: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke-linecap="round"/><path d="M12 8V16M8 12H16" stroke-linecap="round"/></svg>`,
  default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke-linecap="round"/></svg>`
};

function getAgentLogo(name) {
  const lower = name.toLowerCase();
  if (lower.includes('gemini')) return agentLogos.gemini;
  if (lower.includes('claude')) return agentLogos.claude;
  if (lower.includes('codex')) return agentLogos.codex;
  return agentLogos.default;
}

const currentMembers = computed(() =>
  data.value.members.filter((m) => m.type === "active" || m.type === "queued")
);

const historyMembers = computed(() =>
  data.value.members.filter((m) => m.type === "offline")
);

const captain = computed(() => currentMembers.value.find((m) => m.isCaptain) || null);

const timeText = computed(() => {
  if (!data.value.generatedAt) return "STATIONARY";
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
    if (!res.ok) throw new Error("HTTP_LINK_FAULT");
    const json = await res.json();
    data.value = { ...data.value, ...json };
  } catch (e) {
    error.value = "Neural Link Error: " + (e && e.message ? e.message : String(e));
  } finally {
    loading.value = false;
  }
});

function isWorking(member) {
  return member.type === "active" && member.progress > 0 && member.progress < 100;
}

function statusTone(member) {
  if (member.isCaptain) return "captain";
  return "active";
}
</script>

<template>
  <div class="aureate-v3">
    <!-- Top HUD: Minimalist & Expensive -->
    <header class="aureate-hud">
      <div class="hud-brand">
        <span class="hud-kicker">NEURAL_DECK_v3.0</span>
        <span class="hud-main">CORTEX_OS</span>
      </div>
      <div class="hud-stats">
        <div class="h-stat"><span class="h-label">AGENTS:</span> <span class="h-val">{{ currentMembers.length }}</span></div>
        <div class="h-stat"><span class="h-label">COMMANDER:</span> <span class="h-val amber">{{ captain ? captain.alias : "NONE" }}</span></div>
      </div>
      <div class="hud-time">{{ timeText }}</div>
    </header>

    <div v-if="loading" class="aureate-loader">
      <div class="line-loader"></div>
      <div class="loader-text">SYNCING NEURAL MATRIX...</div>
    </div>

    <template v-else>
      <div class="aureate-content-v3">
        <!-- Sidebar: Mission Control -->
        <aside class="aureate-sidebar">
          <div class="sidebar-head">
            <span class="s-title">MISSION_CONTROL</span>
            <div class="s-dot"></div>
          </div>
          <div class="sidebar-list">
            <div v-for="task in data.missions" :key="task.id" class="mission-card-v3" :class="task.status.toLowerCase()">
              <div class="m-top">
                <span class="m-id">{{ task.id }}</span>
                <span class="m-status">{{ task.status }}</span>
              </div>
              <p class="m-desc">{{ task.title }}</p>
              <div class="m-owner">{{ task.owner }}</div>
            </div>
          </div>
        </aside>

        <!-- Main: Agent Nodes -->
        <main class="aureate-main">
          <div class="main-head">
            <span class="s-title">AGENT_NEURAL_NODES</span>
          </div>
          <div class="node-grid-v3">
            <div v-for="member in currentMembers" :key="member.member" 
                 class="node-v3" :class="[statusTone(member), { 'is-working': isWorking(member) }]">
              
              <div class="node-surface"></div>
              
              <div class="node-top">
                <div class="node-identity">
                  <div class="node-brand">
                    <div class="agent-logo" v-html="getAgentLogo(member.agent)"></div>
                    <div class="agent-ids">
                      <h3 class="node-name">{{ member.alias || member.member.split('(')[0] }}</h3>
                      <span class="node-type">{{ member.agent }}</span>
                    </div>
                  </div>
                </div>
                <div class="node-status-glow"></div>
              </div>

              <div class="node-task-box">
                <div class="task-inner">
                  {{ member.task || "Stationary Mode - Awaiting Dispatch" }}
                </div>
              </div>

              <div class="node-progress-v3">
                <div class="p-header">
                  <span class="p-label">NEURAL_LOAD</span>
                  <span class="p-val">{{ member.progress }}%</span>
                </div>
                <div class="p-track-v3">
                  <div class="p-fill-v3" :style="{ width: member.progress + '%' }" :class="{ 'anim-working': isWorking(member) }"></div>
                </div>
              </div>

              <div class="node-meta-v3">
                <span class="meta-path">{{ member.workspace.split('/').pop() }}</span>
                <span class="meta-time">{{ member.since }}</span>
              </div>

              <div v-if="member.isCaptain" class="commander-tag">PREMIUM_CORE</div>
            </div>
          </div>
        </main>
      </div>
    </template>
  </div>
</template>

<style scoped>
.aureate-v3 {
  --bg-main: #050505;
  --bg-surface: #0a0a0a;
  --bg-card: #111111;
  --c-border: rgba(255, 255, 255, 0.08);
  --c-cyan: #22d3ee;
  --c-amber: #fcd34d;
  --c-grey: #4b5563;
  --c-text: #9ca3af;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  
  display: flex;
  flex-direction: column;
  background: var(--bg-main);
  min-height: 100vh;
  color: #fff;
}

/* HUD */
.aureate-hud {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #000;
  border-bottom: 1px solid var(--c-border);
  font-family: var(--font-mono);
}

.hud-brand { display: flex; flex-direction: column; }
.hud-kicker { font-size: 8px; color: var(--c-grey); letter-spacing: 0.2em; }
.hud-main { font-size: 14px; font-weight: 800; color: #fff; }

.hud-stats { display: flex; gap: 32px; font-size: 11px; }
.h-stat { display: flex; gap: 8px; }
.h-label { color: var(--c-grey); }
.h-val { font-weight: 700; color: #fff; }
.h-val.green { color: var(--c-cyan); }
.h-val.amber { color: var(--c-amber); }

.hud-time { font-size: 10px; color: var(--c-grey); }

/* Content Layout */
.aureate-content-v3 {
  display: flex;
  flex: 1;
}

.sidebar-head, .main-head {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid var(--c-border);
  background: rgba(255,255,255,0.01);
}

.s-title { font-size: 10px; font-weight: 800; letter-spacing: 0.15em; color: var(--c-grey); }
.s-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c-cyan); box-shadow: 0 0 10px var(--c-cyan); }

/* Sidebar */
.aureate-sidebar {
  width: 300px;
  border-right: 1px solid var(--c-border);
  display: flex;
  flex-direction: column;
}

.sidebar-list { padding: 16px; display: flex; flex-direction: column; gap: 12px; }

.mission-card-v3 {
  background: var(--bg-surface);
  border: 1px solid var(--c-border);
  padding: 16px;
  border-radius: 6px;
  transition: all 0.2s;
}

.mission-card-v3:hover { border-color: rgba(255,255,255,0.15); background: var(--bg-card); }

.m-top { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 9px; font-family: var(--font-mono); }
.m-id { color: var(--c-grey); }
.m-status { color: var(--c-cyan); font-weight: 700; }
.mission-card-v3.open .m-status { color: var(--c-grey); }

.m-desc { font-size: 13px; font-weight: 500; color: #e5e7eb; line-height: 1.5; margin-bottom: 12px; }
.m-owner { font-size: 9px; color: var(--c-grey); text-transform: uppercase; font-family: var(--font-mono); }

/* Main Grid */
.aureate-main { flex: 1; display: flex; flex-direction: column; }

.node-grid-v3 {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  padding: 16px;
  gap: 16px;
}

.node-v3 {
  background: var(--bg-surface);
  border: 1px solid var(--c-border);
  padding: 24px;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.node-v3:hover {
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
  background: var(--bg-card);
  box-shadow: 0 12px 24px -12px rgba(0,0,0,0.5);
}

.node-surface {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 60%);
  pointer-events: none;
}

.node-top { display: flex; justify-content: space-between; margin-bottom: 24px; }

.node-brand { display: flex; align-items: center; gap: 14px; }
.agent-logo { width: 32px; height: 32px; color: var(--c-grey); transition: all 0.3s; }
.is-working .agent-logo { color: var(--c-cyan); }
.captain .agent-logo { color: var(--c-amber); }

.agent-ids { display: flex; flex-direction: column; }
.node-name { font-size: 18px; font-weight: 800; color: #fff; margin: 0; }
.node-type { font-size: 9px; color: var(--c-grey); font-family: var(--font-mono); margin-top: 2px; }

.node-status-glow {
  width: 8px; height: 8px; border-radius: 50%; background: #27272a; margin-top: 10px;
}
.is-working .node-status-glow {
  background: var(--c-cyan);
  box-shadow: 0 0 12px var(--c-cyan);
  animation: soft-pulse 1.5s infinite alternate;
}

@keyframes soft-pulse { from { opacity: 0.5; filter: blur(2px); } to { opacity: 1; filter: blur(0px); } }

.node-task-box {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.03);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}
.task-inner { font-size: 13px; color: #d1d5db; line-height: 1.6; }

.node-progress-v3 { margin-bottom: 24px; }
.p-header { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 10px; font-weight: 700; }
.p-label { color: var(--c-grey); letter-spacing: 0.1em; }
.p-val { color: #fff; font-family: var(--font-mono); }

.p-track-v3 { height: 3px; background: #1a1a1a; border-radius: 2px; overflow: hidden; }
.p-fill-v3 { height: 100%; background: #3f3f46; transition: width 0.8s ease; }
.is-working .p-fill-v3 { background: var(--c-cyan); }
.captain .p-fill-v3 { background: var(--c-amber); }

.anim-working {
  background-image: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  background-size: 200% 100%;
  animation: shine 2s linear infinite;
}

@keyframes shine { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.node-meta-v3 { display: flex; justify-content: space-between; font-size: 10px; color: var(--c-grey); font-family: var(--font-mono); }

.commander-tag {
  position: absolute; bottom: 0; right: 0; background: var(--c-amber); color: #000;
  padding: 2px 10px; font-size: 9px; font-weight: 900;
}

.aureate-loader {
  padding: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}
.line-loader { width: 120px; height: 1px; background: var(--c-border); position: relative; overflow: hidden; }
.line-loader::after {
  content: ''; position: absolute; left: 0; top: 0; height: 100%; width: 40px;
  background: var(--c-cyan); animation: line-move 1.5s infinite;
}
@keyframes line-move { 0% { left: -40px; } 100% { left: 120px; } }
.loader-text { font-size: 10px; color: var(--c-grey); letter-spacing: 0.2em; }
</style>
