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
});

const currentMembers = computed(() =>
  data.value.members.filter((m) => m.type === "active" || m.type === "queued")
);

const historyMembers = computed(() =>
  data.value.members.filter((m) => m.type === "offline")
);

const captain = computed(() => currentMembers.value.find((m) => m.isCaptain) || null);

const timeText = computed(() => {
  if (!data.value.generatedAt) return "未同步";
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
    if (!res.ok) throw new Error("HTTP " + res.status);
    data.value = await res.json();
  } catch (e) {
    error.value = "加载失败: " + (e && e.message ? e.message : String(e));
  } finally {
    loading.value = false;
  }
});

function isWorking(member) {
  return member.type === "active" && member.progress > 0 && member.progress < 100;
}

function statusTone(member) {
  if (member.type === "offline") return "offline";
  if (member.type === "queued") return "queued";
  if (member.isCaptain) return "captain";
  return "active";
}
</script>

<template>
  <div class="fleet-dashboard">
    <!-- Hero Section -->
    <header class="hero-panel">
      <div class="hero-glow"></div>
      <div class="hero-content">
        <div class="hero-kicker">
          <span class="live-dot" :class="{ 'is-working': currentMembers.some(m => isWorking(m)) }"></span>
          AI TEAM COMMAND CENTER
        </div>
        <h2 class="hero-title">CortexOS 阵列实时态势</h2>
        <p class="hero-meta">大脑中枢同步: <span>{{ timeText }}</span></p>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-icon active-icon" :class="{ 'pulse-bg': currentMembers.some(m => isWorking(m)) }">
            <svg viewBox="0 0 24 24" fill="none" class="icon">
              <path d="M13 10V3L4 14H11V21L20 10H13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </div>
          <div class="summary-info">
            <div class="label">活跃神经元</div>
            <div class="value active">{{ currentMembers.length }}</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon history-icon">
            <svg viewBox="0 0 24 24" fill="none" class="icon">
              <path
                d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div class="summary-info">
            <div class="label">归档意识体</div>
            <div class="value offline">{{ historyMembers.length }}</div>
          </div>
        </div>
        <div class="summary-card captain-special">
          <div class="summary-icon captain-icon">
            <svg viewBox="0 0 24 24" fill="none" class="icon">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div class="summary-info">
            <div class="label">当前指挥官</div>
            <div class="value captain">{{ captain ? captain.member.split('(')[0] : "无核心" }}</div>
          </div>
        </div>
      </div>
    </header>

    <div v-if="loading" class="state-card loading">
      <div class="spinner"></div> 正在接入中枢神经系统...
    </div>
    <div v-else-if="error" class="state-card error">
      <svg viewBox="0 0 24 24" fill="none" class="icon">
        <path
          d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      {{ error }}
    </div>
    <template v-else>
      <!-- Active Members -->
      <section class="section-container">
        <header class="section-head">
          <h3 class="section-title">全域节点矩阵</h3>
        </header>

        <div class="cards-grid">
          <div v-for="member in currentMembers" :key="member.member" class="member-card"
            :class="[statusTone(member), { 'is-captain': member.isCaptain, 'is-working': isWorking(member) }]">
            <div class="card-glow"></div>
            <div class="working-flow" v-if="isWorking(member)"></div>
            
            <div class="card-inner">
              <header class="card-header">
                <div class="member-info">
                  <h3 class="member-name">{{ member.member }}</h3>
                  <div class="badges">
                    <span class="badge agent">{{ member.agent }}</span>
                    <span v-if="member.isCaptain" class="badge captain-badge">PRIME COMMANDER</span>
                    <span v-if="member.hasTodo" class="badge todo-badge">OBJECTIVE PROG</span>
                  </div>
                </div>
                <div class="status-indicator">
                  <span class="status-dot" :class="{ 'pulse': isWorking(member) }"></span>
                </div>
              </header>

              <div class="task-box">
                <div class="task-header" v-if="isWorking(member)">
                  <span class="working-label">正在执行...</span>
                </div>
                <p class="task-desc">{{ member.task || "等候指令..." }}</p>
              </div>

              <div class="progress-section">
                <div class="progress-header">
                  <span class="progress-label">当前神经负荷</span>
                  <span class="progress-value">{{ member.progress }}%</span>
                </div>
                <div class="progress-track" :class="{ 'working-track': isWorking(member) }">
                  <div class="progress-fill" :class="{ 'working-fill': isWorking(member) }" :style="{ width: member.progress + '%' }">
                    <div class="progress-stripe" v-if="isWorking(member)"></div>
                  </div>
                </div>
              </div>

              <div class="meta-details">
                <div class="meta-row">
                  <span class="meta-label">物理坐标</span>
                  <code class="meta-value path" :title="member.workspace">{{ member.workspace }}</code>
                </div>
                <div class="meta-row">
                  <span class="meta-label">已在线</span>
                  <span class="meta-value">{{ member.since }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- History -->
      <details class="history-accordion">
        <summary class="history-summary">
          <span class="summary-content">
            <svg viewBox="0 0 24 24" fill="none" class="icon">
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
            历史意识体归档 ({{ historyMembers.length }})
          </span>
          <svg viewBox="0 0 24 24" fill="none" class="chevron">
            <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </summary>
        <div class="history-content">
          <div v-for="member in historyMembers" :key="member.member" class="history-item">
            <div class="h-header">
              <strong class="h-name">{{ member.member }}</strong>
              <span class="h-agent">{{ member.agent }}</span>
            </div>
            <p class="h-task">{{ member.task }}</p>
            <div class="h-meta">
              <span>{{ member.since }}</span>
            </div>
          </div>
        </div>
      </details>
    </template>
  </div>
</template>

<style scoped>
.fleet-dashboard {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: var(--vp-font-family-base);
}

/* 🎨 核心变量与莫兰迪色系 */
.fleet-dashboard {
  --neon-brand: #9333ea; /* 紫色核心 */
  --neon-gold: #f59e0b;  /* 队长金 */
  --neon-cyan: #06b6d4;  /* 工作青 */
  --card-bg: var(--vp-c-bg-soft);
  --card-border: var(--vp-c-border);
  --text-main: var(--vp-c-text-1);
  --text-muted: var(--vp-c-text-2);
  --text-dim: var(--vp-c-text-3);

  --color-active: var(--vp-c-brand-1);
  --color-captain: #f59e0b;
  --color-queued: #64748b;
  --color-offline: #94a3b8;
}

.icon {
  width: 1.25em;
  height: 1.25em;
}

/* ===== Hero Section (玻璃拟态与流光) ===== */
.hero-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--card-border);
  border-radius: 20px;
  background: linear-gradient(135deg, var(--vp-c-bg-soft) 0%, var(--vp-c-bg-alt) 100%);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.1);
}

.hero-glow {
  position: absolute;
  top: -100px;
  right: -50px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.hero-kicker {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.2em;
  color: var(--neon-brand);
  margin-bottom: 8px;
  text-transform: uppercase;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #cbd5e1;
}

.live-dot.is-working {
  background-color: #22c55e;
  box-shadow: 0 0 12px #22c55e;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.6; }
  100% { transform: scale(1); opacity: 1; }
}

.hero-title {
  margin: 0 !important;
  font-size: 36px !important;
  font-weight: 900 !important;
  color: var(--text-main);
  letter-spacing: -0.03em;
  border: none !important;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid var(--card-border);
  padding: 16px;
  border-radius: 14px;
  transition: all 0.3s;
}

.summary-card:hover {
  transform: translateY(-3px);
  border-color: var(--neon-brand);
}

.summary-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--vp-c-default-soft);
}

.pulse-bg {
  animation: heartbeat-bg 2s infinite;
}

@keyframes heartbeat-bg {
  0% { background: rgba(147, 51, 234, 0.1); }
  50% { background: rgba(147, 51, 234, 0.3); }
  100% { background: rgba(147, 51, 234, 0.1); }
}

.summary-info .label { font-size: 12px; color: var(--text-muted); font-weight: 600; }
.summary-info .value { font-size: 22px; font-weight: 800; font-family: var(--vp-font-family-mono); }

/*指挥官卡片流光*/
.captain-special {
  border: 1px solid transparent;
  background: linear-gradient(var(--vp-c-bg-soft), var(--vp-c-bg-soft)) padding-box,
              linear-gradient(90deg, #f59e0b, #9333ea, #3b82f6) border-box;
}

/* ===== 节点矩阵 (3D Isometric 感) ===== */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 24px;
}

.member-card {
  position: relative;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--card-border);
  border-radius: 18px;
  padding: 24px;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: hidden;
}

.member-card:hover {
  transform: translateY(-8px) scale(1.01);
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.2);
}

.is-working {
  border-color: var(--neon-cyan);
}

/* 顶部工作流扫光 */
.working-flow {
  position: absolute;
  top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, var(--neon-cyan), transparent);
  animation: flow 2s linear infinite;
}

@keyframes flow {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.member-name { font-size: 20px !important; font-weight: 800 !important; margin: 0 !important; }

.badge {
  font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 5px; text-transform: uppercase;
}
.agent { background: #e2e8f0; color: #475569; }
.captain-badge { background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; }
.todo-badge { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }

.status-dot.pulse {
  background-color: var(--neon-cyan);
  box-shadow: 0 0 10px var(--neon-cyan);
  animation: pulse 1s infinite;
}

.task-box {
  background: rgba(0,0,0,0.02);
  border-radius: 12px; padding: 16px; margin: 16px 0;
  border: 1px solid rgba(0,0,0,0.05);
}

.working-label {
  font-size: 10px; color: var(--neon-cyan); font-weight: 800; 
  display: block; margin-bottom: 6px; animation: blink 1s infinite;
}

@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

.task-desc {
  font-family: var(--vp-font-family-mono); font-size: 13px; line-height: 1.6;
}

/* 进度条动画 */
.progress-track {
  height: 8px; background: #f1f5f9; border-radius: 10px; overflow: hidden; margin-top: 8px;
}

.progress-fill {
  height: 100%; background: #94a3b8; transition: width 1s ease; position: relative;
}

.working-fill {
  background: linear-gradient(90deg, #9333ea, #a855f7);
}

.progress-stripe {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background-image: linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent);
  background-size: 30px 30px;
  animation: stripe-move 1s linear infinite;
}

@keyframes stripe-move {
  0% { background-position: 0 0; }
  100% { background-position: 30px 0; }
}

.meta-value.path {
  background: #f8fafc; padding: 4px 10px; border-radius: 8px; font-size: 11px;
}

/* ===== 历史面板 (精简化) ===== */
.history-accordion {
  margin-top: 12px;
  background: var(--vp-c-bg-soft);
  border-radius: 16px;
  border: 1px dashed var(--card-border);
  overflow: hidden;
  transition: all 0.3s;
}

.history-accordion:hover {
  border-color: var(--neon-brand);
  background: var(--vp-c-bg-alt);
}

.history-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  cursor: pointer;
  user-select: none;
  list-style: none;
}

.history-summary::-webkit-details-marker {
  display: none;
}

.summary-content {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-muted);
}

.summary-content svg {
  width: 18px;
  height: 18px;
}

.chevron {
  width: 18px;
  height: 18px;
  color: var(--text-dim);
  transition: transform 0.3s ease;
}

details[open] .chevron {
  transform: rotate(180deg);
}

.history-content {
  padding: 0 24px 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.history-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  border: 1px solid var(--card-border);
  transition: all 0.2s;
}

.history-item:hover {
  border-color: var(--text-dim);
  transform: translateX(4px);
}

.h-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.h-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
}

.h-agent {
  font-size: 9px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #64748b;
  text-transform: uppercase;
}

.h-task {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-muted);
  font-family: var(--vp-font-family-mono);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.h-meta {
  font-size: 11px;
  color: var(--text-dim);
  font-family: var(--vp-font-family-mono);
}
</style>
