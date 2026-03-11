<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import MissionCard from "./MissionCard.vue";
import AgentNode from "./AgentNode.vue";
import CliHealthFooter from "./CliHealthFooter.vue";

const loading = ref(true);
const error = ref("");
const currentTime = ref(new Date());
const realtimeStatus = ref("连接中");
const showTaskCreator = ref(false);
const loadingWorkspaces = ref(false);
const creatingTask = ref(false);
const deletingTaskId = ref("");
const completingTaskId = ref("");
const hoveredMission = ref(null);
const missionTooltipStyle = ref({});
const taskCreatorTargetMember = ref(null);

function showMissionTooltip(event, task) {
  hoveredMission.value = task;
  const rect = event.currentTarget.getBoundingClientRect();
  // Anchor to the right of the card, with slight padding
  missionTooltipStyle.value = {
    top: `${Math.max(20, rect.top)}px`,
    left: `${rect.right + 12}px`
  };
}

function hideMissionTooltip() {
  hoveredMission.value = null;
}

const workspaceOptions = ref([]);
const createTaskForm = ref({
  title: "",
  workspace: "",
  priority: "中"
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

const currentMembers = computed(() =>
  data.value.members.filter((m) => m.type === "active" || m.type === "queued" || m.type === "offline")
);
const currentWorkspaceName = computed(() => {
  const current = workspaceOptions.value.find((item) => item.workspace === createTaskForm.value.workspace);
  return current?.name || "";
});
const missionSections = computed(() => {
  const groups = [
    { key: "pending", title: "待启动", items: [] },
    { key: "working", title: "执行中", items: [] },
    { key: "done", title: "已完成", items: [] }
  ];

  for (const task of data.value.missions) {
    const status = String(task?.status || "").trim();
    if (status === "已完成") {
      groups[2].items.push(task);
      continue;
    }
    if (status === "执行中") {
      groups[1].items.push(task);
      continue;
    }
    groups[0].items.push(task);
  }

  return groups;
});
const displayVersion = computed(() => {
  const raw = String(data.value.version || "").trim();
  const match = raw.match(/v\d+(?:\.\d+){0,2}(?:-[a-z0-9.]+)?/i);
  return match?.[0] || "v0";
});

let requestId = 0;
const actionEndpoint = 'http://127.0.0.1:18790/api/fleet/action';
const stateEndpoint = 'http://127.0.0.1:18790/api/fleet/state';
const eventsEndpoint = 'http://127.0.0.1:18790/api/fleet/events';
const workspacesEndpoint = 'http://127.0.0.1:18790/api/fleet/workspaces';
const RECONNECT_DELAY = 3000;

async function postAction(payload, errorMessage = "操作失败") {
  const response = await fetch(actionEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const resPayload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(resPayload.error || errorMessage);
  }
  if (resPayload.state) {
    applyBridgeState(resPayload.state);
  } else {
    await loadData();
  }
}

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
    isCaptain: Boolean(member.isCaptain),
    recentTasks: Array.isArray(member.recentTasks)
      ? member.recentTasks.map((task, index) => ({
        id: `${member.member || member.memberId || "member"}-任务轨迹-${index + 1}`,
        taskId: task.taskId || "",
        title: task.title || task.taskId || "未命名任务",
        status: task.status || "待启动",
        priority: task.priority || "中",
        publishedAt: task.publishedAt || "",
        updatedAt: task.updatedAt || "",
        isLive: Boolean(task.isLive)
      }))
      : []
  }));

  const missions = Array.isArray(state?.missions)
    ? state.missions.slice(0, 6).map((task, index) => ({
      id: task.id || `任务-${String(index + 1).padStart(2, "0")}`,
      taskId: task.taskId || '',
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

async function openTaskCreator(member = null) {
  taskCreatorTargetMember.value = member;
  showTaskCreator.value = true;
  error.value = "";
  if (workspaceOptions.value.length === 0) {
    await loadWorkspaces();
  }
  if (member?.workspace) {
    createTaskForm.value.workspace = member.workspace;
  }
}

function closeTaskCreator() {
  showTaskCreator.value = false;
  taskCreatorTargetMember.value = null;
  createTaskForm.value = {
    title: "",
    workspace: workspaceOptions.value[0]?.workspace || "",
    priority: "中"
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
    await postAction({
      action: taskCreatorTargetMember.value ? "create-member-task" : "create-task",
      title: createTaskForm.value.title.trim(),
      workspace: createTaskForm.value.workspace.trim(),
      priority: createTaskForm.value.priority,
      memberId: taskCreatorTargetMember.value?.member || ""
    }, "任务发布失败");
    closeTaskCreator();
  } catch (e) {
    error.value = e.message || "任务发布失败";
  } finally {
    creatingTask.value = false;
  }
}

async function completeMemberTask(member, task) {
  if (!canCompleteMemberTask(task)) return;

  completingTaskId.value = task.taskId;
  error.value = "";
  try {
    await postAction({
      action: "complete-task",
      taskId: task.taskId,
      memberId: member.member
    }, "标记完成失败");
  } catch (e) {
    error.value = e.message || "标记完成失败";
  } finally {
    completingTaskId.value = "";
  }
}

async function removeTask(task) {
  if (!canDeleteMission(task)) return;

  const previousMissions = data.value.missions.map((item) => ({ ...item }));
  deletingTaskId.value = task.taskId;
  data.value.missions = data.value.missions.filter((item) => item.taskId !== task.taskId);

  try {
    await postAction({
      action: "delete-task",
      taskId: task.taskId
    }, "删除任务失败");
  } catch (e) {
    data.value.missions = previousMissions;
    error.value = e.message || "删除任务失败";
  } finally {
    deletingTaskId.value = "";
  }
}

async function removeMember(member) {
  const previousMembers = data.value.members.map((item) => ({ ...item }));

  // Optimistic UI Update
  data.value.members = data.value.members.filter(m => m.member !== member.member);
  try {
    await postAction({ action: "kick-out", memberId: member.member }, "移出节点失败");
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
    await postAction({ action: "make-captain", memberId: member.member }, "移交最高指令失败");
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
      <div class="hud-left">
        <div class="hud-kicker">AI TEAM LOCAL COMMAND</div>
        <div class="hud-title-row">
          <div class="hud-main-title">星际舰队中枢</div>
          <span class="hud-version-badge">{{ displayVersion }}</span>
        </div>
        <div class="hud-subtitle">本地舰队协同 · {{ data.active }}/{{ data.total }} 在线节点 · {{ data.missions.length }} 条任务</div>
      </div>
      <div class="hud-center">
        <div class="live-status">
          <div class="live-scanner"></div>
          <span class="live-text">SSE 实时同步</span>
          <span class="live-divider"></span>
          <span class="live-meta">{{ realtimeStatus }}</span>
        </div>
      </div>
      <div class="hud-right">
        <div class="hud-source-pill">SOURCE · {{ data.source?.includes('sqlite') ? 'SQLITE' : 'LOCAL' }}</div>
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
            <span>任务池</span>
            <button class="task-create-trigger" @click="openTaskCreator" title="发布任务">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
          <div class="flow-container">
            <section v-for="section in missionSections" :key="section.key" class="mission-section">
              <div class="mission-section-header">
                <span class="mission-section-title">{{ section.title }}</span>
                <span class="mission-section-count">{{ section.items.length }}</span>
              </div>
              <div v-if="section.items.length === 0" class="mission-section-empty">
                当前没有{{ section.title }}任务
              </div>
              <div
                v-for="(task, idx) in section.items"
                :key="task.id"
                class="mission-glass-card"
                :style="{ '--delay': idx * 0.1 + 's' }"
                @mouseenter="showMissionTooltip($event, task)"
                @mouseleave="hideMissionTooltip"
              >
                <div class="card-edge"></div>
                <div class="m-top">
                  <div class="m-top-left">
                    <span class="m-id">{{ task.id }}</span>
                    <span
                      class="m-priority-orb"
                      :class="priorityClass(task.priority)"
                      :title="'优先级 ' + normalizePriorityLabel(task.priority)"
                    ></span>
                  </div>
                  <div class="m-top-actions">
                    <button
                      v-if="canDeleteMission(task)"
                      class="mission-delete-btn"
                      :disabled="deletingTaskId === task.taskId"
                      @click="removeTask(task)"
                      title="删除待启动任务"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                      </svg>
                    </button>
                    <div class="m-status-badge" :class="missionStatusClass(task.status)">
                      <span class="status-dot"></span>
                      {{ task.status }}
                    </div>
                  </div>
                </div>
                <p class="m-title">{{ task.title }}</p>
                <div class="m-owner">
                  <span class="text-ellipsis owner-name" :title="task.owner">{{ task.owner }}</span>
                  <span v-if="(task.assigneeAgent || task.assigneeRole) && (task.assigneeAgent !== task.owner)" class="m-owner-meta text-ellipsis" :title="[task.assigneeAgent, task.assigneeRole].filter(Boolean).join(' / ')">
                    {{ [task.assigneeAgent, task.assigneeRole].filter(Boolean).join(' / ') }}
                  </span>
                  <span v-else-if="task.assigneeRole" class="m-owner-meta text-ellipsis" :title="task.assigneeRole">
                    {{ task.assigneeRole }}
                  </span>
                </div>
                <div v-if="task.workspace" class="m-workspace" :title="'工作路径 ' + task.workspace">工作路径 {{ task.workspace }}</div>
                <div v-if="task.publishedAt" class="m-published-at text-ellipsis" :title="'发布时间 ' + task.publishedAt">发布时间 {{ task.publishedAt }}</div>
              </div>
            </section>
            <div v-if="data.missions.length === 0" class="mission-empty-state">
              <div>当前任务池为空</div>
              <div>点击左上角 + 发布任务</div>
            </div>
          </div>
        </aside>

        <!-- 4. Agent 矩阵 (The Glass Matrix) -->
        <main class="neural-matrix">
          <div class="matrix-grid">
            <AgentNode
              v-for="(member, idx) in currentMembers" :key="member.member"
              :member="member"
              :idx="idx"
              :completing-task-id="completingTaskId"
              @add-task="openTaskCreator"
              @make-captain="makeCaptain"
              @kick-out="removeMember"
              @complete-task="completeMemberTask"
            />
          </div>
        </main>
      </div>

      <!-- 5. 可视化工具链健康状态栏 (CLI Health Footer) -->
      <CliHealthFooter :environment="data.environment" :realtime-status="realtimeStatus" :version="data.version" />

      <div v-if="showTaskCreator" class="task-creator-backdrop" @click.self="closeTaskCreator">
        <div class="task-creator-panel">
          <div class="task-creator-header">
            <div>
              <div class="task-creator-kicker">任务发布</div>
              <h3>{{ taskCreatorTargetMember ? `给 ${taskCreatorTargetMember.alias || taskCreatorTargetMember.member} 新增任务` : '发布到真实任务池' }}</h3>
            </div>
            <button class="task-creator-close" @click="closeTaskCreator" title="关闭">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Invisible backdrop to close dropdowns -->
          <div v-if="isWorkspaceSelectOpen || isPrioritySelectOpen" class="dropdown-backdrop" @click="closeDropdowns"></div>

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
                    v-for="p in ['高', '中', '低']"
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

    <!-- 全局悬浮气泡 -->
    <transition name="tooltip-fade">
      <div v-if="hoveredMission" class="global-mission-tooltip" :style="missionTooltipStyle">
        <h4 class="gmt-title">{{ hoveredMission.title }}</h4>
        
        <div class="gmt-meta-item" v-if="hoveredMission.workspace">
          <span class="gmt-label">工作路径</span>
          <span class="gmt-value">{{ hoveredMission.workspace }}</span>
        </div>
        
        <div class="gmt-meta-divider"></div>
        
        <div class="gmt-owner-row">
          <div class="gmt-meta-item">
            <span class="gmt-label">所有者</span>
            <span class="gmt-value">{{ hoveredMission.owner }}</span>
          </div>
          
          <div class="gmt-meta-item" v-if="hoveredMission.assigneeAgent || hoveredMission.assigneeRole">
            <span class="gmt-label">执行方</span>
            <span class="gmt-value">{{ [hoveredMission.assigneeAgent, hoveredMission.assigneeRole].filter(Boolean).join(' / ') }}</span>
          </div>
        </div>

        <div class="gmt-meta-item" v-if="hoveredMission.publishedAt" style="margin-top: 10px;">
          <span class="gmt-label">发布时间</span>
          <span class="gmt-value">{{ hoveredMission.publishedAt }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* 🔴 核心：现代高奢 Aether 设计系统 (Aureate Void) */
.aether-stage {
  display: flex;
  flex: 1;
  min-height: 0;
  padding: 24px 24px 160px 24px;
  gap: 24px;
  z-index: 10;
  overflow: hidden;
}

/* 🧊 任务清单 - 玻璃态 */
.mission-flow {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-shrink: 0;
  min-height: 0;
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
  gap: 18px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 8px;
}

.mission-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mission-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 4px;
}

.mission-section-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.74);
}

.mission-section-count {
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
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.mission-section-empty {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.38);
  font-size: 12px;
}

.flow-container::-webkit-scrollbar {
  width: 8px;
}

.flow-container::-webkit-scrollbar-track {
  background: transparent;
}

.flow-container::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(245, 200, 123, 0.14);
  border: 2px solid transparent;
  background-clip: padding-box;
}

.flow-container::-webkit-scrollbar-thumb:hover {
  background: rgba(245, 200, 123, 0.28);
  background-clip: padding-box;
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
  padding-right: 42px;
}

.custom-select-trigger.is-open {
  border-color: rgba(245, 200, 123, 0.5);
  background-color: rgba(15, 18, 24, 0.9);
}

.custom-select-trigger::after {
  content: '';
  position: absolute;
  right: 18px;
  top: 50%;
  width: 8px;
  height: 8px;
  border-right: 1.5px solid rgba(245, 200, 123, 0.72);
  border-bottom: 1.5px solid rgba(245, 200, 123, 0.72);
  transform: translateY(-60%) rotate(45deg);
  transition: transform 0.2s ease, border-color 0.2s ease;
  pointer-events: none;
}

.custom-select-trigger.is-open::after {
  transform: translateY(-35%) rotate(-135deg);
  border-color: rgba(245, 200, 123, 0.92);
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
  min-height: 0;
  overflow-y: auto;
  padding-right: 8px;
}

.neural-matrix::-webkit-scrollbar {
  width: 8px;
}

.neural-matrix::-webkit-scrollbar-track {
  background: transparent;
}

.neural-matrix::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(245, 200, 123, 0.14);
  border: 2px solid transparent;
  background-clip: padding-box;
}

.neural-matrix::-webkit-scrollbar-thumb:hover {
  background: rgba(245, 200, 123, 0.28);
  background-clip: padding-box;
}

.matrix-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  grid-auto-rows: 1fr;
  gap: 24px;
  align-items: stretch;
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
  .matrix-grid {
    grid-auto-rows: auto;
  }

  .aether-stage {
    flex-direction: column;
    overflow: auto;
  }

  .mission-flow {
    width: 100%;
    max-height: 320px;
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
  align-items: center;
  gap: 16px;
  white-space: nowrap;
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

/* 💠 Global Fixed Tooltip */
.global-mission-tooltip {
  position: fixed;
  z-index: 9999;
  width: 340px;
  max-width: 90vw;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(20, 24, 32, 0.95), rgba(10, 12, 16, 0.98));
  backdrop-filter: blur(28px) saturate(120%);
  border: 1px solid rgba(245, 200, 123, 0.3);
  border-radius: 14px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.1);
  pointer-events: none; /* Let mouse pass through to underlying card */
  display: flex;
  flex-direction: column;
}

.global-mission-tooltip::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 24px;
  transform: translateY(-50%) rotate(45deg);
  width: 12px;
  height: 12px;
  background: rgba(20, 24, 32, 0.95);
  border-left: 1px solid rgba(245, 200, 123, 0.3);
  border-bottom: 1px solid rgba(245, 200, 123, 0.3);
}

.gmt-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  line-height: 1.5;
  letter-spacing: 0.02em;
}

.gmt-meta-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 8px;
}

.gmt-meta-item:last-child {
  margin-bottom: 0;
}

.gmt-label {
  font-size: 10px;
  color: #888;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 600;
}

.gmt-value {
  font-size: 11px;
  color: #e2e2e2;
  font-family: ui-monospace, sans-serif;
  word-break: break-all;
  line-height: 1.5;
}

.gmt-meta-divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.08), transparent);
  margin: 12px 0;
}

.gmt-owner-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateX(-12px) scale(0.98);
}

.health-item.offline .h-dot {
  background: #ef4444;
}

.health-item.offline .h-name {
  color: #ef4444;
}

.footer-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  font-family: ui-monospace, sans-serif;
  white-space: nowrap;
}

.sync-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  letter-spacing: 0.05em;
}

.sync-label {
  color: #888888;
}

.sync-status {
  font-weight: 600;
  color: #888888;
}

.sync-status.is-online {
  color: #22c55e;
  text-shadow: 0 0 10px rgba(34, 197, 94, 0.4);
}

.footer-system-stats {
  display: flex;
  gap: 12px;
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
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  white-space: nowrap;
}

.stat-icon {
  font-size: 13px;
  opacity: 1; /* Keep emoji colors punchy */
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}

.stat-label {
  font-size: 10px;
  color: #888888;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 11px;
  color: var(--c-aureate-glow);
  font-weight: bold;
  font-family: ui-monospace, sans-serif;
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
