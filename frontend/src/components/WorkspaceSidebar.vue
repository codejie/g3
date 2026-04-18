<template>
  <div class="workspace-sidebar" :style="{ width: collapsed ? '40px' : '300px' }">
    <!-- Toggle Button (Left edge when expanded) -->
    <button
      v-if="!collapsed"
      @click="$emit('toggle')"
      class="toggle-btn"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>

    <!-- Collapsed State - Expand Button with Vertical Title -->
    <div v-if="collapsed" class="collapsed-bar">
      <button @click="$emit('toggle')" class="expand-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <div class="vertical-title">工作空间</div>
    </div>

    <div v-if="!collapsed" class="sidebar-content">
      <!-- Header -->
      <div class="sidebar-header">
        <span class="sidebar-title">工作空间</span>
        <button class="collapse-btn" @click="$emit('toggle')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      <!-- File Browser Placeholder -->
      <div class="file-browser">
        <div class="browser-placeholder">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <span>文件浏览器</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  collapsed: boolean;
}

defineProps<Props>();

defineEmits<{
  (e: 'toggle'): void;
}>();
</script>

<style scoped>
.workspace-sidebar {
  position: relative;
  height: 100%;
  border-left: 1px solid var(--border-100);
  background: var(--bg-000);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease-in-out;
  overflow: hidden;
}

.toggle-btn {
  position: absolute;
  top: 80px;
  left: -16px;
  z-index: 40;
  width: 16px;
  height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-000);
  border: 1px solid var(--border-100);
  border-radius: 8px 0 0 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: var(--bg-100);
}

.toggle-btn svg {
  color: var(--text-400);
  transition: color 0.2s;
}

.toggle-btn:hover svg {
  color: var(--accent-brand);
}

.collapsed-bar {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 16px;
}

.expand-btn {
  padding: 8px;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-400);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-btn:hover {
  background: var(--bg-100);
  color: var(--accent-brand);
}

.vertical-title {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-weight: bold;
  font-size: 12px;
  color: var(--text-400);
  margin-top: 16px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: color 0.2s;
}

.vertical-title:hover {
  color: var(--accent-brand);
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 300px;
  animation: fadeIn 0.3s ease;
}

.sidebar-header {
  height: 56px;
  padding: 16px;
  border-bottom: 1px solid var(--border-100);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-title {
  font-weight: bold;
  color: var(--text-100);
  font-size: 14px;
}

.collapse-btn {
  padding: 6px;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-400);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-btn:hover {
  background: var(--bg-100);
  color: var(--accent-brand);
}

.file-browser {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.browser-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-400);
  gap: 12px;
}

.browser-placeholder span {
  font-size: 14px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
