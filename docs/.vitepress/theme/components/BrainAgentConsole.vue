<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const STORAGE_SESSIONS_KEY = "cortexos.brain.sessions.v1";
const STORAGE_ACTIVE_KEY = "cortexos.brain.active-session.v1";
const CLOUD_BRAIN_URL = "https://brain-api-675793533606.asia-southeast2.run.app";
const CLOUD_BRAIN_PROJECT = "cortexos";

const composer = ref("");
const sessions = ref([]);
const activeSessionId = ref("");
const sending = ref(false);
const threadRef = ref(null);
const inboxLoading = ref(false);
const inboxError = ref("");
const inboxLastSyncedAt = ref("");
const inboxNotifications = ref([]);
let inboxTimer = null;

const roadmapItems = [
  { title: "聊天 MVP", status: "进行中", tone: "working" },
  { title: "记忆接入", status: "下一步", tone: "pending" },
  { title: "Inbox 接入", status: "已接通", tone: "triaged" },
  { title: "任务接入", status: "排队中", tone: "queued" }
];

const systemContext = [
  "CortexOS = 主脑 Agent 本体",
  "Cloud Brain = 云端延展，不是另一套脑",
  "用户长期知识真源 = ~/Documents/memory",
  "先让聊天、记忆、收件箱、任务四层打通"
];

function safeNow() {
  return new Date().toISOString();
}

function formatClock(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function formatRelative(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小时前`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} 天前`;
}

function formatNotificationStatus(value) {
  const status = String(value || "").trim().toLowerCase();
  if (status === "new") return "未读";
  if (status === "triaged") return "已分诊";
  if (status === "acted") return "已处理";
  if (status === "archived") return "已归档";
  return "未知";
}

function toneForNotification(notification = {}) {
  const priority = String(notification.priority || "").toLowerCase();
  const status = String(notification.status || "").toLowerCase();
  if (priority === "urgent" || priority === "high") return "working";
  if (status === "new") return "pending";
  if (status === "acted") return "triaged";
  return "queued";
}

function summarizeNotificationText(value) {
  const text = String(value || "").trim();
  if (!text) return "这条通知没有提供更多描述。";
  return text.length > 92 ? `${text.slice(0, 92)}…` : text;
}

async function fetchInbox() {
  inboxLoading.value = true;
  inboxError.value = "";

  try {
    const url = new URL("/notifications", CLOUD_BRAIN_URL);
    url.searchParams.set("project", CLOUD_BRAIN_PROJECT);
    url.searchParams.set("limit", "8");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Cloud Brain inbox 请求失败 (${response.status})`);
    }

    const payload = await response.json();
    const rows = Array.isArray(payload.notifications) ? payload.notifications : [];

    inboxNotifications.value = rows.map((item) => ({
      id: item.id,
      title: item.title || "未命名通知",
      description: summarizeNotificationText(item.content),
      status: formatNotificationStatus(item.status),
      tone: toneForNotification(item),
      timeText: formatRelative(item.createdAt),
      rawStatus: item.status || "new"
    }));
    inboxLastSyncedAt.value = safeNow();
  } catch (error) {
    inboxNotifications.value = [];
    inboxError.value = error instanceof Error ? error.message : "Cloud Brain inbox 拉取失败";
  } finally {
    inboxLoading.value = false;
  }
}

function makeMessage(role, content, meta = {}) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    label: role === "assistant" ? "CortexOS" : "你",
    content,
    createdAt: meta.createdAt || safeNow(),
    type: meta.type || "chat"
  };
}

function makeDefaultSession() {
  const createdAt = safeNow();
  return {
    id: `session-${Date.now()}`,
    title: "新的主脑会话",
    summary: "从这里开始定义 CortexOS 主脑怎么思考、记忆和分诊。",
    createdAt,
    updatedAt: createdAt,
    messages: [
      makeMessage(
        "assistant",
        "这里已经不是静态原型了。现在这页会把你的会话保存在浏览器本地，你可以持续和 CortexOS 对话，并逐步把记忆、收件箱和任务接进来。",
        { createdAt }
      )
    ]
  };
}

function loadSessions() {
  if (typeof window === "undefined") return [makeDefaultSession()];
  try {
    const raw = window.localStorage.getItem(STORAGE_SESSIONS_KEY);
    if (!raw) return [makeDefaultSession()];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [makeDefaultSession()];
    return parsed;
  } catch {
    return [makeDefaultSession()];
  }
}

function saveSessions() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(sessions.value));
  window.localStorage.setItem(STORAGE_ACTIVE_KEY, activeSessionId.value);
}

function normalizeTitle(text) {
  const clean = String(text || "").trim().replace(/\s+/g, " ");
  if (!clean) return "新的主脑会话";
  return clean.slice(0, 22);
}

function summarizeSession(messages) {
  const lastUser = [...messages].reverse().find(item => item.role === "user");
  const lastMessage = messages[messages.length - 1];
  return normalizeTitle((lastUser?.content || lastMessage?.content || "").slice(0, 34));
}

function createSession() {
  const session = makeDefaultSession();
  sessions.value = [session, ...sessions.value];
  activeSessionId.value = session.id;
}

function removeSession(sessionId) {
  if (sessions.value.length <= 1) return;
  sessions.value = sessions.value.filter(session => session.id !== sessionId);
  if (activeSessionId.value === sessionId) {
    activeSessionId.value = sessions.value[0]?.id || "";
  }
}

function selectSession(sessionId) {
  activeSessionId.value = sessionId;
}

function updateSession(sessionId, updater) {
  sessions.value = sessions.value.map(session => {
    if (session.id !== sessionId) return session;
    return updater(session);
  });
}

function generateAssistantReply(input) {
  const text = String(input || "").trim();
  const lower = text.toLowerCase();

  if (lower.includes("记忆")) {
    return "主脑会优先把重点结论沉淀进 memories，而不是把所有对话原文全量入库。下一步最适合做的是：对话前检索记忆，对话后只提炼重点事实和 why it matters。";
  }

  if (lower.includes("通知") || lower.includes("inbox")) {
    return "通知不该直接等于长期记忆。更稳的链路是：远端消息先进入 inbox，再由 CortexOS 分诊成 memory、task 或 archive。这样主脑不会被普通同步灌爆。";
  }

  if (lower.includes("任务")) {
    return "任务层建议只收需要后续动作的事项。对话里如果出现“需要确认、需要推进、需要处理”的语义，就应该转成 tasks，而不是只停在聊天记录里。";
  }

  if (lower.includes("模型") || lower.includes("gemini") || lower.includes("claude") || lower.includes("codex") || lower.includes("minimax")) {
    return "模型在 CortexOS 里应该只是发动机，不是主体。主脑负责人格、记忆、收件箱和任务，Gemini / Claude / Codex / MiniMax 只是根据场景切换的推理引擎。";
  }

  if (lower.includes("下一步") || lower.includes("计划")) {
    return "按现在的节奏，最适合的下一步是：先把聊天主链路做稳，再接记忆检索，然后把 Cloud Brain inbox 拉进右侧面板。不要一开始就做复杂的多模型编排。";
  }

  return "我已经把这页从静态展示收成可持久化会话前台了。现在你可以继续把它当作主脑对话窗口使用，后面我们再把 Cloud Brain inbox、记忆检索和任务层逐步接进来。";
}

async function sendMessage() {
  const text = composer.value.trim();
  if (!text || sending.value || !activeSession.value) return;

  sending.value = true;
  const userMessage = makeMessage("user", text);
  const assistantMessage = makeMessage("assistant", generateAssistantReply(text), {
    createdAt: new Date(Date.now() + 240).toISOString()
  });

  updateSession(activeSession.value.id, (session) => {
    const nextMessages = [...session.messages, userMessage, assistantMessage];
    return {
      ...session,
      title: session.messages.length <= 1 ? normalizeTitle(text) : session.title,
      summary: summarizeSession(nextMessages),
      updatedAt: assistantMessage.createdAt,
      messages: nextMessages
    };
  });

  composer.value = "";
  sending.value = false;
  await nextTick();
  scrollThreadToBottom();
}

function scrollThreadToBottom() {
  if (!threadRef.value) return;
  threadRef.value.scrollTop = threadRef.value.scrollHeight;
}

const activeSession = computed(() => {
  return sessions.value.find(session => session.id === activeSessionId.value) || sessions.value[0] || null;
});

const sessionCards = computed(() => {
  return sessions.value.map(session => ({
    ...session,
    timeText: formatRelative(session.updatedAt),
    preview: session.summary || summarizeSession(session.messages),
    active: session.id === activeSessionId.value
  }));
});

const contextMemories = computed(() => {
  if (!activeSession.value) return [];
  const userMessages = activeSession.value.messages.filter(item => item.role === "user");
  const latest = userMessages.slice(-3).map(item => normalizeTitle(item.content));
  return latest.length > 0 ? latest : [
    "Cloud Brain 已部署到 Cloud Run，并以 Firestore 作为共享主库",
    "通知先进入 inbox，再决定转 memory 或 task",
    "用户长期知识真源仍然是 ~/Documents/memory"
  ];
});

const contextInbox = computed(() => {
  if (inboxLoading.value && inboxNotifications.value.length === 0) {
    return [{
      id: "inbox-loading",
      title: "Cloud Brain Inbox 同步中",
      description: "正在从云端收件箱拉取真实通知，请稍等一下。",
      status: "同步中",
      tone: "pending",
      timeText: "刚刚"
    }];
  }

  if (inboxError.value) {
    return [{
      id: "inbox-error",
      title: "Cloud Brain Inbox 暂不可用",
      description: inboxError.value,
      status: "连接异常",
      tone: "working",
      timeText: inboxLastSyncedAt.value ? formatRelative(inboxLastSyncedAt.value) : "刚刚"
    }];
  }

  if (inboxNotifications.value.length > 0) {
    return inboxNotifications.value;
  }

  return [{
    id: "inbox-empty",
    title: "Cloud Brain Inbox 已接通",
    description: "当前没有待展示的远端通知。后面雅加达节点发来新消息时，这里会直接显示真实收件箱内容。",
    status: "空闲",
    tone: "triaged",
    timeText: inboxLastSyncedAt.value ? formatRelative(inboxLastSyncedAt.value) : "刚刚"
  }];
});

onMounted(async () => {
  sessions.value = loadSessions();
  if (typeof window !== "undefined") {
    const storedActive = window.localStorage.getItem(STORAGE_ACTIVE_KEY) || "";
    activeSessionId.value = storedActive || sessions.value[0]?.id || "";
  } else {
    activeSessionId.value = sessions.value[0]?.id || "";
  }

  if (!activeSessionId.value && sessions.value[0]) {
    activeSessionId.value = sessions.value[0].id;
  }

  await nextTick();
  scrollThreadToBottom();
  await fetchInbox();
  inboxTimer = window.setInterval(() => {
    fetchInbox();
  }, 30000);
});

onBeforeUnmount(() => {
  if (inboxTimer) {
    window.clearInterval(inboxTimer);
    inboxTimer = null;
  }
});

watch([sessions, activeSessionId], () => {
  saveSessions();
}, { deep: true });

watch(activeSessionId, async () => {
  await nextTick();
  scrollThreadToBottom();
});

function classForTone(tone) {
  return `tone-${tone || "default"}`;
}
</script>

<template>
  <section class="brain-agent-stage">
    <header class="brain-agent-hero">
      <div class="brain-agent-hero__copy">
        <div class="brain-agent-kicker">CORTEXOS / BRAIN AGENT / CHAT MVP</div>
        <h1>主脑聊天前台</h1>
        <p>
          这页现在已经不是静态示意图了。会话会保存在浏览器本地，你可以真实创建、切换、续聊；
          下一步我们再把 Cloud Brain 的记忆、收件箱和任务层逐个接进来。
        </p>
        <div class="brain-agent-hero__chips">
          <span>本地会话持久化</span>
          <span>多会话切换</span>
          <span>主脑回复骨架</span>
          <span>Inbox 已接云端</span>
        </div>
      </div>
      <div class="brain-agent-hero__panel">
        <div class="brain-agent-metric">
          <label>当前阶段</label>
          <strong>Phase 2 · 聊天 MVP 已接通</strong>
        </div>
        <div class="brain-agent-metric">
          <label>会话数量</label>
          <strong>{{ sessions.length }}</strong>
        </div>
        <div class="brain-agent-metric">
          <label>当前模式</label>
          <strong>本地会话 + Cloud Brain Inbox</strong>
        </div>
        <div class="brain-agent-metric">
          <label>下一步</label>
          <strong>继续接入真实 Memories / Tasks</strong>
        </div>
      </div>
    </header>

    <div class="brain-agent-layout">
      <aside class="brain-column brain-column--sessions">
        <div class="brain-panel">
          <div class="brain-panel__head">
            <h2>会话列</h2>
            <button class="ghost-action" type="button" @click="createSession">新建会话</button>
          </div>
          <div class="session-list">
            <article
              v-for="session in sessionCards"
              :key="session.id"
              class="session-card"
              :class="{ 'is-active': session.active }"
              @click="selectSession(session.id)"
            >
              <div class="session-card__top">
                <strong>{{ session.title }}</strong>
                <span>{{ session.timeText }}</span>
              </div>
              <p>{{ session.preview }}</p>
              <button
                v-if="sessions.length > 1"
                class="session-remove"
                type="button"
                @click.stop="removeSession(session.id)"
              >
                删除
              </button>
            </article>
          </div>
        </div>

        <div class="brain-panel compact">
          <div class="brain-panel__head">
            <h2>阶段目标</h2>
          </div>
          <ul class="bullet-list">
            <li>先把聊天主流程跑通</li>
            <li>再把记忆和 inbox 拉进右栏</li>
            <li>任务层随后接入，不提前做复杂编排</li>
          </ul>
        </div>
      </aside>

      <main class="brain-column brain-column--chat">
        <div class="brain-panel brain-panel--chat">
          <div class="brain-panel__head">
            <h2>{{ activeSession?.title || "主脑会话" }}</h2>
            <span>最后更新 {{ activeSession ? formatRelative(activeSession.updatedAt) : "刚刚" }}</span>
          </div>

          <div ref="threadRef" class="chat-thread">
            <article
              v-for="message in activeSession?.messages || []"
              :key="message.id"
              class="chat-bubble"
              :class="`role-${message.role}`"
            >
              <div class="chat-bubble__meta">
                <strong>{{ message.label }}</strong>
                <span>{{ formatClock(message.createdAt) }}</span>
              </div>
              <p>{{ message.content }}</p>
            </article>
          </div>

          <div class="composer-shell">
            <div class="composer-hint">
              现在已经支持真实会话与本地持久化。下一步会把 Cloud Brain 的通知、记忆、任务接进这个主聊天流。
            </div>
            <div class="composer-box">
              <textarea
                v-model="composer"
                placeholder="和 CortexOS 说点什么，比如：下一步怎么做、怎么处理通知、怎么沉淀记忆。"
                @keydown.meta.enter.prevent="sendMessage"
                @keydown.ctrl.enter.prevent="sendMessage"
              ></textarea>
              <div class="composer-actions">
                <span>⌘/Ctrl + Enter 发送</span>
                <button type="button" :disabled="sending || !composer.trim()" @click="sendMessage">
                  {{ sending ? "发送中..." : "发送" }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <aside class="brain-column brain-column--context">
        <div class="brain-panel">
          <div class="brain-panel__head">
            <h2>Inbox</h2>
            <div class="panel-actions">
              <span>{{ inboxLastSyncedAt ? `同步于 ${formatClock(inboxLastSyncedAt)}` : "Cloud Brain" }}</span>
              <button class="ghost-action" type="button" :disabled="inboxLoading" @click="fetchInbox">
                {{ inboxLoading ? "同步中" : "刷新" }}
              </button>
            </div>
          </div>
          <div class="stack-list">
            <article
              v-for="item in contextInbox"
              :key="item.id"
              class="mini-stack-card"
              :class="classForTone(item.tone)"
            >
              <div class="mini-stack-card__meta">
                <strong>{{ item.title }}</strong>
                <span>{{ item.status }}</span>
              </div>
              <p>{{ item.description }}</p>
              <small class="mini-stack-card__time">{{ item.timeText }}</small>
            </article>
          </div>
        </div>

        <div class="brain-panel">
          <div class="brain-panel__head">
            <h2>记忆候选</h2>
            <span>来自当前会话</span>
          </div>
          <ul class="memory-list">
            <li v-for="item in contextMemories" :key="item">{{ item }}</li>
          </ul>
        </div>

        <div class="brain-panel">
          <div class="brain-panel__head">
            <h2>路线图</h2>
            <span>Roadmap</span>
          </div>
          <div class="stack-list">
            <article
              v-for="task in roadmapItems"
              :key="task.title"
              class="mini-stack-card"
              :class="classForTone(task.tone)"
            >
              <div class="mini-stack-card__meta">
                <strong>{{ task.title }}</strong>
                <span>{{ task.status }}</span>
              </div>
            </article>
          </div>
        </div>

        <div class="brain-panel compact">
          <div class="brain-panel__head">
            <h2>系统上下文</h2>
          </div>
          <ul class="bullet-list">
            <li v-for="item in systemContext" :key="item">{{ item }}</li>
          </ul>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.brain-agent-stage {
  --brain-panel: rgba(10, 18, 34, 0.78);
  --brain-panel-strong: rgba(12, 20, 36, 0.92);
  --brain-border: rgba(241, 195, 111, 0.16);
  --brain-text: #eef3ff;
  --brain-muted: #98a8c6;
  --brain-gold: #f1c36f;
  --brain-shadow: 0 28px 90px rgba(0, 0, 0, 0.34);
  color: var(--brain-text);
  display: grid;
  gap: 24px;
}

.brain-agent-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 420px);
  gap: 24px;
  padding: 28px;
  border-radius: 28px;
  border: 1px solid var(--brain-border);
  background:
    radial-gradient(circle at top left, rgba(241, 195, 111, 0.14), transparent 30%),
    radial-gradient(circle at bottom right, rgba(123, 179, 255, 0.12), transparent 28%),
    linear-gradient(180deg, rgba(13, 19, 34, 0.96), rgba(8, 13, 24, 0.92));
  box-shadow: var(--brain-shadow);
  overflow: hidden;
  position: relative;
}

.brain-agent-hero::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 28px 28px;
  opacity: 0.14;
  pointer-events: none;
}

.brain-agent-hero__copy,
.brain-agent-hero__panel {
  position: relative;
  z-index: 1;
}

.brain-agent-kicker {
  color: var(--brain-gold);
  font-size: 12px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.brain-agent-hero h1 {
  margin: 0 0 12px;
  font-size: clamp(34px, 5vw, 56px);
  line-height: 1.02;
  letter-spacing: -0.04em;
}

.brain-agent-hero p {
  margin: 0;
  max-width: 60ch;
  line-height: 1.8;
  color: var(--brain-muted);
  font-size: 15px;
}

.brain-agent-hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.brain-agent-hero__chips span,
.brain-agent-metric,
.ghost-action {
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  border-radius: 999px;
  backdrop-filter: blur(18px);
}

.brain-agent-hero__chips span {
  padding: 8px 12px;
  color: var(--brain-text);
  font-size: 12px;
}

.brain-agent-hero__panel {
  display: grid;
  gap: 12px;
}

.brain-agent-metric {
  padding: 14px 16px;
}

.brain-agent-metric label {
  display: block;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.45);
  margin-bottom: 6px;
}

.brain-agent-metric strong {
  display: block;
  font-size: 15px;
  line-height: 1.5;
}

.brain-agent-layout {
  display: grid;
  grid-template-columns: 290px minmax(0, 1fr) 340px;
  gap: 20px;
}

.brain-column {
  display: grid;
  gap: 20px;
  align-content: start;
}

.brain-panel {
  border: 1px solid var(--brain-border);
  border-radius: 24px;
  background: var(--brain-panel);
  box-shadow: var(--brain-shadow);
  padding: 18px;
}

.brain-panel.compact {
  background: rgba(8, 14, 26, 0.9);
}

.brain-panel--chat {
  min-height: 760px;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.brain-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.brain-panel__head h2 {
  margin: 0;
  font-size: 18px;
  letter-spacing: -0.02em;
}

.brain-panel__head span {
  color: var(--brain-muted);
  font-size: 12px;
}

.panel-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.ghost-action {
  color: var(--brain-text);
  padding: 8px 12px;
  cursor: pointer;
}

.session-list,
.stack-list,
.memory-list,
.bullet-list {
  display: grid;
  gap: 12px;
}

.session-card,
.mini-stack-card {
  position: relative;
  border: 1px solid rgba(255,255,255,0.08);
  background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
  border-radius: 18px;
  padding: 14px;
}

.session-card {
  cursor: pointer;
}

.session-card.is-active {
  border-color: rgba(123, 179, 255, 0.36);
  background: linear-gradient(180deg, rgba(72, 120, 255, 0.18), rgba(255,255,255,0.03));
}

.session-card__top,
.mini-stack-card__meta,
.composer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.session-card strong,
.mini-stack-card strong {
  font-size: 14px;
}

.session-card span,
.mini-stack-card span,
.composer-actions span {
  color: var(--brain-muted);
  font-size: 11px;
}

.session-card p,
.mini-stack-card p,
.chat-bubble p,
.bullet-list li,
.memory-list li {
  margin: 0;
  color: var(--brain-muted);
  line-height: 1.7;
  font-size: 13px;
}

.mini-stack-card__time {
  display: inline-block;
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.42);
  font-size: 11px;
}

.session-remove {
  margin-top: 10px;
  border: 0;
  background: transparent;
  color: rgba(255,255,255,0.55);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

.chat-thread {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
}

.chat-bubble {
  max-width: min(78%, 720px);
  padding: 16px 18px;
  border-radius: 22px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
}

.chat-bubble.role-user {
  margin-left: auto;
  background: linear-gradient(180deg, rgba(68, 108, 255, 0.22), rgba(255,255,255,0.04));
  border-color: rgba(123, 179, 255, 0.28);
}

.chat-bubble.role-assistant {
  background: linear-gradient(180deg, rgba(241, 195, 111, 0.08), rgba(255,255,255,0.03));
}

.chat-bubble__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.chat-bubble__meta strong {
  font-size: 13px;
}

.chat-bubble__meta span {
  color: var(--brain-muted);
  font-size: 11px;
}

.composer-shell {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.composer-hint {
  font-size: 12px;
  color: var(--brain-muted);
}

.composer-box {
  border-radius: 22px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(4, 9, 18, 0.86);
  padding: 14px;
  display: grid;
  gap: 12px;
}

.composer-box textarea {
  width: 100%;
  min-height: 110px;
  resize: none;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--brain-text);
  font: inherit;
  line-height: 1.8;
}

.composer-box button {
  border: 0;
  border-radius: 999px;
  padding: 10px 18px;
  color: #101214;
  background: linear-gradient(135deg, #f3c772, #eaa34a);
  font-weight: 700;
  cursor: pointer;
}

.composer-box button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.memory-list,
.bullet-list {
  padding-left: 18px;
}

.tone-pending {
  border-color: rgba(241, 195, 111, 0.3);
}

.tone-working {
  border-color: rgba(123, 179, 255, 0.3);
}

.tone-triaged {
  border-color: rgba(57, 223, 150, 0.24);
}

.tone-draft {
  border-color: rgba(255,255,255,0.12);
}

.tone-queued {
  border-color: rgba(255,255,255,0.1);
}

@media (max-width: 1180px) {
  .brain-agent-layout {
    grid-template-columns: 1fr;
  }

  .brain-panel--chat {
    min-height: 680px;
  }
}

@media (max-width: 960px) {
  .brain-agent-hero {
    grid-template-columns: 1fr;
  }
}
</style>
