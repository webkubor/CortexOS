<script setup>
import { ref } from 'vue';

const scripts = ref([
  { name: 'health:core', description: '核心健康检查' },
  { name: 'health:docs-index', description: '文档索引检查' },
  { name: 'health:verify', description: '验证健康状况' },
  { name: 'health:gate', description: '健康门禁' },
  { name: 'health:mcp', description: 'MCP 健康检查' },
  { name: 'memory:refresh', description: '刷新记忆' },
]);

const runningScript = ref(null);
const scriptOutput = ref(null);
const error = ref(null);

const actionEndpoint = 'http://127.0.0.1:18790/api/fleet/action';

async function runScript(scriptName) {
  runningScript.value = scriptName;
  scriptOutput.value = null;
  error.value = null;

  try {
    const response = await fetch(actionEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'run-internal-script', scriptName }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '脚本执行失败');
    }

    scriptOutput.value = result.stdout || result.stderr;
  } catch (e) {
    error.value = e.message;
  } finally {
    runningScript.value = null;
  }
}
</script>

<template>
  <div class="system-console">
    <div class="console-header">
      <h3>系统控制台</h3>
    </div>
    <div class="script-list">
      <div v-for="script in scripts" :key="script.name" class="script-item">
        <div class="script-info">
          <span class="script-name">{{ script.name }}</span>
          <span class="script-description">{{ script.description }}</span>
        </div>
        <button @click="runScript(script.name)" :disabled="runningScript === script.name" class="run-button">
          {{ runningScript === script.name ? '运行中...' : '运行' }}
        </button>
      </div>
    </div>
    <div v-if="scriptOutput || error" class="output-panel">
      <pre v-if="scriptOutput">{{ scriptOutput }}</pre>
      <pre v-if="error" class="error-output">{{ error }}</pre>
    </div>
  </div>
</template>

<style scoped>
.system-console {
  padding: 20px;
  background: #0e121a;
  border-radius: 16px;
  border: 1px solid rgba(245, 200, 123, 0.14);
}

.console-header h3 {
  margin: 0 0 16px;
  color: #f8fafc;
  font-size: 18px;
}

.script-list {
  display: grid;
  gap: 12px;
}

.script-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.script-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.script-name {
  color: #f2f4f8;
  font-weight: 600;
}

.script-description {
  color: rgba(226, 232, 240, 0.6);
  font-size: 12px;
}

.run-button {
  padding: 8px 16px;
  border: 1px solid rgba(245, 200, 123, 0.22);
  border-radius: 8px;
  background: rgba(245, 200, 123, 0.1);
  color: var(--c-aureate-base);
  cursor: pointer;
  transition: all 0.2s ease;
}

.run-button:hover {
  background: rgba(245, 200, 123, 0.2);
}

.run-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.output-panel {
  margin-top: 20px;
  padding: 16px;
  background: #040507;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-height: 300px;
  overflow-y: auto;
}

.output-panel pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: #f8fafc;
}

.error-output {
  color: #ff6b6b;
}
</style>
