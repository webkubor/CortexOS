<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

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
    { id: "任务-01", title: "外脑反馈链路校准", status: "执行中", owner: "Codex-主机" },
    { id: "任务-02", title: "审美协议巡检", status: "执行中", owner: "Gemini-执行节点" },
    { id: "任务-03", title: "记忆索引压缩优化", status: "待处理", owner: "待分配" },
    { id: "任务-04", title: "跨 Agent 同步持久化", status: "执行中", owner: "Claude-战略节点" }
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

function missionStatusClass(status) {
  const text = String(status || "").trim();
  if (text === "执行中") return "working";
  if (text === "待处理") return "pending";
  return "unknown";
}

const currentMembers = computed(() =>
  data.value.members.filter((m) => m.type === "active" || m.type === "queued")
);

const REFRESH_INTERVAL = 8000;
let refreshTimer = null;
let requestId = 0;

async function loadData() {
  const currentRequestId = ++requestId;
  if (!data.value.generatedAt) loading.value = true;
  error.value = "";
  try {
    const url = new URL("/CortexOS/data/ai_team_status.json", window.location.origin);
    url.searchParams.set("t", String(Date.now()));
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error();
    const json = await res.json();
    if (currentRequestId !== requestId) return;
    data.value = { ...data.value, ...json };
  } catch (e) {
    if (currentRequestId !== requestId) return;
    error.value = "Neural Link Fault";
  } finally {
    if (currentRequestId === requestId) loading.value = false;
  }
}

function startAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = window.setInterval(() => {
    if (document.hidden) return;
    loadData();
  }, REFRESH_INTERVAL);
}

function handleVisibilityRefresh() {
  if (!document.hidden) loadData();
}

onMounted(() => {
  loadData();
  startAutoRefresh();
  window.addEventListener("focus", handleVisibilityRefresh);
  document.addEventListener("visibilitychange", handleVisibilityRefresh);
});

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer);
  window.removeEventListener("focus", handleVisibilityRefresh);
  document.removeEventListener("visibilitychange", handleVisibilityRefresh);
});

function isWorking(member) {
  return member.type === "active" && member.progress > 0 && member.progress < 100;
}

async function removeMember(member) {
  // Optimistic UI Update
  data.value.members = data.value.members.filter(m => m.member !== member.member);
  try {
    await fetch("/api/fleet/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "kick-out", memberId: member.member })
    });
    // Optional: reloadData();
  } catch (e) {
    console.error("Failed to kick out member", e);
  }
}

async function makeCaptain(member) {
  // Optimistic UI Update
  data.value.members.forEach(m => m.isCaptain = false);
  member.isCaptain = true;
  try {
    await fetch("/api/fleet/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "make-captain", memberId: member.member })
    });
    // Optional: reloadData();
  } catch (e) {
    console.error("Failed to make captain", e);
  }
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
    <div class="aether-pattern"></div>

    <!-- 2. 沉浸式 HUD -->
    <header class="aether-hud">
      <div class="hud-group">
        <div class="hud-tag">星际舰队中枢</div>
        <div class="hud-main">神经矩阵 V5</div>
      </div>
      <div class="hud-center">
        <div class="live-status">
          <div class="live-scanner"></div>
          <span class="live-text">监控运行中</span>
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
          <div class="flow-header">任务队列</div>
          <div class="flow-container">
            <div v-for="(task, idx) in data.missions" :key="task.id" class="mission-glass-card"
              :style="{ '--delay': idx * 0.1 + 's' }">
              <div class="card-edge"></div>
              <div class="m-top">
                <span class="m-id">{{ task.id }}</span>
                <div class="m-indicator" :class="missionStatusClass(task.status)"></div>
              </div>
              <p class="m-title">{{ task.title }}</p>
              <div class="m-owner">{{ task.owner }}</div>
            </div>
          </div>
        </aside>

        <!-- 4. Agent 矩阵 (The Glass Matrix) -->
        <main class="neural-matrix">
          <div class="matrix-grid">
            <div v-for="(member, idx) in currentMembers" :key="member.member" class="agent-glass-node"
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
                  <div class="header-actions">
                    <div class="working-spinner" v-if="isWorking(member)"></div>
                    <div class="action-menu">
                      <button class="action-btn make-captain" v-if="!member.isCaptain" @click="makeCaptain(member)"
                        title="调配为队长">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </button>
                      <button class="action-btn kick-out" @click="removeMember(member)" title="移出矩阵">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="task-reveal-box">
                  <p class="task-text">{{ member.task || "待命状态" }}</p>
                </div>

                <div class="node-footer">
                  <div class="load-bar-wrapper">
                    <div class="load-labels">
                      <span>指令负载</span>
                      <span>{{ member.progress }}%</span>
                    </div>
                    <div class="load-track">
                      <div class="load-fill" :style="{ width: member.progress + '%' }"
                        :class="{ 'active': isWorking(member) }"></div>
                    </div>
                  </div>
                  <div class="node-meta">
                    <span class="meta-item">📍 {{ member.workspace.split('/').pop() }}</span>
                    <span class="meta-item">⏱ {{ member.since }}</span>
                  </div>
                </div>
              </div>

              <!-- 队长金质描边 -->
              <div class="captain-crown" v-if="member.isCaptain">最高指令</div>
            </div>
          </div>
        </main>
      </div>
    </template>

    <!-- 加载动画 -->
    <div v-if="loading" class="aether-loading">
      <div class="aether-spinner"></div>
      <div class="aether-text">系统底层金丝直连初始化...</div>
    </div>
  </div>
</template>

<style scoped>
/* 🔴 核心：现代高奢 Aether 设计系统 (Aureate Void) */
.aether-nexus {
  --c-aureate-glow: #F5C87B;
  --c-aureate-base: #D4AE5E;
  --c-aureate-dim: #8B7347;
  --c-white: #ffffff;
  --c-border: rgba(255, 255, 255, 0.05);
  /* 更低调的边框 */
  --glass-bg: rgba(0, 0, 0, 0.3);
  /* 更深邃的玻璃背景 */
  --glass-blur: blur(20px) saturate(120%);

  position: relative;
  width: 100%;
  min-height: 100vh;
  background: #090A0E;
  /* 极深的灰蓝/黑曜石 */
  color: #fff;
  font-family: "Geist", "Inter", "PingFang SC", "Microsoft YaHei", sans-serif;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 🌀 弥散渐变背景 - 克制光晕 */
.aether-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  filter: blur(120px);
  opacity: 0.8;
}

.aether-pattern {
  position: absolute;
  inset: 0;
  z-index: 1;
  background-image: radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 24px 24px;
  opacity: 0.6;
  pointer-events: none;
}

.blob {
  position: absolute;
  border-radius: 50%;
  animation: move 30s infinite alternate;
}

.b1 {
  width: 600px;
  height: 600px;
  background: rgba(212, 174, 94, 0.04);
  top: -10%;
  left: -10%;
}

.b2 {
  width: 500px;
  height: 500px;
  background: rgba(245, 200, 123, 0.02);
  bottom: -10%;
  right: -10%;
  animation-delay: -5s;
}

.b3 {
  width: 400px;
  height: 400px;
  background: rgba(255, 255, 255, 0.02);
  top: 40%;
  left: 40%;
  animation-delay: -10s;
}

@keyframes move {
  from {
    transform: translate(0, 0) rotate(0deg);
  }

  to {
    transform: translate(100px, 100px) rotate(360deg);
  }
}

/* 🛰 HUD */
.aether-hud {
  height: 70px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--c-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  z-index: 100;
}

.hud-tag {
  font-size: 10px;
  color: #888;
  letter-spacing: 0.1em;
  font-weight: 500;
  margin-bottom: 4px;
}

.hud-main {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #ffffff;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
}

.live-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 100px;
  border: 1px solid var(--c-border);
}

.live-scanner {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--c-aureate-glow);
  box-shadow: 0 0 10px var(--c-aureate-glow);
  animation: ping 1.5s infinite;
}

.live-text {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--c-aureate-base);
}

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

.flow-header {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  letter-spacing: 0.1em;
  padding-left: 8px;
}

.mission-glass-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0.5) 100%);
  backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255, 255, 255, 0.04);
  box-shadow: inset 1px 1px 1px rgba(255, 255, 255, 0.08), 0 8px 24px rgba(0, 0, 0, 0.6);
  padding: 24px;
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  animation: slideIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-delay: var(--delay);
  transition: all 0.4s ease;
}

.mission-glass-card:hover {
  transform: translateX(4px);
  border-color: rgba(245, 200, 123, 0.2);
  box-shadow: inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset 0 0 30px rgba(245, 200, 123, 0.03), 0 12px 32px rgba(0, 0, 0, 0.8);
}

.mission-glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
}

.m-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.m-id {
  font-size: 10px;
  font-weight: 900;
  color: #444;
}

.m-indicator {
  width: 8px;
  height: 2px;
  background: #333;
}

.m-indicator.working {
  background: var(--c-aureate-glow);
  box-shadow: 0 0 8px rgba(245, 200, 123, 0.5);
}

.m-indicator.pending {
  background: rgba(255, 255, 255, 0.35);
}

.m-title {
  font-size: 14px;
  font-weight: 600;
  color: #eee;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.m-owner {
  font-size: 10px;
  color: #666;
  font-family: ui-monospace;
}

/* 💎 Agent 矩阵 - 液态玻璃节点 */
.neural-matrix {
  flex: 1;
}

.matrix-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.agent-glass-node {
  position: relative;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(0, 0, 0, 0.6) 100%);
  backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255, 255, 255, 0.04);
  box-shadow: inset 1px 1px 1px rgba(255, 255, 255, 0.1), 0 12px 40px rgba(0, 0, 0, 0.5);
  border-radius: 24px;
  padding: 32px;
  transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  overflow: hidden;
  animation: slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-delay: var(--delay);
}

.agent-glass-node:hover {
  transform: translateY(-6px);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(0, 0, 0, 0.7) 100%);
  border-color: rgba(245, 200, 123, 0.3);
  box-shadow: inset 1px 1px 1px rgba(255, 255, 255, 0.15), inset 0 0 40px rgba(245, 200, 123, 0.06), 0 20px 50px -12px rgba(0, 0, 0, 0.8);
}

/* 玻璃噪声与反光 */
.glass-noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3%3Ffilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.02'/%3E%3C/svg%3E");
  pointer-events: none;
}

.glass-glare {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.05), transparent 50%);
  pointer-events: none;
  transform: rotate(-45deg);
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  position: relative;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-menu {
  display: flex;
  gap: 8px;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.agent-glass-node:hover .action-menu {
  opacity: 1;
  transform: translateX(0);
}

.action-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--c-border);
  color: #888;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.action-btn svg {
  width: 14px;
  height: 14px;
}

.action-btn.make-captain:hover {
  background: rgba(245, 200, 123, 0.1);
  border-color: var(--c-aureate-glow);
  color: var(--c-aureate-glow);
  box-shadow: 0 0 15px rgba(245, 200, 123, 0.2);
}

.action-btn.kick-out:hover {
  background: rgba(255, 85, 85, 0.1);
  border-color: rgba(255, 85, 85, 0.4);
  color: #ff5555;
  box-shadow: 0 0 15px rgba(255, 85, 85, 0.2);
}

.agent-identity {
  display: flex;
  align-items: center;
  gap: 20px;
}

.agent-logo-wrapper {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.8));
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(245, 200, 123, 0.4);
  border-radius: 16px;
  box-shadow: inset 0 4px 10px rgba(0, 0, 0, 0.8), 0 4px 12px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.agent-logo-wrapper svg {
  width: 28px;
  height: 28px;
}

.is-working .agent-logo-wrapper {
  color: #fff;
  filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.5));
  animation: logo-breathe 3s infinite ease-in-out;
}

@keyframes logo-breathe {

  0%,
  100% {
    transform: scale(1);
    opacity: 0.8;
  }

  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

.agent-name {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: #ffffff;
  letter-spacing: 0.02em;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
}

.agent-sub {
  font-size: 11px;
  color: #666;
  font-family: ui-monospace;
  margin-top: 4px;
  display: block;
}

.working-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.05);
  border-top-color: var(--c-aureate-glow);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.task-reveal-box {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.04);
  box-shadow: inset 0 4px 12px rgba(0, 0, 0, 0.5);
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 32px;
  min-height: 80px;
}

.task-text {
  font-size: 13px;
  line-height: 1.6;
  color: #b0b0b0;
  margin: 0;
  font-weight: 400;
  letter-spacing: 0.02em;
}

.node-footer {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.load-bar-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.load-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;
  color: #888;
  letter-spacing: 0.05em;
}

.load-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 100px;
  overflow: hidden;
}

.load-fill {
  height: 100%;
  background: #333;
  transition: width 1s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.load-fill.active {
  background: var(--c-aureate-glow);
  box-shadow: 0 0 12px rgba(245, 200, 123, 0.5);
  position: relative;
}

.load-fill.active::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
  animation: pulse-slide 2s linear infinite;
}

@keyframes pulse-slide {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(100%);
  }
}

.is-captain .load-fill {
  background: var(--c-aureate-glow);
  box-shadow: 0 0 20px rgba(245, 200, 123, 0.8);
}

.node-meta {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #444;
  font-family: ui-monospace;
}

.captain-crown {
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(135deg, var(--c-aureate-glow), var(--c-aureate-dim));
  color: #000;
  padding: 6px 16px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  border-bottom-left-radius: 16px;
  box-shadow: 0 4px 12px rgba(245, 200, 123, 0.2);
}

/* 🌀 加载动画 */
.aether-loading {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
}

.aether-spinner {
  width: 60px;
  height: 60px;
  border: 1px solid var(--c-border);
  border-top-color: var(--c-aureate-glow);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.aether-text {
  font-size: 12px;
  letter-spacing: 0.2em;
  font-weight: 400;
  color: #888;
}

/* 动画库 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes ping {
  0% {
    transform: scale(1);
    opacity: 1;
  }

  100% {
    transform: scale(3);
    opacity: 0;
  }
}

@keyframes slideIn {
  from {
    transform: translateX(-30px);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(40px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 1024px) {
  .aether-stage {
    flex-direction: column;
  }

  .mission-flow {
    width: 100%;
  }
}
</style>
