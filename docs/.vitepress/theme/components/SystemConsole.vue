<script setup>
import { ref } from 'vue';

const scripts = ref([
  { name: 'health:core', description: '核心健康检查' },
  { name: 'health:docs-index', description: '文档索引检查' },
  { name: 'health:verify', description: '验证健康状况' },
  { name: 'health:gate', description: '健康门禁' },
  { name: 'health:mcp', description: 'MCP 健康检查' },
  { name: 'memory:refresh', description: '刷新记忆索引' },
]);

const engines = ref([
  { name: 'gemini', description: 'Gemini 智能引擎' },
  { name: 'claude', description: 'Claude 核心引擎' },
  { name: 'codex', description: 'Codex 执行引擎' },
]);

const runningScript = ref(null);
const scriptOutput = ref(null);
const error = ref(null);
const successMessage = ref(null);

const actionEndpoint = 'http://127.0.0.1:18790/api/fleet/action';

async function postAction(payload) {
  error.value = null;
  successMessage.value = null;
  try {
    const response = await fetch(actionEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '操作失败');
    return result;
  } catch (e) {
    error.value = e.message;
    throw e;
  }
}

async function runScript(scriptName) {
  runningScript.value = scriptName;
  scriptOutput.value = null;
  try {
    const result = await postAction({ action: 'run-internal-script', scriptName });
    scriptOutput.value = result.stdout || result.stderr || '执行完成（无输出）';
    successMessage.value = `${scriptName} 执行成功`;
  } catch (e) {
    // Error handled in postAction
  } finally {
    runningScript.value = null;
  }
}

async function runEngine(engineName) {
  runningScript.value = engineName;
  try {
    const result = await postAction({ action: 'run-engine', engineName });
    successMessage.value = result.message || `${engineName} 引擎点火成功`;
  } catch (e) {
  } finally {
    runningScript.value = null;
  }
}

async function runSetup() {
  runningScript.value = 'setup';
  try {
    const result = await postAction({ action: 'run-setup' });
    scriptOutput.value = result.stdout || result.stderr;
    successMessage.value = '系统初始化完成';
  } catch (e) {
  } finally {
    runningScript.value = null;
  }
}
</script>

<template>
  <div class="system-console">
    <div class="console-section">
      <div class="section-header">
        <div class="kicker">INITIALIZATION</div>
        <h3>基座配置</h3>
      </div>
      <div class="setup-box">
        <p class="setup-desc">配置 Codex 终端别名与环境基座，建议在首次启动或环境变更时运行。</p>
        <button @click="runSetup" :disabled="!!runningScript" class="run-button is-setup">
          {{ runningScript === 'setup' ? '初始化中...' : '一键环境初始化' }}
        </button>
      </div>
    </div>

    <div class="console-section">
      <div class="section-header">
        <div class="kicker">ENGINES</div>
        <h3>舰队点火</h3>
      </div>
      <div class="grid-list">
        <div v-for="engine in engines" :key="engine.name" class="console-item">
          <div class="item-info">
            <span class="item-name">{{ engine.name.toUpperCase() }}</span>
            <span class="item-desc">{{ engine.description }}</span>
          </div>
          <button @click="runEngine(engine.name)" :disabled="!!runningScript" class="run-button">
            {{ runningScript === engine.name ? '点火中...' : '启动' }}
          </button>
        </div>
      </div>
    </div>

    <div class="console-section">
      <div class="section-header">
        <div class="kicker">MAINTENANCE</div>
        <h3>系统维护</h3>
      </div>
      <div class="grid-list">
        <div v-for="script in scripts" :key="script.name" class="console-item">
          <div class="item-info">
            <span class="item-name">{{ script.name }}</span>
            <span class="item-desc">{{ script.description }}</span>
          </div>
          <button @click="runScript(script.name)" :disabled="!!runningScript" class="run-button">
            {{ runningScript === script.name ? '执行中...' : '执行' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 结果展示 -->
    <div v-if="successMessage || error || scriptOutput" class="feedback-area">
      <div v-if="successMessage" class="status-banner is-success">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        {{ successMessage }}
      </div>
      <div v-if="error" class="status-banner is-error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
        {{ error }}
      </div>
      <div v-if="scriptOutput" class="output-panel">
        <div class="output-header">终端输出 (TERMINAL OUTPUT)</div>
        <pre>{{ scriptOutput }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.system-console {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 24px;
  background: rgba(14, 18, 26, 0.4);
  border-radius: 20px;
  border: 1px solid rgba(245, 200, 123, 0.1);
}

.console-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header .kicker {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.15em;
  color: rgba(245, 200, 123, 0.5);
  margin-bottom: 4px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  color: #f8fafc;
  font-weight: 700;
}

.setup-box {
  padding: 20px;
  background: rgba(245, 200, 123, 0.03);
  border: 1px dashed rgba(245, 200, 123, 0.2);
  border-radius: 16px;
}

.setup-desc {
  font-size: 13px;
  color: rgba(226, 232, 240, 0.5);
  margin: 0 0 16px;
  line-height: 1.6;
}

.grid-list {
  display: grid;
  gap: 12px;
}

.console-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
}

.console-item:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(245, 200, 123, 0.15);
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-name {
  color: #f2f4f8;
  font-size: 13px;
  font-weight: 600;
}

.item-desc {
  color: rgba(226, 232, 240, 0.4);
  font-size: 11px;
}

.run-button {
  height: 32px;
  padding: 0 16px;
  border: 1px solid rgba(245, 200, 123, 0.2);
  border-radius: 8px;
  background: rgba(245, 200, 123, 0.06);
  color: #f5c87b;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.run-button:hover:not(:disabled) {
  background: rgba(245, 200, 123, 0.15);
  border-color: rgba(245, 200, 123, 0.4);
  transform: translateY(-1px);
}

.run-button.is-setup {
  width: 100%;
  height: 40px;
  font-size: 13px;
}

.run-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.feedback-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.status-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.status-banner svg {
  width: 16px;
  height: 16px;
}

.status-banner.is-success {
  background: rgba(94, 224, 161, 0.1);
  color: #5ee0a1;
  border: 1px solid rgba(94, 224, 161, 0.2);
}

.status-banner.is-error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.output-panel {
  background: #040507;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.output-header {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.3);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.output-panel pre {
  margin: 0;
  padding: 16px;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  color: #cbd5e1;
  max-height: 240px;
  overflow-y: auto;
}
</style>
