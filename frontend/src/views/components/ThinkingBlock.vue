<template>
  <div class="thinking-block" :class="{ collapsed: isCollapsed }">
    <div class="thinking-header" @click="toggle">
      <svg
        class="toggle-icon"
        :class="{ rotated: !isCollapsed }"
        xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9"/>
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
      <span>{{ isCollapsed ? firstLine : 'Thinking...' }}</span>
    </div>
    <div v-if="!isCollapsed" class="thinking-content">{{ text }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps<{
  text: string;
  streaming?: boolean;
}>();

const hideThinkingDelay = Number(import.meta.env.VITE_HIDE_THINKING);
const isCollapsed = ref(false);
let collapseTimer: ReturnType<typeof setTimeout> | null = null;

const firstLine = computed(() => {
  const lines = props.text.trim().split('\n');
  const line = lines[0] || '';
  const maxLen = 80;
  return line.length > maxLen ? line.slice(0, maxLen) + '…' : line;
});

const toggle = () => {
  isCollapsed.value = !isCollapsed.value;
  if (isCollapsed.value) {
    clearTimer();
  }
};

const clearTimer = () => {
  if (collapseTimer !== null) {
    clearTimeout(collapseTimer);
    collapseTimer = null;
  }
};

const scheduleCollapse = () => {
  clearTimer();
  if (isNaN(hideThinkingDelay) || hideThinkingDelay === -1) return;
  if (hideThinkingDelay === 0) {
    isCollapsed.value = true;
  } else {
    collapseTimer = setTimeout(() => {
      isCollapsed.value = true;
    }, hideThinkingDelay);
  }
};

watch(() => props.streaming, (newVal, oldVal) => {
  if (oldVal === true && newVal === false) {
    scheduleCollapse();
  }
});

onMounted(() => {
  if (!props.streaming) {
    scheduleCollapse();
  }
});

onUnmounted(() => {
  clearTimer();
});
</script>

<style scoped>
.thinking-block {
  margin: 8px 0;
  padding: 12px;
  background: var(--bg-200);
  border-left: 2px solid var(--accent-brand);
  border-radius: 0 8px 8px 0;
  font-size: 12px;
  font-style: italic;
  color: var(--text-400);
}

.thinking-header {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.5;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thinking-header:hover {
  opacity: 0.8;
}

.toggle-icon {
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.thinking-content {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-monospace, 'SFMono-Regular', 'SF Mono', Menlo, Consolas, monospace;
  margin-top: 8px;
  font-style: normal;
}

.collapsed .thinking-header {
  margin-bottom: 0;
}
</style>
