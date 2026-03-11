<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import geminiIcon from "../assets/gemini.svg";
import claudeIcon from "../assets/claude.svg";
import codexIcon from "../assets/codex.svg";

const loading = ref(true);
const error = ref("");
const currentTime = ref(new Date());
const realtimeStatus = ref("连接中");
const showTaskCreator = ref(false);
const loadingWorkspaces = ref(false);
const creatingTask = ref(false);
const workspaceOptions = ref([]);
const createTaskForm = ref({
  title: "",
  workspace: "",
  priority: "未标注"
});
let timeInterval = null;
let reconnectTimer = null;
let eventSource = null;

const isWorkspaceSelectOpen = ref(false);
const isPrioritySelectOpen = ref(false);

const closeDropdowns = () => {
  isWorkspaceSelectOpen.value = false;
  isPrioritySelectOpen.value = false;
};

const data = ref({
  generatedAt: "",
  total: 0,
  active: 0,
  offline: 0,
  queued: 0,
  environment: {},
  version: 'v5.7.1-local',
  members: [],
  missions: []
});

// 顶级官方 Logo 路径与元数据 (Local Assets Version)
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
  const source = typeof member === "string"
    ? { agent: member }
    : (member || {});
  const agent = String(source.agent || source.agentName || "").toLowerCase();
  const alias = String(source.alias || "").toLowerCase();
  const workspace = String(source.workspace || "").toLowerCase();
  const memberId = String(source.member || source.memberId || "").toLowerCase();

  if (
    workspace.includes("/clawd") ||
    workspace.endsWith("clawd") ||
    workspace.includes(".openclaw") ||
    alias.includes("栖月") ||
    memberId.includes("lobster") ||
    agent.includes("openclaw") ||
    agent.includes("lobster")
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

function missionStatusClass(status) {
  const text = String(status || "").trim();
  if (text === "执行中") return "working";
  if (text === "待处理") return "pending";
  if (text === "待启动") return "pending";
  if (text === "已完成") return "done";
  return "unknown";
}

function isIdleTask(task) {
  const text = String(task || "").trim().replace(/\s+/g, "");
  return [
    "",
    "待分配任务",
    "待分配",
    "待命状态",
    "待命",
    "空闲",
    "无任务",
    "心跳打卡"
  ].includes(text);
}

function getMemberStateTag(member) {
  if (isIdleTask(member?.task)) return "待命";
  const text = String(member?.status || "").trim();
  if (text.includes("已离线")) return "已离线";
  if (text.includes("等待") || text.includes("待处理") || text.includes("待命")) return "待命";
  if (text.includes("执行中") || text.includes("队长锁")) return "执行中";
  return text || "在线";
}

function getMemberRoleLabel(member) {
  const raw = String(member?.role || "").trim();
  if (!raw || raw === "未分配") return "";
  return raw
    .replace(/^队长[／/-]?/u, "")
    .replace(/^舰队统帅[／/-]?/u, "")
    .trim();
}

const currentMembers = computed(() =>
  data.value.members.filter((m) => m.type === "active" || m.type === "queued" || m.type === "offline")
);
const currentWorkspaceName = computed(() => {
  const current = workspaceOptions.value.find((item) => item.workspace === createTaskForm.value.workspace);
  return current?.name || "";
});

let requestId = 0;
const actionEndpoint = 'http://127.0.0.1:18790/api/fleet/action';
const stateEndpoint = 'http://127.0.0.1:18790/api/fleet/state';
const eventsEndpoint = 'http://127.0.0.1:18790/api/fleet/events';
const workspacesEndpoint = 'http://127.0.0.1:18790/api/fleet/workspaces';
const RECONNECT_DELAY = 3000;

function memberStatusToType(status, fallback = "active") {
  const text = String(status || "").trim();
  if (text.includes("已离线")) return "offline";
  if (text.includes("等待")) return "queued";
  if (text.includes("执行中") || text.includes("队长锁")) return "active";
  return fallback;
}

function memberStatusToProgress(status, isCaptain) {
  if (isCaptain) return 60;
  const type = memberStatusToType(status);
  if (type === "offline") return 100;
  if (type === "queued") return 5;
  return 55;
}

function getMissionStatus(member) {
  const type = memberStatusToType(member.status, member.type);
  if (type === "queued") return "待处理";
  if (type === "offline") return "已离线";
  return "执行中";
}

function normalizeBridgeState(state) {
  const sourceMembers = Array.isArray(state?.members)
    ? state.members
    : Array.isArray(state?.agents)
      ? state.agents.map((agent) => ({
        member: agent.memberId,
        alias: agent.alias,
        agent: agent.agentName,
        role: agent.role,
        workspace: agent.workspace,
        task: agent.task,
        since: agent.heartbeatAt || agent.updatedAt || "-",
        status: agent.status,
        type: agent.type || memberStatusToType(agent.status),
        progress: memberStatusToProgress(agent.status, agent.isCaptain),
        isCaptain: Boolean(agent.isCaptain)
      }))
      : [];

  const members = sourceMembers.map((member) => ({
    member: member.member || member.memberId,
    alias: member.alias,
    agent: member.agent || member.agentName,
    role: member.role,
    workspace: member.workspace || '-',
    task: member.task,
    since: member.since || member.heartbeatAt || member.updatedAt || "-",
    status: member.status,
    type: member.type || memberStatusToType(member.status),
    progress: member.progress ?? memberStatusToProgress(member.status, member.isCaptain),
    isCaptain: Boolean(member.isCaptain)
  }));

  const missions = Array.isArray(state?.missions)
    ? state.missions.slice(0, 6).map((task, index) => ({
      id: task.id || `任务-${String(index + 1).padStart(2, "0")}`,
      title: task.title || task.taskId || `任务-${String(index + 1).padStart(2, "0")}`,
      status: task.status || '待启动',
      owner: task.owner || task.assignee || '待分配',
      assigneeAgent: task.assigneeAgent || '',
      assigneeRole: task.assigneeRole || '',
      workspace: task.workspace || '',
      publishedAt: task.publishedAt || ''
    }))
    : [];

  return {
    generatedAt: state?.generatedAt || "",
    source: state?.source || data.value.source || '',
    version: state?.version || data.value.version,
    environment: state?.environment || data.value.environment || {},
    total: state?.total ?? members.length,
    active: state?.active ?? members.filter((member) => member.type === "active").length,
    offline: state?.offline ?? members.filter((member) => member.type === "offline").length,
    queued: state?.queued ?? members.filter((member) => member.type === "queued").length,
    members,
    missions
  };
}

async function loadData() {
  const currentRequestId = ++requestId;
  if (!data.value.generatedAt) loading.value = true;
  try {
    const bridgeResponse = await fetch(stateEndpoint, { cache: "no-store" });
    if (!bridgeResponse.ok) throw new Error("bridge-state-failed");
    const payload = await bridgeResponse.json();
    const json = normalizeBridgeState(payload.state || {});
    if (currentRequestId !== requestId) return;
    data.value = { ...data.value, ...json };
    realtimeStatus.value = "在线"
    error.value = ""
  } catch (e) {
    if (currentRequestId !== requestId) return;
    error.value = "本地 AI Team bridge 未连接"
    realtimeStatus.value = "断线"
  } finally {
    if (currentRequestId === requestId) loading.value = false;
  }
}

function clearRealtimeTimers() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function disconnectRealtime() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
}

function scheduleRealtimeReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    connectRealtime();
  }, RECONNECT_DELAY);
}

function connectRealtime() {
  disconnectRealtime();
  clearRealtimeTimers();
  realtimeStatus.value = "连接中";

  const source = new EventSource(eventsEndpoint);
  eventSource = source;

  source.addEventListener("ready", () => {
    realtimeStatus.value = "在线";
    error.value = "";
  });

  source.addEventListener("state", (event) => {
    try {
      const payload = JSON.parse(event.data || "{}");
      if (payload.state) {
        applyBridgeState(payload.state);
        loading.value = false;
        realtimeStatus.value = "在线";
        error.value = "";
      }
    } catch (e) {
      console.error("Failed to parse fleet SSE payload", e);
    }
  });

  source.onerror = async () => {
    realtimeStatus.value = "断线";
    disconnectRealtime();
    await loadData();
    scheduleRealtimeReconnect();
  };
}

function handleVisibilityRefresh() {
  if (!document.hidden) {
    loadData();
    if (!eventSource) connectRealtime();
  }
}

onMounted(() => {
  loadData();
  connectRealtime();
  window.addEventListener("focus", handleVisibilityRefresh);
  document.addEventListener("visibilitychange", handleVisibilityRefresh);

  timeInterval = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
});

onBeforeUnmount(() => {
  if (timeInterval) clearInterval(timeInterval);
  disconnectRealtime();
  clearRealtimeTimers();
  window.removeEventListener("focus", handleVisibilityRefresh);
  document.removeEventListener("visibilitychange", handleVisibilityRefresh);
});

function isWorking(member) {
  return member.type === "active" && (member.progress > 0 || member.type === "active");
}

function getStatusText(status) {
  const map = { 'WORKING': '执行中', 'PENDING': '待处理', 'DONE': '已完成' };
  return map[status?.toUpperCase()] || status;
}

function applyBridgeState(state) {
  data.value = {
    ...data.value,
    ...normalizeBridgeState(state || {})
  };
}

async function loadWorkspaces() {
  loadingWorkspaces.value = true;
  try {
    const response = await fetch(workspacesEndpoint, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("激活工作区拉取失败");
    }
    const payload = await response.json().catch(() => ({}));
    workspaceOptions.value = Array.isArray(payload.workspaces) ? payload.workspaces : [];
    if (!createTaskForm.value.workspace && workspaceOptions.value.length > 0) {
      createTaskForm.value.workspace = workspaceOptions.value[0].workspace || workspaceOptions.value[0].rootPath || "";
    }
  } catch (e) {
    error.value = e.message || "激活工作区拉取失败";
  } finally {
    loadingWorkspaces.value = false;
  }
}

async function openTaskCreator() {
  showTaskCreator.value = true;
  error.value = "";
  if (workspaceOptions.value.length === 0) {
    await loadWorkspaces();
  }
}

function closeTaskCreator() {
  showTaskCreator.value = false;
  createTaskForm.value = {
    title: "",
    workspace: workspaceOptions.value[0]?.workspace || "",
    priority: "未标注"
  };
}

async function submitTask() {
  if (!createTaskForm.value.title.trim()) {
    error.value = "任务标题不能为空";
    return;
  }
  if (!createTaskForm.value.workspace.trim()) {
    error.value = "请选择工作区";
    return;
  }

  creatingTask.value = true;
  error.value = "";
  try {
    const response = await fetch(actionEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create-task",
        title: createTaskForm.value.title.trim(),
        workspace: createTaskForm.value.workspace.trim(),
        priority: createTaskForm.value.priority
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "任务发布失败");
    }
    if (payload.state) {
      applyBridgeState(payload.state);
    } else {
      await loadData();
    }
    closeTaskCreator();
  } catch (e) {
    error.value = e.message || "任务发布失败";
  } finally {
    creatingTask.value = false;
  }
}

async function removeMember(member) {
  const previousMembers = data.value.members.map((item) => ({ ...item }));

  // Optimistic UI Update
  data.value.members = data.value.members.filter(m => m.member !== member.member);
  try {
    const response = await fetch(actionEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "kick-out", memberId: member.member })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "移出节点失败");
    }
    const payload = await response.json().catch(() => ({}));
    if (payload.state) applyBridgeState(payload.state);
    else await loadData();
  } catch (e) {
    data.value.members = previousMembers;
    error.value = e.message || "移出节点失败";
    console.error("Failed to kick out member", e);
  }
}

async function makeCaptain(member) {
  const previousMembers = data.value.members.map((item) => ({ ...item }));

  // Optimistic UI Update
  data.value.members.forEach(m => {
    if (m.member === member.member) {
      m.isCaptain = true;
    } else {
      m.isCaptain = false;
    }
  });

  try {
    const response = await fetch(actionEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "make-captain", memberId: member.member })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "移交最高指令失败");
    }
    const payload = await response.json().catch(() => ({}));
    if (payload.state) applyBridgeState(payload.state);
    else await loadData();
  } catch (e) {
    data.value.members = previousMembers;
    error.value = e.message || "移交最高指令失败";
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
        <div class="hud-main-title">
          星际舰队中枢
          <span class="hud-divider">//</span>
          <span class="hud-version-badge">V5</span>
        </div>
      </div>
      <div class="hud-center">
        <div class="live-status">
          <div class="live-scanner"></div>
          <span class="live-text">监控运行中</span>
        </div>
      </div>
      <div class="hud-right">
        <div class="quantum-clock">
          <span class="q-time q-hour">{{ currentTime.getHours().toString().padStart(2, '0') }}</span>
          <span class="q-colon">:</span>
          <span class="q-time q-minute">{{ currentTime.getMinutes().toString().padStart(2, '0') }}</span>
          <span class="q-colon">:</span>
          <span class="q-time q-second">{{ currentTime.getSeconds().toString().padStart(2, '0') }}</span>
        </div>
      </div>
    </header>

    <template v-if="!loading">
      <div class="aether-stage">
        <!-- 3. 作战清单 (Mission Flow) -->
        <aside class="mission-flow">
          <div class="flow-header">
            <span>任务队列</span>
            <button class="task-create-trigger" @click="openTaskCreator" title="发布任务">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
          <div class="flow-container">
            <div v-for="(task, idx) in data.missions" :key="task.id" class="mission-glass-card"
              :style="{ '--delay': idx * 0.1 + 's' }">
              <div class="card-edge"></div>
              <div class="m-top">
                <span class="m-id">{{ task.id }}</span>
                <div class="m-status-badge" :class="missionStatusClass(task.status)">
                  <span class="status-dot"></span>
                  {{ task.status }}
                </div>
              </div>
              <p class="m-title hover-expand">{{ task.title }}</p>
              <div class="m-owner">
                <span class="text-ellipsis owner-name" :title="task.owner">{{ task.owner }}</span>
                <span v-if="(task.assigneeAgent || task.assigneeRole) && (task.assigneeAgent !== task.owner)" class="m-owner-meta text-ellipsis" :title="[task.assigneeAgent, task.assigneeRole].filter(Boolean).join(' / ')">
                  {{ [task.assigneeAgent, task.assigneeRole].filter(Boolean).join(' / ') }}
                </span>
                <span v-else-if="task.assigneeRole" class="m-owner-meta text-ellipsis" :title="task.assigneeRole">
                  {{ task.assigneeRole }}
                </span>
              </div>
              <div v-if="task.workspace" class="m-published-at hover-expand">工作路径 {{ task.workspace }}</div>
              <div v-if="task.publishedAt" class="m-published-at text-ellipsis" :title="'发布时间 ' + task.publishedAt">发布时间 {{ task.publishedAt }}</div>
            </div>
            <div v-if="data.missions.length === 0" class="mission-empty-state">
              <div>当前任务池为空</div>
              <div>点击左上角 + 发布任务</div>
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
                    <div class="agent-logo-wrapper" :class="getModelMeta(member).class">
                      <span class="alw-icon" v-if="getModelMeta(member).icon.includes('<')"
                        v-html="getModelMeta(member).icon"></span>
                      <span v-else class="emoji-icon">{{ getModelMeta(member).icon }}</span>
                    </div>
                    <div class="agent-info">
                      <h3 class="agent-name">{{ member.alias || member.member.split('(')[0] }}</h3>
                      <div class="agent-badges">
                        <!-- 职位徽章 -->
                        <span v-if="member.isCaptain" class="role-badge captain">👑 舰队统帅</span>
                        <span v-else class="role-badge state">{{ getMemberStateTag(member) }}</span>
                        <span v-if="getMemberRoleLabel(member)" class="role-badge duty">🎯 {{ getMemberRoleLabel(member) }}</span>

                        <!-- 引擎徽章 -->
                        <div class="engine-badge" :class="getModelMeta(member).class">
                          <span class="eb-icon" v-if="getModelMeta(member).icon.includes('<')"
                            v-html="getModelMeta(member).icon"></span>
                          <span class="eb-icon" v-else>{{ getModelMeta(member).icon }}</span>
                          <span class="eb-label">{{ getModelMeta(member).label }}</span>
                        </div>
                      </div>
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

      <!-- 5. 可视化工具链健康状态栏 (CLI Health Footer) -->
      <footer class="cli-health-footer">
        <div class="footer-glass-blur"></div>
        <div class="footer-container">
          <div class="health-group">
            <span class="health-label">核心链路体检:</span>
            <div class="health-items">
              <div v-for="(status, key) in data.environment?.tools" :key="key" class="health-item"
                :class="status?.status">
                <span class="h-dot"></span>
                <span class="h-name">{{ key.toUpperCase() }}</span>
                <!-- 🧪 Tooltip 气泡 -->
                <div v-if="status?.status === 'offline'" class="h-tooltip">
                  <div class="h-tooltip-arrow"></div>
                  {{ status.reason }}
                </div>
              </div>
            </div>
          </div>

          <div class="footer-system-stats" v-if="data.environment">
            <div class="stat-item">
              <span class="stat-label">📦 SKILLS:</span>
              <span class="stat-value">{{ data.environment.skillsCount || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">🚀 NODE:</span>
              <span class="stat-value">{{ data.environment.nodeVersion || '--' }}</span>
            </div>
          </div>

          <div class="footer-meta">
            <span class="sync-info">实时通道: SSE · {{ realtimeStatus }}</span>
            <span class="version-tag">{{ data.version || 'V5.6.5' }}</span>
          </div>
        </div>
      </footer>

      <div v-if="showTaskCreator" class="task-creator-backdrop" @click.self="closeTaskCreator">
        <div class="task-creator-panel">
          <div class="task-creator-header">
            <div>
              <div class="task-creator-kicker">任务发布</div>
              <h3>发布到真实任务池</h3>
            </div>
            <button class="task-creator-close" @click="closeTaskCreator" title="关闭">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <label class="task-field">
            <span class="task-field-label">任务标题</span>
            <input
              v-model="createTaskForm.title"
              type="text"
              class="task-field-input"
              placeholder="输入任务标题"
              @keyup.enter="submitTask"
            />
          </label>

          <div class="task-field">
            <span class="task-field-label">工作区</span>
            <div class="custom-select-container">
              <div class="task-field-input custom-select-trigger" :class="{ 'is-open': isWorkspaceSelectOpen }" @click="isWorkspaceSelectOpen = !isWorkspaceSelectOpen; isPrioritySelectOpen = false">
                <span class="cs-value text-ellipsis">{{ currentWorkspaceName ? `${currentWorkspaceName} ｜ ${createTaskForm.workspace}` : (loadingWorkspaces ? '正在加载激活工作区...' : '请选择工作区') }}</span>
              </div>
              <transition name="dropdown">
                <div class="custom-options-panel" v-if="isWorkspaceSelectOpen">
                  <div class="custom-option"
                    v-for="workspace in workspaceOptions"
                    :key="workspace.workspace || workspace.rootPath"
                    :class="{ 'is-selected': createTaskForm.workspace === (workspace.workspace || workspace.rootPath) }"
                    @click="createTaskForm.workspace = workspace.workspace || workspace.rootPath; isWorkspaceSelectOpen = false"
                  >
                    <div class="co-name">{{ workspace.name }}</div>
                    <div class="co-path text-ellipsis">{{ workspace.workspace || workspace.rootPath }}</div>
                  </div>
                  <div v-if="workspaceOptions.length === 0" class="custom-option disabled">
                    暂无已激活工作区
                  </div>
                </div>
              </transition>
            </div>
            <span class="task-field-hint">只有已激活工作区才能发布任务</span>
          </div>

          <div class="task-field">
            <span class="task-field-label">优先级</span>
            <div class="custom-select-container">
              <div class="task-field-input custom-select-trigger" :class="{ 'is-open': isPrioritySelectOpen }" @click="isPrioritySelectOpen = !isPrioritySelectOpen; isWorkspaceSelectOpen = false">
                <span class="cs-value">{{ createTaskForm.priority }}</span>
              </div>
              <transition name="dropdown">
                <div class="custom-options-panel slim-panel" v-if="isPrioritySelectOpen">
                  <div class="custom-option center-item"
                    v-for="p in ['未标注', '高', '中', '低']"
                    :key="p"
                    :class="{ 'is-selected': createTaskForm.priority === p }"
                    @click="createTaskForm.priority = p; isPrioritySelectOpen = false"
                  >
                    {{ p }}
                  </div>
                </div>
              </transition>
            </div>
          </div>

          <div v-if="createTaskForm.workspace" class="task-workspace-preview">
            <span class="task-workspace-name">{{ currentWorkspaceName || '已选工作区' }}</span>
            <span class="task-workspace-path">{{ createTaskForm.workspace }}</span>
          </div>

          <div class="task-creator-actions">
            <button class="task-secondary-btn" @click="closeTaskCreator">取消</button>
            <button class="task-primary-btn" @click="submitTask" :disabled="creatingTask || loadingWorkspaces">
              {{ creatingTask ? '发布中...' : '发布任务' }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- 加载动画 -->
    <div v-if="loading" class="aether-loading">
      <div class="aether-spinner"></div>
      <div class="aether-text">系统底层金丝直连初始化...</div>
    </div>

    <div v-if="error" class="action-error-banner">{{ error }}</div>
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

.action-error-banner {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 300;
  max-width: min(420px, calc(100vw - 32px));
  padding: 12px 16px;
  border: 1px solid rgba(255, 102, 102, 0.35);
  border-radius: 14px;
  background: rgba(35, 10, 10, 0.9);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.32);
  color: #ffd9d9;
  font-size: 13px;
  line-height: 1.5;
  backdrop-filter: blur(14px);
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

.hud-group {
  display: flex;
  align-items: center;
}

.hud-main-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #fff;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
}

.hud-divider {
  color: var(--c-aureate-dim);
  font-family: ui-monospace, sans-serif;
  font-size: 16px;
  opacity: 0.5;
}

.hud-version-badge {
  background: linear-gradient(135deg, rgba(212, 174, 94, 0.2), rgba(212, 174, 94, 0.05));
  border: 1px solid var(--c-aureate-glow);
  box-shadow: inset 0 0 10px rgba(245, 200, 123, 0.2), 0 0 15px rgba(245, 200, 123, 0.15);
  color: var(--c-aureate-glow);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0.15em;
  font-family: ui-monospace, sans-serif;
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

/* ⏱ Quantum Clock */
.quantum-clock {
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(139, 115, 71, 0.4);
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.8), 0 4px 12px rgba(0, 0, 0, 0.4);
  padding: 6px 12px;
  border-radius: 8px;
  font-family: ui-monospace, 'Courier New', monospace;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.q-time {
  color: #fafafa;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.q-second {
  color: var(--c-aureate-base);
  text-shadow: 0 0 10px rgba(212, 174, 94, 0.4);
}

.q-colon {
  color: var(--c-aureate-dim);
  animation: blink 1s step-end infinite;
  margin: 0 2px;
}

@keyframes blink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.3;
  }
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

/* ⏱ Quantum Clock */
.quantum-clock {
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(139, 115, 71, 0.4);
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.8), 0 4px 12px rgba(0, 0, 0, 0.4);
  padding: 6px 12px;
  border-radius: 8px;
  font-family: ui-monospace, 'Courier New', monospace;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.q-time {
  color: #fafafa;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.q-second {
  color: var(--c-aureate-base);
  text-shadow: 0 0 10px rgba(212, 174, 94, 0.4);
}

.q-colon {
  color: var(--c-aureate-dim);
  animation: blink 1s step-end infinite;
  margin: 0 2px;
}

@keyframes blink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.3;
  }
}

/* 🎭 布局层 */
.aether-stage {
  display: flex;
  flex: 1;
  padding: 24px 24px 160px 24px;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: #888;
  letter-spacing: 0.1em;
  padding-left: 8px;
}

.task-create-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(245, 200, 123, 0.22);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--c-aureate-base);
  cursor: pointer;
  transition: all 0.25s ease;
}

.task-create-trigger:hover {
  border-color: rgba(245, 200, 123, 0.45);
  background: rgba(245, 200, 123, 0.08);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
}

.task-create-trigger svg {
  width: 16px;
  height: 16px;
}

.flow-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mission-glass-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0.5) 100%);
  backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255, 255, 255, 0.04);
  box-shadow: inset 1px 1px 1px rgba(255, 255, 255, 0.08), 0 8px 24px rgba(0, 0, 0, 0.6);
  padding: 12px 16px;
  border-radius: 10px;
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
  margin-bottom: 6px;
}

.m-id {
  font-size: 11px;
  font-weight: 800;
  color: #666;
  letter-spacing: 0.1em;
}

.m-status-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #aaa;
  letter-spacing: 0.05em;
}

.m-status-badge.working {
  background: rgba(245, 200, 123, 0.1);
  border-color: rgba(245, 200, 123, 0.3);
  color: var(--c-aureate-base);
}

.m-status-badge.pending {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: #ddd;
}

.m-status-badge.done {
  background: rgba(107, 214, 163, 0.12);
  border-color: rgba(107, 214, 163, 0.28);
  color: #8ce0b7;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 6px currentColor;
}

.m-title {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 10px 0;
  line-height: 1.3;
  letter-spacing: 0.02em;
}

.m-owner {
  font-size: 10px;
  color: #777;
  font-family: ui-monospace;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  width: 100%;
}

.owner-name {
  flex-shrink: 0;
  max-width: 50%;
}

.m-owner-meta {
  font-size: 9px;
  color: #6a6a6a;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  padding-left: 8px;
  flex: 1;
}

.m-published-at {
  font-size: 9px;
  color: #6a6a6a;
  font-family: ui-monospace;
  margin-bottom: 4px;
}

.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.hover-expand {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
  white-space: normal;
  transition: max-height 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.m-title.hover-expand {
  max-height: 17px;
}

.m-published-at.hover-expand {
  max-height: 12px;
}

.mission-glass-card:hover .hover-expand {
  -webkit-line-clamp: 20;
  max-height: 150px;
}

.mission-empty-state {
  padding: 18px 16px;
  border: 1px dashed rgba(245, 200, 123, 0.22);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.02);
  color: #9a9a9a;
  font-size: 12px;
  line-height: 1.7;
}

.task-creator-backdrop {
  position: fixed;
  inset: 0;
  z-index: 260;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(5, 7, 10, 0.72);
  backdrop-filter: blur(14px);
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.task-creator-panel {
  width: min(560px, calc(100vw - 32px));
  padding: 24px 28px;
  border: 1px solid rgba(245, 200, 123, 0.15);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(20, 24, 32, 0.95), rgba(10, 12, 16, 0.98));
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.1);
  animation: scaleUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  0% { opacity: 0; backdrop-filter: blur(0px); }
  100% { opacity: 1; backdrop-filter: blur(14px); }
}

@keyframes scaleUp {
  0% { transform: scale(0.95) translateY(10px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

.task-creator-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.task-creator-kicker {
  margin-bottom: 6px;
  color: var(--c-aureate-dim);
  font-size: 11px;
  letter-spacing: 0.14em;
}

.task-creator-header h3 {
  margin: 0;
  font-size: 22px;
  color: #fff;
}

.task-creator-close {
  width: 34px;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  color: #cfcfcf;
  cursor: pointer;
}

.task-creator-close svg {
  width: 16px;
  height: 16px;
}

.task-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.task-field-label {
  color: #d6d6d6;
  font-size: 13px;
}

.task-field-input {
  width: 100%;
  min-height: 48px;
  padding: 0 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  color: #fff;
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.task-field-input:hover {
  background: rgba(255, 255, 255, 0.05);
}

.task-field-input:focus {
  border-color: rgba(245, 200, 123, 0.5);
  background: rgba(15, 18, 24, 0.9);
  box-shadow: 0 0 0 3px rgba(245, 200, 123, 0.15);
}

.dropdown-backdrop {
  position: absolute;
  inset: 0;
  z-index: 265;
}

.custom-select-container {
  position: relative;
  width: 100%;
}

.custom-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  z-index: 266;
  position: relative;
  background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 10l5 5 5-5' stroke='%23F5C87B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
}

.custom-select-trigger.is-open {
  border-color: rgba(245, 200, 123, 0.5);
  background-color: rgba(15, 18, 24, 0.9);
  background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 14l5-5 5 5' stroke='%23F5C87B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
}

.custom-options-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 270;
  background: rgba(20, 24, 32, 0.95);
  border: 1px solid rgba(245, 200, 123, 0.2);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  transform-origin: top;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scaleY(0.95) translateY(-5px);
}

.custom-option {
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 2px;
}

.custom-option:last-child {
  margin-bottom: 0;
}

.custom-option:hover {
  background: rgba(245, 200, 123, 0.1);
}

.custom-option.is-selected {
  background: rgba(245, 200, 123, 0.15);
  color: var(--c-aureate-glow);
}

.co-name {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
}

.co-path {
  font-size: 11px;
  color: #888;
  font-family: ui-monospace;
}

.task-field-hint {
  color: #7f7f7f;
  font-size: 11px;
}

.task-workspace-preview {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.task-workspace-name {
  color: #f3f3f3;
  font-size: 13px;
}

.task-workspace-path {
  color: #8d8d8d;
  font-size: 11px;
  word-break: break-all;
}

.task-creator-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.task-secondary-btn,
.task-primary-btn {
  min-width: 104px;
  height: 44px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.task-secondary-btn {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: #e4e4e4;
  transition: all 0.3s ease;
}

.task-secondary-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.task-primary-btn {
  border: none;
  background: linear-gradient(135deg, var(--c-aureate-base), var(--c-aureate-dim));
  color: #0b0d10;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(245, 200, 123, 0.15);
}

.task-primary-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(245, 200, 123, 0.3);
  background: linear-gradient(135deg, var(--c-aureate-glow), var(--c-aureate-base));
}

.task-primary-btn:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: 0 2px 8px rgba(245, 200, 123, 0.2);
}

.task-primary-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  filter: grayscale(0.5);
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

.agent-logo-wrapper svg,
.agent-logo-wrapper img {
  width: 38px;
  height: 38px;
  display: block;
  object-fit: contain;
}

.agent-logo-wrapper.mod-codex svg,
.agent-logo-wrapper.mod-codex img,
.agent-logo-wrapper.mod-codex svg,
.engine-badge.mod-codex svg,
.mod-codex svg {
  color: white !important;
  fill: white !important;
  filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.4));
}

.alw-icon {
  display: flex;
  align-items: center;
  justify-content: center;
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

.agent-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.role-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.role-badge.captain {
  background: rgba(245, 200, 123, 0.15);
  border: 1px solid rgba(245, 200, 123, 0.3);
  color: var(--c-aureate-glow);
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

.engine-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: ui-monospace, sans-serif;
  border: 1px solid transparent;
  white-space: nowrap;
}

.eb-icon {
  width: 14px;
  height: 14px;
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

.eb-icon.emoji {
  font-size: 12px;
}

.engine-badge.mod-gemini {
  background: rgba(66, 133, 244, 0.15);
  border-color: rgba(66, 133, 244, 0.3);
  color: #8ab4f8;
}

.engine-badge.mod-claude {
  background: rgba(217, 119, 87, 0.15);
  border-color: rgba(217, 119, 87, 0.3);
  color: #ffb89e;
}

.engine-badge.mod-codex {
  background: rgba(30, 215, 96, 0.15);
  border-color: rgba(30, 215, 96, 0.3);
  color: #8affc1;
}

.engine-badge.mod-codex img,
.engine-badge.mod-codex svg {
  filter: brightness(0) invert(1);
}

.engine-badge.mod-lobster {
  background: rgba(255, 50, 50, 0.15);
  border-color: rgba(255, 50, 50, 0.4);
  color: #ff6b6b;
  box-shadow: 0 0 15px rgba(255, 50, 50, 0.2);
}

.emoji-icon {
  font-size: 32px;
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
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  font-family: ui-monospace;
  letter-spacing: 0.03em;
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

/* 🧪 CLI Health Footer Styles */
.cli-health-footer {
  position: fixed;
  bottom: 85px;  /* Raised to make room for command hub */
  left: 0;
  right: 0;
  z-index: 100;
  height: 48px;
  display: flex;
  align-items: center;
  border-top: 1px solid rgba(139, 115, 71, 0.2);
  background: rgba(9, 10, 14, 0.85);
  backdrop-filter: blur(20px);
}

.footer-container {
  width: 100%;
  max-width: 1800px;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.health-group {
  display: flex;
  align-items: center;
  gap: 20px;
}

.health-label {
  font-size: 11px;
  color: #666;
  letter-spacing: 0.1em;
}

.health-items {
  display: flex;
  gap: 16px;
}

.health-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  cursor: help;
}

.health-item .h-tooltip {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  background: rgba(30, 10, 10, 0.95);
  color: #ef4444;
  font-size: 11px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: all 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.health-item:hover .h-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.h-tooltip-arrow {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(239, 68, 68, 0.3);
}

.health-item .h-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #333;
}

.health-item .h-name {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #555;
}

/* 🟢 Online State */
.health-item.online {
  border-color: rgba(34, 197, 94, 0.2);
  background: rgba(34, 197, 94, 0.05);
}

.health-item.online .h-dot {
  background: #22c55e;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.8);
  animation: h-pulse 2s infinite;
}

.health-item.online .h-name {
  color: #22c55e;
}

/* 🔴 Offline State */
.health-item.offline {
  border-color: rgba(239, 68, 68, 0.2);
  background: rgba(239, 68, 68, 0.05);
}

.health-item.offline .h-dot {
  background: #ef4444;
}

.health-item.offline .h-name {
  color: #ef4444;
}

.footer-meta {
  display: flex;
  gap: 20px;
  font-size: 10px;
  color: #444;
  font-family: ui-monospace;
}

.footer-system-stats {
  display: flex;
  gap: 24px;
  align-items: center;
  margin-left: auto;
  margin-right: 40px;
  padding: 0 20px;
  border-left: 1px solid rgba(255, 255, 255, 0.05);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-size: 9px;
  color: #555;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.stat-value {
  font-size: 11px;
  color: var(--c-aureate-glow);
  font-family: ui-monospace;
  text-shadow: 0 0 8px rgba(245, 200, 123, 0.3);
}

.version-tag {
  color: var(--c-aureate-dim);
  background: rgba(139, 115, 71, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

@keyframes h-pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }

  100% {
    opacity: 1;
  }
}
</style>
