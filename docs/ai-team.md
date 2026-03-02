# AI Team 可视化看板

这个页面展示每个 AI 成员的当前任务、进度和状态。

- 数据源: [`docs/memory/fleet_status.md`](/AI_Common/memory/fleet_status)
- 同步命令: `pnpm run fleet:sync-dashboard`

> 更新编排表后，执行一次同步命令，再刷新本页即可看到最新信息。

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

const captain = computed(() => data.value.members.find((m) => m.isCaptain));

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
    const res = await fetch("/AI_Common/data/ai_team_status.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data.value = await res.json();
  } catch (e) {
    error.value = `加载失败: ${e?.message || e}`;
  } finally {
    loading.value = false;
  }
});
</script>

<div class="fleet-dashboard">
  <div class="summary-grid">
    <div class="summary-card">
      <div class="label">成员总数</div>
      <div class="value">{{ data.total }}</div>
    </div>
    <div class="summary-card">
      <div class="label">活跃中</div>
      <div class="value active">{{ data.active }}</div>
    </div>
    <div class="summary-card">
      <div class="label">已离线</div>
      <div class="value offline">{{ data.offline }}</div>
    </div>
    <div class="summary-card">
      <div class="label">待分配</div>
      <div class="value queued">{{ data.queued }}</div>
    </div>
  </div>

  <p class="meta">最后同步: {{ timeText }}</p>

  <div v-if="loading" class="state-card">正在加载看板数据…</div>
  <div v-else-if="error" class="state-card error">{{ error }}</div>
  <div v-else class="cards">
    <article
      v-for="member in data.members"
      :key="member.member"
      class="member-card"
      :class="{ captain: member.isCaptain }"
    >
      <header class="card-header">
        <h3>{{ member.member }}</h3>
        <span class="agent">{{ member.agent }}</span>
      </header>

      <p v-if="member.isCaptain" class="captain-badge">当前队长</p>
      <p class="task">{{ member.task || "待补充任务" }}</p>

      <div class="progress-wrap">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${member.progress}%` }"></div>
        </div>
        <span class="progress-text">{{ member.progress }}%</span>
      </div>

      <ul class="meta-list">
        <li><strong>状态:</strong> {{ member.status }}</li>
        <li><strong>路径:</strong> {{ member.workspace }}</li>
        <li><strong>领命时间:</strong> {{ member.since }}</li>
      </ul>
    </article>
  </div>
</div>

<style scoped>
.fleet-dashboard {
  margin-top: 16px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.summary-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 12px;
  background: linear-gradient(180deg, rgba(8, 150, 255, 0.08), transparent 90%);
}

.label {
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.value {
  font-size: 24px;
  font-weight: 700;
  margin-top: 4px;
}

.value.active {
  color: #0d8a4c;
}

.value.offline {
  color: #667085;
}

.value.queued {
  color: #b45309;
}

.meta {
  margin-top: 12px;
  color: var(--vp-c-text-2);
}

.state-card {
  border: 1px dashed var(--vp-c-divider);
  border-radius: 10px;
  padding: 12px;
}

.state-card.error {
  color: #b42318;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
}

.member-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  padding: 14px;
  background: var(--vp-c-bg-soft);
}

.member-card.captain {
  border-color: #2563eb;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.15) inset;
}

.card-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
}

.agent {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
}

.captain-badge {
  display: inline-block;
  margin: 8px 0 0;
  font-size: 12px;
  color: #1d4ed8;
}

.task {
  margin: 8px 0 10px;
}

.progress-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 10px;
  background: rgba(148, 163, 184, 0.25);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9, #22c55e);
}

.progress-text {
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.meta-list {
  margin: 10px 0 0;
  padding-left: 18px;
}

.meta-list li {
  margin: 2px 0;
}
</style>
