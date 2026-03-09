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
    { id: "TX-01", title: "Neural Feedback Loop Integration", status: "WORKING", owner: "Codex-Prime" },
    { id: "TX-02", title: "Aesthetic Protocol Audit v5.0", status: "WORKING", owner: "Gemini-1" },
    { id: "TX-03", title: "Cortex Memory Optimization", status: "PENDING", owner: "UNASSIGNED" },
    { id: "TX-04", title: "Cross-Agent Sync persistence", status: "WORKING", owner: "Claude-Code" }
  ]
});

// 顶级官方 Logo 路径
const agentLogos = {
  gemini: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z"/></svg>`,
  claude: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L3.5 19H5.8L12 7.2L18.2 19H20.5L12 3ZM12 11.5L8.5 18H15.5L12 11.5Z"/></svg>`,
  codex: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 7H13V13H11V7ZM11 15H13V17H11V15Z"/></svg>`,
  default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>`
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

onMounted(async () => {
  loading.value = true;
  try {
    const res = await fetch("/CortexOS/data/ai_team_status.json", { cache: "no-store" });
    if (!res.ok) throw new Error();
    const json = await res.json();
    data.value = { ...data.value, ...json };
  } catch (e) {
    error.value = "Neural Link Fault";
  } finally {
    loading.value = false;
  }
});

function isWorking(member) {
  return member.type === "active" && member.progress > 0 && member.progress < 100;
}
</script>

<template>
  <div class="aether-nexus">
    <!-- 1. 弥散渐变动态背景 (The Living Aether) -->
    <div class="aether-bg">
      <div class="blob b1"></div>
      <div class="blob b2"></div>
      <div class="blob b3"></div>
    </div>

    <!-- 2. 沉浸式 HUD -->
    <header class="aether-hud">
      <div class="hud-group">
        <div class="hud-tag">PROJECT_CORTEX</div>
        <div class="hud-main">NEURAL_ARRAY_V5</div>
      </div>
      <div class="hud-center">
        <div class="live-status">
          <div class="live-scanner"></div>
          <span class="live-text">MONITORING_ACTIVE</span>
        </div>
      </div>
      <div class="hud-right">
        <span class="hud-time">{{ new Date().toLocaleTimeString() }}</span>
      </div>
    </header>

    <template v-if="!loading">
      <div class="aether-stage">
        <!-- 3. 作战清单 (Mission Flow) -->
        <aside class="mission-flow">
          <div class="flow-header">MISSION_BACKLOG</div>
          <div class="flow-container">
            <div v-for="(task, idx) in data.missions" :key="task.id" 
                 class="mission-glass-card" :style="{ '--delay': idx * 0.1 + 's' }">
              <div class="card-edge"></div>
              <div class="m-top">
                <span class="m-id">{{ task.id }}</span>
                <div class="m-indicator" :class="task.status.toLowerCase()"></div>
              </div>
              <p class="m-title">{{ task.title }}</p>
              <div class="m-owner">{{ task.owner }}</div>
            </div>
          </div>
        </aside>

        <!-- 4. Agent 矩阵 (The Glass Matrix) -->
        <main class="neural-matrix">
          <div class="matrix-grid">
            <div v-for="(member, idx) in currentMembers" :key="member.member" 
                 class="agent-glass-node" 
                 :class="{ 'is-working': isWorking(member), 'is-captain': member.isCaptain }"
                 :style="{ '--delay': (idx + 3) * 0.1 + 's' }">
              
              <!-- 液体玻璃反光层 -->
              <div class="glass-glare"></div>
              <div class="glass-noise"></div>

              <div class="node-content">
                <div class="node-header">
                  <div class="agent-identity">
                    <div class="agent-logo-wrapper" v-html="getAgentLogo(member.agent)"></div>
                    <div class="agent-info">
                      <h3 class="agent-name">{{ member.alias || member.member.split('(')[0] }}</h3>
                      <span class="agent-sub">{{ member.agent }}</span>
                    </div>
                  </div>
                  <div class="working-spinner" v-if="isWorking(member)"></div>
                </div>

                <div class="task-reveal-box">
                  <p class="task-text">{{ member.task || "STATIONARY_STATE" }}</p>
                </div>

                <div class="node-footer">
                  <div class="load-bar-wrapper">
                    <div class="load-labels">
                      <span>NEURAL_LOAD</span>
                      <span>{{ member.progress }}%</span>
                    </div>
                    <div class="load-track">
                      <div class="load-fill" :style="{ width: member.progress + '%' }" :class="{ 'active': isWorking(member) }"></div>
                    </div>
                  </div>
                  <div class="node-meta">
                    <span class="meta-item">📍 {{ member.workspace.split('/').pop() }}</span>
                    <span class="meta-item">⏱ {{ member.since }}</span>
                  </div>
                </div>
              </div>

              <!-- 队长金质描边 -->
              <div class="captain-crown" v-if="member.isCaptain">PRIME_DIRECTIVE</div>
            </div>
          </div>
        </main>
      </div>
    </template>

    <!-- 加载动画 -->
    <div v-if="loading" class="aether-loading">
      <div class="aether-spinner"></div>
      <div class="aether-text">INITIATING_AUREATE_LINK...</div>
    </div>
  </div>
</template>

<style scoped>
/* 🔴 核心：现代高奢 Aether 设计系统 */
.aether-nexus {
  --c-cyan: #00f2ff;
  --c-violet: #7000ff;
  --c-amber: #ffb800;
  --c-white: #ffffff;
  --c-border: rgba(255, 255, 255, 0.12);
  --glass-bg: rgba(255, 255, 255, 0.03);
  --glass-blur: blur(40px) saturate(180%);
  
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: #000;
  color: #fff;
  font-family: "Geist", "Inter", sans-serif;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 🌀 弥散渐变背景 */
.aether-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  filter: blur(120px);
  opacity: 0.4;
}
.blob {
  position: absolute;
  border-radius: 50%;
  animation: move 20s infinite alternate;
}
.b1 { width: 600px; height: 600px; background: var(--c-violet); top: -10%; left: -10%; }
.b2 { width: 500px; height: 500px; background: var(--c-cyan); bottom: -10%; right: -10%; animation-delay: -5s; }
.b3 { width: 400px; height: 400px; background: #ff0055; top: 40%; left: 40%; animation-delay: -10s; }

@keyframes move {
  from { transform: translate(0, 0) rotate(0deg); }
  to { transform: translate(100px, 100px) rotate(360deg); }
}

/* 🛰 HUD */
.aether-hud {
  height: 70px;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--c-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  z-index: 100;
}
.hud-tag { font-size: 9px; color: #666; letter-spacing: 0.3em; margin-bottom: 4px; }
.hud-main { font-size: 16px; font-weight: 900; letter-spacing: -0.02em; }

.live-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 16px;
  background: rgba(255,255,255,0.05);
  border-radius: 100px;
  border: 1px solid var(--c-border);
}
.live-scanner {
  width: 6px; height: 6px; border-radius: 50%; background: var(--c-cyan);
  box-shadow: 0 0 15px var(--c-cyan); animation: ping 1.5s infinite;
}
.live-text { font-size: 10px; font-weight: 800; color: var(--c-cyan); }

/* 🎭 布局层 */
.aether-stage {
  display: flex;
  flex: 1;
  padding: 24px;
  gap: 24px;
  z-index: 10;
}

/* 🧊 任务清单 - 玻璃态 */
.mission-flow {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.flow-header { font-size: 11px; font-weight: 900; color: #666; letter-spacing: 0.2em; padding-left: 8px; }

.mission-glass-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--c-border);
  padding: 20px;
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  animation: slideIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-delay: var(--delay);
}
.mission-glass-card::before {
  content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
}

.m-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.m-id { font-size: 10px; font-weight: 900; color: #444; }
.m-indicator { width: 8px; height: 2px; background: #333; }
.m-indicator.working { background: var(--c-cyan); box-shadow: 0 0 8px var(--c-cyan); }

.m-title { font-size: 14px; font-weight: 600; color: #eee; margin: 0 0 12px 0; line-height: 1.4; }
.m-owner { font-size: 10px; color: #666; font-family: ui-monospace; }

/* 💎 Agent 矩阵 - 液态玻璃节点 */
.neural-matrix { flex: 1; }
.matrix-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.agent-glass-node {
  position: relative;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--c-border);
  border-radius: 24px;
  padding: 32px;
  transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  overflow: hidden;
  animation: slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-delay: var(--delay);
}

.agent-glass-node:hover {
  transform: translateY(-8px) scale(1.02);
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 30px 60px -12px rgba(0,0,0,0.6);
}

/* 玻璃噪声与反光 */
.glass-noise {
  position: absolute; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3%3Ffilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.02'/%3E%3C/svg%3E");
  pointer-events: none;
}
.glass-glare {
  position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
  background: radial-gradient(circle at center, rgba(255,255,255,0.05), transparent 50%);
  pointer-events: none; transform: rotate(-45deg);
}

.node-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
.agent-identity { display: flex; align-items: center; gap: 20px; }

.agent-logo-wrapper {
  width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;
  color: #555; transition: all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.is-working .agent-logo-wrapper {
  color: #fff; filter: drop-shadow(0 0 15px rgba(255,255,255,0.5));
  animation: logo-breathe 3s infinite ease-in-out;
}

@keyframes logo-breathe { 
  0%, 100% { transform: scale(1); opacity: 0.8; } 
  50% { transform: scale(1.1); opacity: 1; } 
}

.agent-name { font-size: 22px; font-weight: 900; margin: 0; letter-spacing: -0.03em; }
.agent-sub { font-size: 11px; color: #666; font-family: ui-monospace; margin-top: 4px; display: block; }

.working-spinner {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.1); border-top-color: var(--c-cyan);
  border-radius: 50%; animation: spin 1s linear infinite;
}

.task-reveal-box {
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.05);
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 32px;
  min-height: 80px;
}
.task-text { font-size: 14px; line-height: 1.6; color: #ccc; margin: 0; font-weight: 500; }

.node-footer { display: flex; flex-direction: column; gap: 20px; }
.load-bar-wrapper { display: flex; flex-direction: column; gap: 12px; }
.load-labels { display: flex; justify-content: space-between; font-size: 10px; font-weight: 900; color: #555; }

.load-track { height: 4px; background: rgba(255,255,255,0.05); border-radius: 100px; overflow: hidden; }
.load-fill { height: 100%; background: #333; transition: width 1s cubic-bezier(0.2, 0.8, 0.2, 1); }
.load-fill.active { background: var(--c-cyan); box-shadow: 0 0 15px var(--c-cyan); }
.is-captain .load-fill { background: var(--c-amber); box-shadow: 0 0 15px var(--c-amber); }

.node-meta { display: flex; justify-content: space-between; font-size: 10px; color: #444; font-family: ui-monospace; }

.commander-tag {
  position: absolute; bottom: 0; right: 0; background: var(--c-amber); color: #000;
  padding: 4px 16px; font-size: 10px; font-weight: 900; letter-spacing: 0.1em;
  border-top-left-radius: 12px;
}

/* 🌀 加载动画 */
.aether-loading { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 32px; }
.aether-spinner { 
  width: 60px; height: 60px; border: 1px solid var(--c-border); border-top-color: var(--c-cyan);
  border-radius: 50%; animation: spin 1s linear infinite;
}
.aether-text { font-size: 11px; letter-spacing: 0.4em; color: #444; }

/* 动画库 */
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes ping { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(3); opacity: 0; } }
@keyframes slideIn { from { transform: translateX(-30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

@media (max-width: 1024px) {
  .aether-stage { flex-direction: column; }
  .mission-flow { width: 100%; }
}
</style>
