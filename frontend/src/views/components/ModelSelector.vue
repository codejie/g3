<template>
  <div class="model-selector" ref="selectorRef">
    <div class="model-badge" @click="toggleDropdown">
      <div class="status-dot" :class="{ active: isServerActive }"></div>
      <span class="model-name">{{ modelStore.currentDisplay }}</span>
      <svg class="chevron" :class="{ open: dropdownOpen }" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
    </div>

    <div v-if="dropdownOpen" class="model-dropdown">
      <div v-if="modelStore.loading" class="dropdown-loading">{{ t('modelSelector.loading') }}</div>
      <template v-else>
        <div
          v-for="item in modelStore.items"
          :key="item.provider.id"
          class="provider-group"
        >
        <div class="provider-label">{{ getOptionValue(item.provider.options, 'name') || item.provider.provider_id }}</div>
        <div
          v-for="model in item.models"
          :key="model.id"
          class="model-option"
          :class="{ selected: model.id === modelStore.selectedModelId }"
          @click="handleSelect(item.provider.id, model.id)"
        >
          <span class="model-option-name">{{ getOptionValue(model.options, 'name') || model.model_id }}</span>
          <span v-if="getOptionValue(model.options, 'context_size')" class="model-option-context">{{ formatContextSize(Number(getOptionValue(model.options, 'context_size'))) }}</span>
            <svg v-if="model.id === modelStore.selectedModelId" class="check-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        </div>
        <div v-if="modelStore.items.length === 0" class="dropdown-empty">{{ t('modelSelector.noModels') }}</div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useModelStore } from '../../store/modelStore'

defineProps<{
  isServerActive?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', providerId: string, modelId: string): void
}>()

const { t } = useI18n()
const modelStore = useModelStore()

const selectorRef = ref<HTMLElement | null>(null)
const dropdownOpen = ref(false)

const toggleDropdown = () => {
  if (!dropdownOpen.value && modelStore.items.length === 0) {
    modelStore.fetchModels()
  }
  dropdownOpen.value = !dropdownOpen.value
}

const handleSelect = (providerId: string, modelId: string) => {
  modelStore.selectModel(providerId, modelId)
  emit('select', providerId, modelId)
  dropdownOpen.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  if (selectorRef.value && !selectorRef.value.contains(event.target as Node)) {
    dropdownOpen.value = false
  }
}

  const getOptionValue = (options: { key: string; value: string }[], key: string): string => {
    return options.find(o => o.key === key)?.value || ''
  }

  const formatContextSize = (size: number): string => {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(0)}M`
  if (size >= 1024) return `${(size / 1024).toFixed(0)}K`
  return `${size}`
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  modelStore.fetchModels()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.model-selector {
  position: relative;
  display: flex;
  align-items: center;
}

.model-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-100);
  padding: 6px 12px;
  border-radius: 9999px;
  border: 1px solid var(--border-200);
  cursor: pointer;
  transition: background 0.2s;
  user-select: none;
}

.model-badge:hover {
  background: var(--bg-200);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-400);
  transition: background 0.3s;
  flex-shrink: 0;
}

.status-dot.active {
  background: var(--success-100);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.model-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-200);
  white-space: nowrap;
}

.chevron {
  color: var(--text-400);
  transition: transform 0.2s;
  flex-shrink: 0;
}

.chevron.open {
  transform: rotate(180deg);
}

.model-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 300px;
  max-height: 360px;
  overflow-y: auto;
  background: var(--bg-000);
  border: 1px solid var(--border-200);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 100;
  padding: 4px;
}

.model-dropdown::-webkit-scrollbar {
  width: 4px;
}

.model-dropdown::-webkit-scrollbar-thumb {
  background: var(--border-300);
  border-radius: 999px;
}

.dropdown-loading,
.dropdown-empty {
  padding: 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-400);
}

.provider-group {
  margin-bottom: 4px;
}

.provider-group:last-child {
  margin-bottom: 0;
}

.provider-label {
  padding: 8px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-400);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.model-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.model-option:hover {
  background: var(--bg-100);
}

.model-option.selected {
  background: var(--bg-200);
}

.model-option-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-100);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-option-context {
  font-size: 11px;
  color: var(--text-400);
  flex-shrink: 0;
}

.check-icon {
  color: var(--accent-brand);
  flex-shrink: 0;
}
</style>
