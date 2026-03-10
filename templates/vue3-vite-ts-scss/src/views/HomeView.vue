<template>
  <main class="home-page">
    <section class="hero-card">
      <p class="hero-card__eyebrow">AI 项目统一基线</p>
      <h1 class="hero-card__title">{{ projectName }}</h1>
      <p class="hero-card__desc">
        统一采用 Vue 3、Vite、TypeScript、SCSS、pnpm 与 Ky 网络层封装。
      </p>

      <dl class="hero-card__meta">
        <div>
          <dt>应用状态</dt>
          <dd>{{ statusText }}</dd>
        </div>
        <div>
          <dt>接口层</dt>
          <dd>{{ serverHint }}</dd>
        </div>
      </dl>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'
import { http } from '@/lib/http/client'

const appStore = useAppStore()
const { projectName, statusText } = storeToRefs(appStore)
const serverHint = ref('未探测')

onMounted(async () => {
  try {
    await http.get('health').json()
    serverHint.value = '后端连通'
  } catch {
    serverHint.value = '未配置后端，当前为纯前端模板'
  }
})
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  padding: 48px 20px;
  display: grid;
  place-items: center;
}

.hero-card {
  width: min(720px, 100%);
  padding: 32px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: $radius-xl;
  background: rgba(10, 15, 28, 0.84);
  box-shadow: $shadow-card;
}

.hero-card__eyebrow {
  margin: 0 0 12px;
  color: $color-accent;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-card__title {
  margin: 0;
  font-size: clamp(32px, 5vw, 48px);
}

.hero-card__desc {
  margin: 16px 0 0;
  color: $color-text-soft;
  line-height: 1.7;
}

.hero-card__meta {
  margin: 24px 0 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.hero-card__meta dt {
  color: $color-text-soft;
  font-size: 12px;
}

.hero-card__meta dd {
  margin: 8px 0 0;
  font-weight: 600;
}
</style>
