import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  const projectName = ref('Vue 3 AI 项目基线')
  const ready = ref(true)

  const statusText = computed(() => (ready.value ? '已就绪' : '初始化中'))

  return {
    projectName,
    ready,
    statusText
  }
})
