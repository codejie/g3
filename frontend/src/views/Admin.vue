<template>
  <div class="admin-container" :style="{ paddingTop: 'var(--safe-area-inset-top)' }">
    <!-- Left Sidebar -->
    <aside class="admin-sidebar">
      <!-- Header -->
      <div class="sidebar-header">
        <div class="logo-icon">
          <span>AG</span>
        </div>
        <span class="sidebar-title">{{ $t('admin.brand') }}</span>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="section-label">{{ $t('admin.panel') }}</div>
      <button
        v-for="item in navItems"
        :key="item.key"
        class="nav-item"
        :class="{ active: activeSection === item.key, disabled: item.disabled }"
        :disabled="item.disabled"
        @click="!item.disabled && (activeSection = item.key)"
      >
        <span class="nav-icon-wrapper">
          <span class="nav-icon" v-html="item.icon"></span>
          <span v-if="item.key === 'opencode-config' && restartAlertStore.needsRestart" class="restart-badge">!</span>
        </span>
        <span class="nav-label">{{ item.label }}</span>
      </button>
        </div>
      </nav>

<!-- Footer -->
<div class="sidebar-footer">
  <button class="user-menu-trigger" :class="{ active: showUserMenu }" @click="showUserMenu = !showUserMenu">
    <div class="user-avatar">{{ userInitial }}</div>
    <div class="user-meta">
      <span class="user-name">{{ userStore.userInfo?.username }}</span>
      <span class="user-role">{{ userStore.userInfo?.role }}</span>
    </div>
    <svg class="chevron-icon" :class="{ rotated: showUserMenu }" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
  </button>
  <div v-if="showUserMenu" class="user-menu-panel">
    <div class="user-detail-row">
      <span class="detail-label">{{ $t('admin.userUsername') }}</span>
      <span class="detail-value">{{ userStore.userInfo?.username }}</span>
    </div>
    <div class="user-detail-row">
      <span class="detail-label">{{ $t('admin.userRole') }}</span>
      <span class="detail-value">{{ userStore.userInfo?.role }}</span>
    </div>
    <div class="user-detail-row">
      <span class="detail-label">{{ $t('admin.userLoginTime') }}</span>
      <span class="detail-value">{{ formatLoginTime }}</span>
    </div>
        <button class="menu-action-btn" @click="toggleLanguage">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          <span>{{ $t('admin.language') }} {{ currentLanguage }}</span>
        </button>
        <button class="logout-btn" @click="handleLogout">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      <span>{{ $t('admin.logout') }}</span>
    </button>
  </div>
</div>
    </aside>

    <!-- Main Content -->
    <main class="admin-main">
      <!-- Header Bar -->
      <header class="main-header">
        <div class="header-left">
          <h2 class="page-title">{{ currentTitle }}</h2>
        </div>
      </header>

      <!-- Content Area -->
      <div class="admin-content" :class="{ 'content-fill': activeSection === 'opencode-config' }">
        <!-- Empty State -->
        <div v-if="!activeSection" class="empty-state">
          <div class="welcome-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
          </div>
          <h3 class="welcome-title">{{ $t('admin.panel') }}</h3>
          <p class="welcome-desc">{{ $t('admin.welcomeDesc') }}</p>
        </div>

    <!-- Model Management Section -->
    <div v-else-if="activeSection === 'models'" class="content-section">
      <ModelManagement />
    </div>

  <!-- Skills Management Section -->
  <div v-else-if="activeSection === 'skills'" class="content-section">
    <SkillsManagement />
  </div>

  <!-- OpenCode Config Section -->
  <div v-else-if="activeSection === 'opencode-config'" class="content-section">
    <OpenCodeConfig />
  </div>

  <!-- User Management Section -->
  <div v-else-if="activeSection === 'users'" class="content-section">
    <UserManagement />
  </div>
  </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/userStore';
import { useRestartAlertStore } from '../store/restartAlertStore';
import { ElMessageBox } from 'element-plus';
import { setLocale, getLocale } from '../locales';
import ModelManagement from './admin/ModelManagement.vue';
import UserManagement from './admin/UserManagement.vue';
import SkillsManagement from './admin/SkillsManagement.vue';
import OpenCodeConfig from './admin/OpenCodeConfig.vue';

const { t } = useI18n();
const router = useRouter();
const userStore = useUserStore();
const restartAlertStore = useRestartAlertStore();

const activeSection = ref<string>('');
const showUserMenu = ref(false);

const iconModels = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>';

const iconSkills = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';

const iconOpenCode = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>';

const iconUsers = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';

const iconLogs = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';

const navItems = computed(() => [
  { key: 'models', label: t('admin.modelManagement'), icon: iconModels },
  { key: 'skills', label: t('admin.skillsManagement'), icon: iconSkills },
  { key: 'opencode-config', label: t('admin.opencodeConfig'), icon: iconOpenCode },
  { key: 'users', label: t('admin.userManagement'), icon: iconUsers },
  { key: 'logs', label: t('admin.logView'), icon: iconLogs, disabled: true },
]);

const currentTitle = computed(() => {
  const item = navItems.value.find(i => i.key === activeSection.value);
  return item ? item.label : t('admin.title');
});

const userInitial = computed(() => {
  return userStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'A';
});

const formatLoginTime = computed(() => {
  const ts = userStore.userInfo?.loginTime;
  if (!ts) return '-';
  return new Date(ts).toLocaleString();
});

const currentLanguage = computed(() => {
  const locale = getLocale();
  return locale === 'zh-CN' ? t('admin.languageZh') : t('admin.languageEn');
});

const toggleLanguage = () => {
  const locale = getLocale();
  const newLocale = locale === 'zh-CN' ? 'en-US' : 'zh-CN';
  setLocale(newLocale);
};

const handleLogout = async () => {
  showUserMenu.value = false;
  try {
    await ElMessageBox.confirm(t('admin.logoutConfirm'), t('admin.logoutTitle'), { type: 'warning' });
  } catch {
    return;
  }
  userStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.admin-container {
  --admin-accent: #3b82f6;
  --admin-accent-hover: #2563eb;
  --admin-accent-light: #60a5fa;
  --admin-accent-bg: rgba(59, 130, 246, 0.08);

  position: relative;
  height: var(--app-height, 100vh);
  display: flex;
  background: var(--bg-100);
  overflow: hidden;
}

/* ===== Sidebar ===== */
.admin-sidebar {
  width: 260px;
  border-right: 1px solid var(--border-100);
  background: var(--bg-000);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
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
  background: var(--admin-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.sidebar-title {
  font-weight: bold;
  color: var(--text-100);
  letter-spacing: -0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== Navigation ===== */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-label {
  padding: 8px 16px;
  font-size: 10px;
  font-weight: bold;
  color: var(--text-400);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
  color: var(--text-200);
  font-size: 14px;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
}

.nav-item:hover {
  background: var(--admin-accent-bg);
}

.nav-item.active {
  background: var(--admin-accent-bg);
  color: var(--admin-accent);
}

.nav-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-400);
  transition: color 0.2s;
}

.restart-badge {
  position: absolute;
  top: -4px;
  right: -6px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 700;
  line-height: 14px;
  text-align: center;
  pointer-events: none;
}

.nav-item:hover .nav-icon-wrapper .nav-icon {
  color: var(--admin-accent);
}

.nav-item.active .nav-icon-wrapper .nav-icon {
  color: var(--admin-accent);
}

.nav-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.nav-label {
  font-weight: 500;
}

/* ===== Sidebar Footer ===== */
.sidebar-footer {
  padding: 8px;
  border-top: 1px solid var(--border-100);
  background: var(--bg-000);
}

.user-menu-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
  background: transparent;
  border: none;
  text-align: left;
}

.user-menu-trigger:hover {
  background: var(--admin-accent-bg);
}

.user-menu-trigger.active {
  background: var(--admin-accent-bg);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--admin-accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-100);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-role {
  font-size: 11px;
  color: var(--text-400);
}

.chevron-icon {
  color: var(--text-400);
  transition: transform 0.2s;
  flex-shrink: 0;
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}

.user-menu-panel {
  margin-top: 4px;
  padding: 8px;
  background: var(--bg-100);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  animation: fadeIn 0.15s ease;
}

.user-detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
}

.detail-label {
  font-size: 12px;
  color: var(--text-400);
}

.detail-value {
  font-size: 12px;
  color: var(--text-200);
  font-weight: 500;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-action-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: transparent;
  color: var(--text-300);
  font-size: 13px;
  border: none;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.menu-action-btn:hover {
  background: var(--bg-200);
  color: var(--text-100);
}

.menu-action-btn svg {
  flex-shrink: 0;
  transition: color 0.2s;
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: transparent;
  color: var(--text-300);
  font-size: 13px;
  border: none;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
}

.logout-btn svg {
  flex-shrink: 0;
  transition: color 0.2s;
}

.logout-btn:hover svg {
  color: #ef4444;
}

/* ===== Main Content ===== */
.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.main-header {
  height: 56px;
  border-bottom: 1px solid var(--border-100);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: var(--bg-000);
  backdrop-filter: blur(12px);
  z-index: 20;
  flex-shrink: 0;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-100);
  letter-spacing: -0.01em;
}

/* ===== Content Area ===== */
.admin-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: var(--bg-100);
}

.admin-content.content-fill {
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.admin-content.content-fill > .content-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 16px;
  animation: fadeIn 0.3s ease;
}

.welcome-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--admin-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

.welcome-title {
  font-size: 24px;
  font-weight: bold;
  color: var(--text-100);
  margin-bottom: 12px;
}

.welcome-desc {
  font-size: 14px;
  color: var(--text-400);
}

/* ===== Section Card ===== */
.content-section {
  animation: fadeIn 0.3s ease;
}

.section-card {
  background: var(--bg-000);
  border: 1px solid var(--border-100);
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-100);
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-100);
}

.card-body {
  padding: 32px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.placeholder-text {
  font-size: 14px;
  color: var(--text-400);
  font-style: italic;
}

/* ===== Animations ===== */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
