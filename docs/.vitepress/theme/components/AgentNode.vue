<script setup>
import { computed } from "vue";
import geminiIcon from "../assets/gemini.svg";
import claudeIcon from "../assets/claude.svg";
import codexIcon from "../assets/codex.svg";

const props = defineProps({
  member: {
    type: Object,
    required: true
  },
  idx: {
    type: Number,
    default: 0
  },
  completingTaskId: {
    type: String,
    default: ""
  }
});

const emit = defineEmits(["add-task", "make-captain", "kick-out", "complete-task"]);

const agentModels = {
  gemini: {
    icon: `<img src="${geminiIcon}" class="model-icon-img" alt="Gemini" />`,
    label: "Gemini 引擎",
    class: "mod-gemini"
  },
  claude: {
    icon: `<img src="${claudeIcon}" class="model-icon-img" alt="Claude" />`,
    label: "Claude 引擎",
    class: "mod-claude"
  },
  codex: {
    icon: `<img src="${codexIcon}" class="model-icon-img" alt="ChatGPT" />`,
    label: "ChatGPT / OpenAI",
    class: "mod-codex"
  },
  lobster: {
    icon: "🦞",
    label: "龙虾",
    class: "mod-lobster"
  }
};

function resolveAgentEngine(member) {
  const source = typeof member === "string" ? { agent: member } : (member || {});
  const agent = String(source.agent || source.agentName || "").toLowerCase();
  const alias = String(source.alias || "").toLowerCase();
  const workspace = String(source.workspace || "").toLowerCase();
  const memberId = String(source.member || source.memberId || "").toLowerCase();

  if (
    workspace.includes("/clawd") || workspace.endsWith("clawd") ||
    workspace.includes(".openclaw") || alias.includes("栖月") ||
    memberId.includes("lobster") || agent.includes("openclaw") || agent.includes("lobster")
  ) {
    return "lobster";
  }
  if (agent.includes("gemini")) return "gemini";
  if (agent.includes("claude")) return "claude";
  if (agent.includes("codex")) return "codex";
  return "lobster";
}

function getModelMeta(member) {
  return agentModels[resolveAgentEngine(member)] || agentModels.lobster;
}

function isIdleTask(task) {
  const text = String(task || "").trim().replace(/\s+/g, "");
  return ["", "待分配任务", "待分配", "待命状态", "待命", "空闲", "无任务", "心跳打卡"].includes(text);
}

function getMemberStateTag(member) {
  if (isIdleTask(member?.task)) return "待命";
  const text = String(member?.status || "").trim();
  if (text.includes("已离线")) return "已离线";
  if (text.includes("等待") || text.includes("待处理") || text.includes("待命")) return "待命";
  if (text.includes("执行中") || text.includes("队长锁")) return "执行中";
  return text || "在线";
}

function missionStatusClass(status) {
  const text = String(status || "").trim();
  if (text === "执行中") return "working";
  if (text === "待处理" || text === "待启动") return "pending";
  if (text === "已完成") return "done";
  return "unknown";
}

function taskHistoryStatusClass(task) {
  if (task?.isLive) return "live";
  return missionStatusClass(task?.status);
}

function getTaskHistoryStatusLabel(task) {
  if (task?.isLive) return "当前";
  return String(task?.status || "待启动").trim() || "待启动";
}

function formatTaskHistoryTime(task) {
  return String(task?.updatedAt || task?.publishedAt || "").trim() || "刚刚更新";
}

function getMemberRoleLabel(member) {
  const raw = String(member?.role || "").trim();
  if (!raw || raw === "未分配") return "";
  return raw.replace(/^队长[／/-]?/u, "").replace(/^舰队统帅[／/-]?/u, "").trim();
}

function isWorking(member) {
  return member.type === "active" && (member.progress > 0 || member.type === "active");
}

function canCompleteMemberTask(task) {
  return Boolean(String(task?.taskId || "").trim()) && String(task?.status || "").trim() !== "已完成";
}
</script>

<template>
  <div class="agent-glass-node"
    :class="{ 'is-working': isWorking(member), 'is-captain': member.isCaptain }"
    :style="{ '--delay': (idx + 3) * 0.1 + 's' }">

    <!-- 液体玻璃反光层 -->
    <div class="glass-glare"></div>
    <div class="glass-noise"></div>

    <div class="node-content">
      <div class="node-header">
        <div class="agent-identity">
          <div class="agent-logo-wrapper" :class="getModelMeta(member).class">
            <span class="alw-icon" v-if="getModelMeta(member).icon.includes('<')"
              v-html="getModelMeta(member).icon"></span>
            <span v-else class="emoji-icon">{{ getModelMeta(member).icon }}</span>
          </div>
          <div class="agent-info">
            <div class="agent-name-row">
              <h3 class="agent-name">{{ member.alias || member.member.split('(')[0] }}</h3>
              <!-- 引擎徽章 (Mini) -->
              <div class="engine-badge-mini" :class="getModelMeta(member).class" :title="getModelMeta(member).label">
                <span class="eb-icon" v-if="getModelMeta(member).icon.includes('<')"
                  v-html="getModelMeta(member).icon"></span>
                <span class="eb-icon" v-else>{{ getModelMeta(member).icon }}</span>
              </div>
            </div>
            <div class="agent-badges">
              <!-- 职位徽章 -->
              <span v-if="member.isCaptain" class="role-badge captain">👑 舰队统帅</span>
              <span v-else class="role-badge state">{{ getMemberStateTag(member) }}</span>
              <span v-if="getMemberRoleLabel(member)" class="role-badge duty">{{ getMemberRoleLabel(member) }}</span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <div class="action-menu">
            <button class="action-btn add-task" @click="emit('add-task', member)" title="给该成员新增任务">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <button class="action-btn make-captain" v-if="!member.isCaptain" @click="emit('make-captain', member)" title="调配为队长">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
            <button class="action-btn kick-out" @click="emit('kick-out', member)" title="移出矩阵">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="task-reveal-box">
        <div class="task-history-head">
          <span class="task-history-title-label">任务轨迹</span>
          <span class="task-history-count">{{ member.recentTasks?.length || 0 }}</span>
        </div>
        <div v-if="member.recentTasks?.length" class="task-history-scroll">
          <article v-for="taskItem in member.recentTasks" :key="taskItem.id" class="task-history-item">
            <div class="task-history-topline">
              <div class="task-history-topline-left">
                <span class="task-history-status" :class="taskHistoryStatusClass(taskItem)">
                  {{ getTaskHistoryStatusLabel(taskItem) }}
                </span>
                <button
                  v-if="canCompleteMemberTask(taskItem)"
                  class="task-complete-btn"
                  :disabled="completingTaskId === taskItem.taskId"
                  @click="emit('complete-task', member, taskItem)"
                  title="标记为完成"
                >
                  ✓ 结案
                </button>
              </div>
              <span class="task-history-time">{{ formatTaskHistoryTime(taskItem) }}</span>
            </div>
            <p class="task-history-name" :title="taskItem.title">{{ taskItem.title }}</p>
          </article>
        </div>
        <div v-else class="task-history-empty">暂无指派历史</div>
      </div>

      <div class="node-footer">
        <div class="load-bar-wrapper">
          <div class="load-labels">
            <span class="ll-left">神经网络载荷 ⚡️</span>
            <span class="ll-right">{{ member.progress > 0 ? (member.progress > 100 ? 100 : member.progress) : 0 }}%</span>
          </div>
          <div class="load-track">
            <div class="load-fill" :class="{ 'active': isWorking(member) }" :style="{ width: (member.progress > 100 ? 100 : Math.max(0, member.progress)) + '%' }"></div>
          </div>
        </div>
        <div class="node-meta">
          <span class="meta-item meta-item--workspace" :title="member.workspace">📍 {{ member.workspace }}</span>
          <div class="meta-divider"></div>
          <span class="meta-item">⏱ {{ member.since || '-' }}</span>
        </div>
      </div>
    </div>
    <div class="captain-crown" v-if="member.isCaptain">舰队指令长</div>
  </div>
</template>

<style scoped>
.agent-glass-node {
  position: relative;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(0, 0, 0, 0.6) 100%);
  backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255, 255, 255, 0.04);
  box-shadow: inset 1px 1px 1px rgba(255, 255, 255, 0.1), 0 12px 40px rgba(0, 0, 0, 0.5);
  border-radius: 24px;
  padding: 24px;
  transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  overflow: hidden;
  animation: slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-delay: var(--delay, 0s);
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

.agent-glass-node:hover {
  transform: translateY(-6px);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(0, 0, 0, 0.7) 100%);
  border-color: rgba(245, 200, 123, 0.3);
  box-shadow: inset 1px 1px 1px rgba(255, 255, 255, 0.15), inset 0 0 40px rgba(245, 200, 123, 0.06), 0 20px 50px -12px rgba(0, 0, 0, 0.8);
}

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
  margin-bottom: 20px;
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

.action-btn svg { width: 14px; height: 14px; }

.action-btn.make-captain:hover {
  background: rgba(245, 200, 123, 0.1);
  border-color: var(--c-aureate-glow);
  color: var(--c-aureate-glow);
  box-shadow: 0 0 15px rgba(245, 200, 123, 0.2);
}

.action-btn.add-task:hover {
  background: rgba(125, 229, 173, 0.1);
  border-color: rgba(125, 229, 173, 0.35);
  color: #a7f0ca;
  box-shadow: 0 0 15px rgba(125, 229, 173, 0.16);
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
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.agent-logo-wrapper {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  aspect-ratio: 1 / 1;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.8));
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(245, 200, 123, 0.4);
  border-radius: 14px;
  box-shadow: inset 0 4px 10px rgba(0, 0, 0, 0.8), 0 4px 12px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
  overflow: hidden;
}

.agent-logo-wrapper svg,
.agent-logo-wrapper img {
  width: 28px;
  height: 28px;
  display: block;
  object-fit: contain;
  object-position: center;
}

.agent-logo-wrapper.mod-codex svg,
.agent-logo-wrapper.mod-codex img,
.engine-badge-mini.mod-codex svg {
  color: white !important;
  fill: white !important;
  filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.4));
}

.alw-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.is-working .agent-logo-wrapper {
  color: #fff;
  filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.5));
  animation: logo-breathe 3s infinite ease-in-out;
}

@keyframes logo-breathe {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
}

.node-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.agent-info {
  min-width: 0;
  flex: 1;
}

.agent-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agent-name {
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  color: #ffffff;
  letter-spacing: 0.02em;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
}

.agent-badges {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.role-badge {
  font-size: 9px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 999px;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
}

.role-badge.captain {
  background: rgba(245, 200, 123, 0.15);
  border: 1px solid rgba(245, 200, 123, 0.3);
  color: var(--c-aureate-glow, #f8d79a);
  box-shadow: 0 0 10px rgba(245, 200, 123, 0.1);
}

.role-badge.state {
  background: rgba(100, 150, 255, 0.1);
  border: 1px solid rgba(100, 150, 255, 0.2);
  color: #a0c0ff;
}

.role-badge.duty {
  background: rgba(125, 229, 173, 0.1);
  border: 1px solid rgba(125, 229, 173, 0.22);
  color: #a7f0ca;
}

.engine-badge-mini {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  flex-shrink: 0;
  cursor: help;
}

.eb-icon {
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.eb-icon svg,
.eb-icon img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

.eb-icon.emoji { font-size: 10px; }

.engine-badge-mini.mod-gemini {
  background: rgba(66, 133, 244, 0.15);
  border-color: rgba(66, 133, 244, 0.3);
  color: #8ab4f8;
}

.engine-badge-mini.mod-claude {
  background: rgba(217, 119, 87, 0.15);
  border-color: rgba(217, 119, 87, 0.3);
  color: #ffb89e;
}

.engine-badge-mini.mod-codex {
  background: rgba(30, 215, 96, 0.15);
  border-color: rgba(30, 215, 96, 0.3);
  color: #8affc1;
}

.engine-badge-mini.mod-codex img,
.engine-badge-mini.mod-codex svg { filter: brightness(0) invert(1); }

.engine-badge-mini.mod-lobster {
  background: rgba(255, 50, 50, 0.15);
  border-color: rgba(255, 50, 50, 0.4);
  color: #ff6b6b;
  box-shadow: 0 0 15px rgba(255, 50, 50, 0.2);
}

.emoji-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  line-height: 1;
}

.task-reveal-box {
  background: rgba(0, 0, 0, 0.24);
  border: 1px solid rgba(255, 255, 255, 0.035);
  box-shadow: inset 0 4px 10px rgba(0, 0, 0, 0.38);
  padding: 12px 14px;
  border-radius: 14px;
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 0 0 208px;
  height: 208px;
  min-height: 208px;
}

.task-history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.task-history-title-label {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.42);
}

.task-history-count {
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.task-history-scroll {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.task-history-scroll::-webkit-scrollbar { width: 4px; }
.task-history-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
}

.task-history-item {
  padding: 9px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.028);
  border: 1px solid rgba(255, 255, 255, 0.04);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-history-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.task-history-topline-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.task-history-status {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.task-history-status.live,
.task-history-status.working { color: #f5c87b; background: rgba(245, 200, 123, 0.12); }
.task-history-status.pending { color: rgba(255, 255, 255, 0.72); background: rgba(255, 255, 255, 0.08); }
.task-history-status.done { color: #74d49b; background: rgba(116, 212, 155, 0.12); }
.task-history-status.unknown { color: rgba(255, 255, 255, 0.58); background: rgba(255, 255, 255, 0.05); }

.task-history-time { flex-shrink: 0; font-size: 10px; color: rgba(255, 255, 255, 0.36); }

.task-complete-btn {
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid rgba(125, 229, 173, 0.22);
  background: rgba(125, 229, 173, 0.08);
  color: #a7f0ca;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-complete-btn:hover:not(:disabled) {
  border-color: rgba(125, 229, 173, 0.4);
  background: rgba(125, 229, 173, 0.14);
}
.task-complete-btn:disabled { opacity: 0.5; cursor: wait; }

.task-history-name {
  font-size: 12px;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.78);
  margin: 0;
  font-weight: 500;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-history-empty {
  flex: 1;
  min-height: 0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.025);
  border: 1px dashed rgba(255, 255, 255, 0.06);
}

.node-footer { display: flex; flex-direction: column; gap: 12px; margin-top: auto; }

.load-bar-wrapper { display: flex; flex-direction: column; gap: 12px; }

.load-labels { display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #888; letter-spacing: 0.05em; }

.load-track { height: 4px; background: rgba(255, 255, 255, 0.05); border-radius: 100px; overflow: hidden; }

.load-fill { height: 100%; background: #333; transition: width 1s cubic-bezier(0.2, 0.8, 0.2, 1); }

.load-fill.active { background: var(--c-aureate-glow, #f8d79a); box-shadow: 0 0 12px rgba(245, 200, 123, 0.5); position: relative; }
.load-fill.active::after {
  content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
  animation: pulse-slide 2s linear infinite;
}

@keyframes pulse-slide { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
@keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.is-captain .load-fill { background: var(--c-aureate-glow, #f8d79a); box-shadow: 0 0 20px rgba(245, 200, 123, 0.8); }

.node-meta {
  display: flex; align-items: center; gap: 10px; width: fit-content; max-width: 100%; padding: 7px 11px;
  border-radius: 999px; border: 1px solid rgba(255, 255, 255, 0.05); background: rgba(255, 255, 255, 0.025);
  backdrop-filter: blur(10px); font-size: 9px; color: rgba(255, 255, 255, 0.46); font-family: ui-monospace; letter-spacing: 0.07em;
}

.meta-item { white-space: nowrap; }
.meta-item--workspace { max-width: 140px; overflow: hidden; text-overflow: ellipsis; }
.meta-divider { width: 1px; height: 10px; background: rgba(255, 255, 255, 0.08); }

.captain-crown {
  position: absolute; top: 0; right: 0; background: linear-gradient(135deg, var(--c-aureate-glow, #f8d79a), var(--c-aureate-dim, #d4a35c));
  color: #000; padding: 6px 16px; font-size: 11px; font-weight: 800; letter-spacing: 0.1em;
  border-bottom-left-radius: 16px; box-shadow: 0 4px 12px rgba(245, 200, 123, 0.2);
}

@media (max-width: 1024px) {
  .agent-glass-node { min-height: auto; }
  .task-reveal-box { flex-basis: 208px; height: 208px; min-height: 208px; }
}
</style>
