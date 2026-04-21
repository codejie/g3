<template>
  <aside
    class="sidebar"
    :style="{
      width: collapsed ? '0px' : '260px',
      opacity: collapsed ? 0 : 1
    }"
  >
    <!-- Header -->
    <div class="sidebar-header">
      <div class="logo-icon">
        <span>G3</span>
      </div>
      <span class="sidebar-title">G3</span>
    </div>

    <!-- Actions -->
    <div class="sidebar-actions">
      <button
        @click="$emit('newChat')"
        class="new-chat-btn"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>新建会话</span>
      </button>
    </div>

    <!-- Session List -->
    <div class="session-section">
      <div class="section-title">会话历史</div>
      <div class="session-list">
        <div v-if="sessions.length === 0" class="empty-sessions">
          暂无会话记录
        </div>
        <div
          v-for="session in sessions"
          :key="session.id"
          class="session-item"
          :class="{ active: currentSessionId === session.id }"
          @click="$emit('selectSession', session)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <div class="session-info">
            <span class="session-title">{{ session.title || session.id }}</span>
            <span class="session-time">{{ formatDate(session.time?.created) }}</span>
          </div>
        </div>
      </div>
    </div>

  <!-- Footer -->
  <div class="sidebar-footer">
    <button class="settings-btn" @click="$emit('openSettings')">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      <span>设置</span>
    </button>
    <button class="profile-btn" @click="profileVisible = true">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <span>个人中心</span>
    </button>
  </div>

  <!-- Profile Dialog -->
  <ProfileDialog v-model="profileVisible" />

    <!-- Toggle Button -->
    <button
      @click="$emit('toggle')"
      class="toggle-btn"
      :style="{ left: collapsed ? '0px' : '260px' }"
    >
      <svg
        v-if="!collapsed"
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
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      <svg
        v-else
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
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProfileDialog from './ProfileDialog.vue'

interface Session {
  id: string;
  title?: string;
  time?: {
    created?: number;
  };
}

interface Props {
  collapsed: boolean;
  sessions?: Session[];
  currentSessionId?: string | null;
}

withDefaults(defineProps<Props>(), {
  sessions: () => [],
  currentSessionId: null
});

defineEmits<{
  (e: 'toggle'): void;
  (e: 'newChat'): void;
  (e: 'selectSession', session: Session): void;
  (e: 'openSettings'): void;
}>();

const profileVisible = ref(false)

const formatDate = (timestamp?: number): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const isThisYear = date.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return `${date.getMonth() + 1}/${date.getDate()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  return date.toLocaleDateString();
};
</script>

<style scoped>
.sidebar {
  position: relative;
  height: 100%;
  border-right: 1px solid var(--border-100);
  background: var(--bg-000);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease-in-out;
  z-index: 30;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--border-100);
  height: 56px;
  flex-shrink: 0;
}

.logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--accent-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.sidebar-title {
  font-weight: bold;
  color: var(--text-100);
  letter-spacing: -0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-actions {
  padding: 8px;
  padding-top: 24px;
}

.new-chat-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--accent-brand);
  color: white;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.new-chat-btn:hover {
  background: var(--accent-main-000);
}

.new-chat-btn svg {
  transition: transform 0.3s;
}

.new-chat-btn:hover svg {
  transform: rotate(90deg);
}

.session-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 8px;
}

.section-title {
  padding: 8px 16px;
  font-size: 10px;
  font-weight: bold;
  color: var(--text-400);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
}

.session-list::-webkit-scrollbar {
  width: 4px;
}

.session-list::-webkit-scrollbar-thumb {
  background-color: var(--border-200);
  border-radius: 10px;
}

.empty-sessions {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--text-400);
  font-style: italic;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
  color: var(--text-200);
  margin-bottom: 4px;
}

.session-item:hover {
  background: var(--bg-100);
}

.session-item.active {
  background: var(--bg-100);
}

.session-item.active svg {
  color: var(--accent-brand);
}

.session-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.session-title {
  font-size: 12px;
  font-weight: bold;
  color: var(--text-100);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-time {
  font-size: 10px;
  color: var(--text-400);
  margin-top: 2px;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--border-100);
  background: var(--bg-000);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: transparent;
  color: var(--text-200);
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.profile-btn:hover {
  background: var(--bg-100);
}

.profile-btn svg {
  color: var(--text-400);
  transition: color 0.2s;
}

.profile-btn:hover svg {
  color: var(--accent-brand);
}

.settings-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: transparent;
  color: var(--text-200);
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.settings-btn:hover {
  background: var(--bg-100);
}

.settings-btn svg {
  color: var(--text-400);
  transition: transform 0.5s, color 0.2s;
}

.settings-btn:hover svg {
  transform: rotate(45deg);
  color: var(--accent-brand);
}

.toggle-btn {
  position: absolute;
  top: 80px;
  z-index: 40;
  width: 16px;
  height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-000);
  border: 1px solid var(--border-100);
  border-radius: 0 8px 8px 0;
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
</style>
