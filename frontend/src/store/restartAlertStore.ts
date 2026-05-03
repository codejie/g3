import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useRestartAlertStore = defineStore('restartAlert', () => {
  const modelChanged = ref(false)
  const skillChanged = ref(false)

  const needsRestart = computed(() => modelChanged.value || skillChanged.value)

  const markModelChanged = () => {
    modelChanged.value = true
  }

  const markSkillChanged = () => {
    skillChanged.value = true
  }

  const clearModelChanged = () => {
    modelChanged.value = false
  }

  const clearSkillChanged = () => {
    skillChanged.value = false
  }

  const clearAll = () => {
    modelChanged.value = false
    skillChanged.value = false
  }

  return {
    modelChanged,
    skillChanged,
    needsRestart,
    markModelChanged,
    markSkillChanged,
    clearModelChanged,
    clearSkillChanged,
    clearAll,
  }
})
